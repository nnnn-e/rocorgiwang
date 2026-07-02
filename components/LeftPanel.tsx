"use client"

import { useState } from "react"
import { Bricolage_Grotesque } from "next/font/google"
import BackgroundGallery from "./BackgroundGallery"

// Initialize the Bricolage Grotesque font
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

interface LeftPanelProps {
  containerWidth: number
  isMobile: boolean
  windowWidth: number
}

const calculateTitleFontSize = (containerWidth: number, isMobile: boolean) => {
  // 根据设备类型应用不同的字体大小范围
  if (isMobile) {
    // 移动端：基础大小 18px，最大 112px (原来是 88px)
    if (containerWidth <= 200) {
      return "18px"
    }

    const increase = ((containerWidth - 200) / 10) * 0.3
    const fontSize = Math.min(24 + increase, 112) // 这里改为 112

    return `${fontSize}px`
  } else {
    // PC 端：基础大小 24px，最大 96px
    if (containerWidth <= 200) {
      return "32px"
    }

    const increase = ((containerWidth - 200) / 10) * 0.36 // 调整增长率以适应新范围
    const fontSize = Math.min(32 + increase, 108)

    return `${fontSize}px`
  }
}

export default function LeftPanel({ containerWidth, isMobile, windowWidth }: LeftPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  // 处理播放按钮点击
  const handlePlayClick = () => {
    setIsPlaying(!isPlaying)
    // 这里可以添加实际的音频/视频播放逻辑
    if (typeof window !== "undefined") {
      const backgroundGallery = document.querySelector(".background-gallery") as HTMLElement
      if (backgroundGallery) {
        if (!isPlaying) {
          // 开始播放
          backgroundGallery.classList.add("playing")
        } else {
          // 停止播放
          backgroundGallery.classList.remove("playing")
        }
      }
    }
  }

  if (isMobile) {
    return (
      <div className="relative h-full w-full">
        {/* 背景画廊 */}
        <BackgroundGallery onClick={undefined} />

        {/* 内容层 */}
        <div className="relative z-20 flex flex-col h-full text-[rgba(255,255,255,1)]">
          <nav
            className="flex justify-between items-center px-4 py-3 absolute top-0 left-0 right-0 z-10"
            style={{ fontSize: "14px" }}
          >
            <div>
              <a href="http://os.rocorgi.wang/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                LongOS
              </a>
            </div>
            <div>HIKING</div>
          </nav>

          {/* 中间区域 - 四个角落的标题短句 */}
          <div className="flex-1 relative">
            {/* 左上角 */}
            <div className="absolute top-[2.5rem] left-[1rem] z-[9999]">
              <div
                className={`${bricolage.className} corner-text`}
                style={{
                  fontSize: `calc(${calculateTitleFontSize(windowWidth * 1, true)} + 0.5rem)`,
                  lineHeight: "90%",
                  fontWeight: 400,
                  textTransform: "uppercase",
                }}
              >
                <div>LONG</div>
                <div>IS</div>
              </div>
            </div>

            {/* 右上角 */}
            <div className="absolute top-[2.5rem] right-[1rem] text-right z-[9999]">
              <div
                className={`${bricolage.className} corner-text`}
                style={{
                  fontSize: `calc(${calculateTitleFontSize(windowWidth * 1, true)} + 0.5rem)`,
                  lineHeight: "90%",
                  fontWeight: 400,
                  textTransform: "uppercase",
                }}
              >
                <div>BUILDING</div>
                <div>TOOLS</div>
              </div>
            </div>

            {/* 左下角 */}
            <div className="absolute bottom-[2.5rem] left-[1rem] z-[9999]">
              <div
                className={`${bricolage.className} corner-text`}
                style={{
                  fontSize: `calc(${calculateTitleFontSize(windowWidth * 1, true)} + 0.5rem)`,
                  lineHeight: "90%",
                  fontWeight: 400,
                  textTransform: "uppercase",
                }}
              >
                <div>TO</div>
                <div>AMPLIFY</div>
              </div>
            </div>

            {/* 右下角 */}
            <div className="absolute bottom-[2.5rem] right-[1rem] text-right z-[9999]">
              <div
                className={`${bricolage.className} corner-text`}
                style={{
                  fontSize: `calc(${calculateTitleFontSize(windowWidth * 1, true)} + 0.5rem)`,
                  lineHeight: "90%",
                  fontWeight: 400,
                  textTransform: "uppercase",
                }}
              >
                <div>OUR</div>
                <div>IMAGINATIONS</div>
              </div>
            </div>
          </div>

          <nav
            className="flex justify-between items-center px-4 py-3 absolute bottom-0 left-0 right-0 z-10"
            style={{ fontSize: "16px" }}
          >
            <div>
              <a
                href="https://www.figma.com/design/JlPwo4rDRW6JmgAsErc84i/Wang?node-id=430-1183&t=1akBfndzGvvlooBZ-1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                FIGMA
              </a>
            </div>
            <div>
              <a href="http://os.rocorgi.wang/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                LongOS
              </a>
            </div>
          </nav>
        </div>
      </div>
    )
  }

  // 桌面版
  return (
    <div className="relative h-full w-full">
      {/* 背景图层 */}
      <BackgroundGallery onClick={undefined} />

      {/* 内容层 */}
      <div className="relative z-20 flex flex-col h-full text-[rgba(255,255,255,1)]">
        <nav
          className="flex justify-between items-center px-8 py-4 absolute top-0 left-0 right-0 z-10"
          style={{
            fontSize: "14px",
          }}
        >
          <div>
            <a href="http://os.rocorgi.wang/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              LongOS
            </a>
          </div>
          <div>PHOTOGRAPHY</div>
          <div>HIKING</div>
        </nav>

        {/* 中间区域 - 四个角落的标题短句 */}
        <div className="flex-1 relative">
          {/* 左上角 */}
          <div className="absolute top-[3rem] left-[2rem] z-[9999]">
            <div
              className={`${bricolage.className} corner-text`}
              style={{
                fontSize: calculateTitleFontSize(containerWidth, false),
                lineHeight: "90%",
                fontWeight: 400,
                textTransform: "uppercase",
              }}
            >
              <div>LONG</div>
              <div>IS</div>
            </div>
          </div>

          {/* 右上角 */}
          <div className="absolute top-[3rem] right-[2rem] text-right z-[9999]">
            <div
              className={`${bricolage.className} corner-text`}
              style={{
                fontSize: calculateTitleFontSize(containerWidth, false),
                lineHeight: "90%",
                fontWeight: 400,
                textTransform: "uppercase",
              }}
            >
              <div>BUILDING</div>
              <div>TOOLS</div>
            </div>
          </div>

          {/* 左下角 */}
          <div className="absolute bottom-[3rem] left-[2rem] z-[9999]">
            <div
              className={`${bricolage.className} corner-text`}
              style={{
                fontSize: calculateTitleFontSize(containerWidth, false),
                lineHeight: "90%",
                fontWeight: 400,
                textTransform: "uppercase",
              }}
            >
              <div>TO</div>
              <div>AMPLIFY</div>
            </div>
          </div>

          {/* 右下角 */}
          <div className="absolute bottom-[3rem] right-[2rem] text-right z-[9999]">
            <div
              className={`${bricolage.className} corner-text`}
              style={{
                fontSize: calculateTitleFontSize(containerWidth, false),
                lineHeight: "90%",
                fontWeight: 400,
                textTransform: "uppercase",
              }}
            >
              <div>OUR</div>
              <div>IMAGINATIONS</div>
            </div>
          </div>
        </div>

        <nav
          className="flex justify-between items-center px-8 py-4 absolute bottom-0 left-0 right-0 z-10"
          style={{
            fontSize: "14px",
          }}
        >
          <div>
            <a
              href="https://www.figma.com/design/JlPwo4rDRW6JmgAsErc84i/Wang?node-id=430-1183&t=1akBfndzGvvlooBZ-1"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              FIGMA
            </a>
          </div>
          <div>
            <a href="http://os.rocorgi.wang/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              LongOS
            </a>
          </div>
          <div>
            <a
              href="https://www.cosmos.so/rocorgi/connecting-dots"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              COSMOS
            </a>
          </div>
        </nav>
      </div>
    </div>
  )
}
