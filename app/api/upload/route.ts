import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export const maxDuration = 30 // 设置最大超时时间为30秒
export const runtime = "nodejs"

// 允许的文件类型
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

// 最大文件大小 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有找到文件" }, { status: 400 })
    }

    // 检查文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "不支持的文件类型，仅支持JPEG、PNG、GIF和WEBP图片" }, { status: 400 })
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "文件太大，最大支持5MB" }, { status: 400 })
    }

    // 生成唯一文件名
    const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), "public", "uploads")

    try {
      // 写入文件
      await writeFile(join(uploadDir, fileName), buffer)

      // 返回文件URL
      const fileUrl = `/uploads/${fileName}`

      return NextResponse.json({
        url: fileUrl,
        type: file.type,
      })
    } catch (error) {
      console.error("文件写入错误:", error)
      return NextResponse.json({ error: "文件保存失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("上传处理错误:", error)
    return NextResponse.json({ error: "文件上传处理失败" }, { status: 500 })
  }
}
