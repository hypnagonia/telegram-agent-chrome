import type { Hint, HintRequest } from '@domain/entities/Hint'
import type { HintGenerator } from '@domain/ports/HintGenerator'
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
}

export interface GenerateHintOutput {
  hints: Hint[]
  contextUsed: number
  debugInfo?: GenerateHintDebugInfo
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

    const contextMessages = ragContext.length > 0
      ? ragContext
      : recentFormatted.length > 0 ? [recentFormatted.join('\n')] : []

    console.log('[GenerateHintUseCase] Using context chunks:', contextMessages.length,
      ragContext.length > 0 ? '(from RAG)' : '(from recent messages)')

    const request: HintRequest = {
      peerId: input.peerId,
      currentMessage: input.currentMessage,
      contextMessages,
      recentMessages: recentFormatted,
      promptTemplate: input.promptTemplate,
    }

    console.log('[GenerateHintUseCase] Calling LLM generator...')
    const hints = await this.hintGenerator.generate(request)
    console.log('[GenerateHintUseCase] LLM returned', hints.length, 'hints')

    const adapter = this.hintGenerator as unknown as { lastDebugInfo?: { prompt: string; provider: string; model: string } }
    const debugInfo: GenerateHintDebugInfo | undefined = adapter.lastDebugInfo
      ? {
          prompt: adapter.lastDebugInfo.prompt,
          contextChunks: contextMessages,
          provider: adapter.lastDebugInfo.provider,
          model: adapter.lastDebugInfo.model,
        }
      : undefined

    return {
      hints,
      contextUsed: contextMessages.length,
      debugInfo,
    }
  }
}
