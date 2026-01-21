export interface IndexStats {
  documentCount: number
  chunkCount: number
  totalTokens: number
}

export interface RagIndexer {
  index(filename: string, content: string): Promise<void>
  clear(): Promise<void>
  getStats(): Promise<IndexStats>
  isReady(): boolean
}
