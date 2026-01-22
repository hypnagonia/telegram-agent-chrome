import type { Hint, HintRequest } from '@domain/entities/Hint'
import type { HintGenerator, LLMUsageInfo } from '@domain/ports/HintGenerator'
import type { MessageRepository } from '@domain/ports/MessageRepository'
import type { RagRetriever } from '@domain/ports/RagRetriever'

export interface GenerateHintInput {
  peerId: string
  currentMessage: string
  promptTemplate: string
  topK?: number
}

export interface GenerateHintDebugInfo {
  prompt: string
  contextChunks: string[]
  provider: string
  model: string
  usage?: LLMUsageInfo
}

export interface GenerateHintOutput {
  hints: Hint[]
  contextUsed: number
  debugInfo?: GenerateHintDebugInfo
}

function anonymizeMessages(messages: string[]): { anonymized: string[]; nameMap: Map<string, string> } {
  const nameMap = new Map<string, string>()
  let counter = 0
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

  const anonymized = messages.map(msg => {
    return msg.replace(/\[([^\]]+)\]:/g, (match, name) => {
      if (name === 'You') return match
      if (!nameMap.has(name)) {
        const label = labels[counter % labels.length]
        nameMap.set(name, `@person${label}`)
        counter++
      }
      return `[${nameMap.get(name)}]:`
    })
  })

  return { anonymized, nameMap }
}

export class GenerateHintUseCase {
  constructor(
    private hintGenerator: HintGenerator,
    private ragRetriever: RagRetriever,
    private messageRepository: MessageRepository
  ) {}

  async execute(input: GenerateHintInput): Promise<GenerateHintOutput> {
    console.log('[GenerateHintUseCase] Starting with input:', {
      peerId: input.peerId,
      currentMessage: input.currentMessage?.slice(0, 50),
    })

    const recentMessages = await this.messageRepository.findByPeerId(input.peerId)
    const recentFormatted = recentMessages
      .slice(-20)
      .map(m => `[${m.isOutgoing ? 'You' : m.senderName}]: ${m.text}`)

    console.log('[GenerateHintUseCase] Recent messages count:', recentMessages.length)

    const baseQuery = input.currentMessage || 'recent conversation'
    const query = `${input.peerId} ${baseQuery}`
    const topK = input.topK ?? 5

    console.log('[GenerateHintUseCase] Querying RAG with:', { query: query.slice(0, 50), topK })
    const chunks = await this.ragRetriever.query(query, topK)
    console.log('[GenerateHintUseCase] RAG returned', chunks.length, 'chunks')

    const ragContext = chunks.map((chunk) => chunk.content)

    const recentSet = new Set(recentFormatted)
    const deduplicatedContext = ragContext
      .map(chunk => {
        const lines = chunk.split('\n')
        const filteredLines = lines.filter(line => !recentSet.has(line.trim()))
        return filteredLines.join('\n').trim()
      })
      .filter(chunk => chunk.length > 0)

    console.log('[GenerateHintUseCase] After deduplication:', deduplicatedContext.length, 'context chunks (was', ragContext.length, ')')

    const contextMessages = deduplicatedContext.length > 0
      ? deduplicatedContext
      : recentFormatted.length > 0 ? [recentFormatted.join('\n')] : []

    console.log('[GenerateHintUseCase] Using context chunks:', contextMessages.length,
      deduplicatedContext.length > 0 ? '(from RAG, deduplicated)' : '(from recent messages)')

    const allMessages = [...contextMessages, ...recentFormatted]
    const { anonymized, nameMap } = anonymizeMessages(allMessages)
    const anonymizedContext = anonymized.slice(0, contextMessages.length)
    const anonymizedRecent = anonymized.slice(contextMessages.length)

    console.log('[GenerateHintUseCase] Anonymized', nameMap.size, 'names:', Array.from(nameMap.entries()))

    const request: HintRequest = {
      peerId: input.peerId,
      currentMessage: input.currentMessage,
      contextMessages: anonymizedContext,
      recentMessages: anonymizedRecent,
      promptTemplate: input.promptTemplate,
    }

    console.log('[GenerateHintUseCase] Calling LLM generator...')
    const result = await this.hintGenerator.generate(request)
    console.log('[GenerateHintUseCase] LLM returned', result.hints.length, 'hints, tokens:', result.usage?.totalTokens)

    const adapter = this.hintGenerator as unknown as { lastDebugInfo?: { prompt: string; provider: string; model: string; usage?: LLMUsageInfo } }
    const debugInfo: GenerateHintDebugInfo | undefined = adapter.lastDebugInfo
      ? {
          prompt: adapter.lastDebugInfo.prompt,
          contextChunks: contextMessages,
          provider: adapter.lastDebugInfo.provider,
          model: adapter.lastDebugInfo.model,
          usage: result.usage,
        }
      : undefined

    return {
      hints: result.hints,
      contextUsed: contextMessages.length,
      debugInfo,
    }
  }
}
