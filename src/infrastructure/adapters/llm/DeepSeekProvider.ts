import type { ChatMessage } from './OpenAIProvider'

export interface DeepSeekConfig {
  apiKey: string
  model?: string
}

export class DeepSeekProvider {
  private apiKey: string
  private model: string

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'deepseek-chat'
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    console.log('[DeepSeek] chat called, apiKey set:', !!this.apiKey, 'model:', this.model)

    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured. Go to Settings to add your key.')
    }

    const url = 'https://api.deepseek.com/chat/completions'
    console.log('[DeepSeek] Fetching:', url)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
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
    console.log('[DeepSeek] Success, response length:', data.choices[0]?.message?.content?.length || 0)
    return data.choices[0]?.message?.content || ''
  }
}
