"use client"

import { useEffect, useState } from "react"

export default function IntervalThinking() {
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // 设置定时器，每800ms切换一次动画状态
    const interval = setInterval(() => {
      setIsAnimating((prev) => !prev)
    }, 1000)

    // 组件卸载时清除定时器
    return () => clearInterval(interval)
  }, [])

  // 如果不在动画状态，使用较低透明度的白色
  return (
    <span
      className={`${isAnimating ? "gradient-animation" : ""}`}
      style={isAnimating ? {} : { color: "#444" }}
    >
      Thinking
    </span>
  )
}
