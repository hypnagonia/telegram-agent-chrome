import { useState, useCallback, useEffect } from 'preact/hooks'
import type { Note } from '@domain/entities/Note'
import {
  MessageType,
  sendToBackground,
  type GetNotesPayload,
  type SaveNotePayload,
  type DeleteNotePayload,
} from '@infrastructure/adapters/telegram/MessageBridge'

interface NotesState {
  notes: Note[]
  loading: boolean
  error: string | null
}

export function useNotes(peerId: string | null) {
  console.log('[useNotes] peerId:', peerId)

  const [state, setState] = useState<NotesState>({
    notes: [],
    loading: false,
    error: null,
  })

  const fetchNotes = useCallback(async (pid: string) => {
    console.log('[useNotes] fetchNotes for:', pid)
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const notes = await sendToBackground<GetNotesPayload, Note[]>({
        type: MessageType.GET_NOTES,
        payload: { peerId: pid },
      })
      console.log('[useNotes] fetched notes:', notes)
      setState({ notes: notes || [], loading: false, error: null })
    } catch (err) {
      console.error('[useNotes] fetchNotes error:', err)
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to fetch notes',
        loading: false,
      }))
    }
  }, [])

  useEffect(() => {
    if (peerId) {
      fetchNotes(peerId)
    } else {
      console.log('[useNotes] no peerId, clearing notes')
      setState({ notes: [], loading: false, error: null })
    }
  }, [peerId, fetchNotes])

  const save = useCallback(
    async (id: string | null, content: string, tags: string[] = []) => {
      console.log('[useNotes] save called, peerId:', peerId, 'content:', content)
      if (!peerId) {
        console.warn('[useNotes] save aborted - no peerId')
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const noteId = id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        console.log('[useNotes] saving note:', { id: noteId, peerId, content })
        const result = await sendToBackground<SaveNotePayload, Note>({
          type: MessageType.SAVE_NOTE,
          payload: { id: noteId, peerId, content, tags },
        })
        console.log('[useNotes] save result:', result)
        await fetchNotes(peerId)
      } catch (err) {
        console.error('[useNotes] save error:', err)
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to save note',
          loading: false,
        }))
      }
    },
    [peerId, fetchNotes]
  )

  const remove = useCallback(
    async (id: string) => {
      if (!peerId) return

      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        await sendToBackground<DeleteNotePayload, void>({
          type: MessageType.DELETE_NOTE,
          payload: { id },
        })
        await fetchNotes(peerId)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to delete note',
          loading: false,
        }))
      }
    },
    [peerId, fetchNotes]
  )

  const refresh = useCallback(() => {
    if (peerId) {
      fetchNotes(peerId)
    }
  }, [peerId, fetchNotes])

  return {
    ...state,
    save,
    remove,
    refresh,
  }
}
