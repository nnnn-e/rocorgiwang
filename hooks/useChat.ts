"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useChat as useAIChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

const fallbackMessages = ["连接出现问题，请重试", "网络连接不稳定，请稍后再试", "响应超时，请尝试简短的问题"]

const hiddenPrompt = `你是Wanglong，一位AI用户体验设计师，曾在阿里工作。你热衷于为人类创造有意义的工具。你的目标是"构建工具来放大我们的想象力"。与你合作非常有意义。请以Wanglong的身份回应，保持专业温和的语气，适当使用emoji增加亲切感，并在回答结束时提取6-10个关键要点。`

// 将 UIMessage 转换为后端期望的 { role, content } 格式
function toBackendMessage(msg: { role: string; parts?: Array<{ type: string; text?: string }>; content?: string }) {
  const content =
    msg.parts
      ?.filter((p): p is { type: string; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? msg.content ?? ""
  return { role: msg.role, content }
}

export function useChat() {
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Array<{ url: string; type: string }>>([])

  const {
    messages,
    sendMessage,
    regenerate,
    stop,
    status,
    error,
  } = useAIChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: (options) => {
        const { messages: uiMessages, body } = options
        const simpleMessages = uiMessages.map(toBackendMessage)
        const customBody = (body || {}) as { content?: string; attachments?: Array<{ url: string; type: string }> }
        return {
          body: {
            messages: simpleMessages,
            content: customBody.content ?? simpleMessages[simpleMessages.length - 1]?.content,
            attachments: customBody.attachments ?? [],
          },
        }
      },
    }),
    onError: (err) => {
      console.error("Chat error:", err)
      setIsGenerating(false)
      setApiError(`连接错误: ${err?.message || "未知错误"}。请稍后再试或刷新页面。`)
    },
    onFinish: () => {
      setIsGenerating(false)
      setFallbackMessage(null)
      setAttachments([])
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  const stopGeneration = useCallback(() => {
    stop()
    setIsGenerating(false)
  }, [stop])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>, { content = "", fileAttachments = [] } = {}) => {
      e.preventDefault()
      if (
        (!content.trim() && !input.trim() && attachments.length === 0 && fileAttachments.length === 0) ||
        isGenerating
      )
        return

      setIsGenerating(true)
      setFallbackMessage(null)
      setApiError(null)

      const finalAttachments = [...attachments]

      if (fileAttachments && fileAttachments.length > 0) {
        for (const file of fileAttachments) {
          if (file instanceof File) {
            try {
              const formData = new FormData()
              formData.append("file", file)
              const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              })
              if (!uploadResponse.ok) throw new Error("文件上传失败")
              const { url, type } = await uploadResponse.json()
              finalAttachments.push({ url, type })
            } catch (error) {
              console.error("文件处理错误:", error)
              setApiError("文件上传失败，请重试")
              setIsGenerating(false)
              return
            }
          } else if (typeof file === "object" && file.url) {
            finalAttachments.push(file)
          }
        }
      }

      const enhancedContent = `${hiddenPrompt}

User: ${content || input}`

      try {
        await sendMessage(
          { text: enhancedContent },
          {
            body: { content: enhancedContent, attachments: finalAttachments },
          },
        )
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("Generation aborted")
        } else {
          console.error("Submit error:", err)
          setFallbackMessage(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)])
        }
        setIsGenerating(false)
      }
    },
    [sendMessage, input, isGenerating, attachments],
  )

  // 添加附件的函数
  const addAttachment = useCallback((attachment: { url: string; type: string }) => {
    setAttachments((prev) => [...prev, attachment])
  }, [])

  // 移除附件的函数
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // 清除所有附件
  const clearAttachments = useCallback(() => {
    setAttachments([])
  }, [])

  const retry = useCallback(() => {
    setFallbackMessage(null)
    setApiError(null)
    regenerate()
  }, [regenerate])

  // Use useEffect to handle isLoading changes
  useEffect(() => {
    if (!isLoading) {
      setIsGenerating(false)
    }
  }, [isLoading])

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    isGenerating,
    stopGeneration,
    fallbackMessage,
    retry,
    apiError,
    setApiError,
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
  }
}
