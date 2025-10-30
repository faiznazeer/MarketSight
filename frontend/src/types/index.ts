export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Source[]
  isStreaming?: boolean
}

export interface Source {
  id: string
  title: string
  snippet: string
  page?: number
  documentType?: string
}

export interface ResearchSession {
  id: string
  title: string
  ticker: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

