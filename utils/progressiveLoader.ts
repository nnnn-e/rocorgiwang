// 渐进式资源加载管理器

// 预加载图片
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

// 预加载音频
export const preloadAudio = (src: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.preload = "auto"
    audio.oncanplaythrough = () => resolve(audio)
    audio.onerror = (e) => reject(e)
    audio.src = src
  })
}

// 批量预加载资源
export const preloadResources = async (
  images: string[] = [],
  audioFiles: string[] = [],
  onProgress?: (percent: number) => void,
): Promise<void> => {
  const total = images.length + audioFiles.length
  let loaded = 0

  // 创建所有加载任务
  const tasks = [
    ...images.map((src) =>
      preloadImage(src)
        .then(() => {
          loaded++
          onProgress?.(Math.floor((loaded / total) * 100))
        })
        .catch(() => {
          loaded++
          onProgress?.(Math.floor((loaded / total) * 100))
        }),
    ),
    ...audioFiles.map((src) =>
      preloadAudio(src)
        .then(() => {
          loaded++
          onProgress?.(Math.floor((loaded / total) * 100))
        })
        .catch(() => {
          loaded++
          onProgress?.(Math.floor((loaded / total) * 100))
        }),
    ),
  ]

  // 并行执行所有任务
  await Promise.allSettled(tasks)
}

// 延迟加载非关键JS
export const loadNonCriticalJS = (scripts: string[], onComplete?: () => void): void => {
  let loaded = 0

  scripts.forEach((src) => {
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => {
      loaded++
      if (loaded === scripts.length) {
        onComplete?.()
      }
    }
    document.body.appendChild(script)
  })
}
