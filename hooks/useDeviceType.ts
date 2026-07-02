"use client"

import { useState, useEffect } from "react"

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === "undefined") return

    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // 初始检查
    checkDevice()

    // 监听窗口大小变化
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  return { isMobile }
}
