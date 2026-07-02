// 预加载字体
;(() => {
  const fontUrl =
    "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Font/AdvinePixelDemo-Regular.woff"

  // 创建一个新的字体加载器
  const fontLoader = new FontFace("AdvinePixel", `url(${fontUrl})`)

  // 加载字体
  fontLoader
    .load()
    .then((loadedFont) => {
      // ��加载的字体添加到文档中
      document.fonts.add(loadedFont)

      // 添加一个类到 body 表示字体已加载
      document.body.classList.add("advine-pixel-loaded")

      console.log("AdvinePixel 字体已加载")
    })
    .catch((error) => {
      console.error("字体加载失败:", error)
    })
})()
