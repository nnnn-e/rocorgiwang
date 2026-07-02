"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useChat } from "@/hooks/useChat"
import AIMessage from "./chat/AIMessage"
import UserMessage from "./chat/UserMessage"
import ThinkingAnimation from "./chat/ThinkingAnimation"
import DefaultPrompts from "./chat/DefaultPrompts"
import InputContainer from "./chat/InputContainer"
import { useGradientBackground } from "@/hooks/useGradientBackground"

interface ChatPanelProps {
  isMobile: boolean
}

export default function ChatPanel({ isMobile }: ChatPanelProps) {
  const {
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
    addAttachment,
    clearAttachments,
    attachments,
  } = useChat()

  // 使用自定义钩子管理背景渐变 - 现在返回CSS变量
  const { cssVariables, animationState, changeGradient } = useGradientBackground()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const [loadingCharIndex, setLoadingCharIndex] = useState(0)
  const loadingChars = ["☉౪⊙", "இwஇ", "＿ ＿", "=^^=", "╯╰", "T_T"]
  const [showDefaultPrompt, setShowDefaultPrompt] = useState(messages.length === 0)
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false)

  // Track if we're currently submitting a message
  const isSubmittingRef = useRef(false)
  // Track the last scroll time for debouncing
  const lastScrollTimeRef = useRef(0)

  // Add a new state variable to track scroll source
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add after other state declarations
  const [completedMessageIds, setCompletedMessageIds] = useState<Set<string>>(new Set())

  // Add a ref to track the observer
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 使用useMemo优化底部padding计算
  const inputContainerHeight = useMemo(() => (isMobile ? 180 : 200), [isMobile])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Initialize showDefaultPrompt based on message history
  useEffect(() => {
    if (messages.length > 0) {
      setShowDefaultPrompt(false)
    }
  }, [messages.length])

  // Optimize thinking animation to reduce re-renders
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingCharIndex((prevIndex) => (prevIndex + 1) % loadingChars.length)
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isGenerating, loadingChars.length])

  // Setup intersection observer for the last message
  useEffect(() => {
    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Calculate the bottom margin to keep content visible above the input container
    const bottomMargin = inputContainerHeight

    // Create a new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting && isGenerating) {
          // If the last message is not visible and we're generating content,
          // scroll to keep it visible above the input container
          if (chatContainerRef.current && lastMessageRef.current) {
            const containerRect = chatContainerRef.current.getBoundingClientRect()
            const lastMessageRect = lastMessageRef.current.getBoundingClientRect()

            // Calculate how much we need to scroll to keep the last message visible
            // with a 1rem (16px) margin above the input container
            const scrollOffset = lastMessageRect.bottom - containerRect.bottom + bottomMargin + 16

            if (scrollOffset > 0) {
              chatContainerRef.current.scrollBy({
                top: scrollOffset,
                behavior: "smooth",
              })
            }
          }
        }
      },
      {
        root: chatContainerRef.current,
        rootMargin: `0px 0px -${bottomMargin + 16}px 0px`, // Add 16px (1rem) margin
        threshold: 0.1,
      },
    )

    // Observe the last message if it exists and we're generating content
    if (lastMessageRef.current && isGenerating) {
      observerRef.current.observe(lastMessageRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isGenerating, messages, inputContainerHeight])

  // Modified scrollToBottom function to keep content visible above input
  const scrollToBottom = useCallback(
    (force = false) => {
      // Debounce: Skip if less than 200ms since last scroll and not forced
      const now = Date.now()
      if (!force && now - lastScrollTimeRef.current < 200) return
      lastScrollTimeRef.current = now

      // Calculate the bottom margin to keep content visible above the input container
      const bottomMargin = inputContainerHeight

      // Use requestAnimationFrame to ensure scrolling happens in the next frame
      requestAnimationFrame(() => {
        // Scroll the chat container to keep content visible above the input
        const chatContainer = document.querySelector(".chat-container") as HTMLElement
        if (chatContainer) {
          const scrollHeight = chatContainer.scrollHeight
          const clientHeight = chatContainer.clientHeight

          // Scroll to a position that keeps the bottom content visible above the input
          // with a 1rem (16px) margin
          chatContainer.scrollTop = scrollHeight - clientHeight + bottomMargin + 16
        }

        // Additional handling for desktop
        if (!isMobile && messagesEndRef.current) {
          const messagesEnd = messagesEndRef.current
          const containerRect = chatContainer?.getBoundingClientRect()
          const messagesEndRect = messagesEnd.getBoundingClientRect()

          // Calculate how much we need to scroll to keep the messages end visible
          // with a 1rem (16px) margin above the input container
          if (containerRect) {
            const scrollOffset = messagesEndRect.bottom - containerRect.bottom + bottomMargin + 16

            if (scrollOffset > 0) {
              chatContainer?.scrollBy({
                top: scrollOffset,
                behavior: "auto",
              })
            }
          }
        }
      })
    },
    [isMobile, inputContainerHeight],
  )

  // Add a continuous scroll effect during message generation
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout | null = null

    if (isGenerating) {
      // Set up an interval to check and adjust scroll position during generation
      scrollInterval = setInterval(() => {
        if (chatContainerRef.current && lastMessageRef.current) {
          const containerRect = chatContainerRef.current.getBoundingClientRect()
          const lastMessageRect = lastMessageRef.current.getBoundingClientRect()
          const bottomMargin = inputContainerHeight

          // Check if the last message is below the visible area
          if (lastMessageRect.bottom > containerRect.bottom - bottomMargin - 16) {
            // Scroll to keep the last message visible with a 1rem margin
            chatContainerRef.current.scrollBy({
              top: 10, // Scroll a small amount for a smooth effect
              behavior: "smooth",
            })
          }
        }
      }, 100) // Check frequently for smooth scrolling
    }

    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval)
      }
    }
  }, [isGenerating, inputContainerHeight])

  // Optimize scrolling logic when messages change
  useEffect(() => {
    // If we're submitting a message, let handleSubmitWrapper handle scrolling
    if (isSubmittingRef.current) return

    // Otherwise, handle scrolling due to message changes
    if (messages.length > 0) {
      // Use a delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        scrollToBottom(true)
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [messages, scrollToBottom])

  // Modify this useEffect hook
  useEffect(() => {
    // Scroll to bottom when message generation starts
    if (isGenerating) {
      scrollToBottom(true)
    }

    // When message generation completes (isGenerating changes from true to false)
    if (!isGenerating && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === "assistant") {
        // Use a longer delay to ensure message content is fully rendered
        setTimeout(() => {
          setCompletedMessageIds((prev) => {
            const newSet = new Set(prev)
            newSet.add(lastMessage.id)
            return newSet
          })

          // Scroll to bottom after message completes
          scrollToBottom(true)
        }, 500)
      }
    }
  }, [isGenerating, messages, scrollToBottom])

  // Ensure scrolling happens immediately after completedMessageIds state updates
  useEffect(() => {
    // When completedMessageIds is updated, scroll to the KeyPoints card
    if (completedMessageIds.size > 0 && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && completedMessageIds.has(lastMessage.id)) {
        // Use a longer timeout to ensure the KeyPoints card is fully rendered
        setTimeout(() => {
          const keyPointsCard = document.querySelector(`[data-message-id="${lastMessage.id}"]`)
          if (keyPointsCard) {
            // Use scrollIntoView with a smooth behavior
            keyPointsCard.scrollIntoView({ behavior: "smooth", block: "nearest" })

            // Also update the chat container scroll position as a fallback
            if (chatContainerRef.current) {
              const cardPosition = keyPointsCard.getBoundingClientRect().top
              const containerPosition = chatContainerRef.current.getBoundingClientRect().top
              const scrollOffset = cardPosition - containerPosition - 100 // Add some padding

              chatContainerRef.current.scrollBy({
                top: scrollOffset,
                behavior: "smooth",
              })
            }
          } else {
            // If KeyPoints card isn't found, scroll to bottom as fallback
            scrollToBottom(true)
          }
        }, 300)
      }
    }
  }, [completedMessageIds, messages, scrollToBottom])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInput(newValue)

    // Only show default prompts if input is empty AND there are no messages yet
    if (newValue.trim() === "" && messages.length === 0) {
      setShowDefaultPrompt(true)
    } else {
      setShowDefaultPrompt(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        const event = new Event("submit", { cancelable: true, bubbles: true })
        form.dispatchEvent(event)
      }
    }
  }

  // Modify message submission handler
  const handleSubmitWrapper = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Check if we can submit
    if (!input.trim() || isGenerating || isSubmittingRef.current) return

    // 在发送消息时更改背景渐变
    changeGradient()

    // Save current input and clear it
    const currentInput = input

    // Set state first to avoid repeated triggers
    if (!hasUserSentMessage) {
      setHasUserSentMessage(true)
    }

    // Clear input field early to reduce state update count
    setInput("")

    // Hide default prompts after sending a message
    setShowDefaultPrompt(false)

    // Determine if structured prompting is needed
    // Complex questions, design questions, methodology questions, etc. benefit more from structured answers
    const needsStructure =
      currentInput.length > 100 ||
      currentInput.includes("设计") ||
      currentInput.includes("如何") ||
      currentInput.includes("为什么") ||
      currentInput.includes("分析") ||
      currentInput.includes("比较") ||
      currentInput.includes("思考")

    // Add lightweight structured prompting without changing the question itself
    const structuredPrompt = needsStructure
      ? `${currentInput}\n\n(请先简短寒暄回应对方，然后以结构化方式回答，保持你的语气和风格不变)`
      : `${currentInput}\n\n(请先简短寒暄回应对方，再回答问题)`

    // Submit message - use the saved input value
    const formData = new FormData(e.target as HTMLFormElement)
    formData.set("message", structuredPrompt)
    await handleSubmit(e)

    // Use a short delay to ensure DOM has updated
    setTimeout(() => {
      // Force scroll to bottom, but only scroll the chat container
      scrollToBottom(true)

      // Mark message submission as complete
      isSubmittingRef.current = false
    }, 100)
  }

  const handleSendMessage = (point: string) => {
    setInput(point)
    setShowDefaultPrompt(false)

    // Focus the input field after setting the input value
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 0)
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
    setShowDefaultPrompt(false)

    // Focus the input field after setting the input value
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 0)
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* 添加渐变椭圆背景 - 使用CSS变量和will-change优化 */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{
          zIndex: 1,
          ...(cssVariables as any), // 应用所有CSS变量
        }}
      >
        {/* 使用CSS类和变量代替内联样式，减少重绘 */}
        <style jsx>{`
          .gradient-ellipse {
            position: absolute;
            border-radius: 9999px;
            filter: blur(100px);
            will-change: transform, opacity;
            transform: scale(var(--animation-scale));
            transition: all var(--transition-duration) var(--transition-timing);
          }
          
          .ellipse-1 {
            bottom: var(--ellipse1-bottom);
            left: var(--ellipse1-left);
            width: var(--ellipse1-width);
            height: var(--ellipse1-height);
            opacity: var(--ellipse1-opacity);
            background: linear-gradient(135deg, var(--gradient1-color) var(--gradient1-position), var(--gradient2-color) var(--gradient2-position));
          }
          
          .ellipse-2 {
            bottom: var(--ellipse2-bottom);
            right: var(--ellipse2-right);
            width: var(--ellipse2-width);
            height: var(--ellipse2-height);
            opacity: var(--ellipse2-opacity);
            background: linear-gradient(135deg, var(--gradient2-color) 0%, var(--gradient3-color) 100%);
          }
          
          .ellipse-3 {
            bottom: var(--ellipse3-bottom);
            right: var(--ellipse3-right);
            width: var(--ellipse3-width);
            height: var(--ellipse3-height);
            opacity: var(--ellipse3-opacity);
            background: linear-gradient(135deg, var(--gradient3-color) 0%, var(--gradient1-color) 100%);
          }
          
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: var(--ellipse1-opacity);
            }
            50% {
              opacity: calc(var(--ellipse1-opacity) * 1.2);
            }
          }
        `}</style>

        <div className={`gradient-ellipse ellipse-1 ${animationState === "animating" ? "animate-pulse" : ""}`} />
        <div className={`gradient-ellipse ellipse-2 ${animationState === "animating" ? "animate-pulse" : ""}`} />
        <div className={`gradient-ellipse ellipse-3 ${animationState === "animating" ? "animate-pulse" : ""}`} />
      </div>

      {/* Chat header */}
      <div
        className={`flex justify-between items-center p-4 ${isMobile ? "px-4" : "px-8"} w-full`}
        style={{
          fontSize: isMobile ? "16px" : "14px",
          color: "rgba(255,255,255, .8)",
        }}
      >
        <div>CHAT</div>
        <div>WITH</div>
        <div>LONG</div>
      </div>

      {/* 外层容器 - 使用一致的宽度和内边距 */}
      <div className={`flex-1 overflow-hidden ${isMobile ? "px-4" : "px-8"} w-full`}>
        {/* 消息列表容器 */}
        <div
          ref={chatContainerRef}
          className={`h-full overflow-y-auto ${isMobile ? "py-4" : "py-8"} max-w-[720px] mx-auto w-full chat-container relative`}
          style={{ paddingBottom: `${inputContainerHeight}px`, zIndex: 2 }}
        >
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1
            return (
              <div
                key={message.id}
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} ${index > 0 ? "mt-4" : ""}`}
                ref={isLastMessage && message.role === "assistant" ? lastMessageRef : undefined}
              >
                {message.role === "assistant" ? (
                  <AIMessage
                    content={message.content}
                    messageId={message.id}
                    isMobile={isMobile}
                    isCompleted={completedMessageIds.has(message.id)}
                    onPointClick={handleSendMessage}
                  />
                ) : (
                  <UserMessage content={message.content} attachments={message.attachments} isMobile={isMobile} />
                )}
              </div>
            )
          })}

          {/* Use fixed height container to wrap thinking animation to avoid layout shifts */}
          <div className="h-8 mt-4">
            <ThinkingAnimation isGenerating={isGenerating} loadingChar={loadingChars[loadingCharIndex]} />
          </div>

          {fallbackMessage && (
            <div className="flex flex-col items-start mt-4">
              <div className="max-w-[90%] rounded-lg bg-red-100 p-3">
                <p className="text-sm text-red-800">{fallbackMessage}</p>
              </div>
              <button onClick={retry} className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                Retry
              </button>
            </div>
          )}

          {apiError && (
            <div className="flex flex-col items-start mt-4">
              <div className="max-w-[90%] rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-sm text-yellow-800">{apiError}</p>
              </div>
              <button onClick={() => setApiError(null)} className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                关闭提示
              </button>
            </div>
          )}

          {/* Invisible element to help with scrolling */}
          <div className="messages-end h-4" ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating input container with the specified gradient background */}
      <div
        className={`absolute bottom-0 left-0 right-0 ${isMobile ? "px-4 pb-4" : "px-8 pb-4"} z-30`}
        style={{
          background: "linear-gradient(180deg, rgba(16, 16, 16, 0%) 0%, #101010 100%)",
        }}
      >
        <div className={`max-w-[720px] mx-auto w-full`}>
          {showDefaultPrompt && <DefaultPrompts isMobile={isMobile} onPromptClick={handlePromptClick} />}

          <InputContainer
            ref={inputRef}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmitWrapper}
            isGenerating={isGenerating}
            stopGeneration={stopGeneration}
            isMobile={isMobile}
            handleKeyDown={handleKeyDown}
            onInputChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  )
}
