import type { Message } from '../entities/Message'

export interface MessageRepository {
  save(message: Message): Promise<void>
  saveBatch(messages: Message[]): Promise<void>
  findById(id: string): Promise<Message | undefined>
  findByPeerId(peerId: string): Promise<Message[]>
  findByPeerIdPaginated(peerId: string, offset: number, limit: number): Promise<Message[]>
  countByPeerId(peerId: string): Promise<number>
  deleteByPeerId(peerId: string): Promise<void>
}
