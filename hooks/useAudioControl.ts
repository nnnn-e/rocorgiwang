"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { AUDIO_SOURCES, SILENT_AUDIO, debugLog, debugError } from "@/constants/audio-sources"

interface UseAudioControlProps {
  initialVolume?: number
  currentIndex: number
  isPlaying: boolean
  onError?: (error: string) => void
}

interface UseAudioControlReturn {
  audioRef: React.RefObject<HTMLAudioElement>
  silentAudioRef: React.RefObject<HTMLAudioElement>
  volume: number
  setVolume: React.Dispatch<React.SetStateAction<number>>
  audioStatus: string
  usingSilentAudio: boolean
  audioInitialized: boolean
  isAudioUnlocked: boolean
  currentSourceIndex: React.MutableRefObject<number>
  audioOperationLock: React.MutableRefObject<boolean>
  initializeAudioSource: (index: number) => void
  playCurrentAudio: () => void
  increaseVolume: () => void
  decreaseVolume: () => void
  unlockAudioContext: () => Promise<void>
}

export function useAudioControl({
  initialVolume = 0.3,
  currentIndex,
  isPlaying,
  onError,
}: UseAudioControlProps): UseAudioControlReturn {
  const [volume, setVolume] = useState(initialVolume)
  const [audioStatus, setAudioStatus] = useState("初始化中...")
  const [usingSilentAudio, setUsingSilentAudio] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [nextSourceAttempt, setNextSourceAttempt] = useState<string | undefined>(undefined)
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false)
  const [autoPlayAfterLoad, setAutoPlayAfterLoad] = useState(false)

  // 音频相关引用
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentSourceIndex = useRef(0)
  const retryCount = useRef(0)
  const maxRetries = 3
  const audioSourcesLoaded = useRef<boolean[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)

  // 添加音频操作锁，防止play/pause冲突
  const audioOperationLock = useRef(false)
  // 添加延迟操作队列
  const pendingOperation = useRef<null | (() => void)>(null)

  // 安全地执行音频操作的函数
  const safeAudioOperation = (operation: () => Promise<void> | void) => {
    if (audioOperationLock.current) {
      // 如果当前有操作在进行，��此操作加入队列
      pendingOperation.current = () => {
        operation()
        pendingOperation.current = null
      }
      return
    }

    // 锁定音频操作
    audioOperationLock.current = true

    // 执行操作
    try {
      const result = operation()
      if (result instanceof Promise) {
        result
          .catch((error) => {
            debugError("音频操作失败:", error)
          })
          .finally(() => {
            // 解锁并检查是否有待处理的操作
            audioOperationLock.current = false
            if (pendingOperation.current) {
              setTimeout(pendingOperation.current, 50)
            }
          })
      } else {
        // 如果不是Promise，立即解锁
        audioOperationLock.current = false
        if (pendingOperation.current) {
          setTimeout(pendingOperation.current, 50)
        }
      }
    } catch (error) {
      console.error("音频操作异常:", error)
      // 确保解锁
      audioOperationLock.current = false
      if (pendingOperation.current) {
        setTimeout(pendingOperation.current, 50)
      }
    }
  }

  const unlockAudioContext = async () => {
    if (!audioContextRef.current) return

    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume()
        console.log("AudioContext resumed successfully")
      } catch (err) {
        console.error("Failed to resume AudioContext:", err)
      }
    }
  }

  // 使用静音音频作为最后的备用
  const useSilentAudio = (errorMessage?: string) => {
    try {
      if (!silentAudioRef.current) {
        silentAudioRef.current = new Audio(SILENT_AUDIO)
      }

      const silentAudio = silentAudioRef.current

      // 确保它使用静音音频数据
      silentAudio.src = SILENT_AUDIO
      silentAudio.load()

      setUsingSilentAudio(true)
      setAudioStatus("使用静音模式 - 所有音频源都失败")

      // 如果应该播放，则播放
      if (isPlaying && isAudioUnlocked) {
        safeAudioOperation(async () => {
          if (silentAudioRef.current) {
            try {
              await silentAudioRef.current.play()
            } catch (e) {
              console.error("静音音频播放失败:", e)
            }
          }
        })
      }

      // 通知用户
      if (onError && errorMessage) {
        onError(`无法播放音频: ${errorMessage}。已切换到静音模式。`)
      } else if (onError) {
        onError("无法播放音频，已切换到静音模式。请检查您的网络连接或浏览器设置。")
      }
    } catch (error) {
      debugError("静音音频初始化错误:", error)
      setAudioStatus(`静音音频错误: ${error}`)
    }
  }

  // 尝试下一个音频源
  const tryNextAudioSource = (errorMessage: string) => {
    if (!audioRef.current) return

    // 暂停当前音频
    safeAudioOperation(() => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    })

    retryCount.current += 1

    // 如果重试次数超过最大值，使用静音音频
    if (retryCount.current > maxRetries) {
      useSilentAudio(errorMessage)
      return
    }

    // 尝试下一个音频源
    const nextIndexValue = (currentSourceIndex.current + 1) % AUDIO_SOURCES.length
    setAudioStatus(`尝试下一个音频源 #${nextIndexValue + 1} (${errorMessage})`)

    // 短暂延迟后尝试下一个源
    setTimeout(() => {
      initializeAudioSource(nextIndexValue)
    }, 500)
  }

  // 初始化特定索引的音频源
  const initializeAudioSource = (index: number) => {
    if (!audioRef.current) return

    // 如果当前已经是这个索引，且音频已加载，则不需要重新初始化
    // if (index === currentSourceIndex.current && audioRef.current.readyState > 0) {
    //   return
    // }

    if (index >= AUDIO_SOURCES.length) {
      // 如果所有源都失败，使用静音音频
      useSilentAudio()
      return
    }

    try {
      const source = AUDIO_SOURCES[index]
      const audio = audioRef.current

      // 记录当前播放状态
      const wasPlaying = isPlaying || !audio.paused

      // 暂停当前播放
      safeAudioOperation(() => {
        if (audio) {
          audio.pause()
        }
      })

      // Wait a moment before changing the source to avoid interruption errors
      setTimeout(() => {
        // Set audio source
        audio.src = source

        // Update state
        currentSourceIndex.current = index
        setAudioStatus(`加载音频中... (源 #${index + 1})`)

        // Preload audio
        audio.load()

        // If previously playing or should play, auto-play after loading
        if (wasPlaying && isAudioUnlocked) {
          setAutoPlayAfterLoad(true)
        }
      }, 100)
    } catch (error) {
      debugError("初始化音频源错误:", error)
      setNextSourceAttempt(`初始化错误: ${error}`)
    }
  }

  // 播放当前音频
  const playCurrentAudio = () => {
    if (usingSilentAudio) {
      if (silentAudioRef.current) {
        // Only play if currently paused
        if (silentAudioRef.current.paused) {
          safeAudioOperation(async () => {
            if (silentAudioRef.current && silentAudioRef.current.paused) {
              try {
                await silentAudioRef.current.play()
              } catch (e) {
                console.error("静音音频播放失败:", e)
              }
            }
          })
        }
      }
      return
    }

    if (!audioRef.current || !audioRef.current.src) {
      // If audio element doesn't exist or has no source, try to initialize
      initializeAudioSource(currentSourceIndex.current)
      return
    }

    // Only play if currently paused
    if (audioRef.current.paused) {
      safeAudioOperation(async () => {
        if (audioRef.current && audioRef.current.paused) {
          try {
            // Add a small delay before playing to ensure any pending load operations complete
            await new Promise((resolve) => setTimeout(resolve, 100))
            await audioRef.current.play()
          } catch (error) {
            const errorMessage = error.message || "未知错误"
            debugError("播放失败:", error)
            if (onError) onError(`播放失败: ${errorMessage}`)
          }
        }
      })
    }
  }

  // 处理音量增加
  const increaseVolume = () => {
    debugLog("增加音量")
    // 直接调整音量，不影响播放状态
    setVolume((prev) => {
      const newVolume = Math.min(prev + 0.1, 1.0)
      debugLog("设置新音量:", newVolume)
      return newVolume
    })
  }

  // 处理音量减少
  const decreaseVolume = () => {
    debugLog("减少音量")
    // 直接调整音量，不影响播放状态
    setVolume((prev) => {
      const newVolume = Math.max(prev - 0.1, 0.1)
      debugLog("设置新音量:", newVolume)
      return newVolume
    })
  }

  // 初始化音频元素
  useEffect(() => {
    let audio: HTMLAudioElement | null = null
    let silentAudio: HTMLAudioElement | null = null

    // 创建主音频元素
    if (!audioRef.current) {
      audio = new Audio()
      audioRef.current = audio
    } else {
      audio = audioRef.current
    }

    // 创建静音音频元素
    if (!silentAudioRef.current) {
      silentAudio = new Audio(SILENT_AUDIO)
      silentAudioRef.current = silentAudio
    } else {
      silentAudio = silentAudioRef.current
    }

    // 初始化音频状态
    audioSourcesLoaded.current = Array(AUDIO_SOURCES.length).fill(false)

    // 设置音频元素的基本属性
    audio.volume = volume
    audio.loop = true
    audio.crossOrigin = "anonymous" // 添加跨域支持
    audio.preload = "auto" // 预加载音频

    silentAudio.volume = volume
    silentAudio.loop = true
    silentAudio.crossOrigin = "anonymous"
    silentAudio.preload = "auto"

    // 添加事件监听器
    const handleCanPlayThrough = () => {
      audioSourcesLoaded.current[currentSourceIndex.current] = true
      setAudioStatus("LOADED，PLAY NOW")
      retryCount.current = 0
      setAudioInitialized(true)

      // 如果应该自动播放，且当前是播放状态，确保开始播放
      if (autoPlayAfterLoad && isPlaying && audioRef.current && audioRef.current.paused) {
        safeAudioOperation(async () => {
          if (audioRef.current) {
            try {
              await audioRef.current.play()
            } catch (e) {
              console.error("FAIL TO PLAY:", e)
            }
            setAutoPlayAfterLoad(false)
          }
        })
      }
    }

    const handlePlaying = () => {
      const sourceName = audio.src.split("/").pop() || "音频"
      setAudioStatus(`正在播放: ${sourceName}`)
    }

    const handlePause = () => {
      const sourceName = audio.src.split("/").pop() || "音频"
      setAudioStatus(`已暂停: ${sourceName}`)
    }

    const handleError = (e: Event) => {
      const errorTarget = e.target as HTMLMediaElement
      const errorCode = errorTarget.error ? errorTarget.error.code : "未知"
      const errorMessage = errorTarget.error ? errorTarget.error.message : "未知错误"

      debugError("音频错误:", errorCode, errorMessage, "来源:", audio.src)

      // 尝试下一个音频源
      setNextSourceAttempt(`错误 ${errorCode}: ${errorMessage}`)
    }

    // 添加事件监听器
    audio.addEventListener("canplaythrough", handleCanPlayThrough)
    audio.addEventListener("playing", handlePlaying)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("error", handleError)

    // 尝试解锁音频（对移动设备很重要）
    const unlockAudio = () => {
      safeAudioOperation(async () => {
        if (silentAudioRef.current) {
          try {
            await silentAudioRef.current.play()
            silentAudioRef.current.pause()
            silentAudioRef.current.currentTime = 0
            document.removeEventListener("click", unlockAudio)
            document.removeEventListener("touchstart", unlockAudio)
            setAudioStatus("音频已解锁")
            setIsAudioUnlocked(true)
          } catch (err) {
            debugLog("音频解锁失败，将在下次交互时重��", err)
          }
        }
      })
    }

    document.addEventListener("click", unlockAudio, { once: true })
    document.addEventListener("touchstart", unlockAudio, { once: true })

    // 初始化第一个音频源
    initializeAudioSource(0)

    // 清理函数
    return () => {
      if (audio) {
        safeAudioOperation(() => {
          if (audio) {
            audio.pause()
            audio.src = ""
          }
        })

        // 移除所有事件监听器
        audio.removeEventListener("canplaythrough", handleCanPlayThrough)
        audio.removeEventListener("playing", handlePlaying)
        audio.removeEventListener("pause", handlePause)
        audio.removeEventListener("error", handleError)
      }

      if (silentAudio) {
        safeAudioOperation(() => {
          if (silentAudio) {
            silentAudio.pause()
            silentAudio.src = ""
          }
        })
      }

      document.removeEventListener("click", unlockAudio)
      document.removeEventListener("touchstart", unlockAudio)
    }
  }, []) // 只在组件挂载时执行一次

  // 单独处理音量变化
  useEffect(() => {
    debugLog("应用音量变化:", volume)

    if (audioRef.current) {
      // 只更新音量，不影响其他状态
      audioRef.current.volume = volume
      debugLog("已更新音频音量:", volume)
    }

    if (silentAudioRef.current) {
      silentAudioRef.current.volume = volume
    }

    setAudioStatus(`音量: ${Math.round(volume * 100)}%`)
  }, [volume])

  // 处理播放状态变化
  useEffect(() => {
    // 确保音频元素存在
    if (!audioRef.current) return

    debugLog("播放状态变化:", isPlaying, "当前暂停状态:", audioRef.current.paused)

    // 尝试解锁 AudioContext
    unlockAudioContext()

    // Only proceed with regular audio if not using silent audio
    if (!usingSilentAudio) {
      // 只有在 isPlaying 为 true 时才执行播放逻辑
      if (isPlaying) {
        if (audioRef.current && audioRef.current.paused) {
          // 只有在当前暂停时才调用播放
          debugLog("尝试播放音频")
          safeAudioOperation(async () => {
            if (audioRef.current) {
              try {
                await audioRef.current.play()
              } catch (error) {
                const errorMessage = error.message || "未知错误"
                debugError("播放失败:", error)
                if (onError) onError(`播放失败: ${errorMessage}`)
              }
            }
          })
        }
      } else {
        if (!audioRef.current.paused) {
          debugLog("暂停音频")
          safeAudioOperation(() => {
            if (audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause()
            }
          })
        }
      }
    }
  }, [isPlaying, onError, usingSilentAudio])

  useEffect(() => {
    if (usingSilentAudio) {
      safeAudioOperation(async () => {
        if (silentAudioRef.current) {
          try {
            if (silentAudioRef.current.paused) {
              await silentAudioRef.current.play()
            }
          } catch (error) {
            debugError("静音音频播放失败:", error)
          }
        }
      })
    }
  }, [usingSilentAudio])

  useEffect(() => {
    if (nextSourceAttempt) {
      tryNextAudioSource(nextSourceAttempt)
    }
  }, [nextSourceAttempt])

  // 当currentIndex变化时，切换到对应的音频
  useEffect(() => {
    initializeAudioSource(currentIndex)
  }, [currentIndex])

  return {
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
  }
}
