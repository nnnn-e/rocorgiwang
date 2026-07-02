"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { generateSyntheticAudioData } from "@/utils/audioUtils"
import type { WaveformStyle, AudioData } from "@/constants/audio-sources"

interface UseAudioVisualizationProps {
  audioRef: React.RefObject<HTMLAudioElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  isPlaying: boolean
  playerSize: number
  centerButtonSize: number
  onAudioDataUpdate?: (audioData: AudioData) => void
}

interface UseAudioVisualizationReturn {
  visualizationInitialized: boolean
  waveformStyle: WaveformStyle
  setWaveformStyle: React.Dispatch<React.SetStateAction<WaveformStyle>>
  rotationSpeed: number
  setRotationSpeed: React.Dispatch<React.SetStateAction<number>>
  waveAmplitude: number
  setWaveAmplitude: React.Dispatch<React.SetStateAction<number>>
  waveformDensity: number
  setWaveformDensity: React.Dispatch<React.SetStateAction<number>>
  bassMultiplier: number
  setBassMultiplier: React.Dispatch<React.SetStateAction<number>>
  trebleMultiplier: number
  setTrebleMultiplier: React.Dispatch<React.SetStateAction<number>>
  initializeAudioVisualization: () => Promise<void>
  startVisualization: () => void
  stopVisualization: () => void
  forceWaveformStyle: (style: WaveformStyle) => void
}

// 定义粒子接口
interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  freqIndex: number
  active: boolean // 标记粒子是否活跃
}

// 定义梨花特效的线条结构
interface FireworkLine {
  x: number
  y: number
  angle: number
  speed: number
  length: number
  life: number
  maxLife: number
  active: boolean // 标记线条是否活跃
}

// 对象池管理器
class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  private maxSize: number

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number, maxSize: number) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize

    // 预先创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }

  // 获取一个对象
  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  // 释放一个对象回池中
  release(obj: T): void {
    this.resetFn(obj)
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj)
    }
  }

  // 批量获取多个对象
  getMultiple(count: number): T[] {
    const result: T[] = []
    for (let i = 0; i < count; i++) {
      result.push(this.get())
    }
    return result
  }

  // 批量释放多个对象
  releaseMultiple(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj)
    }
  }
}

export function useAudioVisualization({
  audioRef,
  canvasRef,
  isPlaying,
  playerSize,
  centerButtonSize,
  onAudioDataUpdate,
}: UseAudioVisualizationProps): UseAudioVisualizationReturn {
  // 波形样式相关状态
  const [waveformStyle, setWaveformStyle] = useState<WaveformStyle>("bars")
  const [rotationSpeed, setRotationSpeed] = useState(0) // 旋转速度
  const [waveAmplitude, setWaveAmplitude] = useState(0.3) // 波形振幅
  const [waveformDensity, setWaveformDensity] = useState(1) // 波形密度
  const [bassMultiplier, setBassMultiplier] = useState(1.2) // 低音响应倍数
  const [trebleMultiplier, setTrebleMultiplier] = useState(0.8) // 高音响应倍数
  const [visualizationInitialized, setVisualizationInitialized] = useState(false)

  // 调试信息
  // const [debugInfo, setDebugInfo] = useState({
  //   audioContextState: "未初始化",
  //   visualizationActive: false,
  //   canvasSize: { width: 0, height: 0 },
  //   isMobile: false,
  // })

  // 使用ref来存储当前波形样式，确保在动画循环中能获取到最新值
  const waveformStyleRef = useRef<WaveformStyle>("bars")
  // 添加上一次波形样式的引用 - 移到顶层
  const lastWaveformStyleRef = useRef<WaveformStyle | null>(null)

  // 当waveformStyle状态变化时，更新ref
  useEffect(() => {
    waveformStyleRef.current = waveformStyle
    console.log(`Waveform style updated to: ${waveformStyle} (ref updated)`)
  }, [waveformStyle])

  const rotationAngleRef = useRef(0) // 当前旋转角度
  const timeRef = useRef(0) // 用于动画效果的时间累积
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // 离屏Canvas相关引用
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null)
  const offscreenCtxRef = useRef<OffscreenCanvasRenderingContext2D | null>(null)
  const isOffscreenCanvasSupportedRef = useRef<boolean | null>(null)

  // 为噪点效果预生成随机粒子位置
  const particlesRef = useRef<Particle[]>([])
  const activeParticlesRef = useRef<Particle[]>([])

  // 梨花特效的线条数组
  const fireworkLinesRef = useRef<FireworkLine[]>([])
  const activeFireworkLinesRef = useRef<FireworkLine[]>([])

  // 对象池引用
  const particlePoolRef = useRef<ObjectPool<Particle> | null>(null)
  const fireworkLinePoolRef = useRef<ObjectPool<FireworkLine> | null>(null)

  // 上一帧的音频强度，用于检测变化
  const lastIntensityRef = useRef(0)

  // 频率数据和时域数据缓冲区
  const frequencyDataRef = useRef<Uint8Array | null>(null)
  const timeDataRef = useRef<Uint8Array | null>(null)

  // 性能监控
  const fpsCounterRef = useRef<number>(0)
  const lastFpsUpdateRef = useRef<number>(0)
  const currentFpsRef = useRef<number>(0)

  // 检测是否为移动设备
  const isMobileRef = useRef(false)
  useEffect(() => {
    // 简单的移动设备检测
    isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    console.log(`设备检测: ${isMobileRef.current ? "移动设备" : "桌面设备"}`)

    // 更新调试信息
    // setDebugInfo((prev) => ({
    //   ...prev,
    //   isMobile: isMobileRef.current,
    // }))
  }, [])

  // 初始化对象池
  const initObjectPools = useCallback(() => {
    // 创建粒子对象池
    if (!particlePoolRef.current) {
      particlePoolRef.current = new ObjectPool<Particle>(
        // 创建函数
        () => ({
          x: 0,
          y: 0,
          size: 0,
          opacity: 0,
          freqIndex: 0,
          active: false,
        }),
        // 重置函数
        (particle) => {
          particle.x = 0
          particle.y = 0
          particle.size = 0
          particle.opacity = 0
          particle.freqIndex = 0
          particle.active = false
        },
        // 初始大小 - 移动设备上减少粒子数量
        Math.floor(playerSize * (isMobileRef.current ? 1.0 : 2.0)),
        // 最大大小 - 移动设备上减少粒子数量
        Math.floor(playerSize * (isMobileRef.current ? 1.5 : 3.0)),
      )
    }

    // 创建梨花特效线条对象池
    if (!fireworkLinePoolRef.current) {
      fireworkLinePoolRef.current = new ObjectPool<FireworkLine>(
        // 创建函数
        () => ({
          x: 0,
          y: 0,
          angle: 0,
          speed: 0,
          length: 0,
          life: 0,
          maxLife: 0,
          active: false,
        }),
        // 重置函数
        (line) => {
          line.x = 0
          line.y = 0
          line.angle = 0
          line.speed = 0
          line.length = 0
          line.life = 0
          line.maxLife = 0
          line.active = false
        },
        // 初始大小 - 移动设备上减少线条数量
        isMobileRef.current ? 50 : 100,
        // 最大大小 - 移动设备上减少线条数量
        isMobileRef.current ? 150 : 300,
      )
    }
  }, [playerSize])

  // 检查是否支持OffscreenCanvas
  const checkOffscreenCanvasSupport = useCallback(() => {
    if (isOffscreenCanvasSupportedRef.current === null) {
      // 在移动设备上禁用OffscreenCanvas，即使它可能受支持
      isOffscreenCanvasSupportedRef.current = !isMobileRef.current && typeof OffscreenCanvas !== "undefined"
      console.log(`OffscreenCanvas support: ${isOffscreenCanvasSupportedRef.current}`)
    }
    return isOffscreenCanvasSupportedRef.current
  }, [])

  // 初始化离屏Canvas
  const initOffscreenCanvas = useCallback(() => {
    if (!checkOffscreenCanvasSupport()) return false

    try {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = new OffscreenCanvas(playerSize, playerSize)
        offscreenCtxRef.current = offscreenCanvasRef.current.getContext("2d")

        if (!offscreenCtxRef.current) {
          console.error("Failed to get offscreen canvas context")
          return false
        }

        console.log("Offscreen canvas initialized")
        return true
      }

      // 确保离屏Canvas尺寸与播放器匹配
      if (offscreenCanvasRef.current.width !== playerSize) {
        offscreenCanvasRef.current.width = playerSize
        offscreenCanvasRef.current.height = playerSize
      }

      return true
    } catch (error) {
      console.error("Error initializing offscreen canvas:", error)
      return false
    }
  }, [playerSize, checkOffscreenCanvasSupport])

  // 初始化噪点粒子
  const initNoiseParticles = useCallback((count: number, radius: number, centerX: number, centerY: number) => {
    if (!particlePoolRef.current) return

    // 清空当前活跃粒子数组
    activeParticlesRef.current = []

    // 移动设备上减少粒子数量
    // 移动设备上减少粒子数量
    const adjustedCount = isMobileRef.current ? Math.floor(count * 0.6) : count
    console.log(`初始化粒子: ${adjustedCount}个`)

    for (let i = 0; i < adjustedCount; i++) {
      // 从对象池获取粒子
      const particle = particlePoolRef.current.get()

      // 使用极坐标生成均匀分布的粒子
      const angle = Math.random() * Math.PI * 2
      // 使用平方根来确保粒子在圆内均匀分布
      const distance = Math.sqrt(Math.random()) * radius
      particle.x = centerX + Math.cos(angle) * distance
      particle.y = centerY + Math.sin(angle) * distance
      particle.size = isMobileRef.current ? 1.5 : 1 // 移动设备上增大粒子尺寸
      particle.opacity = 0.3 + Math.random() * 0.7
      // 为每个粒子分配一个频率索引，用于后续响应音频
      particle.freqIndex = Math.floor(Math.random() * 128)
      particle.active = true

      // 添加到活跃粒子数组
      activeParticlesRef.current.push(particle)
    }
  }, [])

  // 创建梨花特效
  const createFirework = useCallback((centerX: number, centerY: number, intensity: number) => {
    if (!fireworkLinePoolRef.current) return

    // 移动设备上减少线条数量
    const lineCount = isMobileRef.current ? 8 : 12 // 移动设备上减少线条数量

    // 根据音频强度调整爆炸范围和速度
    const baseSpeed = 2 + intensity * 8 // 基础速度
    const baseLength = 5 + intensity * 15 // 线条长度
    const maxLife = 30 + intensity * 30 // 生命周期

    for (let i = 0; i < lineCount; i++) {
      // 从对象池获取线条
      const line = fireworkLinePoolRef.current.get()

      const angle = (i / lineCount) * Math.PI * 2
      // 添加一些随机性使效果更自然
      const speed = baseSpeed * (0.8 + Math.random() * 0.4)
      const length = baseLength * (0.8 + Math.random() * 0.4)

      line.x = centerX
      line.y = centerY
      line.angle = angle
      line.speed = speed
      line.length = length
      line.life = maxLife
      line.maxLife = maxLife
      line.active = true

      // 添加到活跃线条数组
      activeFireworkLinesRef.current.push(line)
    }
  }, [])

  // 获取颜色 - 使用固定的经典白色主题
  const getThemeColor = (index: number, intensity = 1): string => {
    // 经典白色，确保最小不透明度为0.7
    return `rgba(255, 255, 255, ${Math.max(0.7, 0.4 + intensity * 0.6)})`
  }

  // 提取为组件内的函数，而不是仅在 useEffect 中定义
  const initializeAudioVisualization = async () => {
    if (!audioRef.current || !canvasRef.current) {
      console.error("音频或画布元素不存在")
      return
    }

    try {
      console.log("开始初始化音频可视化")

      // 初始化对象池
      initObjectPools()

      // 初始化离屏Canvas
      initOffscreenCanvas()

      // 创建音频上下文
      let audioContext = audioContextRef.current

      // 如果不存或已关闭，创建新的
      if (!audioContext || audioContext.state === "closed") {
        console.log("创建新的AudioContext")
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext
      }

      // 更新调试信息
      // setDebugInfo((prev) => ({
      //   ...prev,
      //   audioContextState: audioContext.state,
      // }))

      // 确保 AudioContext 处于 running 状态
      if (audioContext.state === "suspended") {
        try {
          console.log("尝试恢复AudioContext")
          await audioContext.resume()
          console.log("AudioContext resumed successfully")

          // 更新调试信息
          // setDebugInfo((prev) => ({
          //   ...prev,
          //   audioContextState: audioContext.state,
          // }))
        } catch (err) {
          console.error("Failed to resume AudioContext:", err)
        }
      }

      // 创建分析器节点
      let analyser = analyserRef.current
      if (!analyser) {
        console.log("创建分析器节点")
        analyser = audioContext.createAnalyser()
        analyser.fftSize = isMobileRef.current ? 512 : 1024 // 移动设备上减小FFT大小
        analyserRef.current = analyser

        // 初始化频率数据和时域数据缓冲区
        frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount)
        timeDataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }

      // 连接音频源到分析器
      const audioElement = audioRef.current
      if (audioElement) {
        try {
          // 检查是否已经连接到另一个节点
          if (!(audioElement as any)._hasSourceNode) {
            console.log("连接音频元素到分析器")
            const sourceNode = audioContext.createMediaElementSource(audioElement)
            sourceNodeRef.current = sourceNode
            sourceNode.connect(analyser)
            analyser.connect(audioContext.destination)

            // 标记此音频元素已连接到可视化器
            ;(audioElement as any)._hasSourceNode = true
          }
        } catch (error) {
          console.error("无法创建音频源节点:", error)
          // 如果已经连接，则跳过
          if (error instanceof DOMException && error.name === "InvalidStateError") {
            console.log("音频元素已经连接到另一个节点")
          }
        }
      }

      // 确保画布尺寸正确
      if (canvasRef.current) {
        canvasRef.current.width = playerSize
        canvasRef.current.height = playerSize

        // 更新调试信息
        // setDebugInfo((prev) => ({
        //   ...prev,
        //   canvasSize: { width: playerSize, height: playerSize },
        // }))

        console.log(`画布尺寸设置为: ${playerSize}x${playerSize}`)
      }

      setVisualizationInitialized(true)
      console.log("音频可视化初始化完成")

      // 如果当前正在播放，立即开始可视化
      if (isPlaying) {
        console.log("开始可视化 (初始化后)")
        startVisualization()
      }
    } catch (error) {
      console.error("初始化音频可视化时出错:", error)
    }
  }

  // 音频可视化相关函数
  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null

      // 更新调试信息
      // setDebugInfo((prev) => ({
      //   ...prev,
      //   visualizationActive: false,
      // }))

      console.log("停止可视化")
    }
  }

  const startVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // 确保可视化已初始化
    if (!visualizationInitialized) {
      console.log("可视化未初始化，尝试初始化")
      initializeAudioVisualization().then(() => {
        // 初始化完成后开始绘制
        if (isPlaying) {
          // 确保仍然处于播放状态
          console.log("初始化后开始可视化")
          animationFrameRef.current = requestAnimationFrame(draw)

          // 更新调试信息
          // setDebugInfo((prev) => ({
          //   ...prev,
          //   visualizationActive: true,
          // }))
        }
      })
      return
    }

    console.log("开始可视化")

    // 更新调试信息
    // setDebugInfo((prev) => ({
    //   ...prev,
    //   visualizationActive: true,
    // }))

    // 绘制函数
    let lastFrameTime = 0
    const targetFPS = isMobileRef.current ? 30 : 60 // 移动设备使用较低帧率
    const frameInterval = 1000 / targetFPS

    const draw = (timestamp: number) => {
      // 计算帧间隔时间
      const elapsed = timestamp - lastFrameTime

      // 如果间隔时间小于目标帧率间隔，跳过这一帧
      if (elapsed < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }

      // 更新上一帧时间
      lastFrameTime = timestamp - (elapsed % frameInterval)

      // FPS计数
      fpsCounterRef.current++
      if (timestamp - lastFpsUpdateRef.current >= 5000) {
        // 改为 5000 毫秒
        currentFpsRef.current = fpsCounterRef.current / 5 // 除以 5 得到平均 FPS
        fpsCounterRef.current = 0
        lastFpsUpdateRef.current = timestamp
        console.log(`Average FPS: ${currentFpsRef.current.toFixed(1)}`)
      }

      if (!canvasRef.current) {
        console.error("画布元素不存在")
        return
      }

      const canvas = canvasRef.current

      // 确保画布尺寸与容器匹配
      if (canvas.width !== playerSize) {
        console.log(`更新画布尺寸: ${canvas.width}x${canvas.height} -> ${playerSize}x${playerSize}`)
        canvas.width = playerSize
        canvas.height = playerSize

        // 更新调试信息
        // setDebugInfo((prev) => ({
        //   ...prev,
        //   canvasSize: { width: playerSize, height: playerSize },
        // }))

        // 同时更新离屏Canvas尺寸
        if (offscreenCanvasRef.current) {
          offscreenCanvasRef.current.width = playerSize
          offscreenCanvasRef.current.height = playerSize
        }
      }

      // 选择要使用的上下文
      let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null
      let useOffscreen = false

      if (offscreenCtxRef.current && offscreenCanvasRef.current) {
        ctx = offscreenCtxRef.current
        useOffscreen = true
      } else {
        if (canvasRef.current) {
          ctx = canvasRef.current.getContext("2d")
        }
      }

      if (!ctx) {
        console.error("无法获取画布上下文")
        return
      }

      // 更新时间引用，用于动画效果
      timeRef.current += 0.01

      // 更新旋转角度
      rotationAngleRef.current = 0 // 固定旋转角度为0

      // 中心点
      const centerX = playerSize / 2
      const centerY = playerSize / 2

      // 中央按钮直径是 playerSize * 0.3，所以半径是 playerSize * 0.15
      const baseRadius = centerButtonSize / 2

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 获取音频数据
      let dataArray: Uint8Array
      let frequencyData: Uint8Array

      if (analyserRef.current && frequencyDataRef.current && timeDataRef.current) {
        // 使用实际音频数据
        analyserRef.current.getByteTimeDomainData(timeDataRef.current)
        analyserRef.current.getByteFrequencyData(frequencyDataRef.current)
        dataArray = timeDataRef.current
        frequencyData = frequencyDataRef.current
      } else {
        // 使用合成数据
        dataArray = generateSyntheticAudioData(timestamp, 128)
        frequencyData = generateSyntheticAudioData(timestamp + 1000, 128) // 稍微偏移以产生不同的数据
      }

      // 计算音频强度 - 使用预分配的变量避免创建新对象
      // 计算音频强度 - 使用预分配的变量避免创建新对象
      // 预计算频段范围
      const bassRange = { start: 0, end: Math.floor(frequencyData.length * 0.1) }
      const midRange = { start: bassRange.end, end: Math.floor(frequencyData.length * 0.5) }
      const trebleRange = { start: midRange.end, end: frequencyData.length }

      // 使用定长数组存储计算结果
      const intensities = new Float32Array(3) // [bass, mid, treble]

      // 只在需要时计算强度
      const calculateIntensities = () => {
        let total = 0

        // 计算低音强度
        for (let i = bassRange.start; i < bassRange.end; i++) {
          const value = frequencyData[i] / 255
          total += value
          intensities[0] += value
        }
        intensities[0] = (intensities[0] / (bassRange.end - bassRange.start)) * bassMultiplier

        // 计算中音强度
        for (let i = midRange.start; i < midRange.end; i++) {
          const value = frequencyData[i] / 255
          total += value
          intensities[1] += value
        }
        intensities[1] = intensities[1] / (midRange.end - midRange.start)

        // 计算高音强度
        for (let i = trebleRange.start; i < trebleRange.end; i++) {
          const value = frequencyData[i] / 255
          total += value
          intensities[2] += value
        }
        intensities[2] = (intensities[2] / (trebleRange.end - trebleRange.start)) * trebleMultiplier

        return total / frequencyData.length
      }

      const totalIntensity = calculateIntensities()
      const bassIntensity = intensities[0]
      const midIntensity = intensities[1]
      const trebleIntensity = intensities[2]

      // 在获取音频数据后添加以下代码
      if (onAudioDataUpdate) {
        // 调用回调函数
        onAudioDataUpdate({
          frequencyData,
          timeData: dataArray,
          averageIntensity: totalIntensity,
          bassIntensity,
          midIntensity,
          trebleIntensity,
        })
      }

      // 检测音频强度变化，触发梨花特效 - 只在声场模式下
      if (waveformStyleRef.current === "soundfield") {
        const intensityThreshold = 0.05 // 强度变化阈值
        const intensityDelta = Math.abs(totalIntensity - lastIntensityRef.current)

        // 当音频强度变化超过阈值时，创建新的梨花特效
        if (intensityDelta > intensityThreshold) {
          // 在播放器区域内随机位置创建梨花特效
          const visualRadius = playerSize / 2
          const randomDistance = Math.random() * (visualRadius * 0.8)
          const randomAngle = Math.random() * Math.PI * 2
          const x = centerX + Math.cos(randomAngle) * randomDistance
          const y = centerY + Math.sin(randomAngle) * randomDistance

          // 创建新的梨花特效
          createFirework(x, y, intensityDelta)
        }
      }

      // 更新上一帧的音频强度
      lastIntensityRef.current = totalIntensity

      // 根据波形样式绘制不同的可视化效果
      const currentStyle = waveformStyleRef.current

      // 只在波形样式变化时记录日志，使用 ref 跟踪上一次的样式
      if (currentStyle !== lastWaveformStyleRef.current) {
        console.log(`Waveform style changed to: ${currentStyle}`)
        lastWaveformStyleRef.current = currentStyle
      }

      switch (currentStyle) {
        case "bars":
          drawBarsWaveform(ctx, frequencyData, centerX, centerY, baseRadius)
          break
        case "particles":
          drawParticlesWaveform(ctx, frequencyData, centerX, centerY, baseRadius)
          break
        case "soundfield":
          drawNoiseFieldWaveform(ctx, frequencyData, dataArray, centerX, centerY, baseRadius, playerSize)
          // 只在声场模式下绘制梨花特效
          drawFireworks(ctx, centerX, centerY, playerSize / 2)
          break
        default:
          console.warn(`Unknown waveform style: ${currentStyle}, falling back to bars`)
          drawBarsWaveform(ctx, frequencyData, centerX, centerY, baseRadius)
      }

      // 如果使用了离屏Canvas，将其内容复制到主Canvas
      if (useOffscreen && offscreenCanvasRef.current) {
        const mainCtx = canvas.getContext("2d")
        if (mainCtx) {
          mainCtx.clearRect(0, 0, canvas.width, canvas.height)
          mainCtx.drawImage(offscreenCanvasRef.current, 0, 0)
        }
      }

      // 继续动画循环
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw)
      }
    }

    // 绘制梨花特效
    const drawFireworks = (
      ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      visualRadius: number,
    ) => {
      if (!fireworkLinePoolRef.current) return

      // 使用临时数组存储仍然活跃的线条
      const stillActive: FireworkLine[] = []

      // 遍历所有活跃线条
      for (const line of activeFireworkLinesRef.current) {
        if (!line.active) continue

        // 更新线条位置
        line.x += Math.cos(line.angle) * line.speed
        line.y += Math.sin(line.angle) * line.speed

        // 减少生命值
        line.life -= 1

        // 如果线条仍然存活，则绘制并保留
        if (line.life > 0) {
          // 计算线条起点和终点
          const startX = line.x
          const startY = line.y
          const endX = startX - Math.cos(line.angle) * line.length
          const endY = startY - Math.sin(line.angle) * line.length

          // 计算不透明度，随生命周期减少
          const opacity = line.life / line.maxLife

          // 绘制线条
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
          ctx.lineWidth = isMobileRef.current ? 1.5 : 1 // 移动设备上增加线宽
          ctx.stroke()

          // 保留此线条
          stillActive.push(line)
        } else {
          // 将不再活跃的线条返回对象池
          line.active = false
          fireworkLinePoolRef.current.release(line)
        }
      }

      // 更新活跃线条数组
      activeFireworkLinesRef.current = stillActive
    }

    // 条形波形绘制函数
    const drawBarsWaveform = (
      ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
      frequencyData: Uint8Array,
      centerX: number,
      centerY: number,
      baseRadius: number,
    ) => {
      // 移动设备上减少条形数量
      const barCount = Math.min(frequencyData.length, isMobileRef.current ? 90 : 180)
      const barWidth = (Math.PI * 2) / barCount

      // 批量绘制 - 减少状态变化
      ctx.lineWidth = isMobileRef.current ? 3 : 2 // 移动设备上增加线宽

      for (let i = 0; i < barCount; i++) {
        // 计算角度
        const angle = i * barWidth + rotationAngleRef.current

        // 获取频率数据
        const frequencyValue = frequencyData[i] / 255

        // 应用低音和高音倍数
        let amplitudeMultiplier = 1
        if (i < barCount / 3) {
          // 低频
          amplitudeMultiplier = bassMultiplier
        } else if (i > (barCount * 2) / 3) {
          // 高频
          amplitudeMultiplier = trebleMultiplier
        }

        // 计算条形高度
        const barHeight = baseRadius * frequencyValue * waveAmplitude * amplitudeMultiplier

        // 计算内外半径
        const innerRadius = baseRadius
        const outerRadius = innerRadius + barHeight

        // 使用1px宽度的线条代替条形
        const startAngle = angle
        const endAngle = angle + (isMobileRef.current ? 0.02 : 0.01) // 移动设备上增加角度宽度

        // 绘制线条
        ctx.beginPath()
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
        ctx.strokeStyle = getThemeColor(i, frequencyValue * 1.0)
        ctx.stroke()
      }
    }

    // 粒子波形绘制函数
    const drawParticlesWaveform = (
      ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
      frequencyData: Uint8Array,
      centerX: number,
      centerY: number,
      baseRadius: number,
    ) => {
      // 移动设备上减少粒子数量
      const particleCount = Math.min(frequencyData.length, isMobileRef.current ? 20 : 30)

      for (let i = 0; i < particleCount; i++) {
        // 计算角度
        const angle = (i / particleCount) * Math.PI * 2 + rotationAngleRef.current

        // 获取频率数据
        const frequencyValue = frequencyData[i] / 255

        // 应用低音和高音倍数
        let amplitudeMultiplier = 1
        if (i < particleCount / 3) {
          amplitudeMultiplier = bassMultiplier
        } else if (i > (particleCount * 2) / 3) {
          amplitudeMultiplier = trebleMultiplier
        }

        // 计算粒子半径
        const particleRadius = baseRadius * (0.5 + frequencyValue * waveAmplitude * amplitudeMultiplier)

        // 添加波动效果
        const waveEffect = Math.sin(angle * waveformDensity * 5 + timeRef.current * 2) * 0.2
        const radius = particleRadius + waveEffect * frequencyValue * baseRadius * 0.3

        // 计算粒子坐标
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)

        // 计算粒子大小 - 移动设备上增大粒子尺寸
        const size = isMobileRef.current ? 1 + frequencyValue * 3 : 1 + frequencyValue * 5

        // 绘制粒子
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = getThemeColor(i, frequencyValue * 1.0)
        ctx.fill()
      }
    }

    // 噪点声场波形绘制函数 - 全新实现
    const drawNoiseFieldWaveform = (
      ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
      frequencyData: Uint8Array,
      timeData: Uint8Array,
      centerX: number,
      centerY: number,
      baseRadius: number,
      playerSize: number,
    ) => {
      // 计算可视化区域半径 (整个播放器的半径)
      const visualRadius = playerSize / 2

      // 如果粒子数组为空，初始化粒子
      if (activeParticlesRef.current.length === 0) {
        // 生成大量粒子，根据播放器大小调整数量
        const getOptimalParticleCount = () => {
          // 基于设备性能动态调整粒子数量
          if (isMobileRef.current) {
            // 移动设备上使用较少的粒子
            return Math.floor(playerSize * 0.5)
          } else if (currentFpsRef.current < 30 && currentFpsRef.current > 0) {
            // 如果FPS低于30，减少粒子数量
            return Math.floor(playerSize * 0.8)
          } else {
            // 默认粒子数量
            return Math.floor(playerSize * 1.5)
          }
        }

        // 使用优化后的粒子数量
        const particleCount = getOptimalParticleCount()
        initNoiseParticles(particleCount, visualRadius, centerX, centerY)
      }

      // 计算音频强度
      // 计算音频强度
      // 将画布分成网格，只更新和绘制活跃区域的粒子
      const gridSize = 4 // 将画布分成 4x4 的网格
      const gridCells = Array(gridSize * gridSize).fill(0)

      // 计算每个频率对应的网格单元
      for (let i = 0; i < frequencyData.length; i++) {
        const value = frequencyData[i] / 255
        if (value > 0.1) {
          // 只考虑有显著能量的频率
          const cellIndex = Math.floor((i / frequencyData.length) * gridCells.length)
          gridCells[cellIndex] = Math.max(gridCells[cellIndex], value)
        }
      }

      // 批量绘制粒子 - 减少状态变化
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.beginPath()

      // 只处理活跃网格中的粒子
      for (const particle of activeParticlesRef.current) {
        if (!particle.active) continue

        // 计算粒子所在的网格单元
        const gridX = Math.floor((particle.x / playerSize) * gridSize)
        const gridY = Math.floor((particle.y / playerSize) * gridSize)
        const cellIndex = gridY * gridSize + gridX

        // 如果网格单元不活跃，跳过这个粒子
        if (gridCells[cellIndex] < 0.1) continue

        // 获取该粒子对应的频率值
        const freqValue = frequencyData[particle.freqIndex] / 255

        // 如果频率值太低，跳过绘制
        if (freqValue < 0.05) continue

        // 根据频率值调整粒子不透明度
        const dynamicOpacity = particle.opacity * (0.3 + freqValue * 0.7)

        // 绘制粒子 - 移动设备上增大粒子尺寸
        const particleSize = isMobileRef.current ? 1.5 : 1

        // 添加到路径而不是单独绘制
        ctx.moveTo(particle.x + particleSize, particle.y)
        ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2)
      }

      // 一次性填充所有粒子
      ctx.fill()
    }

    animationFrameRef.current = requestAnimationFrame(draw)
  }

  // 强制设置波形样式并重启可视化
  const forceWaveformStyle = useCallback(
    (style: WaveformStyle) => {
      console.log(`Forcing waveform style to: ${style}`)

      // 停止当前可视化
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // 设置新的波形样式
      setWaveformStyle(style)
      waveformStyleRef.current = style

      // 根据不同的波形样式设置适合的参数
      switch (style) {
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

      // 如果正在播放，重新开始可视化
      if (isPlaying && visualizationInitialized) {
        setTimeout(() => {
          startVisualization()
        }, 50)
      }

      console.log(`Forced waveform style to: ${style}`)
    },
    [isPlaying, visualizationInitialized],
  )

  // 初始化音频可视化
  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return

    // 始尝试初始化，但不强制设置状态
    initializeAudioVisualization()

    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, []) // 只在组件挂载时执行一次

  // 监听窗口大小变化，确保在布局变化时重新初始化可视化
  useEffect(() => {
    const handleResize = () => {
      // 如果已经初始化过，且当前正在播放，则重新初始化可视化
      if (visualizationInitialized && isPlaying) {
        // 停止当前可视化
        stopVisualization()

        // 重置粒子数组，以便在下一次绘制时重新初始化
        activeParticlesRef.current = []

        // 短暂延迟后重新开始可视化
        setTimeout(() => {
          startVisualization()
        }, 100)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [visualizationInitialized, isPlaying])

  // 处理播放状态变化对可视化的影响
  useEffect(() => {
    console.log(`播放状态变化: ${isPlaying ? "播放" : "暂停"}, 可视化初始化: ${visualizationInitialized}`)

    if (isPlaying) {
      if (!animationFrameRef.current && visualizationInitialized) {
        console.log("播放状态变化 -> 开始可视化")
        startVisualization()
      } else if (!visualizationInitialized) {
        console.log("播放状态变化 -> 尝试初始化可视化")
        initializeAudioVisualization().then(() => {
          if (isPlaying) {
            console.log("初始化后开始可视化")
            startVisualization()
          }
        })
      }
    } else {
      stopVisualization()
    }
  }, [isPlaying, visualizationInitialized])

  // 监听波形样式变化，记录日志
  useEffect(() => {
    console.log(`Waveform style changed to: ${waveformStyle}`)

    // 当波形样式变化时，如果正在播放，重新启动可视化
    if (isPlaying && visualizationInitialized) {
      // 停止当前可视化
      stopVisualization()

      // 短暂延迟后重新开始可视化
      setTimeout(() => {
        startVisualization()
      }, 50)
    }
  }, [waveformStyle, isPlaying, visualizationInitialized])

  // 添加一个特殊的移动设备解锁处理
  useEffect(() => {
    if (isMobileRef.current) {
      const unlockAudio = async () => {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          try {
            await audioContextRef.current.resume()
            console.log("移动设备: AudioContext 已解锁")

            // 更新调试信息
            // setDebugInfo((prev) => ({
            //   ...prev,
            //   audioContextState: audioContextRef.current?.state || "未知",
            // }))

            // 如果正在播放但可视化未启动，尝试启动可视化
            if (isPlaying && !animationFrameRef.current && visualizationInitialized) {
              console.log("移动设备: 解锁后启动可视化")
              startVisualization()
            }
          } catch (err) {
            console.error("移动设备: 解锁 AudioContext 失败", err)
          }
        }
      }

      // 添加一次性事件监听器来解锁音频
      const handleUnlock = () => {
        console.log("移动设备: 尝试解锁音频")
        unlockAudio()
        // 解锁后移除事件监听器
        document.removeEventListener("touchstart", handleUnlock)
        document.removeEventListener("touchend", handleUnlock)
        document.removeEventListener("click", handleUnlock)
      }

      document.addEventListener("touchstart", handleUnlock)
      document.addEventListener("touchend", handleUnlock)
      document.addEventListener("click", handleUnlock)

      return () => {
        document.removeEventListener("touchstart", handleUnlock)
        document.removeEventListener("touchend", handleUnlock)
        document.removeEventListener("click", handleUnlock)
      }
    }
  }, [isPlaying, visualizationInitialized])

  return {
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
  }
}
