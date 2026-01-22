import type { Note } from '@domain/entities/Note'
import type { NoteRepository } from '@domain/ports/NoteRepository'
import { db, noteToRecord, recordToNote } from './db'

export class NoteStore implements NoteRepository {
  async save(note: Note): Promise<void> {
    await db.notes.put(noteToRecord(note))
  }

  async findById(id: string): Promise<Note | undefined> {
    const record = await db.notes.get(id)
    return record ? recordToNote(record) : undefined
  }

  async findByPeerId(peerId: string): Promise<Note[]> {
    const records = await db.notes
      .where('peerId')
      .equals(peerId)
      .sortBy('updatedAt')
    return records.map(recordToNote).reverse()
  }

  async getAll(): Promise<Note[]> {
    const records = await db.notes.orderBy('updatedAt').reverse().toArray()
    return records.map(recordToNote)
  }

  async delete(id: string): Promise<void> {
    await db.notes.delete(id)
  }

  async deleteByPeerId(peerId: string): Promise<void> {
    await db.notes.where('peerId').equals(peerId).delete()
  }
}
