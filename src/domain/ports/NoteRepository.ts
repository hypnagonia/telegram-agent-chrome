import type { Note } from '../entities/Note'

export interface NoteRepository {
  save(note: Note): Promise<void>
  findById(id: string): Promise<Note | undefined>
  findByPeerId(peerId: string): Promise<Note[]>
  delete(id: string): Promise<void>
  deleteByPeerId(peerId: string): Promise<void>
}
