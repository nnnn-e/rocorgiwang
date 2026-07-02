// Service Worker for caching resources

const CACHE_NAME = "long-chat-cache-v1"
const RESOURCES_TO_CACHE = [
  "/",
  "/favicon.ico",
  // 添加其他静态资源路径
]

// 安装 Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(RESOURCES_TO_CACHE)
    }),
  )
})

// 激活 Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// ��存策略：网络优先，失败时回退到缓存
self.addEventListener("fetch", (event) => {
  // 只处理 GET 请求
  if (event.request.method !== "GET") return

  // 排除 API 请求
  if (event.request.url.includes("/api/")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 克隆响应以便我们可以同时使用它并将其存储在缓存中
        const responseClone = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          // 只缓存成功的响应
          if (response.status === 200) {
            cache.put(event.request, responseClone)
          }
        })

        return response
      })
      .catch(() => {
        // 网络请求失败时，尝试从缓存中获取
        return caches.match(event.request)
      }),
  )
})

// 预缓存图片资源
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_IMAGES") {
    const imageUrls = event.data.imageUrls

    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        imageUrls.map((url) =>
          fetch(url)
            .then((response) => cache.put(url, response))
            .catch((error) => console.error("Failed to cache image:", url, error)),
        ),
      )
    })
  }
})
