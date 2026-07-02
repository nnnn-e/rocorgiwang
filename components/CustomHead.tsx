"use client"

import { useEffect } from "react"

export default function CustomHead() {
  useEffect(() => {
    // 动态创建并加载字体
    const style = document.createElement("style")
    style.textContent = `
      @font-face {
        font-family: "AdvinePixel";
        src: url("https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Font/AdvinePixelDemo-Regular.woff") format("woff");
        font-weight: normal;
        font-style: normal;
        font-display: block;
      }
      
      /* 直接针对左侧容器中的大字 */
      .left-container h1,
      .left-container h2,
      .left-container h3,
      .left-container .MuiTypography-h1,
      .left-container .MuiTypography-h2,
      .left-container .MuiTypography-h3 {
        font-family: "AdvinePixel", monospace !important;
      }
    `
    document.head.appendChild(style)

    // 预加载字体
    const link = document.createElement("link")
    link.rel = "preload"
    link.href =
      "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Font/AdvinePixelDemo-Regular.woff"
    link.as = "font"
    link.type = "font/woff"
    link.crossOrigin = "anonymous"
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(style)
      document.head.removeChild(link)
    }
  }, [])

  return null
}
