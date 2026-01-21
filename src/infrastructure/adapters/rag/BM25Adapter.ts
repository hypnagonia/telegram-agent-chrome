import type { RagIndexer, IndexStats } from '@domain/ports/RagIndexer'
import type { RagRetriever, ScoredChunk } from '@domain/ports/RagRetriever'

interface Document {
  filename: string
  chunks: Chunk[]
}

interface Chunk {
  content: string
  tokens: string[]
  startLine: number
  endLine: number
}

interface TokenStats {
  tf: Map<string, number>
  length: number
}

export class BM25Adapter implements RagIndexer, RagRetriever {
  private documents: Document[] = []
  private chunkStats: Map<number, TokenStats> = new Map()
  private df: Map<string, number> = new Map()
  private avgDl = 0
  private totalChunks = 0
  private k1 = 1.2
  private b = 0.75

  isReady(): boolean {
    return true
  }

  async init(): Promise<void> {}

  async index(filename: string, content: string): Promise<void> {
    console.log('[BM25] Indexing document:', filename, 'content length:', content.length)
    const lines = content.split('\n')
    const chunks = this.chunkContent(lines, filename)

    const doc: Document = { filename, chunks }
    this.documents.push(doc)

    this.rebuildIndex()
    console.log('[BM25] Index rebuilt. Total docs:', this.documents.length, 'Total chunks:', this.totalChunks)
  }

  private chunkContent(lines: string[], _filename: string): Chunk[] {
    const chunks: Chunk[] = []
    const chunkSize = 20

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, i + chunkSize)
      const content = chunkLines.join('\n')
      const tokens = this.tokenize(content)

      if (tokens.length > 0) {
        chunks.push({
          content,
          tokens,
          startLine: i + 1,
          endLine: Math.min(i + chunkSize, lines.length),
        })
      }
    }

    return chunks
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1)
      .map(t => this.stem(t))
  }

  private stem(word: string): string {
    if (word.length < 4) return word

    const suffixes = ['ing', 'ed', 'es', 's', 'ly', 'ment', 'ness', 'tion', 'able', 'ible']
    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
        return word.slice(0, -suffix.length)
      }
    }
    return word
  }

  private rebuildIndex(): void {
    this.chunkStats.clear()
    this.df.clear()
    this.totalChunks = 0
    let totalLength = 0

    let chunkIndex = 0
    for (const doc of this.documents) {
      for (const chunk of doc.chunks) {
        const tf = new Map<string, number>()
        for (const token of chunk.tokens) {
          tf.set(token, (tf.get(token) || 0) + 1)
        }

        this.chunkStats.set(chunkIndex, {
          tf,
          length: chunk.tokens.length,
        })

        for (const token of new Set(chunk.tokens)) {
          this.df.set(token, (this.df.get(token) || 0) + 1)
        }

        totalLength += chunk.tokens.length
        this.totalChunks++
        chunkIndex++
      }
    }

    this.avgDl = this.totalChunks > 0 ? totalLength / this.totalChunks : 0
  }

  async query(queryText: string, topK: number): Promise<ScoredChunk[]> {
    console.log('[BM25] Query:', queryText.slice(0, 50), '| topK:', topK)
    console.log('[BM25] Index state: docs=', this.documents.length, 'chunks=', this.totalChunks)

    const queryTokens = this.tokenize(queryText)
    console.log('[BM25] Query tokens:', queryTokens.slice(0, 10).join(', '))

    if (queryTokens.length === 0) {
      console.log('[BM25] No query tokens, returning empty')
      return []
    }

    if (this.documents.length === 0) {
      console.log('[BM25] WARNING: No documents indexed! Cannot search.')
      return []
    }

    const scores: Array<{ score: number; chunkIndex: number; docIndex: number; chunk: Chunk; filename: string }> = []

    let chunkIndex = 0
    for (let docIndex = 0; docIndex < this.documents.length; docIndex++) {
      const doc = this.documents[docIndex]
      for (const chunk of doc.chunks) {
        const score = this.computeBM25(queryTokens, chunkIndex)
        if (score > 0) {
          scores.push({ score, chunkIndex, docIndex, chunk, filename: doc.filename })
        }
        chunkIndex++
      }
    }

    scores.sort((a, b) => b.score - a.score)
    console.log('[BM25] Found', scores.length, 'matching chunks')

    const results = scores.slice(0, topK).map(s => ({
      content: s.chunk.content,
      filename: s.filename,
      score: s.score,
      startLine: s.chunk.startLine,
      endLine: s.chunk.endLine,
    }))

    if (results.length > 0) {
      console.log('[BM25] Top result score:', results[0].score, 'content:', results[0].content.slice(0, 50))
    }

    return results
  }

  private computeBM25(queryTokens: string[], chunkIndex: number): number {
    const stats = this.chunkStats.get(chunkIndex)
    if (!stats) return 0

    let score = 0
    const N = this.totalChunks

    for (const token of queryTokens) {
      const tf = stats.tf.get(token) || 0
      if (tf === 0) continue

      const docFreq = this.df.get(token) || 0
      const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1)

      const numerator = tf * (this.k1 + 1)
      const denominator = tf + this.k1 * (1 - this.b + this.b * (stats.length / this.avgDl))

      score += idf * (numerator / denominator)
    }

    return score
  }

  async clear(): Promise<void> {
    this.documents = []
    this.chunkStats.clear()
    this.df.clear()
    this.avgDl = 0
    this.totalChunks = 0
    console.log('[BM25] Index cleared completely')
  }

  async clearByPeerId(peerId: string): Promise<void> {
    const before = this.documents.length
    this.documents = this.documents.filter(doc => doc.filename !== peerId)
    this.rebuildIndex()
    console.log('[BM25] Cleared index for peer:', peerId, 'docs before:', before, 'after:', this.documents.length)
  }

  async getStats(): Promise<IndexStats> {
    return {
      documentCount: this.documents.length,
      chunkCount: this.totalChunks,
      totalTokens: Array.from(this.chunkStats.values()).reduce((sum, s) => sum + s.length, 0),
    }
  }
}
