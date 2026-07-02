/**
 * 在中文与英文、数字之间添加半角空格
 * 规则：
 * 1. 在中文字符后面紧跟英文/数字时，添加空格
 * 2. 在英文/数字后面紧跟中文字符时，添加空格
 * 3. 保留已有的空格，不重复添加
 * 4. 不处理标点符号
 * 5. 不处理Markdown语法和特殊标记
 */
export function addSpaceBetweenChineseAndOthers(text: string): string {
  if (!text) return text

  // 将Markdown代码块和内联代码标记为不处理
  const codeBlockRegex = /```[\s\S]*?```/g
  const inlineCodeRegex = /`[^`]*`/g

  // 收集所有需要保护的部分
  const protectedParts: string[] = []

  // 替换代码块为占位符
  let processedText = text.replace(codeBlockRegex, (match) => {
    protectedParts.push(match)
    return `__PROTECTED_${protectedParts.length - 1}__`
  })

  // 替换内联代码为占位符
  processedText = processedText.replace(inlineCodeRegex, (match) => {
    protectedParts.push(match)
    return `__PROTECTED_${protectedParts.length - 1}__`
  })

  // 在中文和英文/数字之间添加空格
  processedText = processedText
    // 在中文后面加空格，如果后面是英文/数字
    .replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, "$1 $2")
    // 在英文/数字后面加空格，如果后面是中文
    .replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, "$1 $2")

  // 恢复被保护的部分
  for (let i = 0; i < protectedParts.length; i++) {
    processedText = processedText.replace(`__PROTECTED_${i}__`, protectedParts[i])
  }

  return processedText
}

// 在文件末尾添加一个新函数，用于在渲染前清理消息内容中的key-points标签

/**
 * 在渲染前清理消息内容中的key-points标签
 * 这确保在UI中不会显示key-points标签及其内容
 */
export function cleanMessageContent(content: string): string {
  // 移除所有key-points标签及其内容
  return content.replace(/<key-points>[\s\S]*?<\/key-points>/g, "")
}

/**
 * 在emoji和文字之间添加空格
 * 规则：
 * 1. 在emoji后面紧跟文字时，添加空格
 * 2. 在文字后面紧跟emoji时，添加空格
 * 3. 保留已有的空格，不重复添加
 */
export function addSpaceBetweenEmojiAndText(text: string): string {
  if (!text) return text

  // 将Markdown代码块和内联代码标记为不处理
  const codeBlockRegex = /```[\s\S]*?```/g
  const inlineCodeRegex = /`[^`]*`/g

  // 收集所有需要保护的部分
  const protectedParts: string[] = []

  // 替换代码块为占位符
  let processedText = text.replace(codeBlockRegex, (match) => {
    protectedParts.push(match)
    return `__PROTECTED_${protectedParts.length - 1}__`
  })

  // 替换内联代码为占位符
  processedText = processedText.replace(inlineCodeRegex, (match) => {
    protectedParts.push(match)
    return `__PROTECTED_${protectedParts.length - 1}__`
  })

  // Emoji正则表达式 - 匹配Unicode emoji
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu

  // 在emoji和文字之间添加空格
  processedText = processedText
    // 在emoji后面加空格，如果后面是文字
    .replace(new RegExp(`(${emojiRegex.source})([^\\s${emojiRegex.source}])`, "gu"), "$1 $2")
    // 在文字后面加空格，如果后面是emoji
    .replace(new RegExp(`([^\\s${emojiRegex.source}])(${emojiRegex.source})`, "gu"), "$1 $2")

  // 恢复被保护的部分
  for (let i = 0; i < protectedParts.length; i++) {
    processedText = processedText.replace(`__PROTECTED_${i}__`, protectedParts[i])
  }

  return processedText
}
