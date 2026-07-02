"use client"

// 创建一个新的独立组件来处理思考动画
import { useEffect, useRef } from "react"

interface ThinkingIndicatorProps {
  isVisible: boolean
}

export default function ThinkingIndicator({ isVisible }: ThinkingIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  // 使用 requestAnimationFrame 直接操作 DOM，避免 React 重新渲染
  useEffect(() => {
    if (!isVisible) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const loadingChars = ["☉౪⊙", "இwஇ", "＿ ＿", "=^^=", "╯╰", "T_T"]
    let index = 0
    let lastUpdateTime = 0
    const updateInterval = 150 // ms

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateTime > updateInterval) {
        if (indicatorRef.current) {
          indicatorRef.current.textContent = loadingChars[index]
          index = (index + 1) % loadingChars.length
        }
        lastUpdateTime = timestamp
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="flex items-center text-white/60 space-x-2 mt-4" 
    style=
    {{ 
      fontSize: "16px", 
      color: "rgba(255,255,255, .6)" 
      }}>
      <span>Thinking</span>
      <span ref={indicatorRef}>☉౪⊙</span>
    </div>
  )
}
