import type { RagRetriever, ScoredChunk } from '@domain/ports/RagRetriever'

export interface QueryContextInput {
  query: string
  topK?: number
}

export interface QueryContextOutput {
  chunks: ScoredChunk[]
  contextText: string[]
}

export class QueryContextUseCase {
  constructor(private ragRetriever: RagRetriever) {}

  async execute(input: QueryContextInput): Promise<QueryContextOutput> {
    const topK = input.topK ?? 5
    const chunks = await this.ragRetriever.query(input.query, topK)

    const contextText = chunks.map((chunk) => chunk.content)

    return {
      chunks,
      contextText,
    }
  }
}
