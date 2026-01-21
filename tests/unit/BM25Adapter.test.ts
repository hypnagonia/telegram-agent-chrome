import { describe, it, expect, beforeEach } from 'vitest'
import { BM25Adapter } from '@infrastructure/adapters/rag/BM25Adapter'

describe('BM25Adapter', () => {
  let adapter: BM25Adapter

  beforeEach(async () => {
    adapter = new BM25Adapter()
    await adapter.init()
  })

  describe('isReady', () => {
    it('should return true', () => {
      expect(adapter.isReady()).toBe(true)
    })
  })

  describe('index', () => {
    it('should index content', async () => {
      await adapter.index('doc1', 'Hello world this is a test document')

      const stats = await adapter.getStats()
      expect(stats.documentCount).toBe(1)
      expect(stats.chunkCount).toBeGreaterThan(0)
    })

    it('should index multiple documents', async () => {
      await adapter.index('doc1', 'First document content')
      await adapter.index('doc2', 'Second document content')

      const stats = await adapter.getStats()
      expect(stats.documentCount).toBe(2)
    })

    it('should handle multiline content', async () => {
      const content = Array.from({ length: 50 }, (_, i) => `Line ${i}: Some content here`).join('\n')
      await adapter.index('doc1', content)

      const stats = await adapter.getStats()
      expect(stats.chunkCount).toBeGreaterThan(1)
    })
  })

  describe('query', () => {
    it('should return empty array when no documents indexed', async () => {
      const results = await adapter.query('test', 5)
      expect(results).toEqual([])
    })

    it('should return empty array for empty query', async () => {
      await adapter.index('doc1', 'Hello world')
      const results = await adapter.query('', 5)
      expect(results).toEqual([])
    })

    it('should find matching documents', async () => {
      await adapter.index('doc1', 'The quick brown fox jumps over the lazy dog')

      const results = await adapter.query('brown fox', 5)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].content).toContain('brown')
    })

    it('should rank more relevant documents higher', async () => {
      const content = [
        '[Alice]: I love pizza',
        '[Bob]: Pizza is great',
        '[Alice]: Let me order some pizza for dinner',
        '[Bob]: I prefer pasta actually',
        '[Alice]: Ok we can also get pasta',
      ].join('\n')
      await adapter.index('chat1', content)

      const results = await adapter.query('pizza', 5)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].content.toLowerCase()).toContain('pizza')
    })

    it('should respect topK limit', async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i}: keyword here`).join('\n')
      await adapter.index('doc1', lines)

      const results = await adapter.query('keyword', 3)
      expect(results.length).toBeLessThanOrEqual(3)
    })

    it('should handle stemming', async () => {
      await adapter.index('doc1', 'testing tested tester')

      const results = await adapter.query('test', 5)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should handle cyrillic text', async () => {
      await adapter.index('doc1', 'Привет мир это тестовый документ на русском языке')

      const results = await adapter.query('привет', 5)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('clear', () => {
    it('should clear all documents', async () => {
      await adapter.index('doc1', 'First document')
      await adapter.index('doc2', 'Second document')

      await adapter.clear()

      const stats = await adapter.getStats()
      expect(stats.documentCount).toBe(0)
      expect(stats.chunkCount).toBe(0)
    })
  })

  describe('clearByPeerId', () => {
    it('should clear only specified peer documents', async () => {
      await adapter.index('peer1', 'First peer content')
      await adapter.index('peer2', 'Second peer content')
      await adapter.index('peer1', 'More first peer content')

      await adapter.clearByPeerId('peer1')

      const stats = await adapter.getStats()
      expect(stats.documentCount).toBe(1)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const content = Array.from({ length: 30 }, (_, i) => `Line ${i}: test content`).join('\n')
      await adapter.index('doc1', content)

      const stats = await adapter.getStats()
      expect(stats.documentCount).toBe(1)
      expect(stats.chunkCount).toBeGreaterThan(0)
      expect(stats.totalTokens).toBeGreaterThan(0)
    })
  })
})
