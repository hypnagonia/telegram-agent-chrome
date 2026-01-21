import { useState, useEffect, useCallback } from 'preact/hooks'
import type { Dialogue } from '@domain/entities/Dialogue'
import {
  MessageType,
  sendToBackground,
  type DialogueChangedPayload,
  type DialogueStatusPayload,
  type IndexUpdatedPayload,
} from '@infrastructure/adapters/telegram/MessageBridge'

interface CurrentDialogueState {
  peerId: string | null
  peerName: string | null
  dialogue: Dialogue | null
  loading: boolean
  error: string | null
}

export function useCurrentDialogue() {
  const [state, setState] = useState<CurrentDialogueState>({
    peerId: null,
    peerName: null,
    dialogue: null,
    loading: true,
    error: null,
  })

  const fetchDialogueStatus = useCallback(async (peerId: string) => {
    console.log('[useCurrentDialogue] fetchDialogueStatus:', peerId)
    try {
      const dialogue = await sendToBackground<DialogueStatusPayload, Dialogue | null>({
        type: MessageType.GET_DIALOGUE_STATUS,
        payload: { peerId },
      })
      console.log('[useCurrentDialogue] dialogue status:', dialogue)
      setState((prev) => ({ ...prev, dialogue, loading: false }))
    } catch (err) {
      console.error('[useCurrentDialogue] fetchDialogueStatus error:', err)
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  const fetchCurrentDialogue = useCallback(async () => {
    console.log('[useCurrentDialogue] fetchCurrentDialogue called')
    try {
      let current = await sendToBackground<undefined, { peerId: string; peerName: string } | null>({
        type: MessageType.GET_CURRENT_DIALOGUE,
        payload: undefined,
      })
      console.log('[useCurrentDialogue] from GET_CURRENT_DIALOGUE:', current)

      if (!current) {
        console.log('[useCurrentDialogue] Trying GET_ACTIVE_TAB_PEER...')
        current = await sendToBackground<undefined, { peerId: string; peerName: string } | null>({
          type: MessageType.GET_ACTIVE_TAB_PEER,
          payload: undefined,
        })
        console.log('[useCurrentDialogue] from GET_ACTIVE_TAB_PEER:', current)
      }

      if (current) {
        setState((prev) => ({
          ...prev,
          peerId: current!.peerId,
          peerName: current!.peerName,
          loading: false,
        }))
        fetchDialogueStatus(current.peerId)
      } else {
        console.log('[useCurrentDialogue] no current dialogue found')
        setState((prev) => ({ ...prev, loading: false }))
      }
    } catch (err) {
      console.error('[useCurrentDialogue] fetchCurrentDialogue error:', err)
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to fetch current dialogue',
        loading: false,
      }))
    }
  }, [fetchDialogueStatus])

  useEffect(() => {
    fetchCurrentDialogue()
  }, [fetchCurrentDialogue])

  useEffect(() => {
    const handleMessage = (message: { type: MessageType; payload: unknown }) => {
      if (message.type === MessageType.DIALOGUE_CHANGED) {
        const payload = message.payload as DialogueChangedPayload
        console.log('[useCurrentDialogue] DIALOGUE_CHANGED received:', payload)
        setState((prev) => ({
          ...prev,
          peerId: payload.peerId,
          peerName: payload.peerName,
        }))
        fetchDialogueStatus(payload.peerId)
      } else if (message.type === MessageType.INDEX_UPDATED) {
        const payload = message.payload as IndexUpdatedPayload
        console.log('[useCurrentDialogue] INDEX_UPDATED received:', payload)
        setState((prev) => {
          if (prev.peerId === payload.peerId && prev.dialogue) {
            return {
              ...prev,
              dialogue: { ...prev.dialogue, messageCount: payload.messageCount },
            }
          }
          return prev
        })
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [fetchDialogueStatus])

  const refresh = useCallback(() => {
    fetchCurrentDialogue()
  }, [fetchCurrentDialogue])

  return {
    ...state,
    refresh,
  }
}
