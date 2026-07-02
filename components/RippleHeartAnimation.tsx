"use client"
import { useRef, useEffect } from "react"

export interface RippleHeartAnimationProps {
  /** Dot color */
  dotColor?: string
  /** Animation duration (milliseconds) */
  duration?: number
  /** Animation interval (milliseconds) */
  interval?: number
  /** Component width */
  width?: number | string
  /** Component height */
  height?: number | string
  /** Custom class name */
  className?: string
}

/**
 * Dot matrix heart animation component with ripple effect from center
 */
export default function RippleHeartAnimation({
  dotColor = "white",
  duration = 2000,
  interval = 0,
  width = "20px",
  height = "17px",
  className = "",
}: RippleHeartAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Dot coordinates extracted from SVG
  const dots = [
    { x: 10.25, y: 15 },
    { x: 7.25, y: 12 },
    { x: 10.25, y: 12 },
    { x: 13.25, y: 12 },
    { x: 4.25, y: 9 },
    { x: 7.25, y: 9 },
    { x: 10.25, y: 9 },
    { x: 13.25, y: 9 },
    { x: 16.25, y: 9 },
    { x: 1.25, y: 6 },
    { x: 4.25, y: 6 },
    { x: 7.25, y: 6 },
    { x: 10.25, y: 6 },
    { x: 13.25, y: 6 },
    { x: 16.25, y: 6 },
    { x: 19.25, y: 6 },
    { x: 1.25, y: 3 },
    { x: 4.25, y: 3 },
    { x: 7.25, y: 3 },
    { x: 10.25, y: 3 },
    { x: 13.25, y: 3 },
    { x: 16.25, y: 3 },
    { x: 19.25, y: 3 },
    { x: 4.25, y: 0 },
    { x: 7.25, y: 0 },
    { x: 13.25, y: 0 },
    { x: 16.25, y: 0 },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas pixel ratio for high DPI screens
    const dpr = window.devicePixelRatio || 1
    canvas.width = 20 * dpr
    canvas.height = 17 * dpr
    ctx.scale(dpr, dpr)

    // Calculate SVG center point
    const centerX = 10 // Half of SVG width
    const centerY = 8.5 // Half of SVG height

    // Calculate distance from center for each dot
    const dotsWithDistance = dots.map((dot) => {
      const dx = dot.x - centerX
      const dy = dot.y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      return { ...dot, distance }
    })

    // Find maximum distance for normalization
    const maxDistance = Math.max(...dotsWithDistance.map((dot) => dot.distance))

    // Add normalized distance to each dot
    const normalizedDots = dotsWithDistance.map((dot) => ({
      ...dot,
      normalizedDistance: dot.distance / maxDistance,
    }))

    let animationFrameId: number
    const startTime = Date.now()
    const animationDuration = duration

    const animate = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const cycleTime = duration + interval
      const cycleElapsed = elapsed % cycleTime

      // 只在duration时间内绘制动画，interval时间内清空画布
      if (cycleElapsed <= duration) {
        const progress = cycleElapsed / duration

        // Clear canvas
        ctx.clearRect(0, 0, 20, 17)

        // Draw each dot
        normalizedDots.forEach((dot) => {
          // Calculate animation delay based on distance
          // Closer dots animate earlier
          const delayFactor = dot.normalizedDistance
          const delayedProgress = (progress - delayFactor * 0.5 + 1) % 1

          // Calculate scale and opacity
          let scale, opacity

          if (delayedProgress < 0.5) {
            // 0-0.5: Small to large, transparent to opaque
            scale = 0.5 + delayedProgress * 3 // 0.5 to 2
            opacity = delayedProgress * 2 // 0 to 1
          } else {
            // 0.5-1: Large to small, opaque to transparent
            scale = 2 - (delayedProgress - 0.5) * 3 // 2 to 0.5
            opacity = 1 - (delayedProgress - 0.5) * 2 // 1 to 0
          }

          // Draw dot
          ctx.beginPath()
          ctx.globalAlpha = opacity
          ctx.fillStyle = dotColor
          ctx.arc(dot.x, dot.y, 0.5 * scale, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        })
      } else {
        // During interval, clear the canvas
        ctx.clearRect(0, 0, 20, 17)
      }

      // Request next frame
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [dotColor, duration, interval])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`pixelated ${className}`}
      aria-label="Dot matrix heart animation"
    />
  )
}
