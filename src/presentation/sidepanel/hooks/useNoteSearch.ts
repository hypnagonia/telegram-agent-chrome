import { useState, useCallback } from 'preact/hooks'
import type { Note } from '@domain/entities/Note'
import {
  MessageType,
  sendToBackground,
  type SearchNotesPayload,
} from '@infrastructure/adapters/telegram/MessageBridge'

interface SearchState {
  results: Note[]
  loading: boolean
  error: string | null
  query: string
}

export function useNoteSearch() {
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null,
    query: '',
  })

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState({ results: [], loading: false, error: null, query: '' })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null, query }))
    try {
      const results = await sendToBackground<SearchNotesPayload, Note[]>({
        type: MessageType.SEARCH_NOTES,
        payload: { query },
      })
      setState({ results: results || [], loading: false, error: null, query })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to search notes',
        loading: false,
      }))
    }
  }, [])

  const clear = useCallback(() => {
    setState({ results: [], loading: false, error: null, query: '' })
  }, [])

  return {
    ...state,
    search,
    clear,
  }
}
