// 移除大部分背景图片管理代码，简化组件

"use client"

import { useState, useEffect, useRef } from "react"
import AudioPlayer from "./AudioPlayer"
import { debugError } from "@/constants/audio-sources"

// 更新接口定义
interface BackgroundGalleryProps {
  onClick: () => void
}

// 简化的背景图片数组，仅用于圆形播放器
const playerBackgroundImages = [
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/u1376821896_httpss.mj.run58UATG7J5WQ_Blue_sky_a_huge_cute_dog_73071515-bcad-4c86-991b-13d0060fc0df_0.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/0_0.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/0_1.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/0_2%20%281%29.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/0_3%20%281%29.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/u1376821896_Black_and_white_minimalist_illustration_clean_bol_9b3db6dc-7522-4895-a1b5-5fb381b2db7b_0.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/0_0%20%2810%29.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/0_0%20%288%29.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/0_0.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/0_2%20%281%29.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/0_2%20%282%29.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/0_3%20%281%29.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/0_3%20%282%29.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/Galaxy.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/video-bg.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/Town.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/u1376821896_Golden_hour_moonlight_casts_a_soft_warm_glow_over_438a1aa6-8891-48a3-8488-529c12d4d755_1.png?x-oss-process=style/cover",
  "https://rocorgi.oss-ap-northeast-1.aliyuncs.com/RocorgiWang/ChatGPT%20Image%202025%E5%B9%B44%E6%9C%8823%E6%97%A5%2019_11_09.png?x-oss-process=style/cover",
]

export default function BackgroundGallery({ onClick }: BackgroundGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(500)
  const [containerHeight, setContainerHeight] = useState(500)
  const [userClickingInterval, setUserClickingInterval] = useState<NodeJS.Timeout | null>(null)
  const [isUserActivelyClicking, setIsUserActivelyClicking] = useState(false)

  // 使用useRef来存储最近使用的图片索引，避免重复选择
  const recentIndicesRef = useRef<number[]>([])

  // 保留音频数据状态
  const [audioData, setAudioData] = useState<{
    frequencyData: Uint8Array | null
    timeData: Uint8Array | null
    averageIntensity: number
    bassIntensity: number
    midIntensity: number
    trebleIntensity: number
  }>({
    frequencyData: null,
    timeData: null,
    averageIntensity: 0,
    bassIntensity: 0,
    midIntensity: 0,
    trebleIntensity: 0,
  })

  // 监听容器宽度变化
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef) {
        setContainerWidth(containerRef.offsetWidth)
        setContainerHeight(containerRef.offsetHeight)
      }
    }

    // 初始更新
    updateContainerWidth()

    // 使用ResizeObserver更精确地监测容器尺寸变化
    let resizeObserver: ResizeObserver | null = null
    if (containerRef && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateContainerWidth()
      })
      resizeObserver.observe(containerRef)
    }

    // 添加窗口大小变化监听作为备用
    window.addEventListener("resize", updateContainerWidth)

    // 添加一个延迟测量，确保在页面完全加载后再次测量
    const timeoutId = setTimeout(updateContainerWidth, 500)

    // 清理函数
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener("resize", updateContainerWidth)
      clearTimeout(timeoutId)
    }
  }, [containerRef])

  // 首次加载时不自动播放音频，等待用户交互
  useEffect(() => {
    const handleFirstInteraction = () => {
      // 用户交互后才尝试播放音频
      setHasUserInteracted(true)

      // 初始化音频上下文（解决Safari和Chrome的自动播放限制）
      if (!audioInitialized) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          // 创建一个短暂的静音音频
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          gainNode.gain.value = 0 // 静音
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.001)
          setAudioInitialized(true)
        } catch (error) {
          console.error("初始化音频上下文失败:", error)
        }
      }

      window.removeEventListener("click", handleFirstInteraction)
    }

    window.addEventListener("click", handleFirstInteraction)
    return () => window.removeEventListener("click", handleFirstInteraction)
  }, [audioInitialized])

  // 清理错误超时
  useEffect(() => {
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout)
      }
      if (userClickingInterval) {
        clearTimeout(userClickingInterval)
      }
    }
  }, [errorTimeout, userClickingInterval])

  // 简化的图片选择函数，避免选择最近使用过的图片
  const selectNextImageIndex = () => {
    // 如果图片数组为空，返回0
    if (playerBackgroundImages.length === 0) {
      return 0
    }

    // 如果只有一张图片，只能返回当前索引
    if (playerBackgroundImages.length === 1) {
      return 0
    }

    // 获取当前索引
    const currentIndex = currentImageIndex

    // 创建一个可用索引数组（排除当前索引和最近使用的索引）
    const recentIndices = recentIndicesRef.current
    const availableIndices = Array.from({ length: playerBackgroundImages.length }, (_, i) => i).filter(
      (i) => i !== currentIndex && !recentIndices.includes(i),
    )

    // 如果有可用索引，随机选择一个
    if (availableIndices.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length)
      const selectedIndex = availableIndices[randomIndex]

      // 更新最近使用的索引
      recentIndicesRef.current = [selectedIndex, ...recentIndices.slice(0, 2)]

      return selectedIndex
    }

    // 如果没有可用索引，随机选择一个非当前索引
    const allOtherIndices = Array.from({ length: playerBackgroundImages.length }, (_, i) => i).filter(
      (i) => i !== currentIndex,
    )

    const randomIndex = Math.floor(Math.random() * allOtherIndices.length)
    const selectedIndex = allOtherIndices[randomIndex]

    // 更新最近使用的索引
    recentIndicesRef.current = [selectedIndex, ...recentIndices.slice(0, 2)]

    return selectedIndex
  }

  // 简化的 nextImage 函数
  const nextImage = () => {
    try {
      // 标记用户正在主动点击
      setIsUserActivelyClicking(true)

      // 清除之前的定时器
      if (userClickingInterval) {
        clearTimeout(userClickingInterval)
      }

      // 设置新的定时器，2秒内没有点击则认为用户停止点击
      const interval = setTimeout(() => {
        setIsUserActivelyClicking(false)
      }, 2000)

      setUserClickingInterval(interval)

      // 选择下一个图片索引
      const nextIndex = selectNextImageIndex()
      setCurrentImageIndex(nextIndex)

      // 清除之前的错误
      setAudioError(null)

      // 调用传入的onClick回调
      onClick()
    } catch (error) {
      debugError("切换背景图片时出错:", error)
    }
  }

  // 修改toggleAudio函数，使其在背景切换时也切换音频
  const toggleAudio = () => {
    // 简化逻辑，只切换播放状态
    setIsAudioPlaying(!isAudioPlaying)

    // 清除任何错误消息
    setAudioError(null)

    // 记录用户交互
    if (!hasUserInteracted) {
      setHasUserInteracted(true)
      setAudioInitialized(true)
    }
  }

  // 处理音频错误
  const handleAudioError = (error: string) => {
    setAudioError(error)
    console.error("音频错误:", error)

    // 5秒后自动清除错误消息
    if (errorTimeout) {
      clearTimeout(errorTimeout)
    }

    const timeout = setTimeout(() => {
      setAudioError(null)
    }, 5000)

    setErrorTimeout(timeout)
  }

  // 处理音频轨道变化
  const handleTrackChange = (index: number) => {
    // 确保索引在有效范围内
    const safeIndex = Math.max(0, Math.min(index, playerBackgroundImages.length - 1))

    // 更新当前索引
    setCurrentImageIndex(safeIndex)

    // 更新最近使用的索引
    recentIndicesRef.current = [safeIndex, ...recentIndicesRef.current.slice(0, 2)]
  }

  return (
    <>
      <div
        ref={(el) => setContainerRef(el)}
        className="absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-500"
        aria-label="Click to change background"
        onClick={nextImage}
      >
        {/* 基础黑色背景层 - 始终存在 */}
        <div className="absolute inset-0 w-full h-full z-0 bg-black" />

        {/* 半透明叠加层，提供更好的文字可读性 */}
        <div className="absolute inset-0 bg-black opacity-30 z-10" />
      </div>

      {/* 音频播放器 - 传递当前背景图片URL */}
      <AudioPlayer
        currentIndex={currentImageIndex}
        isPlaying={isAudioPlaying}
        onTogglePlay={toggleAudio}
        onError={handleAudioError}
        onChangeTrack={handleTrackChange}
        containerWidth={containerWidth}
        isChangingTrack={false}
        onAudioDataUpdate={setAudioData}
        backgroundImageUrl={playerBackgroundImages[currentImageIndex]} // 直接使用简化的图片数组
      />

      {/* 音频错误提示 - 只在用户尝试播放音频时显示 */}
      {audioError && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-black bg-opacity-70 text-white px-4 py-2 rounded-md text-sm"
          style={{ maxWidth: "80%", textAlign: "center" }}
        >
          {audioError}
          <button
            className="ml-2 bg-white bg-opacity-30 px-1 rounded-sm hover:bg-opacity-50"
            onClick={() => setAudioError(null)}
          >
            关闭
          </button>
        </div>
      )}
    </>
  )
}
