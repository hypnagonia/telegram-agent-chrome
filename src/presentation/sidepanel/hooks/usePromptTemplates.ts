import { useState, useCallback, useEffect } from 'preact/hooks'
import type { PromptTemplate } from '@domain/entities/PromptTemplate'
import {
  MessageType,
  sendToBackground,
  type SavePromptTemplatePayload,
  type DeletePromptTemplatePayload,
} from '@infrastructure/adapters/telegram/MessageBridge'

interface TemplatesState {
  templates: PromptTemplate[]
  loading: boolean
  error: string | null
}

export function usePromptTemplates() {
  const [state, setState] = useState<TemplatesState>({
    templates: [],
    loading: true,
    error: null,
  })

  const fetchTemplates = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const templates = await sendToBackground<undefined, PromptTemplate[]>({
        type: MessageType.GET_PROMPT_TEMPLATES,
        payload: undefined,
      })
      setState({ templates: templates || [], loading: false, error: null })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to fetch templates',
        loading: false,
      }))
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const save = useCallback(async (id: string, name: string, template: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const templates = await sendToBackground<SavePromptTemplatePayload, PromptTemplate[]>({
        type: MessageType.SAVE_PROMPT_TEMPLATE,
        payload: { id, name, template },
      })
      setState({ templates: templates || [], loading: false, error: null })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to save template',
        loading: false,
      }))
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const templates = await sendToBackground<DeletePromptTemplatePayload, PromptTemplate[]>({
        type: MessageType.DELETE_PROMPT_TEMPLATE,
        payload: { id },
      })
      setState({ templates: templates || [], loading: false, error: null })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to delete template',
        loading: false,
      }))
    }
  }, [])

  return {
    ...state,
    save,
    remove,
    refresh: fetchTemplates,
  }
}
