"use client"

import type React from "react"
import { forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import { Square } from "lucide-react"

interface InputContainerProps {
  input: string
  setInput: (input: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isGenerating: boolean
  stopGeneration: () => void
  isMobile: boolean
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const InputContainer = forwardRef<HTMLTextAreaElement, InputContainerProps>(
  ({ input, setInput, handleSubmit, isGenerating, stopGeneration, isMobile, handleKeyDown, onInputChange }, ref) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => inputRef.current!)

    // 自动调整textarea高度的函数
    const adjustTextareaHeight = () => {
      const textarea = inputRef.current
      if (!textarea) return

      // 重置高度以获取正确的scrollHeight
      textarea.style.height = "auto"

      // 计算新高度 (内容高度 + 边框)
      const newHeight = Math.max(
        textarea.scrollHeight, // 内容实际高度
        72, // 最小高度，确保足够显示两行文本（约24px行高 × 2 + 24px内边距）
      )

      // 设置新高度
      textarea.style.height = `${newHeight}px`
    }

    // 监听输入变化时调整高度
    useEffect(() => {
      adjustTextareaHeight()
    }, [input])

    // 组件挂载时调整一次高度，并设置一个延迟调整以确保字体加载完成
    useEffect(() => {
      // 立即调整一次
      adjustTextareaHeight()

      // 设置一个延迟调整，确保字体和布局完全加载
      const timer = setTimeout(() => {
        adjustTextareaHeight()
      }, 50)

      // 添加窗口大小变化监听
      window.addEventListener("resize", adjustTextareaHeight)

      // 清理函数
      return () => {
        clearTimeout(timer)
        window.removeEventListener("resize", adjustTextareaHeight)
      }
    }, [])

    return (
      <form onSubmit={handleSubmit}>
        {/* 完全重构容器结构，使用绝对定位按钮 */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              onInputChange(e)
            }}
            onKeyDown={handleKeyDown}
            onFocus={adjustTextareaHeight}
            className="w-full bg-white/5 backdrop-blur-[40px] rounded-2xl resize-none outline-none py-3 pl-4 pr-12 placeholder:text-white/30"
            style={{
              fontSize: "16px",
              lineHeight: "24px",
              overflow: "hidden",
              minHeight: "72px", // 增加到足够容纳2行文本的高度
              paddingTop: "12px", // 稍微增加顶部内边距
              paddingBottom: "12px", // 稍微增加底部内边距
              display: "block", // 确保是块级元素
              boxSizing: "border-box", // 确保padding包含在高度内
            }}
            rows={2} // 设置为2行
            placeholder="Ask me anything..."
          />

          {/* 绝对定位的按钮 */}
          <div className="absolute right-2 bottom-2">
            <button
              type="submit"
              className={`flex items-center justify-center rounded-full w-8 h-8 ${
                input.trim() || isGenerating ? "bg-white text-black" : "text-white/30"
              } focus:outline-none transition-colors duration-400`}
              disabled={!input.trim() && !isGenerating}
              onClick={isGenerating ? stopGeneration : undefined}
              aria-label={isGenerating ? "Stop generation" : "Send message"}
            >
              {isGenerating ? (
                <Square className="w-3 h-3" fill="currentColor" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    )
  },
)

InputContainer.displayName = "InputContainer"

export default InputContainer
