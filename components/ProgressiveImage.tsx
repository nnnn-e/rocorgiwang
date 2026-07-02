"use client"

import { useState, useEffect } from "react"

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}

export default function ProgressiveImage({ src, alt, className = "", width, height }: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState("")

  useEffect(() => {
    // 重置状态
    setIsLoaded(false)

    // 创建低质量的缩略图URL
    const thumbnailSrc = `${src}?quality=10&width=50`

    // 先加载缩略图
    const thumbnailImg = new Image()
    thumbnailImg.src = thumbnailSrc
    thumbnailImg.onload = () => {
      setCurrentSrc(thumbnailSrc)

      // 然后加载高质量图片
      const fullImg = new Image()
      fullImg.src = src
      fullImg.onload = () => {
        setCurrentSrc(src)
        setIsLoaded(true)
      }
    }

    return () => {
      thumbnailImg.onload = null
    }
  }, [src])

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {currentSrc && (
        <img
          src={currentSrc || "/placeholder.svg"}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-80"
          }`}
          style={{
            filter: isLoaded ? "none" : "blur(10px)",
            transition: "filter 0.3s ease-out",
          }}
        />
      )}
    </div>
  )
}
