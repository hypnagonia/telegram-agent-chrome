import type { Dialogue } from '../entities/Dialogue'

export interface DialogueRepository {
  save(dialogue: Dialogue): Promise<void>
  findByPeerId(peerId: string): Promise<Dialogue | undefined>
  findAll(): Promise<Dialogue[]>
  updateIndexStatus(peerId: string, isIndexed: boolean, messageCount: number): Promise<void>
  delete(peerId: string): Promise<void>
}
