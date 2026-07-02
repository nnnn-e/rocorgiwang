"use client"

import { useState, useEffect } from "react"

export function useRealViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 0)

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateHeight = () => {
      // 短暂延迟确保地址栏完全展开/收起
      setTimeout(() => {
        setViewportHeight(window.innerHeight)
      }, 100)
    }

    window.addEventListener("resize", updateHeight)
    window.addEventListener("orientationchange", updateHeight)

    // 初始计算
    updateHeight()

    return () => {
      window.removeEventListener("resize", updateHeight)
      window.removeEventListener("orientationchange", updateHeight)
    }
  }, [])

  return viewportHeight
}
