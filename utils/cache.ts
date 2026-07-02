// 创建一个新文件用于缓存功能

interface CacheObject {
  value: any
  timestamp: number
}

class LocalCache {
  private prefix: string
  private ttl: number // 缓存生存时间(毫秒)

  constructor(prefix = "chat_cache_", ttl = 1000 * 60 * 60 * 24) {
    // 默认缓存24小时
    this.prefix = prefix
    this.ttl = ttl
  }

  // 设置缓存
  set(key: string, value: any): void {
    try {
      const cacheObj: CacheObject = {
        value,
        timestamp: Date.now(),
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(cacheObj))
    } catch (e) {
      console.error("Failed to set cache:", e)
    }
  }

  // 获取缓存
  get(key: string): any | null {
    try {
      const cacheItem = localStorage.getItem(this.prefix + key)
      if (!cacheItem) return null

      const cacheObj: CacheObject = JSON.parse(cacheItem)

      // 检查缓存是否过期
      if (Date.now() - cacheObj.timestamp > this.ttl) {
        this.remove(key)
        return null
      }

      return cacheObj.value
    } catch (e) {
      console.error("Failed to get cache:", e)
      return null
    }
  }

  // 移除缓存
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key)
  }

  // 清除所有缓存
  clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key))
  }

  // 生成一个简单的缓存键
  generateCacheKey(input: string, modelId: string): string {
    // 只取输入的前50个字符作为键的一部分
    const truncatedInput = input.substring(0, 50)
    // 使用简单的哈希函数
    const hash = this.simpleHash(truncatedInput)
    return `${modelId}_${hash}`
  }

  // 简单的哈希函数
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16) // Convert to hex
  }
}

export const chatCache = new LocalCache()

export function logError(message: string) {
  // 开发环境才输出详细日志
  if (process.env.NODE_ENV === "development") {
    console.debug(message)
  }

  // 可以将错误记录到监控服务，但不显示给用户
  // 例如: reportErrorToMonitoring(message);
}
