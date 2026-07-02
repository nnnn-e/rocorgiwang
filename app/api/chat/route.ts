export const maxDuration = 60 // 设置最大超时时间为60秒
export const runtime = "nodejs"

import { streamText } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
import { openai } from "@ai-sdk/openai"
import { qwen } from "qwen-ai-provider"

// Import the dynamic system prompt generator
import { generateDynamicSystemPrompt } from "@/utils/systemPrompts"

// 添加一个简单的缓存来记录API提供商的状态
const providerStatus = {
  openai: { available: true, lastError: null, lastErrorTime: 0 },
  deepseek: { available: true, lastError: null, lastErrorTime: 0 },
  qwen: { available: true, lastError: null, lastErrorTime: 0 },
}

// 检查提供商是否应该被跳过（基于最近的错误）
function shouldSkipProvider(providerName: string) {
  const status = providerStatus[providerName as keyof typeof providerStatus]

  // 如果提供商最近没有错误，不跳过
  if (status.available && !status.lastError) return false

  // 如果错误是配额相关的，并且发生在过去30分钟内，跳过该提供商
  if (
    (status.lastError && status.lastError.includes("quota")) ||
    (status.lastError && status.lastError.includes("billing"))
  ) {
    // 检查错误是否在30分钟内发生
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000
    if (status.lastErrorTime > thirtyMinutesAgo) {
      console.log(`Skipping ${providerName} due to recent quota error`)
      return true
    }
  }

  // 重置状态，尝试再次使用
  status.available = true
  status.lastError = null
  return false
}

// 标记提供商为不可用
function markProviderUnavailable(providerName: string, error: any) {
  const status = providerStatus[providerName as keyof typeof providerStatus]
  status.available = false
  status.lastError = error.toString()
  status.lastErrorTime = Date.now()
  console.log(`Marked ${providerName} as unavailable due to error: ${error}`)
}

// Update the POST function to use dynamic system prompts
export async function POST(req: Request) {
  try {
    const { messages, content, attachments } = await req.json()
    const lastMessage = messages[messages.length - 1]
    const prompt = content || lastMessage.content

    // 创建格式化的消息数组
    const formattedMessages = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    // 处理多模态消息（包含图片附件）
    let finalContent = prompt
    let hasImageAttachment = false

    // 如果有附件，处理图片
    if (attachments && attachments.length > 0) {
      // 目前只处理第一张图片
      const imageAttachment = attachments[0]
      hasImageAttachment = true

      // 对于OpenAI，使用特殊的多模态格式
      if (process.env.OPENAI_API_KEY && !shouldSkipProvider("openai")) {
        // 创建OpenAI的多模态消息格式
        const multimodalMessage = {
          role: lastMessage.role,
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageAttachment.url,
                detail: "high", // 可以是 "low", "high", "auto"
              },
            },
          ],
        }

        // 替换最后一条消息
        formattedMessages.push(multimodalMessage)
      } else {
        // 对于其他模型，将图片描述添加到文本中
        finalContent = `[图片已上传] ${prompt}\n图片URL: ${imageAttachment.url}\n请分析这张图片并回答问题。`
        formattedMessages.push({
          role: lastMessage.role,
          content: finalContent,
        })
      }
    } else {
      // 没有附件，添加普通文本消息
      formattedMessages.push({
        role: lastMessage.role,
        content: prompt,
      })
    }

    // Generate dynamic system prompt based on the user's message
    const systemPrompt = generateDynamicSystemPrompt(prompt, messages)

    // 检查环境变量
    const hasDeepseekKey = !!process.env.DEEPSEEK_API_KEY
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasQwenKey = !!process.env.QWEN_API_KEY

    // 如果没有任何API密钥可用，抛出错误
    if (!hasDeepseekKey && !hasOpenAIKey && !hasQwenKey) {
      throw new Error("Missing API keys. At least one of DEEPSEEK_API_KEY, OPENAI_API_KEY, or QWEN_API_KEY is required")
    }

    // 创建API提供商列表
    const apiProviders = []

    // 根据是否有图片附件和提供商状态调整优先级
    if (hasImageAttachment) {
      // 如果有图片，优先使用支持多模态的提供商
      if (hasOpenAIKey && !shouldSkipProvider("openai")) {
        apiProviders.push({
          name: "openai",
          model: openai("gpt-4o"),
          apiKey: process.env.OPENAI_API_KEY,
          supportsMultimodal: true,
        })
      }

      // 然后添加其他提供商作为备选
      if (hasDeepseekKey && !shouldSkipProvider("deepseek")) {
        apiProviders.push({
          name: "deepseek",
          model: deepseek("deepseek-chat"),
          apiKey: process.env.DEEPSEEK_API_KEY,
          supportsMultimodal: false,
        })
      }

      if (hasQwenKey && !shouldSkipProvider("qwen")) {
        apiProviders.push({
          name: "qwen",
          model: qwen("qwen-max"),
          apiKey: process.env.QWEN_API_KEY,
          supportsMultimodal: false,
        })
      }
    } else {
      // 如果没有图片，优先使用DeepSeek（假设它是首选）
      if (hasDeepseekKey && !shouldSkipProvider("deepseek")) {
        apiProviders.push({
          name: "deepseek",
          model: deepseek("deepseek-chat"),
          apiKey: process.env.DEEPSEEK_API_KEY,
          supportsMultimodal: false,
        })
      }

      // 然后是OpenAI
      if (hasOpenAIKey && !shouldSkipProvider("openai")) {
        apiProviders.push({
          name: "openai",
          model: openai("gpt-4o"),
          apiKey: process.env.OPENAI_API_KEY,
          supportsMultimodal: true,
        })
      }

      // 最后是Qwen
      if (hasQwenKey && !shouldSkipProvider("qwen")) {
        apiProviders.push({
          name: "qwen",
          model: qwen("qwen-max"),
          apiKey: process.env.QWEN_API_KEY,
          supportsMultimodal: false,
        })
      }
    }

    // 如果没有可用的API提供商，返回错误
    if (apiProviders.length === 0) {
      throw new Error("No API providers available. All providers may be experiencing issues or quota limits.")
    }

    // 尝试每个API提供商，直到成功或全部失败
    let lastError = null

    for (const provider of apiProviders) {
      try {
        console.log(`Attempting to use ${provider.name} API...`)

        // 对于OpenAI，如果有图片附件且支持多模态，使用特殊处理
        if (provider.name === "openai" && hasImageAttachment && provider.supportsMultimodal) {
          // OpenAI的多模态请求已经在formattedMessages中准备好了
          const result = await streamText({
            model: provider.model,
            messages: formattedMessages,
            system: systemPrompt,
            apiKey: provider.apiKey,
          })

          console.log(`Successfully used ${provider.name} API with multimodal content`)

          return result.toDataStreamResponse({
            getErrorMessage: (error) => {
              console.error(`${provider.name} API error:`, error)
              // 检查是否是配额错误
              const errorMsg = error instanceof Error ? error.message : String(error)
              if (errorMsg.includes("quota") || errorMsg.includes("billing")) {
                markProviderUnavailable(provider.name, errorMsg)
              }
              return `Error: ${errorMsg}`
            },
          })
        } else {
          // 对于不支持多模态的模型，使用文本描述
          const result = await streamText({
            model: provider.model,
            messages: formattedMessages,
            system: systemPrompt,
            apiKey: provider.apiKey,
          })

          console.log(`Successfully used ${provider.name} API`)

          return result.toDataStreamResponse({
            getErrorMessage: (error) => {
              console.error(`${provider.name} API error:`, error)
              // 检查是否是配额错误
              const errorMsg = error instanceof Error ? error.message : String(error)
              if (errorMsg.includes("quota") || errorMsg.includes("billing")) {
                markProviderUnavailable(provider.name, errorMsg)
              }
              return `Error: ${errorMsg}`
            },
          })
        }
      } catch (error: any) {
        console.error(`${provider.name} API failed:`, error)

        // 检查是否是配额错误
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (errorMsg.includes("quota") || errorMsg.includes("billing")) {
          markProviderUnavailable(provider.name, errorMsg)
        }

        lastError = error
        // 继续尝试下一个提供商
      }
    }

    // 如果所有提供商都失败，返回最后一个错误
    throw lastError || new Error("All API providers failed")
  } catch (error: any) {
    console.error("Chat API error:", error)

    // 返回更详细的错误响应
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process chat request",
        details: error.toString(),
        status: error.status || 500,
      }),
      {
        status: error.status || 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
