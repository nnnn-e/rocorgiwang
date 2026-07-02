// 系统提示结构化格式
// 格式：维度 - 要点 - 内容

// 核心身份维度 - 始终包含
export const CORE_IDENTITY = `
## 维度：核心身份
◆ 角色：智能系统/产品体验设计师，专注系统思维与用户体验  
◆ 价值观：基于 Alan Kay、Douglas Engelbart 理念，构建扩展人类认知的工具  
◆ 使命：通过系统化思考提供深度洞察，引导用户发现问题本质
◆ 现状：构建 LongOS (os.rocorgi.wang)，通过 Vibe coding 探索新设计范式
`

// 设计理念维度
export const DESIGN_PHILOSOPHY = `
## 维度：设计理念
◆ 极简系统观：文件即原子，统一跨角色工作流，寻找最小共识点  
◆ 概念压缩：本质洞察 → 符号提炼 → 认知校准  
◆ 卓越产品三要素：意愿度 + 品味 + 启发式沟通
◆ 系统思维：模块化抽象和一致性 > 单点优化
`

// 个人背景维度
export const PERSONAL_BACKGROUND = `
## 维度：个人背景
◆ 教育职业：2013毕业，浙大深造，上海创业，2016加入阿里，横跨App/协同/AI产品  
◆ 现状：杭州西部，已婚，养了一只中华田园犬，INFJ
◆ 爱好：户外、阅读、看展、拍照、保持无聊（接收灵感）
◆ 工具流：Paper→Figma→ChatGPT→Cursor→v0→Suno/Midjourney
`

// 思维模式维度
export const THINKING_PATTERNS = `
## 维度：思维模式
◆ 系统思考：将问题置于更大系统中分析，识别关键节点和连接关系
◆ 问题重构：不仅解决表面问题，更关注问题定义本身的准确性
◆ 结构化思维：问题分解→逻辑递进→对比分析→抽象提炼
◆ 案例映射：从具体实例提取通用原则，构建可迁移的知识框架
`

// 语言表达维度
export const LANGUAGE_EXPRESSION = `
## 维度：语言表达
◆ 客观描述：使用客观、准确的词汇，避免主观臆断和创造新词
◆ 术语规范：使用行业标准术语，保持概念表述一致性
◆ 精确简洁：选择最精确的词汇，去除冗余修饰词
◆ 中立立场：呈现多方观点时保持中立，避免偏见性语言
`

// 响应格式维度
export const RESPONSE_FORMAT = `
## 维度：响应格式
◆ 结构：清晰层级(H2→H3)，每段聚焦单一观点，保持简洁
◆ 语言：专业术语，理性客观，适度类比阐明复杂概念
◆ Emoji：适度使用，标记段落主题(🎨🧠📊)和关键点(💡📌)
◆ 关键点：每个回答提取6-8个关键要点(15-25字/点)
<key-points>
- 简短的第一个要点（15-25字）
- 简短的第二个要点（15-25字）
- 更多简短要点...
</key-points>
`

// 维度配置接口
interface DimensionConfig {
  dimension: string
  content: string
  baseScore: number
  keywords: string[]
}

// 配置各维度的基础信息
const dimensionConfigs: DimensionConfig[] = [
  {
    dimension: "CORE_IDENTITY",
    content: CORE_IDENTITY,
    baseScore: 5, // 核心身份总是包含
    keywords: [],
  },
  {
    dimension: "DESIGN_PHILOSOPHY",
    content: DESIGN_PHILOSOPHY,
    baseScore: 0,
    keywords: [
      "design",
      "设计",
      "system",
      "系统",
      "ui",
      "ux",
      "product",
      "产品",
      "workflow",
      "工作流",
      "method",
      "方法论",
      "principle",
      "原则",
    ],
  },
  {
    dimension: "PERSONAL_BACKGROUND",
    content: PERSONAL_BACKGROUND,
    baseScore: 0,
    keywords: [
      "background",
      "背景",
      "experience",
      "经验",
      "career",
      "职业",
      "life",
      "生活",
      "hobby",
      "爱好",
      "tool",
      "工具",
      "who are you",
      "你是谁",
    ],
  },
  {
    dimension: "THINKING_PATTERNS",
    content: THINKING_PATTERNS,
    baseScore: 0,
    keywords: [
      "think",
      "思考",
      "mindset",
      "思维",
      "decision",
      "决策",
      "problem",
      "问题",
      "framework",
      "框架",
      "cognitive",
      "认知",
    ],
  },
  {
    dimension: "LANGUAGE_EXPRESSION",
    content: LANGUAGE_EXPRESSION,
    baseScore: 3, // 语言表达维度有较高的基础分数
    keywords: [
      "language",
      "语言",
      "expression",
      "表达",
      "wording",
      "用词",
      "terminology",
      "术语",
      "objective",
      "客观",
      "accurate",
      "准确",
    ],
  },
  {
    dimension: "RESPONSE_FORMAT",
    content: RESPONSE_FORMAT,
    baseScore: 5, // 响应格式总是包含
    keywords: [],
  },
]

// 简化的消息分类函数
export function classifyMessage(message: string, messageHistory: { role: string; content: string }[] = []): string[] {
  const lowerMessage = message.toLowerCase()

  // 1. 计算每个维度的基础分数
  const scores: Record<string, number> = {}
  dimensionConfigs.forEach((config) => {
    scores[config.dimension] = config.baseScore
  })

  // 2. 关键词匹配加分
  dimensionConfigs.forEach((config) => {
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        scores[config.dimension] += 2
        break
      }
    }
  })

  // 3. 上下文感知 (分析最近的消息)
  if (messageHistory.length > 0) {
    const recentUserMessages = messageHistory
      .filter((msg) => msg.role === "user")
      .slice(-2)
      .map((msg) => msg.content.toLowerCase())

    if (recentUserMessages.length > 0) {
      dimensionConfigs.forEach((config) => {
        for (const keyword of config.keywords) {
          if (recentUserMessages.some((msg) => msg.includes(keyword.toLowerCase()))) {
            scores[config.dimension] += 1.5
            break
          }
        }
      })
    }
  }

  // 4. 选择维度
  const selectedDimensions: string[] = []

  // 始终包含核心维度
  selectedDimensions.push(CORE_IDENTITY)
  selectedDimensions.push(RESPONSE_FORMAT)
  selectedDimensions.push(LANGUAGE_EXPRESSION)

  // 添加得分高于阈值的其他维度
  const threshold = 0.5
  dimensionConfigs
    .filter(
      (config) =>
        !["CORE_IDENTITY", "RESPONSE_FORMAT", "LANGUAGE_EXPRESSION"].includes(config.dimension) &&
        scores[config.dimension] > threshold,
    )
    .forEach((config) => {
      selectedDimensions.push(config.content)
    })

  // 如果维度太少，添加默认维度
  if (selectedDimensions.length <= 3) {
    selectedDimensions.push(DESIGN_PHILOSOPHY)
  }

  return selectedDimensions
}

// 生成动态系统提示
export function generateDynamicSystemPrompt(
  message: string,
  messageHistory: { role: string; content: string }[] = [],
): string {
  const selectedDimensions = classifyMessage(message, messageHistory)
  return selectedDimensions.join("\n\n")
}
