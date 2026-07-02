// 立即执行函数，确保在页面加载时运行
;(() => {
  // 等待 DOM 加载完成
  document.addEventListener("DOMContentLoaded", () => {
    // 创建样式元素
    const style = document.createElement("style")
    style.textContent = `
      @font-face {
        font-family: "AdvinePixel";
        src: url("https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Font/AdvinePixelDemo-Regular.woff") format("woff");
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      /* 直接针对左侧容器中的大字 */
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

    // 预加载字体
    const link = document.createElement("link")
    link.rel = "preload"
    link.href =
      "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Font/AdvinePixelDemo-Regular.woff"
    link.as = "font"
    link.type = "font/woff"
    link.crossOrigin = "anonymous"
    document.head.appendChild(link)

    // 手动加载字体
    if ("FontFace" in window) {
      const fontUrl =
        "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Font/AdvinePixelDemo-Regular.woff"
      const fontLoader = new FontFace("AdvinePixel", `url(${fontUrl})`)

      fontLoader
        .load()
        .then((loadedFont) => {
          document.fonts.add(loadedFont)
          document.body.classList.add("advine-pixel-loaded")
          console.log("AdvinePixel 字体已加载")
        })
        .catch((error) => {
          console.error("字体加载失败:", error)
        })
    }
  })
})()
