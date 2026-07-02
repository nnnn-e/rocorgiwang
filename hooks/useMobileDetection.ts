"use client"

import { useState, useEffect } from "react"

export function useMobileDetection() {
  // 初始状态设为 null，表示尚未确定
  const [state, setState] = useState<{
    isMobile: boolean
    width: number
    height: number
  }>({
    isMobile: false,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  // 添加防抖函数
  const debounce = (fn: Function, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return function (...args: any[]) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(this, args), ms)
    }
  }

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === "undefined") return

    // 检测函数
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      // 使用明确的断点 - 768px 是常见的平板/移动设备分界点
      const isMobile = width < 768

      setState({ isMobile, width, height })
    }

    // 初始检测
    checkDevice()

    // 使用防抖函数处理调整大小和方向变化
    const debouncedCheckDevice = debounce(checkDevice, 100)

    window.addEventListener("resize", debouncedCheckDevice)
    window.addEventListener("orientationchange", debouncedCheckDevice)

    return () => {
      window.removeEventListener("resize", debouncedCheckDevice)
      window.removeEventListener("orientationchange", debouncedCheckDevice)
    }
  }, [])

  return state
}
