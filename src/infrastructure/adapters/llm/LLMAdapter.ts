import type { Hint, HintRequest } from '@domain/entities/Hint'
import { HintBuilder } from '@domain/entities/Hint'
import type { HintGenerator, HintGeneratorResult } from '@domain/ports/HintGenerator'
import { OpenAIProvider, type LLMUsage } from './OpenAIProvider'
import { ClaudeProvider } from './ClaudeProvider'
import { DeepSeekProvider } from './DeepSeekProvider'
import { PromptBuilder } from './PromptBuilder'
import { createLogger } from '@infrastructure/logging/remoteLog'

const log = createLogger('LLMAdapter')

export type LLMProviderType = 'openai' | 'claude' | 'deepseek'

export interface LLMAdapterConfig {
  provider: LLMProviderType
  apiKey: string
  model?: string
  baseUrl?: string
}

export interface LLMDebugInfo {
  prompt: string
  provider: string
  model: string
  usage?: LLMUsage
}

export class LLMAdapter implements HintGenerator {
  private openaiProvider: OpenAIProvider | null = null
  private claudeProvider: ClaudeProvider | null = null
  private deepseekProvider: DeepSeekProvider | null = null
  private promptBuilder: PromptBuilder
  private currentProvider: LLMProviderType
  private currentModel: string
  public lastDebugInfo: LLMDebugInfo | null = null

  constructor(config: LLMAdapterConfig) {
    console.log('[LLMAdapter] Constructor with config:', JSON.stringify(config))
    this.promptBuilder = new PromptBuilder()
    this.currentProvider = config.provider

    if (config.provider === 'openai') {
      this.currentModel = config.model || 'gpt-4o-mini'
      this.openaiProvider = new OpenAIProvider({
        apiKey: config.apiKey,
        model: config.model,
      })
    } else if (config.provider === 'deepseek') {
      this.currentModel = config.model || 'deepseek-chat'
      this.deepseekProvider = new DeepSeekProvider({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
      })
    } else {
      this.currentModel = config.model || 'claude-3-haiku-20240307'
      this.claudeProvider = new ClaudeProvider({
        apiKey: config.apiKey,
        model: config.model,
      })
    }
  }

  async generate(request: HintRequest): Promise<HintGeneratorResult> {
    console.log('[LLMAdapter] Generating hints with provider:', this.currentProvider)
    console.log('[LLMAdapter] Context messages count:', request.contextMessages.length)
    console.log('[LLMAdapter] Recent messages count:', request.recentMessages.length)

    const prompt = this.promptBuilder.buildHintPrompt(
      request,
      request.promptTemplate,
      request.contextMessages,
      request.recentMessages
    )

    this.lastDebugInfo = {
      prompt,
      provider: this.currentProvider,
      model: this.currentModel,
    }

    console.log('[LLMAdapter] Built prompt, length:', prompt.length)
    console.log('[LLMAdapter] Prompt preview:', prompt.slice(0, 200))

    let content: string
    let usage: LLMUsage | undefined

    try {
      if (this.currentProvider === 'openai' && this.openaiProvider) {
        console.log('[LLMAdapter] Calling OpenAI...')
        const result = await this.openaiProvider.chat([
          { role: 'user', content: prompt },
        ])
        content = result.content
        usage = result.usage
      } else if (this.currentProvider === 'deepseek' && this.deepseekProvider) {
        console.log('[LLMAdapter] Calling DeepSeek...')
        const result = await this.deepseekProvider.chat([
          { role: 'user', content: prompt },
        ])
        content = result.content
        usage = result.usage
      } else if (this.claudeProvider) {
        console.log('[LLMAdapter] Calling Claude...')
        const result = await this.claudeProvider.chat(
          'You are a helpful assistant.',
          [{ role: 'user', content: prompt }]
        )
        content = result.content
        usage = result.usage
      } else {
        throw new Error('No LLM provider configured')
      }

      this.lastDebugInfo.usage = usage
      log.log('LLM Response:', content)
      log.log('Tokens:', { input: usage?.inputTokens, output: usage?.outputTokens, total: usage?.totalTokens })
    } catch (err) {
      console.error('[LLMAdapter] LLM call failed:', err)
      throw err
    }

    const hints = this.parseResponse(content)
    return { hints, usage }
  }

  private cleanSuggestion(text: string): string {
    return text
      .replace(/\d{1,2}:\d{2}\d{1,2}:\d{2}$/g, '')
      .replace(/\d{1,2}:\d{2}$/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]+$/u, '')
      .replace(/[✨🎉🎊💫⭐️🌟]+$/g, '')
      .trim()
  }

  private parseResponse(response: string): Hint[] {
    try {
      const trimmed = response.trim()
      const jsonMatch = trimmed.match(/\[[\s\S]*\]/)

      if (!jsonMatch) {
        return this.createFallbackHints(response)
      }

      const suggestions: string[] = JSON.parse(jsonMatch[0])

      if (!Array.isArray(suggestions)) {
        return this.createFallbackHints(response)
      }

      return suggestions.slice(0, 3).map((text, index) =>
        new HintBuilder()
          .withId(`hint-${Date.now()}-${index}`)
          .withText(this.cleanSuggestion(text))
          .withConfidence(0.8 - index * 0.1)
          .withGeneratedAt(Date.now())
          .build()
      )
    } catch {
      return this.createFallbackHints(response)
    }
  }

  private createFallbackHints(response: string): Hint[] {
    const lines = response
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)

    if (lines.length === 0) {
      return []
    }

    return lines.map((text, index) =>
      new HintBuilder()
        .withId(`hint-${Date.now()}-${index}`)
        .withText(text.replace(/^[\d\-\.\)]+\s*/, '').trim())
        .withConfidence(0.5)
        .withGeneratedAt(Date.now())
        .build()
    )
  }
}
