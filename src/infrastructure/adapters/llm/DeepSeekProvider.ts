import type { ChatMessage, LLMResponse, LLMUsage } from './OpenAIProvider'

export interface DeepSeekConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com'

export class DeepSeekProvider {
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'deepseek-chat'
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')
    console.log('[DeepSeek] Constructor called with config.baseUrl:', config.baseUrl, '-> this.baseUrl:', this.baseUrl)
  }

  private sanitizeContent(content: string): string {
    return content.replace(/[\x00-\x1F\x7F]/g, ' ')
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    console.log('[DeepSeek] chat called, apiKey set:', !!this.apiKey, 'model:', this.model, 'baseUrl:', this.baseUrl)

    if (!this.apiKey && this.baseUrl === DEFAULT_BASE_URL) {
      throw new Error('DeepSeek API key not configured. Go to Settings to add your key.')
    }

    const sanitizedMessages = messages.map(m => ({
      ...m,
      content: this.sanitizeContent(m.content)
    }))

    const url = `${this.baseUrl}/chat/completions`
    console.log('[DeepSeek] Fetching URL:', url, 'baseUrl was:', this.baseUrl, 'model:', this.model)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey && this.apiKey !== 'local') {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: sanitizedMessages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      })
      console.log('[DeepSeek] Response status:', response.status)
    } catch (err) {
      console.error('[DeepSeek] Network error:', err)
      throw new Error(`Network error connecting to DeepSeek: ${err instanceof Error ? err.message : 'Unknown error'}. Check your internet connection.`)
    }

    if (!response.ok) {
      let errorMessage = `DeepSeek API error (${response.status})`
      try {
        const error = await response.json()
        console.error('[DeepSeek] API error response:', error)
        errorMessage = error.error?.message || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    const usage: LLMUsage = {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    }
    console.log('[DeepSeek] Success, tokens:', usage.totalTokens)
    return { content, usage }
  }
}
