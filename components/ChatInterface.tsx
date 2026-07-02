"use client"

import React, { useRef, useState, useLayoutEffect } from "react"
import { useMobileDetection } from "@/hooks/useMobileDetection"
import LeftPanel from "./LeftPanel"
import ChatPanel from "./ChatPanel"

export default function ChatInterface() {
  // 设备检测
  const { isMobile, width: windowWidth } = useMobileDetection()

  // 左侧容器宽度状态
  const [leftContainerWidth, setLeftContainerWidth] = useState(500)
  const leftContainerRef = useRef<HTMLDivElement>(null)
  const [leftWidth, setLeftWidth] = useState(50)

  // 监听左侧容器宽度变化
  useLayoutEffect(() => {
    const updateLeftContainerWidth = () => {
      if (leftContainerRef.current) {
        setLeftContainerWidth(leftContainerRef.current.offsetWidth)
      }
    }

    // 初始更新
    updateLeftContainerWidth()

    // 使用ResizeObserver更精确地监测容器尺寸变化
    let resizeObserver: ResizeObserver | null = null
    if (leftContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateLeftContainerWidth()
      })
      resizeObserver.observe(leftContainerRef.current)
    }

    // 添加窗口大小变化监听作为备用
    window.addEventListener("resize", updateLeftContainerWidth)

    // 添加一个延迟测量，确保在页面完全加载后再次测量
    const timeoutId = setTimeout(updateLeftContainerWidth, 500)

    // 清理函数
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener("resize", updateLeftContainerWidth)
      clearTimeout(timeoutId)
    }
  }, [])

  // 窗口大小变化时重新计算字体大小
  React.useEffect(() => {
    const handleResize = () => {
      setLeftWidth((prev) => prev)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 移动端布局
  if (isMobile) {
    return (
      <div className="relative w-full overflow-y-auto">
        {/* 第一部分：背景画廊 */}
        <div className="w-full" style={{ height: "90vh" }}>
          <LeftPanel containerWidth={leftContainerWidth} isMobile={isMobile} windowWidth={windowWidth} />
        </div>

        {/* 第二部分：聊天界面 */}
        <div className="w-full bg-[#101010]" style={{ height: "90vh" }}>
          <ChatPanel isMobile={isMobile} />
        </div>
      </div>
    )
  }

  // 桌面布局
  return (
    <div className="flex h-screen w-full relative overflow-hidden">
      <div
        ref={leftContainerRef}
        className="h-full overflow-hidden flex flex-col relative"
        style={{
          width: `${leftWidth}%`,
          transition: "width 0.3s ease-in-out",
        }}
      >
        {/* 使用 LeftPanel 组件 */}
        <LeftPanel containerWidth={leftContainerWidth} isMobile={isMobile} windowWidth={windowWidth} />
      </div>
      <div
        className="h-full overflow-hidden flex flex-col relative"
        style={{
          width: `${100 - leftWidth}%`,
          background: "#101010",
          transition: "width 0.3s ease-in-out",
          borderLeft: "1px solid rgba(255,255,255, .07)"
        }}
      >
        {/* 使用 ChatPanel 组件 */}
        <ChatPanel isMobile={isMobile} />
      </div>
    </div>
  )
}
