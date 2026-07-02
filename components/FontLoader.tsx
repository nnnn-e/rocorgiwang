"use client"

import { useEffect } from "react"

export default function FontLoader() {
  useEffect(() => {
    // 创建一个新的字体加载器
    if ("FontFace" in window) {
      const fontUrl =
        "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Font/AdvinePixelDemo-Regular.woff"
      const fontLoader = new FontFace("AdvinePixel", `url(${fontUrl})`, {
        style: "normal",
        weight: "normal",
        display: "swap",
      })

      // 加���字体
      fontLoader
        .load()
        .then((loadedFont) => {
          // 将加载的字体添加到文档中
          document.fonts.add(loadedFont)

          // 添加一个类到 body 表示字体已加载
          document.body.classList.add("advine-pixel-loaded")

          console.log("AdvinePixel 字体已加载")

          // 强制应用字体到左侧容器的大字
          const style = document.createElement("style")
          style.textContent = `
          .left-container h1,
          .left-container h2,
          .left-container h3,
          .left-container .MuiTypography-h1,
          .left-container .MuiTypography-h2,
          .left-container .MuiTypography-h3,
          .corner-text {
            font-family: "AdvinePixel", monospace !important;
          }
        `
          document.head.appendChild(style)
        })
        .catch((error) => {
          console.error("字体加载失败:", error)
        })
    }
  }, [])

  return null
}
