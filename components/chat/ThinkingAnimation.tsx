import RippleHeartAnimation from "@/components/RippleHeartAnimation"
import IntervalThinking from "./IntervalThinking"

interface ThinkingAnimationProps {
  isGenerating: boolean
  loadingChar: string // 保留参数以避免类型错误，但不再使用它
}

export default function ThinkingAnimation({ isGenerating, loadingChar }: ThinkingAnimationProps) {
  if (!isGenerating) return null

  return (
    <div className="flex items-center text-white space-x-2" style={{ fontSize: "16px" }}>
      <RippleHeartAnimation
        dotColor="rgba(255,255,255,0.9)"
        duration={1500}
        width="20px"
        height="17px"
        className="mr-1"
      />
      <IntervalThinking />
    </div>
  )
}
