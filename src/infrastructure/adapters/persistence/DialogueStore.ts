import type { Dialogue } from '@domain/entities/Dialogue'
import type { DialogueRepository } from '@domain/ports/DialogueRepository'
import { db, dialogueToRecord, recordToDialogue } from './db'

export class DialogueStore implements DialogueRepository {
  async save(dialogue: Dialogue): Promise<void> {
    await db.dialogues.put(dialogueToRecord(dialogue))
  }

  async findByPeerId(peerId: string): Promise<Dialogue | undefined> {
    const record = await db.dialogues.get(peerId)
    return record ? recordToDialogue(record) : undefined
  }

  async findAll(): Promise<Dialogue[]> {
    const records = await db.dialogues.toArray()
    return records.map(recordToDialogue)
  }

  async updateIndexStatus(peerId: string, isIndexed: boolean, messageCount: number): Promise<void> {
    await db.dialogues.update(peerId, {
      isIndexed,
      lastIndexedAt: isIndexed ? Date.now() : null,
      messageCount,
    })
  }

  async delete(peerId: string): Promise<void> {
    await db.dialogues.delete(peerId)
  }
}
