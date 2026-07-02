"use client"

import { Bricolage_Grotesque } from "next/font/google"
import ReactMarkdown from "react-markdown"
import KeyPointsCard from "../KeyPointsCard"
import {
  addSpaceBetweenChineseAndOthers,
  cleanMessageContent,
  addSpaceBetweenEmojiAndText,
} from "@/utils/formatChinese"
import { useEffect } from "react"

// Initialize the Bricolage Grotesque font
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

// Enhanced extractKeyPoints function with improved extraction capabilities
const extractKeyPoints = (content: string): string[] => {
  // 1. First try to extract from markup
  const keyPointsRegex = /<key-points>([\s\S]*?)<\/key-points>/
  const match = content.match(keyPointsRegex)

  if (match && match[1]) {
    // Extract bullet points
    const explicitPoints = match[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.substring(2).trim())
      .filter((point) => point.length > 0)

    // If there are enough explicit points, return them directly
    if (explicitPoints.length >= 5) {
      return explicitPoints
    }

    // Otherwise, try to extract more points using other methods
    return [...explicitPoints, ...extractImplicitKeyPoints(content, explicitPoints)]
  }

  // 2. If no markup, try to extract implicit key points from content
  return extractImplicitKeyPoints(content, [])
}

// Enhanced function to extract implicit key points from content
const extractImplicitKeyPoints = (content: string, existingPoints: string[]): string[] => {
  const implicitPoints: string[] = []
  const cleanContent = removeKeyPointsMarkup(content)

  // Extract headings and subheadings as key points
  const headingRegex = /#{1,3}\s+(.+?)(?=\n|$)/g
  let headingMatch
  while ((headingMatch = headingRegex.exec(cleanContent)) !== null) {
    const heading = headingMatch[1].trim()
    if (heading && !existingPoints.includes(heading) && !implicitPoints.includes(heading)) {
      implicitPoints.push(heading)
    }
  }

  // Extract bold text as key points
  const boldRegex = /\*\*(.+?)\*\*/g
  let boldMatch
  while ((boldMatch = boldRegex.exec(cleanContent)) !== null) {
    const bold = boldMatch[1].trim()
    // Only extract shorter bold text as key points
    if (bold && bold.length < 100 && !existingPoints.includes(bold) && !implicitPoints.includes(bold)) {
      implicitPoints.push(bold)
    }
  }

  // Extract list items as key points
  const listItemRegex = /^[\s]*[-*]\s+(.+?)(?=\n|$)/gm
  let listMatch
  while ((listMatch = listItemRegex.exec(cleanContent)) !== null) {
    const item = listMatch[1].trim()
    if (item && !existingPoints.includes(item) && !implicitPoints.includes(item)) {
      implicitPoints.push(item)
    }
  }

  // Extract sentences containing structural markers
  const structureMarkers = [
    "首先",
    "其次",
    "再次",
    "最后",
    "总结",
    "核心是",
    "关键在于",
    "本质上",
    "值得注意的是",
    "从设计角度",
    "从用户体验看",
    "从系统思维出发",
  ]

  // Extract sentences containing structural markers
  const sentences = cleanContent.split(/(?<=\.|\?|!|。|？|！)\s+/)
  const structuralPoints = sentences
    .filter((sentence) => structureMarkers.some((marker) => sentence.includes(marker)))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && sentence.length < 100)
    .filter((sentence) => !existingPoints.includes(sentence) && !implicitPoints.includes(sentence))

  // Limit the number of additional key points to ensure total doesn't exceed 10
  const combinedPoints = [...implicitPoints, ...structuralPoints]
  const maxAdditionalPoints = 10 - existingPoints.length
  return combinedPoints.slice(0, maxAdditionalPoints)
}

// Remove key points markup from message, keeping other content intact
const removeKeyPointsMarkup = (content: string): string => {
  return content.replace(/<key-points>[\s\S]*?<\/key-points>/g, "")
}

interface AIMessageProps {
  content: string
  messageId: string
  isMobile: boolean
  isCompleted: boolean
  onPointClick: (point: string) => void
}

export default function AIMessage({ content, messageId, isMobile, isCompleted, onPointClick }: AIMessageProps) {
  // Add custom CSS to ensure list markers are visible
  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      .ai-message ul {
        list-style-type: disc !important;
        padding-left: 1.5em !important;
        padding-right: 1.5em !important;

      }
      
      .ai-message ol {
        list-style-type: decimal !important;
        padding-left: 1.5em !important;
        padding-right: 1.5em !important;

      }
      
      .ai-message ul li,
      .ai-message ol li {
        display: list-item !important;
        color: rgba(255, 255, 255, 0.8) !important;
        padding-right: 1.5em !important;

      }
      
      .ai-message ul li::marker,
      .ai-message ol li::marker {
        color: rgba(255, 255, 255, 0.6) !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div
      className={`${isMobile ? "max-w-full" : "max-w-full"} ai-message text-white ${bricolage.className}`}
      style={{
        fontSize: "16px",
        lineHeight: isMobile ? "160%" : "inherit",
        background: "transparent",
        borderRadius: "0",
      }}
    >
      <ReactMarkdown
        className="prose prose-sm max-w-none premium-markdown"
        components={{
          h1: ({ node, children, ...props }) => (
            <h1
              className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold text-center ${isMobile ? "my-4" : "my-6"} text-white/90 tracking-tight border-b ${isMobile ? "pb-2" : "pb-3"} border-white/10`}
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2
              className={`${isMobile ? "text-xl" : "text-2xl"} font-semibold ${isMobile ? "mt-5 mb-2" : "mt-6 mb-3"} text-white/80`}
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3
              className={`${isMobile ? "text-lg" : "text-xl"} font-medium ${isMobile ? "mt-4 mb-2" : "mt-5 mb-2"} text-white/80`}
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ node, children, ...props }) => (
            <h4
              className={`${isMobile ? "text-base" : "text-lg"} font-medium ${isMobile ? "mt-3 mb-1" : "mt-4 mb-2"} text-white/70`}
              {...props}
            >
              {children}
            </h4>
          ),
          h5: ({ node, children, ...props }) => (
            <h5
              className={`${isMobile ? "text-sm" : "text-base"} font-medium ${isMobile ? "mt-2 mb-1" : "mt-3 mb-1"} text-white/70`}
              {...props}
            >
              {children}
            </h5>
          ),
          h6: ({ node, children, ...props }) => (
            <h6
              className={`${isMobile ? "text-xs" : "text-sm"} font-medium ${isMobile ? "mt-2 mb-1" : "mt-2 mb-1"} text-white/70`}
              {...props}
            >
              {children}
            </h6>
          ),
          p: ({ node, children, ...props }) => {
            return (
              <p className={`${isMobile ? "my-3" : "my-4"} leading-[1.6] text-white/80`} {...props}>
                {children}
              </p>
            )
          },
          ul: ({ node, children, ...props }) => (
            <ul
              className={`${isMobile ? "my-4 space-y-2" : "my-6 space-y-3"} text-white/80`}
              style={{
                listStyleType: "disc",
                paddingLeft: "1.5em",
              }}
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol
              className={`${isMobile ? "my-4 space-y-2" : "my-6 space-y-3"} text-white/80`}
              style={{
                listStyleType: "decimal",
                paddingLeft: "1.5em",
              }}
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className="leading-[1.6] text-white/80" style={{ display: "list-item" }} {...props}>
              {children}
            </li>
          ),
          blockquote: ({ node, children, ...props }) => (
            <blockquote
              className={`border-l-4 border-white/10 pl-4 ${isMobile ? "my-4" : "my-6"} italic text-white/80 bg-white/5 p-3 rounded-r`}
              {...props}
            >
              {children}
            </blockquote>
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className={`bg-white/5 px-1.5 py-0.5 rounded ${isMobile ? "text-sm" : "text-base"} font-mono text-purple-600`}
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <pre
                className={`bg-white/5 text-white/80 ${isMobile ? "px-4 py-3" : "px-4 py-3"} rounded-lg overflow-x-auto ${isMobile ? "my-4 text-sm" : "my-6 text-base"}`}
              >
                <code className="font-mono" {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          table: ({ node, children, ...props }) => (
            <div className={`${isMobile ? "my-4" : "my-6"} overflow-x-auto rounded-lg border border-white/10`}>
              <table className="min-w-full divide-y divide-white/10" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ node, children, ...props }) => (
            <thead className="bg-white/5" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ node, children, ...props }) => (
            <tbody className="divide-y divide-white/10 bg-white" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ node, children, ...props }) => <tr {...props}>{children}</tr>,
          th: ({ node, children, ...props }) => (
            <th
              className={`${isMobile ? "px-4 py-2" : "px-6 py-3"} text-left text-sm font-medium uppercase tracking-wider text-white/70`}
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ node, children, ...props }) => (
            <td
              className={`${isMobile ? "px-4 py-2 text-sm" : "px-6 py-4 text-base"} whitespace-nowrap text-white/60`}
              {...props}
            >
              {children}
            </td>
          ),
          hr: ({ node, ...props }) => (
            <hr className={`${isMobile ? "my-8" : "my-16"} h-px border-0 bg-[rgba(255,255,255,0.1)]`} {...props} />
          ),
          a: ({ node, children, href, ...props }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          img: ({ node, src, alt, ...props }) => {
            // Handle relative paths
            const imageSrc = src?.startsWith("/")
              ? src
              : src?.startsWith("http")
                ? src
                : `/placeholder.svg?height=300&width=300`

            return (
              <div className={`${isMobile ? "my-4" : "my-4"} flex justify-center`}>
                <img
                  src={imageSrc || "/placeholder.svg"}
                  alt={alt || "Image"}
                  className="rounded-lg shadow-md max-w-full max-h-[400px] object-contain"
                  loading="lazy"
                  {...props}
                />
              </div>
            )
          },
          strong: ({ node, children, ...props }) => (
            <strong className="font-semibold text-white/90" {...props}>
              {children}
            </strong>
          ),
          em: ({ node, children, ...props }) => (
            <em className="italic text-white/80" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {addSpaceBetweenEmojiAndText(addSpaceBetweenChineseAndOthers(cleanMessageContent(content)))}
      </ReactMarkdown>

      {isCompleted && (
        <div className={isMobile ? "mt-4 transition-opacity duration-300 ease-in-out opacity-100" : ""}>
          <KeyPointsCard
            key={`key-points-${messageId}`}
            messageId={messageId}
            points={extractKeyPoints(content)}
            onPointClick={onPointClick}
          />
        </div>
      )}
    </div>
  )
}
