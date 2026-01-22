import { useState, useCallback } from 'preact/hooks'
import type { Hint } from '@domain/entities/Hint'
import {
  MessageType,
  sendToBackground,
  type GenerateHintsPayload,
} from '@infrastructure/adapters/telegram/MessageBridge'
import { calculateCostFromTokens, type TokenInfo } from '@infrastructure/utils/tokenEstimator'

interface HintsState {
  hints: Hint[]
  loading: boolean
  error: string | null
  contextUsed: number
  tokenInfo: TokenInfo | null
}

interface LLMUsageInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

interface LLMDebugInfo {
  prompt: string
  contextChunks: string[]
  provider: string
  model: string
  usage?: LLMUsageInfo
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
    tokenInfo: null,
  })

  const generate = useCallback(async (peerId: string, currentMessage: string) => {
    console.log('[useHints] Generating hints for:', peerId)
    setState((prev) => ({ ...prev, loading: true, error: null, tokenInfo: null }))
    try {
      const response = await sendToBackground<GenerateHintsPayload, GenerateHintsResponse>({
        type: MessageType.GENERATE_HINTS,
        payload: { peerId, currentMessage },
      })
      console.log('[useHints] Hints received:', response.hints.length)

      let tokenInfo: TokenInfo | null = null
      if (response.debugInfo) {
        console.log('─── LLM REQUEST ───')
        console.log('Provider:', response.debugInfo.provider)
        console.log('Model:', response.debugInfo.model)
        console.log('Context chunks:', response.debugInfo.contextChunks.length)
        if (response.debugInfo.usage) {
          console.log('Tokens - Input:', response.debugInfo.usage.inputTokens, 'Output:', response.debugInfo.usage.outputTokens, 'Total:', response.debugInfo.usage.totalTokens)
        }
        if (response.debugInfo.contextChunks.length > 0) {
          console.log('Context preview:', response.debugInfo.contextChunks[0].slice(0, 100) + '...')
        }
        console.log('Full prompt:')
        console.log(response.debugInfo.prompt)
        console.log('───────────────────')

        if (response.debugInfo.usage) {
          tokenInfo = calculateCostFromTokens(
            response.debugInfo.usage.inputTokens,
            response.debugInfo.usage.outputTokens,
            response.debugInfo.provider as 'openai' | 'claude' | 'deepseek'
          )
        }
      }

      setState({
        hints: response.hints,
        loading: false,
        error: null,
        contextUsed: response.contextUsed,
        tokenInfo,
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
      tokenInfo: null,
    })
  }, [])

  return {
    ...state,
    generate,
    clear,
  }
}
