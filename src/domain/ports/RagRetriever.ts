export interface ScoredChunk {
  content: string
  filename: string
  score: number
  startLine: number
  endLine: number
}

export interface RagRetriever {
  query(query: string, topK: number): Promise<ScoredChunk[]>
}
