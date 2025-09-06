export interface OpenRouterModelPricing {
  prompt?: string
  completion?: string
  request?: string
  image?: string
  web_search?: string
  internal_reasoning?: string
  input_cache_read?: string
  input_cache_write?: string
}

export interface OpenRouterModel {
  id: string
  name?: string
  description?: string
  context_length?: number
  pricing?: OpenRouterModelPricing
  capabilities?: {
    chat?: boolean
    completion?: boolean
    [key: string]: boolean | undefined
  }
  [key: string]: unknown
}

export interface OpenRouterCredits {
  balanceUsd?: number
  [key: string]: unknown
}

export type OpenRouterChatRole = 'system' | 'user' | 'assistant' | 'tool'

export interface OpenRouterChatMessage {
  role: OpenRouterChatRole
  content: string
}

export interface OpenRouterChatRequest {
  model: string
  messages: OpenRouterChatMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stop?: string[]
}

export interface OpenRouterChatResponseChoice {
  index: number
  message: OpenRouterChatMessage
  finish_reason?: string
}

export interface OpenRouterChatResponse {
  id: string
  choices: OpenRouterChatResponseChoice[]
  created: number
  model: string
}

export interface OpenRouterErrorResponse {
  error: {
    message: string
    code?: number
    metadata?: any
  }
  user_id?: string
}

export type OpenRouterResponse = OpenRouterChatResponse | OpenRouterErrorResponse

export interface OpenRouterSettings {
  selectedModelId?: string
  lastConnectedAt?: string
  analysisEnabled?: boolean
}
