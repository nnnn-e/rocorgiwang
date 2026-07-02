"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"

interface AppLoadingManagerProps {
  children: React.ReactNode
}

export default function AppLoadingManager({ children }: AppLoadingManagerProps) {
  // 使用useRef来确保初始加载后不再显示加载指示器
  const initialLoadCompleteRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 页面加载完成后移除加载状态
    const handleLoad = () => {
      console.log("AppLoadingManager: document loaded, setting isLoading to false")
      // 短暂延迟以确保所有关键资源已加载
      setTimeout(() => {
        setIsLoading(false)
        initialLoadCompleteRef.current = true
        document.body.classList.remove("js-loading")
      }, 100)
    }

    // 如果文档已经加载完成
    if (document.readyState === "complete") {
      console.log("AppLoadingManager: document already complete")
      handleLoad()
    } else {
      console.log("AppLoadingManager: adding load event listener")
      window.addEventListener("load", handleLoad)
      return () => window.removeEventListener("load", handleLoad)
    }
  }, [])

  // 关键修改：如果初始加载已完成，永远不再显示加载指示器
  return (
    <>
      {children}
      {isLoading && !initialLoadCompleteRef.current && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-r-transparent" />
        </div>
      )}
    </>
  )
}
