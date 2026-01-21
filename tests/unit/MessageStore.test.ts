import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MessageStore } from '@infrastructure/adapters/persistence/MessageStore'
import { MessageBuilder } from '@domain/entities/Message'
import { db } from '@infrastructure/adapters/persistence/db'

describe('MessageStore', () => {
  let store: MessageStore

  beforeEach(async () => {
    store = new MessageStore()
    await db.messages.clear()
  })

  afterEach(async () => {
    await db.messages.clear()
  })

  const createMessage = (overrides = {}) =>
    new MessageBuilder()
      .withId('msg-1')
      .withPeerId('peer-123')
      .withText('Hello world')
      .withTimestamp(1000)
      .withIsOutgoing(false)
      .withSenderName('John')
      .build()

  describe('save', () => {
    it('should save a message', async () => {
      const message = createMessage()
      await store.save(message)

      const found = await store.findById('msg-1')
      expect(found).toEqual(message)
    })

    it('should update existing message with same id', async () => {
      const message1 = createMessage()
      await store.save(message1)

      const message2 = new MessageBuilder()
        .withId('msg-1')
        .withPeerId('peer-123')
        .withText('Updated text')
        .withTimestamp(2000)
        .withIsOutgoing(true)
        .withSenderName('Jane')
        .build()
      await store.save(message2)

      const found = await store.findById('msg-1')
      expect(found?.text).toBe('Updated text')
      expect(found?.senderName).toBe('Jane')
    })
  })

  describe('saveBatch', () => {
    it('should save multiple messages', async () => {
      const messages = [
        new MessageBuilder().withId('msg-1').withPeerId('peer-123').withText('First').withTimestamp(1000).build(),
        new MessageBuilder().withId('msg-2').withPeerId('peer-123').withText('Second').withTimestamp(2000).build(),
        new MessageBuilder().withId('msg-3').withPeerId('peer-123').withText('Third').withTimestamp(3000).build(),
      ]

      await store.saveBatch(messages)

      const count = await store.countByPeerId('peer-123')
      expect(count).toBe(3)
    })
  })

  describe('findById', () => {
    it('should return undefined for non-existent message', async () => {
      const found = await store.findById('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('findByPeerId', () => {
    it('should return messages sorted by timestamp', async () => {
      const messages = [
        new MessageBuilder().withId('msg-3').withPeerId('peer-123').withText('Third').withTimestamp(3000).build(),
        new MessageBuilder().withId('msg-1').withPeerId('peer-123').withText('First').withTimestamp(1000).build(),
        new MessageBuilder().withId('msg-2').withPeerId('peer-123').withText('Second').withTimestamp(2000).build(),
      ]
      await store.saveBatch(messages)

      const found = await store.findByPeerId('peer-123')
      expect(found.map(m => m.id)).toEqual(['msg-1', 'msg-2', 'msg-3'])
    })

    it('should only return messages for specified peerId', async () => {
      const messages = [
        new MessageBuilder().withId('msg-1').withPeerId('peer-123').withText('A').withTimestamp(1000).build(),
        new MessageBuilder().withId('msg-2').withPeerId('peer-456').withText('B').withTimestamp(2000).build(),
        new MessageBuilder().withId('msg-3').withPeerId('peer-123').withText('C').withTimestamp(3000).build(),
      ]
      await store.saveBatch(messages)

      const found = await store.findByPeerId('peer-123')
      expect(found.length).toBe(2)
      expect(found.every(m => m.peerId === 'peer-123')).toBe(true)
    })

    it('should return empty array for non-existent peerId', async () => {
      const found = await store.findByPeerId('non-existent')
      expect(found).toEqual([])
    })
  })

  describe('findByPeerIdPaginated', () => {
    it('should return paginated results', async () => {
      const messages = Array.from({ length: 10 }, (_, i) =>
        new MessageBuilder()
          .withId(`msg-${i}`)
          .withPeerId('peer-123')
          .withText(`Message ${i}`)
          .withTimestamp(i * 1000)
          .build()
      )
      await store.saveBatch(messages)

      const page1 = await store.findByPeerIdPaginated('peer-123', 0, 3)
      expect(page1.length).toBe(3)

      const page2 = await store.findByPeerIdPaginated('peer-123', 3, 3)
      expect(page2.length).toBe(3)

      const page4 = await store.findByPeerIdPaginated('peer-123', 9, 3)
      expect(page4.length).toBe(1)
    })
  })

  describe('countByPeerId', () => {
    it('should return correct count', async () => {
      const messages = [
        new MessageBuilder().withId('msg-1').withPeerId('peer-123').withText('A').withTimestamp(1000).build(),
        new MessageBuilder().withId('msg-2').withPeerId('peer-123').withText('B').withTimestamp(2000).build(),
        new MessageBuilder().withId('msg-3').withPeerId('peer-456').withText('C').withTimestamp(3000).build(),
      ]
      await store.saveBatch(messages)

      const count123 = await store.countByPeerId('peer-123')
      const count456 = await store.countByPeerId('peer-456')

      expect(count123).toBe(2)
      expect(count456).toBe(1)
    })

    it('should return 0 for non-existent peerId', async () => {
      const count = await store.countByPeerId('non-existent')
      expect(count).toBe(0)
    })
  })

  describe('deleteByPeerId', () => {
    it('should delete all messages for peerId', async () => {
      const messages = [
        new MessageBuilder().withId('msg-1').withPeerId('peer-123').withText('A').withTimestamp(1000).build(),
        new MessageBuilder().withId('msg-2').withPeerId('peer-123').withText('B').withTimestamp(2000).build(),
        new MessageBuilder().withId('msg-3').withPeerId('peer-456').withText('C').withTimestamp(3000).build(),
      ]
      await store.saveBatch(messages)

      await store.deleteByPeerId('peer-123')

      const count123 = await store.countByPeerId('peer-123')
      const count456 = await store.countByPeerId('peer-456')

      expect(count123).toBe(0)
      expect(count456).toBe(1)
    })
  })
})
