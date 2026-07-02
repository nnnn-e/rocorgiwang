export interface MentionItem {
  id: number
  text: string
  type: "meeting" | "document" | "email" | "chat"
  time?: string
  participants?: number
  author?: string
  subject?: string
  topic?: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  attachments?: { url: string; type: string }[]
}

export interface Attachment {
  url: string
  type: string
}
