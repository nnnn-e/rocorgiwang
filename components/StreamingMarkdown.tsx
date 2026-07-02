"use client"

import { useState, useEffect, memo, useRef } from "react"
import ReactMarkdown from "react-markdown"

// 使用 memo 包装组件以避免不必要的重新渲染
const StreamingMarkdown = memo(
  ({
    content,
    className,
    components,
  }: {
    content: string
    className: string
    components: any
  }) => {
    // 使用 ref 来存储内容，避免触发重新渲染
    const contentRef = useRef(content)
    // 只在需要更新 UI 时使用的状态
    const [displayContent, setDisplayContent] = useState(content)
    // 跟踪上次更新时间
    const lastUpdateRef = useRef(Date.now())
    // 跟踪是否有待处理的更新
    const pendingUpdateRef = useRef(false)
    // 跟踪 requestAnimationFrame ID
    const rafRef = useRef<number | null>(null)

    // 使用 requestAnimationFrame 来批量处理更新
    useEffect(() => {
      // 当内容变化时，更新 ref 但不立即渲染
      contentRef.current = content

      // 如果没有待处理的更新，安排一个更新
      if (!pendingUpdateRef.current) {
        pendingUpdateRef.current = true

        const updateContent = () => {
          const now = Date.now()
          // 如果距离上次更新不到 100ms，并且内容长度超过 500 字符，延迟更新
          if (now - lastUpdateRef.current < 100 && contentRef.current.length > 500) {
            rafRef.current = requestAnimationFrame(updateContent)
            return
          }

          // 更新显示内容和时间戳
          setDisplayContent(contentRef.current)
          lastUpdateRef.current = now
          pendingUpdateRef.current = false
        }

        rafRef.current = requestAnimationFrame(updateContent)
      }

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }, [content])

    return (
      <ReactMarkdown className={className} components={components}>
        {displayContent}
      </ReactMarkdown>
    )
  },
  (prevProps, nextProps) => {
    // 只有当内容变化超过 50 个字符时才重新渲染
    // 这可以防止小的增量更新触发完整的重新渲染
    if (Math.abs(prevProps.content.length - nextProps.content.length) < 50) {
      return true // 不重新渲染
    }
    return false // 重新渲染
  },
)

StreamingMarkdown.displayName = "StreamingMarkdown"

export default StreamingMarkdown
