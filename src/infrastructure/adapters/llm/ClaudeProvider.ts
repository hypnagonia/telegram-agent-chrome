import type { LLMResponse, LLMUsage } from './OpenAIProvider'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeConfig {
  apiKey: string
  model?: string
}

export class ClaudeProvider {
  private apiKey: string
  private model: string

  constructor(config: ClaudeConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-3-haiku-20240307'
  }

  async chat(systemPrompt: string, messages: ClaudeMessage[]): Promise<LLMResponse> {
    console.log('[Claude] chat called, apiKey set:', !!this.apiKey, 'model:', this.model)

    if (!this.apiKey) {
      throw new Error('Claude API key not configured. Go to Settings to add your key.')
    }

    const url = 'https://api.anthropic.com/v1/messages'
    console.log('[Claude] Fetching:', url)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 500,
          system: systemPrompt,
          messages,
        }),
      })
      console.log('[Claude] Response status:', response.status)
    } catch (err) {
      console.error('[Claude] Network error:', err)
      throw new Error(`Network error connecting to Claude: ${err instanceof Error ? err.message : 'Unknown error'}. Check your internet connection.`)
    }

    if (!response.ok) {
      let errorMessage = `Claude API error (${response.status})`
      try {
        const error = await response.json()
        console.error('[Claude] API error response:', error)
        errorMessage = error.error?.message || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.content[0]?.text || ''
    const usage: LLMUsage = {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    }
    console.log('[Claude] Success, tokens:', usage.totalTokens)
    return { content, usage }
  }
}
