"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"

// 默认位置和大小 - 提取为常量避免重复创建
const DEFAULT_POSITIONS = {
  ellipse1: { bottom: -50, left: "10%" },
  ellipse2: { bottom: -30, right: "15%" },
  ellipse3: { bottom: -80, right: "40%" },
}

const DEFAULT_SIZES = {
  ellipse1: { width: 500, height: 300 },
  ellipse2: { width: 400, height: 250 },
  ellipse3: { width: 350, height: 200 },
}

const DEFAULT_OPACITIES = {
  ellipse1: 0.2,
  ellipse2: 0.2,
  ellipse3: 0.2,
}

// 动画状态类型
const ANIMATION_STATES = {
  IDLE: "idle",
  ANIMATING: "animating",
  FADING: "fading",
}

/**
 * 将HSL颜色转换为十六进制颜色
 * @param h 色相 (0-360)
 * @param s 饱和度 (0-100)
 * @param l 亮度 (0-100)
 * @returns 十六进制颜色字符串
 */
function hslToHex(h: number, s: number, l: number): string {
  // 确保色相在0-360范围内
  h = ((h % 360) + 360) % 360
  // 将s和l转换为0-1范围
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0,
    g = 0,
    b = 0

  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }

  // 转换为0-255范围
  const rHex = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, "0")
  const gHex = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, "0")
  const bHex = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, "0")

  return `#${rHex}${gHex}${bHex}`
}

/**
 * 生成和谐的颜色方案
 * @param baseHue 基础色相 (0-360)
 * @param scheme 色彩方案类型
 * @returns 包含三种颜色的对象
 */
function generateColorScheme(baseHue: number, scheme = "analogous") {
  // 确保色相在0-360范围内
  baseHue = ((baseHue % 360) + 360) % 360

  // 饱和度和亮度基础值
  const baseSaturation = 70 + Math.random() * 20 // 70-90%
  const baseLightness = 25 + Math.random() * 15 // 25-40%

  // 根据不同的色彩方案生成颜色
  const hue1 = baseHue
  let hue2 = baseHue
  let hue3 = baseHue

  switch (scheme) {
    case "analogous": // 类似色
      hue2 = (baseHue + 30) % 360
      hue3 = (baseHue + 330) % 360 // -30度，等同于+330度
      break

    case "complementary": // 互补色
      hue2 = (baseHue + 180) % 360
      hue3 = (baseHue + 210) % 360
      break

    case "triadic": // 三元色
      hue2 = (baseHue + 120) % 360
      hue3 = (baseHue + 240) % 360
      break

    case "split-complementary": // 分裂互补色
      hue2 = (baseHue + 150) % 360
      hue3 = (baseHue + 210) % 360
      break

    case "tetradic": // 四元色
      hue2 = (baseHue + 90) % 360
      hue3 = (baseHue + 180) % 360
      break

    case "square": // 方形
      hue2 = (baseHue + 90) % 360
      hue3 = (baseHue + 270) % 360
      break

    case "monochromatic": // 单色
      // 保持相同色相，调整饱和度和亮度
      break

    default:
      // 默认使用类似色
      hue2 = (baseHue + 30) % 360
      hue3 = (baseHue + 330) % 360
  }

  // 为每种颜色添加微小的饱和度和亮度变化
  const sat1 = baseSaturation
  const sat2 = baseSaturation - 5 + Math.random() * 10
  const sat3 = baseSaturation - 5 + Math.random() * 10

  const light1 = baseLightness
  const light2 = baseLightness - 5 + Math.random() * 10
  const light3 = baseLightness - 5 + Math.random() * 10

  // 转换为十六进制颜色
  const color1 = hslToHex(hue1, sat1, light1)
  const color2 = hslToHex(hue2, sat2, light2)
  const color3 = hslToHex(hue3, sat3, light3)

  return {
    gradient1: { color: color1, position: "0%" },
    gradient2: { color: color2, position: "100%" },
    gradient3: { color: color3, position: "100%" },
  }
}

// 色彩方案类型
const COLOR_SCHEMES = [
  "analogous",
  "complementary",
  "triadic",
  "split-complementary",
  "tetradic",
  "square",
  "monochromatic",
]

export function useGradientBackground() {
  // 基础色相
  const [baseHue, setBaseHue] = useState(() => Math.floor(Math.random() * 360))
  // 当前色彩方案
  const [colorScheme, setColorScheme] = useState(() => COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)])
  // 当前渐变
  const [currentGradient, setCurrentGradient] = useState(() => generateColorScheme(baseHue, colorScheme))

  // 使用单一动画状态而不是多个状态
  const [animationState, setAnimationState] = useState(ANIMATION_STATES.IDLE)
  // 使用单一动画数据对象减少状态更新
  const [animationData, setAnimationData] = useState({
    positions: DEFAULT_POSITIONS,
    sizes: DEFAULT_SIZES,
    opacities: DEFAULT_OPACITIES,
  })

  // 动画计时器引用
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  // 添加RAF引用以便清理
  const rafRef = useRef<number | null>(null)
  // 添加性能标志
  const isLowPerfDevice = useRef(false)

  // 检测低性能设备
  useEffect(() => {
    // 简单检测 - 移动设备或旧设备可能性能较低
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isOldBrowser = !window.requestAnimationFrame || !window.cancelAnimationFrame

    // 如果是移动设备或旧浏览器，标记为低性能设备
    isLowPerfDevice.current = isMobile || isOldBrowser
  }, [])

  // 生成随机动画数据 - 提取为函数减少代码重复
  const generateAnimationData = useCallback((intensity = 1) => {
    // 低性能设备使用较小的变化幅度
    const variationFactor = isLowPerfDevice.current ? 0.5 : 1

    return {
      positions: {
        ellipse1: {
          bottom: DEFAULT_POSITIONS.ellipse1.bottom + (Math.random() * 20 - 10) * variationFactor * intensity,
          left: `${Number.parseInt(DEFAULT_POSITIONS.ellipse1.left as string) + (Math.random() * 5 - 2.5) * variationFactor * intensity}%`,
        },
        ellipse2: {
          bottom: DEFAULT_POSITIONS.ellipse2.bottom + (Math.random() * 20 - 10) * variationFactor * intensity,
          right: `${Number.parseInt(DEFAULT_POSITIONS.ellipse2.right as string) + (Math.random() * 5 - 2.5) * variationFactor * intensity}%`,
        },
        ellipse3: {
          bottom: DEFAULT_POSITIONS.ellipse3.bottom + (Math.random() * 20 - 10) * variationFactor * intensity,
          right: `${Number.parseInt(DEFAULT_POSITIONS.ellipse3.right as string) + (Math.random() * 5 - 2.5) * variationFactor * intensity}%`,
        },
      },
      sizes: {
        ellipse1: {
          width: DEFAULT_SIZES.ellipse1.width + (Math.random() * 50 - 25) * variationFactor * intensity,
          height: DEFAULT_SIZES.ellipse1.height + (Math.random() * 30 - 15) * variationFactor * intensity,
        },
        ellipse2: {
          width: DEFAULT_SIZES.ellipse2.width + (Math.random() * 40 - 20) * variationFactor * intensity,
          height: DEFAULT_SIZES.ellipse2.height + (Math.random() * 25 - 12.5) * variationFactor * intensity,
        },
        ellipse3: {
          width: DEFAULT_SIZES.ellipse3.width + (Math.random() * 35 - 17.5) * variationFactor * intensity,
          height: DEFAULT_SIZES.ellipse3.height + (Math.random() * 20 - 10) * variationFactor * intensity,
        },
      },
      opacities: {
        ellipse1: DEFAULT_OPACITIES.ellipse1 + 0.1 * intensity,
        ellipse2: DEFAULT_OPACITIES.ellipse2 + 0.1 * intensity,
        ellipse3: DEFAULT_OPACITIES.ellipse3 + 0.1 * intensity,
      },
    }
  }, [])

  // 清理所有动画相关的计时器和RAF
  const cleanupAnimations = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // 生成新的颜色方案
  const generateNewColorScheme = useCallback(() => {
    // 生成新的基础色相 - 可以完全随机或基于当前色相
    const newBaseHue = (baseHue + 30 + Math.floor(Math.random() * 120)) % 360

    // 随机选择一个新的色彩方案
    const newColorScheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)]

    // 生成新的渐变
    const newGradient = generateColorScheme(newBaseHue, newColorScheme)

    // 更新状态
    setBaseHue(newBaseHue)
    setColorScheme(newColorScheme)
    setCurrentGradient(newGradient)

    return newGradient
  }, [baseHue])

  // 更新渐变的函数 - 使用requestAnimationFrame优化动画
  const changeGradient = useCallback(() => {
    // 清理之前的动画
    cleanupAnimations()

    // 生成新的颜色方案
    const newGradient = generateNewColorScheme()

    // 低性能设备使用简化动画
    if (isLowPerfDevice.current) {
      // 简单更新渐变和不透明度，跳过复杂动画
      setAnimationData({
        ...animationData,
        opacities: {
          ellipse1: 0.25,
          ellipse2: 0.25,
          ellipse3: 0.25,
        },
      })

      // 简单延时后恢复
      animationTimerRef.current = setTimeout(() => {
        setAnimationData({
          ...animationData,
          opacities: DEFAULT_OPACITIES,
        })
      }, 1500)

      return
    }

    // 高性能设备使用完整动画
    // 设置动画状态为animating
    setAnimationState(ANIMATION_STATES.ANIMATING)

    // 使用RAF确保动画平滑
    rafRef.current = requestAnimationFrame(() => {
      // 生成新的动画数据
      const newAnimationData = generateAnimationData()
      setAnimationData(newAnimationData)

      // 设置一个定时器，在动画完成后开始淡出阶段
      animationTimerRef.current = setTimeout(() => {
        setAnimationState(ANIMATION_STATES.FADING)

        // 淡出阶段使用较小的变化
        const fadingAnimationData = generateAnimationData(0.5)
        setAnimationData({
          ...fadingAnimationData,
          opacities: DEFAULT_OPACITIES,
        })

        // 完全恢复到默认状态
        animationTimerRef.current = setTimeout(() => {
          setAnimationState(ANIMATION_STATES.IDLE)
          setAnimationData({
            positions: DEFAULT_POSITIONS,
            sizes: DEFAULT_SIZES,
            opacities: DEFAULT_OPACITIES,
          })
        }, 1000)
      }, 1500)
    })
  }, [animationData, cleanupAnimations, generateAnimationData, generateNewColorScheme])

  // 清理定时器和RAF
  useEffect(() => {
    return cleanupAnimations
  }, [cleanupAnimations])

  // 计算CSS变量 - 使用useMemo避免不必要的重新计算
  const cssVariables = useMemo(() => {
    const { positions, sizes, opacities } = animationData

    return {
      // 渐变颜色
      "--gradient1-color": currentGradient.gradient1.color,
      "--gradient1-position": currentGradient.gradient1.position,
      "--gradient2-color": currentGradient.gradient2.color,
      "--gradient2-position": currentGradient.gradient2.position,
      "--gradient3-color": currentGradient.gradient3.color,

      // 椭圆1
      "--ellipse1-bottom": `${positions.ellipse1.bottom}px`,
      "--ellipse1-left": positions.ellipse1.left,
      "--ellipse1-width": `${sizes.ellipse1.width}px`,
      "--ellipse1-height": `${sizes.ellipse1.height}px`,
      "--ellipse1-opacity": opacities.ellipse1,

      // 椭圆2
      "--ellipse2-bottom": `${positions.ellipse2.bottom}px`,
      "--ellipse2-right": positions.ellipse2.right,
      "--ellipse2-width": `${sizes.ellipse2.width}px`,
      "--ellipse2-height": `${sizes.ellipse2.height}px`,
      "--ellipse2-opacity": opacities.ellipse2,

      // 椭圆3
      "--ellipse3-bottom": `${positions.ellipse3.bottom}px`,
      "--ellipse3-right": positions.ellipse3.right,
      "--ellipse3-width": `${sizes.ellipse3.width}px`,
      "--ellipse3-height": `${sizes.ellipse3.height}px`,
      "--ellipse3-opacity": opacities.ellipse3,

      // 动画状态
      "--animation-scale": animationState !== ANIMATION_STATES.IDLE ? "1.05" : "1",
      "--transition-timing": "cubic-bezier(0.4, 0, 0.2, 1)",
      "--transition-duration": "1.5s",
    }
  }, [animationData, animationState, currentGradient])

  return {
    cssVariables,
    animationState,
    changeGradient,
    currentColorScheme: colorScheme,
    currentBaseHue: baseHue,
  }
}
