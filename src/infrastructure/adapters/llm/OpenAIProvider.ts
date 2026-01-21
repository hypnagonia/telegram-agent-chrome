export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export class OpenAIProvider {
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'gpt-4o-mini'
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    console.log('[OpenAI] chat called, apiKey set:', !!this.apiKey, 'model:', this.model)

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Go to Settings to add your key.')
    }

    const url = `${this.baseUrl}/chat/completions`
    console.log('[OpenAI] Fetching:', url)

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
      console.log('[OpenAI] Response status:', response.status)
    } catch (err) {
      console.error('[OpenAI] Network error:', err)
      throw new Error(`Network error connecting to OpenAI: ${err instanceof Error ? err.message : 'Unknown error'}. Check your internet connection.`)
    }

    if (!response.ok) {
      let errorMessage = `OpenAI API error (${response.status})`
      try {
        const error = await response.json()
        console.error('[OpenAI] API error response:', error)
        errorMessage = error.error?.message || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('[OpenAI] Success, response length:', data.choices[0]?.message?.content?.length || 0)
    return data.choices[0]?.message?.content || ''
  }
}
