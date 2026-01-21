import { useState, useCallback } from 'preact/hooks'
import type { Hint } from '@domain/entities/Hint'
import {
  MessageType,
  sendToBackground,
  type GenerateHintsPayload,
} from '@infrastructure/adapters/telegram/MessageBridge'

interface HintsState {
  hints: Hint[]
  loading: boolean
  error: string | null
  contextUsed: number
}

interface LLMDebugInfo {
  prompt: string
  contextChunks: string[]
  provider: string
  model: string
}

interface GenerateHintsResponse {
  hints: Hint[]
  contextUsed: number
  debugInfo?: LLMDebugInfo
}

export function useHints() {
  const [state, setState] = useState<HintsState>({
    hints: [],
    loading: false,
    error: null,
    contextUsed: 0,
  })

  const generate = useCallback(async (peerId: string, currentMessage: string) => {
    console.log('[useHints] Generating hints for:', peerId)
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await sendToBackground<GenerateHintsPayload, GenerateHintsResponse>({
        type: MessageType.GENERATE_HINTS,
        payload: { peerId, currentMessage },
      })
      console.log('[useHints] Hints received:', response.hints.length)

      if (response.debugInfo) {
        console.log('─── LLM REQUEST ───')
        console.log('Provider:', response.debugInfo.provider)
        console.log('Model:', response.debugInfo.model)
        console.log('Context chunks:', response.debugInfo.contextChunks.length)
        if (response.debugInfo.contextChunks.length > 0) {
          console.log('Context preview:', response.debugInfo.contextChunks[0].slice(0, 100) + '...')
        }
        console.log('Full prompt:')
        console.log(response.debugInfo.prompt)
        console.log('───────────────────')
      }

      setState({
        hints: response.hints,
        loading: false,
        error: null,
        contextUsed: response.contextUsed,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate hints'
      console.error('[useHints] Error:', errorMessage)
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))
    }
  }, [])

  const clear = useCallback(() => {
    setState({
      hints: [],
      loading: false,
      error: null,
      contextUsed: 0,
    })
  }, [])

  return {
    ...state,
    generate,
    clear,
  }
}
