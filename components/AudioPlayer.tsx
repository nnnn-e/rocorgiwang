"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAudioControl } from "@/hooks/useAudioControl"
import { useAudioVisualization } from "@/hooks/useAudioVisualization"
import { ControlButton } from "@/components/audio/ControlButton"
import type { WaveformStyle } from "@/constants/audio-sources"

interface AudioPlayerProps {
  currentIndex: number
  isPlaying: boolean
  onTogglePlay: () => void
  onError?: (error: string) => void
  onChangeTrack?: (index: number) => void
  containerWidth?: number
  isChangingTrack?: boolean
  onAudioDataUpdate?: (audioData: any) => void
  backgroundImageUrl?: string // 添加背景图片 URL 属性
}

export default function AudioPlayer({
  currentIndex,
  isPlaying,
  onTogglePlay,
  onError,
  onChangeTrack,
  containerWidth = 500,
  isChangingTrack = false,
  onAudioDataUpdate,
  backgroundImageUrl, // 添加背景图片 URL 参数
}: AudioPlayerProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [nextIndex, setNextIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState(0)
  const [isCenterButtonHovered, setIsCenterButtonHovered] = useState(false)

  // 添加圆圈悬停状态
  const [isCircleHovered, setIsCircleHovered] = useState(false)

  // 添加背景图片显示状态
  const [showBackground, setShowBackground] = useState(true)

  // 添加背景图片切换动画相关状态
  const [isChangingBackground, setIsChangingBackground] = useState(false)
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState(backgroundImageUrl)
  const [nextBackgroundUrl, setNextBackgroundUrl] = useState<string | null>(null)
  const [animationDirection, setAnimationDirection] = useState<"next" | "prev">("next")

  // 加载动画相关状态
  const [loadingCharIndex, setLoadingCharIndex] = useState(0)
  const loadingChars = ["-", "\\", "|", "/"]

  // 添加波形样式索引状态，用于循环切换
  const [waveformStyleIndex, setWaveformStyleIndex] = useState(0)
  const waveformStyles: WaveformStyle[] = ["bars", "particles", "soundfield"]

  // 检测是否为移动设备（宽度小于768px）
  const isMobile = containerWidth < 768
  // 确保播放器尺寸有一个合理的默认值和最小值
  const safeContainerWidth = containerWidth || 500 // 提供默认值
  const calculatedPlayerSize = isMobile ? safeContainerWidth * 0.95 : safeContainerWidth - 64
  const playerSizeValue = Math.max(calculatedPlayerSize, 200) // 确保最小尺寸为200px

  // 生成加载动画的样式
  const centerButtonSize = Math.max(playerSizeValue * 0.3, 32) // 30% of player size, minimum 32px

  // 音频可视化相关引用
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 使用自定义 hook 处理音频控制
  const {
    audioRef,
    silentAudioRef,
    volume,
    setVolume,
    audioStatus,
    usingSilentAudio,
    audioInitialized,
    isAudioUnlocked,
    currentSourceIndex,
    audioOperationLock,
    initializeAudioSource,
    playCurrentAudio,
    increaseVolume,
    decreaseVolume,
    unlockAudioContext,
  } = useAudioControl({
    initialVolume: 0.3,
    currentIndex,
    isPlaying,
    onError,
  })

  // 使用自定义 hook 处理音频可视化
  const {
    visualizationInitialized,
    waveformStyle,
    setWaveformStyle,
    rotationSpeed,
    setRotationSpeed,
    waveAmplitude,
    setWaveAmplitude,
    waveformDensity,
    setWaveformDensity,
    bassMultiplier,
    setBassMultiplier,
    trebleMultiplier,
    setTrebleMultiplier,
    initializeAudioVisualization,
    startVisualization,
    stopVisualization,
    forceWaveformStyle,
  } = useAudioVisualization({
    audioRef,
    canvasRef,
    isPlaying,
    playerSize: playerSizeValue,
    centerButtonSize,
    onAudioDataUpdate,
  })

  // 循环切换波形样式
  const cycleWaveformStyle = () => {
    console.log("Cycling waveform style...")

    // 递增索引并确保在0-2之间循环
    const nextIndex = (waveformStyleIndex + 1) % waveformStyles.length
    setWaveformStyleIndex(nextIndex)

    // 获取下一个波形样式
    const newStyle = waveformStyles[nextIndex]

    // 使用强制更新函数设置新的波形样式
    forceWaveformStyle(newStyle)

    console.log(`Switched to ${newStyle} visualization (index: ${nextIndex})`)
  }

  // 监听背景图片URL变化，触发切换动画
  useEffect(() => {
    // 如果不显示背景图片，则不处理背景图片变化
    if (!showBackground) return

    if (backgroundImageUrl && backgroundImageUrl !== currentBackgroundUrl) {
      // 如果背景图片URL变化，触发切换动画
      setIsChangingBackground(true)
      setNextBackgroundUrl(backgroundImageUrl)

      // 根据索引变化判断动画方向
      if (currentIndex > prevIndex) {
        setAnimationDirection("next")
      } else {
        setAnimationDirection("prev")
      }

      // 动画结束后更新当前背景URL
      const timer = setTimeout(() => {
        setCurrentBackgroundUrl(backgroundImageUrl)
        setIsChangingBackground(false)
        setNextBackgroundUrl(null)
      }, 600) // 动画持续时间

      return () => clearTimeout(timer)
    }
  }, [backgroundImageUrl, currentBackgroundUrl, currentIndex, prevIndex, showBackground])

  // 初始化时设置第一个波形样式
  useEffect(() => {
    // 设置初始波形样式
    const initialStyle = waveformStyles[waveformStyleIndex]

    // 设置适合的参数
    switch (initialStyle) {
      case "bars":
        setRotationSpeed(0) // 改为0，原来是0.01
        setWaveAmplitude(0.3)
        setWaveformDensity(1)
        setBassMultiplier(1.2)
        setTrebleMultiplier(0.8)
        break
      case "particles":
        setRotationSpeed(0) // 改为0，原来是0.005
        setWaveAmplitude(0.4)
        setWaveformDensity(1.5)
        setBassMultiplier(1.3)
        setTrebleMultiplier(1.0)
        break
      case "soundfield":
        setRotationSpeed(0) // 已经是0，保持不变
        setWaveAmplitude(0.4)
        setWaveformDensity(1.2)
        setBassMultiplier(1.5)
        setTrebleMultiplier(1.2)
        break
    }

    forceWaveformStyle(initialStyle)

    console.log(`Initial visualization style: ${initialStyle} (index: ${waveformStyleIndex})`)
  }, []) // 空依赖数组确保只在组件挂载时执行一次

  useEffect(() => {
    setNextIndex((currentIndex + 1) % 30) // 假设有30个音频源
    setPrevIndex((currentIndex - 1 + 30) % 30) // 假设有30个音频源
  }, [currentIndex])

  // 加载动画
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingCharIndex((prev) => (prev + 1) % loadingChars.length)
    }, 300)

    return () => clearInterval(interval)
  }, [])

  // 切换到下一首
  const nextTrack = () => {
    // Record current playing state
    const wasPlaying = isPlaying

    // Pause current audio first to avoid interruption
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }

    // 设置动画方向为"下一首"
    setAnimationDirection("next")

    // 循环切换到下一个波形样式
    cycleWaveformStyle()

    // Wait a moment before changing tracks
    setTimeout(() => {
      // Notify parent component to switch background
      if (onChangeTrack) {
        onChangeTrack(nextIndex)
      } else {
        // If no onChangeTrack provided, directly switch audio
        initializeAudioSource(nextIndex)

        // Simulate clicking background to switch to next track
        const event = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        })
        document.querySelector(".absolute.inset-0.w-full.h-full.cursor-pointer")?.dispatchEvent(event)
      }

      // If previously playing, ensure continued playback after track change
      if (wasPlaying) {
        // Short delay before trying to play to ensure audio has loaded
        setTimeout(() => {
          if (isAudioUnlocked && audioRef.current && audioRef.current.paused) {
            // Need to start playing
            playCurrentAudio()
          }
        }, 500)
      }
    }, 100)
  }

  // 切换到上一首
  const prevTrack = () => {
    // Record current playing state
    const wasPlaying = isPlaying

    // Pause current audio first to avoid interruption
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }

    // 设置动画方向为"上一首"
    setAnimationDirection("prev")

    // 循环切换到下一个波形样式
    cycleWaveformStyle()

    // Wait a moment before changing tracks
    setTimeout(() => {
      // Notify parent component to switch background
      if (onChangeTrack) {
        onChangeTrack(prevIndex)
      } else {
        // If no onChangeTrack provided, directly switch audio
        initializeAudioSource(prevIndex)

        // Simulate clicking background to switch
        const event = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        })
        document.querySelector(".absolute.inset-0.w-full.h-full.cursor-pointer")?.dispatchEvent(event)
      }

      // If previously playing, ensure continued playback after track change
      if (wasPlaying) {
        // Short delay before trying to play to ensure audio has loaded
        setTimeout(() => {
          if (isAudioUnlocked && audioRef.current && audioRef.current.paused) {
            // Need to start playing
            playCurrentAudio()
          }
        }, 500)
      }
    }, 100)
  }

  // 切换背景图片显示状态
  const toggleBackgroundVisibility = () => {
    setShowBackground((prev) => !prev)
  }

  // 处理播放/暂停
  const handleTogglePlay = () => {
    // 尝试解锁 AudioContext 并确保可视化初始化
    unlockAudioContext()

    // 在移动设备上，确保音频可视化已初始化
    if (isMobile && !visualizationInitialized) {
      console.log("移动设备: 播放前初始化可视化")
      initializeAudioVisualization().then(() => {
        console.log("移动设备: 可视化初始化完成")
      })
    }

    // 调用父组件提供的回调函数
    onTogglePlay()
  }

  // 获取旋转原点 - 根据动画方向设置不同的原点
  const getTransformOrigin = (direction: "next" | "prev") => {
    // 如果是向下一首切换，旋转原点在左侧
    // 如果是向上一首切换，旋转原点在右侧
    return direction === "next" ? "0% 50%" : "100% 50%"
  }

  // 定义3D旋转动画变体 - 增强版，包含Z轴旋转和更复杂的缩放
  const discVariants = {
    enter: (direction: "next" | "prev") => ({
      rotateY: direction === "next" ? 90 : -90,
      rotateZ: direction === "next" ? -15 : 15, // 添加Z轴旋转
      opacity: 0,
      scale: 0.6, // 更小的起始缩放
      z: -300, // 更远的Z轴距离
    }),
    center: {
      rotateY: 0,
      rotateZ: 0, // 中心位置没有Z轴旋转
      opacity: 1,
      scale: 1, // 正常大小
      z: 0,
      transition: {
        duration: 0.6, // 稍微延长动画时间
        ease: [0.16, 1, 0.3, 1], // 使用自定义缓动函数，类似于 "easeOutQuint"
      },
    },
    exit: (direction: "next" | "prev") => ({
      rotateY: direction === "next" ? -90 : 90,
      rotateZ: direction === "next" ? 15 : -15, // 添加Z轴旋转
      opacity: 0,
      scale: 0.6, // 更小的结束缩放
      z: -300, // 更远的Z轴距离
      transition: {
        duration: 0.5,
        ease: [0.6, 0.01, 0.9, 0.4], // 使用自定义缓动函数，类似于 "easeInQuint"
      },
    }),
  }

  // 处理圆圈的鼠标进入事件
  const handleCircleMouseEnter = () => {
    setIsCircleHovered(true)
    // 保持中心按钮的悬停状态
    setIsCenterButtonHovered(true)
  }

  // 处理圆圈的鼠标离开事件
  const handleCircleMouseLeave = () => {
    setIsCircleHovered(false)
    // 不要立即取消中心按钮的悬停状态，等待确认鼠标是否真的离开了整个区域
    // 这里不设置 setIsCenterButtonHovered(false)
  }

  // 移动设备上的触摸事件处理
  const handleTouchStart = () => {
    if (isMobile) {
      console.log("移动设备: 触摸开始")
      // 尝试解锁音频上下文
      unlockAudioContext()

      // 确保可视化已初始化
      if (!visualizationInitialized) {
        console.log("移动设备: 触摸时初始化可视化")
        initializeAudioVisualization()
      }
    }
  }

  return (
    <div
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
      style={{
        transition: "opacity 0.3s ease",
        perspective: "1200px", // 增加透视距离，使3D效果更明显
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
    >
      {/* iPod风格圆盘控制器 */}
      <div
        className="rounded-full border border-white hover:border-opacity-20 flex items-center justify-center relative overflow-hidden"
        style={{
          width: `${playerSizeValue}px`,
          height: `${playerSizeValue}px`,
          borderWidth: `${Math.max(1, Math.min(8, Math.floor(volume * 10)))}px`, // 音量从0.1到1.0对应边框宽度1px到8px
          borderColor: `rgba(255, 255, 255, ${isHovering ? "1" : "0.01"})`,
          transition: "all 0.3s ease",
          boxShadow: isHovering ? "0 0 30px rgba(255, 255, 255, 0.2)" : "none", // 添加悬停时的光晕效果
        }}
      >
        {/* 背景图片层 - 使用AnimatePresence和motion.div实现3D旋转效果 */}
        {showBackground && (
          <AnimatePresence initial={false} custom={animationDirection}>
            {currentBackgroundUrl && !isChangingBackground && (
              <motion.div
                key={currentBackgroundUrl}
                className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden"
                style={{
                  zIndex: 1,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  transformOrigin: getTransformOrigin(animationDirection), // 设置旋转原点
                }}
                initial="enter"
                animate="center"
                exit="exit"
                variants={discVariants}
                custom={animationDirection}
              >
                <img
                  src={currentBackgroundUrl || "/placeholder.svg"}
                  alt="Background"
                  className="w-full h-full object-cover"
                  style={{
                    opacity: 0.99,
                    animation: isPlaying ? "spin 120s linear infinite" : "none",
                  }}
                />
                {/* 添加一个半透明的叠加层，使控制元素更加可见 */}
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              </motion.div>
            )}

            {nextBackgroundUrl && isChangingBackground && (
              <motion.div
                key={nextBackgroundUrl}
                className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden"
                style={{
                  zIndex: 1,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  transformOrigin: getTransformOrigin(animationDirection), // 设置旋转原点
                }}
                initial="enter"
                animate="center"
                exit="exit"
                variants={discVariants}
                custom={animationDirection}
              >
                <img
                  src={nextBackgroundUrl || "/placeholder.svg"}
                  alt="Next Background"
                  className="w-full h-full object-cover"
                  style={{
                    opacity: 0.99,
                  }}
                />
                {/* 添加一个半透明的叠加层，使控制元素更加可见 */}
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* 当背景图片隐藏时，显示纯黑色背景 */}
        {!showBackground && (
          <div
            className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden bg-black"
            style={{ zIndex: 1 }}
          >
            {/* 添加一个半透明的叠加层，使控制元素更加可见 */}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          </div>
        )}

        {/* 音频可视化画布 - 放在圆形内部 */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ borderRadius: "50%", zIndex: 2 }}
        />

        {/* 添加波形样式指示器 */}
        <div
          className="absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-mono"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            opacity: isHovering ? 0.8 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          {waveformStyle}
        </div>

        {/* Center play/pause button */}
        <div
          className="relative"
          // 创建一个包含按钮和圆圈的容器，共享悬停状态
          onMouseEnter={() => setIsCenterButtonHovered(true)}
          onMouseLeave={() => {
            // 只有当圆圈也没有被悬停时，才设置为false
            if (!isCircleHovered) {
              setIsCenterButtonHovered(false)
            }
          }}
        >
          {/* 使用framer-motion的AnimatePresence和motion.div实现背景动画 */}
          <AnimatePresence>
            {isCenterButtonHovered && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute rounded-full z-10"
                style={{
                  width: `${centerButtonSize}px`,
                  height: `${centerButtonSize}px`,
                  background: "rgba(0, 0, 0, 0.8)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  top: 0,
                  left: 0,
                }}
              />
            )}
          </AnimatePresence>

          <ControlButton
            onClick={handleTogglePlay}
            position="center"
            disabled={isChangingTrack || audioOperationLock.current || isChangingBackground}
            isHovering={isHovering}
            centerButtonSize={centerButtonSize}
          >
            <span className="text-white relative z-30">
              {isChangingTrack || audioOperationLock.current || isChangingBackground ? (
                <span className="animate-pulse">{loadingChars[loadingCharIndex]}</span>
              ) : isPlaying ? (
                "STOP"
              ) : (
                "PLAY"
              )}
            </span>
          </ControlButton>

          {/* 添加背景图片切换按钮 - 相对于PLAY按钮定位 */}
          <div
            className="absolute z-20 cursor-pointer"
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: showBackground ? "rgba(255, 255, 255, .1)" : "rgba(100, 100, 100, 1)",
              bottom: "1rem", // 位于PLAY按钮下方1rem处
              left: "50%",
              transform: "translateX(-50%)", // 水平居中
              opacity: isCenterButtonHovered ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
            onClick={toggleBackgroundVisibility}
            title={showBackground ? "隐藏背景图片" : "显示背景图片"}
            onMouseEnter={handleCircleMouseEnter}
            onMouseLeave={handleCircleMouseLeave}
          />
        </div>

        {/* Top - Volume up */}
        <ControlButton
          onClick={increaseVolume}
          position="top"
          disabled={isChangingTrack || audioOperationLock.current || isChangingBackground}
          isHovering={isHovering}
        >
          STRONG
        </ControlButton>

        {/* Right - Next track */}
        <ControlButton
          onClick={nextTrack}
          position="right"
          disabled={isChangingTrack || audioOperationLock.current || isChangingBackground}
          isHovering={isHovering}
        >
          NEXT
        </ControlButton>

        {/* Bottom - Volume down */}
        <ControlButton
          onClick={decreaseVolume}
          position="bottom"
          disabled={isChangingTrack || audioOperationLock.current || isChangingBackground}
          isHovering={isHovering}
        >
          WHISPER
        </ControlButton>

        {/* Left - Previous track */}
        <ControlButton
          onClick={prevTrack}
          position="left"
          disabled={isChangingTrack || audioOperationLock.current || isChangingBackground}
          isHovering={isHovering}
        >
          PREV
        </ControlButton>
      </div>

      {/* 添加全局CSS动画 */}
      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .opacity-transition {
          opacity: ${isHovering ? 1 : 0.2};
          transition: opacity 0.3s ease;
        }
      `}</style>
    </div>
  )
}
