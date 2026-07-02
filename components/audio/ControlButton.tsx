"use client"

import type React from "react"

interface ControlButtonProps {
  onClick: () => void
  position: "top" | "right" | "bottom" | "left" | "center"
  disabled?: boolean
  children: React.ReactNode
  isHovering: boolean
  centerButtonSize?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function ControlButton({
  onClick,
  position,
  disabled = false,
  children,
  isHovering,
  centerButtonSize,
  onMouseEnter,
  onMouseLeave,
}: ControlButtonProps) {
  // 根据位置确定样式
  let positionStyle: React.CSSProperties = {}

  switch (position) {
    case "top":
      positionStyle = {
        position: "absolute",
        top: "4px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "80px",
        textAlign: "center",
      }
      break
    case "right":
      positionStyle = {
        position: "absolute",
        right: "4px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "80px",
        textAlign: "center",
      }
      break
    case "bottom":
      positionStyle = {
        position: "absolute",
        bottom: "4px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "80px",
        textAlign: "center",
      }
      break
    case "left":
      positionStyle = {
        position: "absolute",
        left: "4px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "80px",
        textAlign: "center",
      }
      break
    case "center":
      positionStyle = {
        position: "relative",
        width: centerButtonSize ? `${centerButtonSize}px` : "auto",
        height: centerButtonSize ? `${centerButtonSize}px` : "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        fontSize: "12px",
        border: "none",
        transition: "border 0.3s ease",
      }
      break
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`text-white rounded-full py-2 z-20 opacity-transition ${position === "center" ? "" : ""}`}
      style={{
        ...positionStyle,
        fontSize: "12px",
        opacity: isHovering ? 1 : 0.4,
        transition: "opacity 0.3s ease",
      }}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
