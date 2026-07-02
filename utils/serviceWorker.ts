// Service Worker 注册和管理

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
    })
  }
}

// 预缓存图片
export function precacheImages(imageUrls: string[]) {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CACHE_IMAGES",
      imageUrls,
    })
  }
}

// 检查资源是否已缓存
export async function isResourceCached(url: string): Promise<boolean> {
  if ("caches" in window) {
    const cache = await caches.open("long-chat-cache-v1")
    const response = await cache.match(url)
    return !!response
  }
  return false
}
