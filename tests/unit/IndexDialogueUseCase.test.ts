import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IndexDialogueUseCase } from '@application/use-cases/IndexDialogueUseCase'
import { MessageBuilder } from '@domain/entities/Message'
import type { MessageRepository } from '@domain/ports/MessageRepository'
import type { DialogueRepository } from '@domain/ports/DialogueRepository'
import type { RagIndexer, IndexStats } from '@domain/ports/RagIndexer'

describe('IndexDialogueUseCase', () => {
  let useCase: IndexDialogueUseCase
  let mockMessageRepo: MessageRepository
  let mockDialogueRepo: DialogueRepository
  let mockRagIndexer: RagIndexer

  beforeEach(() => {
    mockMessageRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      saveBatch: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(undefined),
      findByPeerId: vi.fn().mockResolvedValue([]),
      findByPeerIdPaginated: vi.fn().mockResolvedValue([]),
      countByPeerId: vi.fn().mockResolvedValue(0),
      deleteByPeerId: vi.fn().mockResolvedValue(undefined),
    }

    mockDialogueRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findByPeerId: vi.fn().mockResolvedValue(undefined),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    }

    mockRagIndexer = {
      init: vi.fn().mockResolvedValue(undefined),
      isReady: vi.fn().mockReturnValue(true),
      index: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      clearByPeerId: vi.fn().mockResolvedValue(undefined),
      getStats: vi.fn().mockResolvedValue({ documentCount: 1, chunkCount: 5, totalTokens: 100 } as IndexStats),
    }

    useCase = new IndexDialogueUseCase(mockMessageRepo, mockDialogueRepo, mockRagIndexer)
  })

  const createMessages = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      new MessageBuilder()
        .withId(`msg-${i}`)
        .withPeerId('peer-123')
        .withText(`Message ${i}`)
        .withTimestamp(i * 1000)
        .withIsOutgoing(i % 2 === 0)
        .withSenderName(i % 2 === 0 ? 'You' : 'John')
        .build()
    )

  it('should save messages to repository', async () => {
    const messages = createMessages(5)

    await useCase.execute({
      peerId: 'peer-123',
      peerName: 'John',
      messages,
    })

    expect(mockMessageRepo.saveBatch).toHaveBeenCalledWith(messages)
  })

  it('should clear existing index before indexing', async () => {
    const messages = createMessages(3)

    await useCase.execute({
      peerId: 'peer-123',
      peerName: 'John',
      messages,
    })

    expect(mockRagIndexer.clear).toHaveBeenCalled()
    expect(mockRagIndexer.index).toHaveBeenCalled()
  })

  it('should format messages for indexing', async () => {
    const messages = createMessages(2)

    await useCase.execute({
      peerId: 'peer-123',
      peerName: 'John',
      messages,
    })

    const indexCall = vi.mocked(mockRagIndexer.index).mock.calls[0]
    expect(indexCall[0]).toBe('dialogue-peer-123')
    expect(indexCall[1]).toContain('Message 0')
    expect(indexCall[1]).toContain('Message 1')
  })

  it('should save dialogue metadata', async () => {
    const messages = createMessages(10)

    await useCase.execute({
      peerId: 'peer-123',
      peerName: 'John',
      messages,
    })

    expect(mockDialogueRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        peerId: 'peer-123',
        peerName: 'John',
        isIndexed: true,
        messageCount: 10,
      })
    )
  })

  it('should return success with counts', async () => {
    const messages = createMessages(5)

    const result = await useCase.execute({
      peerId: 'peer-123',
      peerName: 'John',
      messages,
    })

    expect(result.success).toBe(true)
    expect(result.messageCount).toBe(5)
    expect(result.chunkCount).toBe(5)
  })
})
