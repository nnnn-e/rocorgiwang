"use client"

import type React from "react"
import { useMemo, memo, useRef, useEffect, useState } from "react"
import { addSpaceBetweenChineseAndOthers } from "@/utils/formatChinese"
import { matchIconToText } from "@/utils/iconMatcher"

interface KeyPointsCardProps {
  points: string[]
  onPointClick?: (point: string) => void
  messageId?: string // 消息ID用于稳定的key和重置图标选择
}

// Function to strip markdown formatting
const stripMarkdown = (text: string): string => {
  return (
    text
      // Remove bold/italic formatting
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Remove links
      .replace(/\[([^\]]+)\]$$([^)]+)$$/g, "$1")
      // Remove headers
      .replace(/^#+\s+/gm, "")
      // Remove code blocks and inline code
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove lists
      .replace(/^[*\-+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      // Remove horizontal rules
      .replace(/^(?:[-*_]){3,}$/gm, "")
      .trim()
  )
}

// 使用memo包装组件以避免不必要的重新渲染
const KeyPointsCard = memo(
  function KeyPointsCard({ points, onPointClick, messageId = "default" }: KeyPointsCardProps) {
    // 添加状态来跟踪当前悬停的提示信息
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

    // 添加状态来跟踪鼠标悬停的卡片和鼠标位置
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

    // Process points to strip markdown
    const plainTextPoints = useMemo(() => {
      return points.map((point) => stripMarkdown(point))
    }, [points])

    // 使用useMemo缓存每个点的图标，确保它们在重新渲染时保持稳定
    const pointIcons = useMemo(() => {
      // 为每个关键点匹配最合适的图标
      return plainTextPoints.map((point, index) => matchIconToText(point, messageId, index, plainTextPoints.length))
    }, [plainTextPoints, messageId])

    // 添加动画引用
    const containerRef = useRef<HTMLDivElement>(null)
    // 添加卡片引用数组
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])

    // 添加动画效果
    useEffect(() => {
      if (containerRef.current && plainTextPoints.length > 0) {
        const cards = containerRef.current.querySelectorAll(".key-point-card")
        cards.forEach((card, index) => {
          // 减少延迟时间，使动画更连贯
          ;(card as HTMLElement).style.animationDelay = `${index * 60}ms`
          card.classList.add("animate-slide-in")
        })
      }
    }, [plainTextPoints])

    // 如果没有点或点数组为空，则不渲染任何内容
    if (!plainTextPoints || plainTextPoints.length === 0) return null

    // 处理点击事件
    const handleClick = (point: string) => {
      if (onPointClick) {
        // Use the original point with markdown for clicking
        const originalPoint = points[plainTextPoints.indexOf(point)]
        onPointClick(originalPoint || point)
      }
    }

    // 处理键盘事件，支持可访问性
    const handleKeyDown = (e: React.KeyboardEvent, point: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleClick(point)
      }
    }

    // 显示提示框
    const showTooltip = (text: string, e: React.MouseEvent) => {
      // 获取鼠标位置
      const x = e.clientX
      const y = e.clientY
      setTooltip({ text, x, y })
    }

    // 隐藏提示框
    const hideTooltip = () => {
      setTooltip(null)
    }

    // 处理鼠标进入卡片事件
    const handleMouseEnter = (index: number) => {
      setHoveredCardIndex(index)
    }

    // 处理鼠标离开卡片事件
    const handleMouseLeave = () => {
      setHoveredCardIndex(null)
    }

    // 处理鼠标在卡片上移动事件
    const handleMouseMove = (e: React.MouseEvent, index: number) => {
      if (cardRefs.current[index]) {
        const card = cardRefs.current[index]
        if (card) {
          const rect = card.getBoundingClientRect()
          // 计算鼠标在卡片内的相对位置 (0-100%)
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          setMousePosition({ x, y })
        }
      }
    }

    // 格式化手机号（移除空格）
    const formatPhoneNumber = (phone: string): string => {
      // 移除所有空格
      return phone.replace(/\s+/g, "")
    }

    // 处理邮箱和手机号，将其转换为可点击的链接
    const processText = (text: string) => {
      // 邮箱正则表达式
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi

      // 微信同手机号模式检测
      // 匹配"微信同手机号"或类似短语，后面跟着可能有空格的手机号
      const wechatPhoneRegex = /(微信同手机号|微信号|微信和手机号|联系方式)[：:]*\s*([1][3-9][\s\d]{9,})/i
      const wechatPhoneMatch = text.match(wechatPhoneRegex)

      if (wechatPhoneMatch) {
        // 提取手机号并格式化（移除空格）
        const rawPhone = wechatPhoneMatch[2]
        const formattedPhone = formatPhoneNumber(rawPhone)

        // 分割文本：前缀、手机号部分、后缀
        const parts = text.split(wechatPhoneRegex)

        return (
          <>
            {parts[0]}
            <>
              微信同手机号：
              <span
                className="underline cursor-pointer transition-colors"
                style={{ color: "rgba(255,255,255, .6)" }}
                onClick={(e) => {
                  e.stopPropagation() // 防止触发卡片点击事件
                  window.location.href = `tel:${formattedPhone}`
                }}
                onMouseEnter={(e) => {
                  showTooltip(formattedPhone, e)
                  e.currentTarget.style.color = "rgba(255,255,255, 1)"
                }}
                onMouseLeave={(e) => {
                  hideTooltip()
                  e.currentTarget.style.color = "rgba(255,255,255, .6)"
                }}
              >
                查看
              </span>
            </>
            {parts[3] || ""}
          </>
        )
      }

      // 普通手机号正则表达式 (支持带空格的格式)
      // 匹配1开头，后面跟着9-11个数字��空格的组合
      const phoneRegex = /(?<!\d)([1][3-9][\s\d]{9,11})(?!\d)/g

      // 检查文本是否包含邮箱
      if (emailRegex.test(text)) {
        // 将文本分割成邮箱和非邮箱部分
        const parts = text.split(emailRegex)
        const matches = text.match(emailRegex) || []

        return (
          <>
            {parts.map((part, index) => {
              // 如果是邮箱匹配部分，渲染为链接
              if (index % 2 === 1 && matches[(index - 1) / 2]) {
                const email = matches[(index - 1) / 2]
                return (
                  <span
                    key={index}
                    className="underline cursor-pointer transition-colors"
                    style={{ color: "rgba(255,255,255, .6)" }}
                    onClick={(e) => {
                      e.stopPropagation() // 防止触发卡片点击事件
                      window.location.href = `mailto:${email}`
                    }}
                    onMouseEnter={(e) => {
                      showTooltip(email, e)
                      e.currentTarget.style.color = "rgba(255,255,255, 1)"
                    }}
                    onMouseLeave={(e) => {
                      hideTooltip()
                      e.currentTarget.style.color = "rgba(255,255,255, .6)"
                    }}
                  >
                    查看邮箱
                  </span>
                )
              }
              // 非邮箱部分正常显示
              return part
            })}
          </>
        )
      }

      // 检查文本是包含普通手机号
      if (phoneRegex.test(text)) {
        // 将文本分割成手机号和非手机号部分
        const parts = text.split(phoneRegex)
        const matches = text.match(phoneRegex) || []

        return (
          <>
            {parts.map((part, index) => {
              // 如果是手机号匹配部分，渲染为链接
              if (index % 2 === 1 && matches[(index - 1) / 2]) {
                const phone = matches[(index - 1) / 2]
                const formattedPhone = formatPhoneNumber(phone)
                return (
                  <span
                    key={index}
                    className="underline cursor-pointer transition-colors"
                    style={{ color: "rgba(255,255,255, .6)" }}
                    onClick={(e) => {
                      e.stopPropagation() // 防止触发卡片点击事件
                      window.location.href = `tel:${formattedPhone}`
                    }}
                    onMouseEnter={(e) => {
                      showTooltip(formattedPhone, e)
                      e.currentTarget.style.color = "rgba(255,255,255, 1)"
                    }}
                    onMouseLeave={(e) => {
                      hideTooltip()
                      e.currentTarget.style.color = "rgba(255,255,255, .6)"
                    }}
                  >
                    查看手机号
                  </span>
                )
              }
              // 非手机号部分正常显示
              return part
            })}
          </>
        )
      }

      // 如果没有邮箱或手机号，返回原始文本
      return addSpaceBetweenChineseAndOthers(text.length > 60 ? `${text.substring(0, 60)}...` : text)
    }

    return (
      <div className="key-points-container my-6 relative" ref={containerRef} data-message-id={messageId}>
        <h5 className="text-base uppercase mb-3" style={{ color: "rgba(255,255,255, .6)" }}>
          Key words ({plainTextPoints.length})
        </h5>
        <div className="key-points-grid grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {plainTextPoints.map((point, index) => (
            <div
              key={`${messageId}-point-${index}`}
              className="key-point-card p-3 md:p-3 flex flex-col items-start transition-all cursor-pointer animate-slide-in overflow-hidden"
              style={{
                borderRadius: "1rem",
                background: "rgba(255,255,255, 0.05)",
                animationDelay: `${index * 60}ms`,
                opacity: 0, // 初始设置为不可见，由动画控制显示
                position: "relative", // 确保可以正确定位伪元素
              }}
              onClick={() => handleClick(point)}
              onKeyDown={(e) => handleKeyDown(e, point)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={(e) => handleMouseMove(e, index)}
              ref={(el) => (cardRefs.current[index] = el)}
              tabIndex={0}
              role="button"
              aria-label={`Send as prompt: ${point}`}
            >
              {/* 渐变效果层 */}
              <div
                className="absolute inset-0 transition-opacity duration-400 ease-in-out pointer-events-none"
                style={{
                  opacity: hoveredCardIndex === index ? 1 : 0,
                  background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.1) 60%, rgba(255,255,255,0.01) 100%)`,
                }}
              />

              <div
                className="key-point-icon mb-4 flex-shrink-0 relative z-10"
                style={{ color: "rgba(255,255,255, .7)" }}
              >
                {pointIcons[index]}
              </div>
              <p className="key-point-text text-sm md:text-sm text-white/80 font-normal break-words line-clamp-3 md:line-clamp-none relative z-10">
                {processText(point)}
              </p>
            </div>
          ))}
        </div>

        {/* 悬停提示框 */}
        {tooltip && (
          <div
            className="fixed z-50 px-2 py-1 text-xs text-white bg/white rounded shadow-lg pointer-events-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 30}px`, // 在鼠标上方显示
              transform: "translateX(-50%)",
              maxWidth: "250px",
              wordBreak: "break-all",
            }}
          >
            {tooltip.text}
          </div>
        )}

        {/* 确保动画样式存在且正确 */}
        <style jsx global>{`
          @keyframes slideIn {
            0% {
              opacity: 0;
              transform: translateX(-15px) scale(0.98);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          
          .animate-slide-in {
            animation: slideIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            will-change: transform, opacity;
            backface-visibility: hidden;
          }
          
          .key-point-text {
            word-break: break-word;
            overflow-wrap: break-word;
            width: 100%;
          }
        `}</style>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // 自定义比较函数，只有当points数组或messageId真正变化时才重新渲染
    return (
      prevProps.messageId === nextProps.messageId &&
      prevProps.points.length === nextProps.points.length &&
      prevProps.points.every((point, i) => point === nextProps.points[i])
    )
  },
)

export default KeyPointsCard
