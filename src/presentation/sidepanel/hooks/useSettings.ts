import { useState, useEffect, useCallback } from 'preact/hooks'
import {
  MessageType,
  sendToBackground,
  type SettingsPayload,
} from '@infrastructure/adapters/telegram/MessageBridge'

import type { Theme } from '../styles'

interface Settings {
  apiKey: string
  apiProvider: 'openai' | 'claude' | 'deepseek'
  personaId: string
  theme: Theme
  promptTemplate: string
  activeTemplateId: string
}

interface SettingsState {
  settings: Settings
  loading: boolean
  error: string | null
  saved: boolean
}

const DEFAULT_PROMPT_TEMPLATE = `You are a helpful assistant generating reply suggestions for a Telegram conversation.

Tone: friendly, casual

Conversation context:
{{context}}

Recent messages:
{{recent_messages}}

You want to reply: "{{user_input}}"

Based on the context, suggest brief, natural replies that match the conversation tone.`

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  apiProvider: 'deepseek',
  personaId: 'default',
  theme: 'system',
  promptTemplate: DEFAULT_PROMPT_TEMPLATE,
  activeTemplateId: 'default',
}

export function useSettings() {
  const [state, setState] = useState<SettingsState>({
    settings: DEFAULT_SETTINGS,
    loading: true,
    error: null,
    saved: false,
  })

  const fetchSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const settings = await sendToBackground<void, Settings>({
        type: MessageType.GET_SETTINGS,
        payload: undefined,
      })
      setState({
        settings: settings || DEFAULT_SETTINGS,
        loading: false,
        error: null,
        saved: false,
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to fetch settings',
        loading: false,
      }))
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const save = useCallback(async (newSettings: Partial<Settings>) => {
    setState((prev) => ({ ...prev, loading: true, error: null, saved: false }))
    try {
      const payload: SettingsPayload = {
        apiKey: newSettings.apiKey,
        apiProvider: newSettings.apiProvider,
        personaId: newSettings.personaId,
        theme: newSettings.theme,
        promptTemplate: newSettings.promptTemplate,
        activeTemplateId: newSettings.activeTemplateId,
      }
      await sendToBackground<SettingsPayload, void>({
        type: MessageType.SAVE_SETTINGS,
        payload,
      })
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
        loading: false,
        saved: true,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to save settings',
        loading: false,
      }))
    }
  }, [])

  const update = useCallback((updates: Partial<Settings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
      saved: false,
    }))
  }, [])

  return {
    ...state,
    save,
    update,
    refresh: fetchSettings,
  }
}
