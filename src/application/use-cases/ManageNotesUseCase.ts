import type { Note } from '@domain/entities/Note'
import { NoteBuilder } from '@domain/entities/Note'
import type { NoteRepository } from '@domain/ports/NoteRepository'

export interface CreateNoteInput {
  peerId: string
  content: string
  tags?: string[]
}

export interface UpdateNoteInput {
  id: string
  content: string
  tags?: string[]
}

export class ManageNotesUseCase {
  constructor(private noteRepository: NoteRepository) {}

  async create(input: CreateNoteInput): Promise<Note> {
    const note = new NoteBuilder()
      .withId(`note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)
      .withPeerId(input.peerId)
      .withContent(input.content)
      .withTags(input.tags ?? [])
      .build()

    await this.noteRepository.save(note)
    return note
  }

  async update(input: UpdateNoteInput): Promise<Note> {
    const existing = await this.noteRepository.findById(input.id)
    if (!existing) {
      throw new Error(`Note not found: ${input.id}`)
    }

    const updated: Note = {
      ...existing,
      content: input.content,
      tags: input.tags ?? existing.tags,
      updatedAt: Date.now(),
    }

    await this.noteRepository.save(updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.noteRepository.delete(id)
  }

  async getByPeerId(peerId: string): Promise<Note[]> {
    return this.noteRepository.findByPeerId(peerId)
  }

  async getById(id: string): Promise<Note | undefined> {
    return this.noteRepository.findById(id)
  }
}
