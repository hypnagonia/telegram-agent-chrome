import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NoteStore } from '@infrastructure/adapters/persistence/NoteStore'
import type { Note } from '@domain/entities/Note'
import { db } from '@infrastructure/adapters/persistence/db'

describe('NoteStore', () => {
  let store: NoteStore

  beforeEach(async () => {
    store = new NoteStore()
    await db.notes.clear()
  })

  afterEach(async () => {
    await db.notes.clear()
  })

  const createNote = (overrides: Partial<Note> = {}): Note => ({
    id: 'note-1',
    peerId: 'peer-123',
    content: 'Test note content',
    createdAt: 1000,
    updatedAt: 1000,
    tags: ['tag1', 'tag2'],
    ...overrides,
  })

  describe('save', () => {
    it('should save a note', async () => {
      const note = createNote()
      await store.save(note)

      const found = await store.findById('note-1')
      expect(found).toEqual(note)
    })

    it('should update existing note with same id', async () => {
      const note1 = createNote()
      await store.save(note1)

      const note2 = createNote({ content: 'Updated content', updatedAt: 2000 })
      await store.save(note2)

      const found = await store.findById('note-1')
      expect(found?.content).toBe('Updated content')
      expect(found?.updatedAt).toBe(2000)
    })
  })

  describe('findById', () => {
    it('should return undefined for non-existent note', async () => {
      const found = await store.findById('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('findByPeerId', () => {
    it('should return notes sorted by updatedAt descending', async () => {
      const notes = [
        createNote({ id: 'note-1', updatedAt: 1000 }),
        createNote({ id: 'note-2', updatedAt: 3000 }),
        createNote({ id: 'note-3', updatedAt: 2000 }),
      ]
      for (const note of notes) {
        await store.save(note)
      }

      const found = await store.findByPeerId('peer-123')
      expect(found.map(n => n.id)).toEqual(['note-2', 'note-3', 'note-1'])
    })

    it('should only return notes for specified peerId', async () => {
      const notes = [
        createNote({ id: 'note-1', peerId: 'peer-123' }),
        createNote({ id: 'note-2', peerId: 'peer-456' }),
        createNote({ id: 'note-3', peerId: 'peer-123' }),
      ]
      for (const note of notes) {
        await store.save(note)
      }

      const found = await store.findByPeerId('peer-123')
      expect(found.length).toBe(2)
      expect(found.every(n => n.peerId === 'peer-123')).toBe(true)
    })

    it('should return empty array for non-existent peerId', async () => {
      const found = await store.findByPeerId('non-existent')
      expect(found).toEqual([])
    })
  })

  describe('delete', () => {
    it('should delete a note by id', async () => {
      const note = createNote()
      await store.save(note)

      await store.delete('note-1')

      const found = await store.findById('note-1')
      expect(found).toBeUndefined()
    })

    it('should not throw when deleting non-existent note', async () => {
      await expect(store.delete('non-existent')).resolves.not.toThrow()
    })
  })

  describe('deleteByPeerId', () => {
    it('should delete all notes for peerId', async () => {
      const notes = [
        createNote({ id: 'note-1', peerId: 'peer-123' }),
        createNote({ id: 'note-2', peerId: 'peer-123' }),
        createNote({ id: 'note-3', peerId: 'peer-456' }),
      ]
      for (const note of notes) {
        await store.save(note)
      }

      await store.deleteByPeerId('peer-123')

      const found123 = await store.findByPeerId('peer-123')
      const found456 = await store.findByPeerId('peer-456')

      expect(found123).toEqual([])
      expect(found456.length).toBe(1)
    })
  })
})
