import type { RagIndexer, IndexStats } from '@domain/ports/RagIndexer'
import type { RagRetriever, ScoredChunk } from '@domain/ports/RagRetriever'

declare function importScripts(...urls: string[]): void

declare const Go: new () => {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void>
}

declare const ragIndex: ((filename: string, content: string) => string) | undefined
declare const ragQuery: ((query: string, topK: number) => string) | undefined
declare const ragClear: (() => string) | undefined
declare const ragStats: (() => string) | undefined

interface RagQueryResult {
  chunks: Array<{
    content: string
    filename: string
    score: number
    start_line: number
    end_line: number
  }>
}

interface RagStatsResult {
  document_count: number
  chunk_count: number
  total_tokens: number
}

export class WASMRagAdapter implements RagIndexer, RagRetriever {
  private ready = false
  private initPromise: Promise<void> | null = null

  async init(wasmPath: string, execPath: string): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.doInit(wasmPath, execPath)
    return this.initPromise
  }

  private async doInit(wasmPath: string, execPath: string): Promise<void> {
    console.log('[WASMRagAdapter] Loading Go runtime from:', execPath)
    importScripts(execPath)

    console.log('[WASMRagAdapter] Go runtime loaded, instantiating WASM from:', wasmPath)
    const go = new Go()
    const result = await WebAssembly.instantiateStreaming(fetch(wasmPath), go.importObject)
    go.run(result.instance)

    console.log('[WASMRagAdapter] WASM instantiated, waiting for functions...')
    await this.waitForReady()
    this.ready = true
    console.log('[WASMRagAdapter] Ready!')
  }

  private async waitForReady(maxAttempts = 50): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (typeof ragIndex !== 'undefined' && typeof ragQuery !== 'undefined' &&
          typeof ragClear !== 'undefined' && typeof ragStats !== 'undefined') {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error('WASM functions not available after timeout')
  }

  isReady(): boolean {
    return this.ready
  }

  async index(filename: string, content: string): Promise<void> {
    if (!this.ready || typeof ragIndex === 'undefined') {
      throw new Error('WASM not initialized')
    }

    const result = ragIndex(filename, content)
    const parsed = JSON.parse(result)

    if (parsed.error) {
      throw new Error(parsed.error)
    }
  }

  async query(queryText: string, topK: number): Promise<ScoredChunk[]> {
    if (!this.ready || typeof ragQuery === 'undefined') {
      throw new Error('WASM not initialized')
    }

    const result = ragQuery(queryText, topK)
    const parsed: RagQueryResult = JSON.parse(result)

    if (!parsed.chunks) {
      return []
    }

    return parsed.chunks.map((chunk) => ({
      content: chunk.content,
      filename: chunk.filename,
      score: chunk.score,
      startLine: chunk.start_line,
      endLine: chunk.end_line,
    }))
  }

  async clear(): Promise<void> {
    if (!this.ready || typeof ragClear === 'undefined') {
      throw new Error('WASM not initialized')
    }

    const result = ragClear()
    const parsed = JSON.parse(result)

    if (parsed.error) {
      throw new Error(parsed.error)
    }
  }

  async getStats(): Promise<IndexStats> {
    if (!this.ready || typeof ragStats === 'undefined') {
      throw new Error('WASM not initialized')
    }

    const result = ragStats()
    const parsed: RagStatsResult = JSON.parse(result)

    return {
      documentCount: parsed.document_count || 0,
      chunkCount: parsed.chunk_count || 0,
      totalTokens: parsed.total_tokens || 0,
    }
  }
}
