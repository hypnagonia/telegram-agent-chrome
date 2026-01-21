import type { Message } from '@domain/entities/Message'
import type { MessageRepository } from '@domain/ports/MessageRepository'
import { db, messageToRecord, recordToMessage } from './db'

export class MessageStore implements MessageRepository {
  async save(message: Message): Promise<void> {
    await db.messages.put(messageToRecord(message))
  }

  async saveBatch(messages: Message[]): Promise<void> {
    await db.messages.bulkPut(messages.map(messageToRecord))
  }

  async findById(id: string): Promise<Message | undefined> {
    const record = await db.messages.get(id)
    return record ? recordToMessage(record) : undefined
  }

  async findByPeerId(peerId: string): Promise<Message[]> {
    const records = await db.messages
      .where('peerId')
      .equals(peerId)
      .sortBy('timestamp')
    return records.map(recordToMessage)
  }

  async findByPeerIdPaginated(peerId: string, offset: number, limit: number): Promise<Message[]> {
    const records = await db.messages
      .where('peerId')
      .equals(peerId)
      .offset(offset)
      .limit(limit)
      .sortBy('timestamp')
    return records.map(recordToMessage)
  }

  async countByPeerId(peerId: string): Promise<number> {
    return db.messages.where('peerId').equals(peerId).count()
  }

  async deleteByPeerId(peerId: string): Promise<void> {
    await db.messages.where('peerId').equals(peerId).delete()
  }
}
