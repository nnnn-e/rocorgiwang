"use client"

import { User, Brain, Mail } from "lucide-react"

interface DefaultPromptsProps {
  isMobile: boolean
  onPromptClick: (prompt: string) => void
}

export default function DefaultPrompts({ isMobile, onPromptClick }: DefaultPromptsProps) {
  return (
    <div className="mb-4 text-white/60">
      {/* Avatar image aligned to the left */}
      <div className="flex justify-start px-4 mb-4">
        <img
          src="https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/RocorgiWang/Avatar_White.svg"
          alt="Rocorgi Wang Avatar"
          width={56}
          height={56}
        />
      </div>

      <div className="px-4">
        {/* Title color set to rgba(255,255,255, .9) */}
        <h3 className="font-medium text-xl" style={{ color: "rgba(255,255,255, .9)" }}>
          Hello friend{isMobile ? "" : "s"}.
        </h3>
        <h3 className="font-medium text-xl" style={{ color: "rgba(255,255,255, .9)" }}>
          {isMobile ? "We can talk anything about design and product." : "Ask me anything about design"}
        </h3>
      </div>
      <ul className="mt-2" style={{ fontSize: "16px" }}>
        {[
          { icon: User, text: "Who are you?" },
          { icon: Brain, text: "What's in your mind?" },
          { icon: Mail, text: "How to reach out to you?" },
        ].map((item, index) => (
          <li
            key={index}
            className="flex items-center cursor-pointer hover:bg-white hover:bg-opacity-[0.04] py-2 px-4 transition-colors duration-200 prompt-item"
            onClick={() => onPromptClick(item.text)}
          >
            <item.icon className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} mr-2`} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
