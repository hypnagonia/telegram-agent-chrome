import type { Note } from '@domain/entities/Note'
import { NoteBuilder } from '@domain/entities/Note'
import type { NoteRepository } from '@domain/ports/NoteRepository'

export interface CreateNoteInput {
  id?: string
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
    const noteId = input.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    console.log('[ManageNotesUseCase] Creating note:', { id: noteId, peerId: input.peerId })

    const note = new NoteBuilder()
      .withId(noteId)
      .withPeerId(input.peerId)
      .withContent(input.content)
      .withTags(input.tags ?? [])
      .build()

    await this.noteRepository.save(note)
    console.log('[ManageNotesUseCase] Note saved successfully:', noteId)
    return note
  }

  async update(input: UpdateNoteInput): Promise<Note> {
    console.log('[ManageNotesUseCase] Updating note:', input.id)
    const existing = await this.noteRepository.findById(input.id)
    if (!existing) {
      console.error('[ManageNotesUseCase] Note not found for update:', input.id)
      throw new Error(`Note not found: ${input.id}`)
    }

    const updated: Note = {
      ...existing,
      content: input.content,
      tags: input.tags ?? existing.tags,
      updatedAt: Date.now(),
    }

    await this.noteRepository.save(updated)
    console.log('[ManageNotesUseCase] Note updated successfully:', input.id)
    return updated
  }

  async delete(id: string): Promise<void> {
    console.log('[ManageNotesUseCase] Deleting note:', id)
    await this.noteRepository.delete(id)
    console.log('[ManageNotesUseCase] Note deleted successfully:', id)
  }

  async getByPeerId(peerId: string): Promise<Note[]> {
    const notes = await this.noteRepository.findByPeerId(peerId)
    console.log('[ManageNotesUseCase] Found notes for peer:', peerId, 'count:', notes.length)
    return notes
  }

  async getById(id: string): Promise<Note | undefined> {
    const note = await this.noteRepository.findById(id)
    console.log('[ManageNotesUseCase] getById:', id, 'found:', !!note)
    return note
  }
}
