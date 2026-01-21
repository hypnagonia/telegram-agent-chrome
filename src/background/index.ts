import {
  MessageType,
  onMessage,
  type DialogueChangedPayload,
  type NewMessagePayload,
  type MessagesExtractedPayload,
  type IndexDialoguePayload,
  type ClearIndexPayload,
  type QueryContextPayload,
  type GenerateHintsPayload,
  type GetNotesPayload,
  type SaveNotePayload,
  type DeleteNotePayload,
  type DialogueStatusPayload,
  type SettingsPayload,
} from '@infrastructure/adapters/telegram/MessageBridge'
import { MessageStore } from '@infrastructure/adapters/persistence/MessageStore'
import { NoteStore } from '@infrastructure/adapters/persistence/NoteStore'
import { PersonaStore } from '@infrastructure/adapters/persistence/PersonaStore'
import { DialogueStore } from '@infrastructure/adapters/persistence/DialogueStore'
import { BM25Adapter } from '@infrastructure/adapters/rag/BM25Adapter'
import { LLMAdapter, type LLMProviderType } from '@infrastructure/adapters/llm/LLMAdapter'
import { IndexDialogueUseCase } from '@application/use-cases/IndexDialogueUseCase'
import { QueryContextUseCase } from '@application/use-cases/QueryContextUseCase'
import { GenerateHintUseCase } from '@application/use-cases/GenerateHintUseCase'
import { ManageNotesUseCase } from '@application/use-cases/ManageNotesUseCase'
import { MessageBuilder } from '@domain/entities/Message'

const messageStore = new MessageStore()
const noteStore = new NoteStore()
const personaStore = new PersonaStore()
const dialogueStore = new DialogueStore()
const ragAdapter = new BM25Adapter()

let llmAdapter: LLMAdapter | null = null
let currentDialogue: { peerId: string; peerName: string } | null = null

interface Settings {
  apiKey: string
  apiProvider: LLMProviderType
  personaId: string
  theme: 'light' | 'dark'
}

async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(['apiKey', 'apiProvider', 'personaId', 'theme'])
  return {
    apiKey: result.apiKey || '',
    apiProvider: result.apiProvider || 'deepseek',
    personaId: result.personaId || 'default',
    theme: result.theme || 'dark',
  }
}

async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(settings)
  if (settings.apiKey || settings.apiProvider) {
    const current = await getSettings()
    if (current.apiKey) {
      llmAdapter = new LLMAdapter({
        provider: current.apiProvider,
        apiKey: current.apiKey,
      })
    }
  }
}

async function ensureLLMAdapter(): Promise<LLMAdapter> {
  console.log('[Background] ensureLLMAdapter called, current adapter:', !!llmAdapter)
  if (!llmAdapter) {
    const settings = await getSettings()
    console.log('[Background] Settings loaded:', {
      apiKeySet: !!settings.apiKey,
      apiKeyLength: settings.apiKey?.length || 0,
      provider: settings.apiProvider
    })
    if (!settings.apiKey) {
      throw new Error('API key not configured. Please set it in Settings tab.')
    }
    llmAdapter = new LLMAdapter({
      provider: settings.apiProvider,
      apiKey: settings.apiKey,
    })
    console.log('[Background] LLM adapter created for provider:', settings.apiProvider)
  }
  return llmAdapter
}

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('[Background] Tab activated:', activeInfo.tabId)
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    if (tab.url && tab.id) {
      const url = new URL(tab.url)
      if (url.hostname === 'web.telegram.org' && url.hash.length > 1) {
        const peerId = url.hash.slice(1)
        let peerName = peerId
        try {
          const extracted = await chrome.tabs.sendMessage(tab.id, {
            type: MessageType.EXTRACT_MESSAGES,
            payload: {},
          }) as { peerName: string | null }
          if (extracted?.peerName) {
            peerName = extracted.peerName
          }
        } catch {}
        console.log('[Background] Tab has Telegram dialogue:', peerId, 'name:', peerName)
        currentDialogue = { peerId, peerName }
        chrome.runtime.sendMessage({
          type: MessageType.DIALOGUE_CHANGED,
          payload: { peerId, peerName },
        }).catch(() => {})
      }
    }
  } catch (err) {
    console.error('[Background] Tab activation error:', err)
  }
})

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url && tab.id) {
    try {
      const url = new URL(tab.url)
      if (url.hostname === 'web.telegram.org' && url.hash.length > 1) {
        const peerId = url.hash.slice(1)
        let peerName = peerId
        setTimeout(async () => {
          try {
            const extracted = await chrome.tabs.sendMessage(tab.id!, {
              type: MessageType.EXTRACT_MESSAGES,
              payload: {},
            }) as { peerName: string | null }
            if (extracted?.peerName) {
              peerName = extracted.peerName
              currentDialogue = { peerId, peerName }
              chrome.runtime.sendMessage({
                type: MessageType.DIALOGUE_CHANGED,
                payload: { peerId, peerName },
              }).catch(() => {})
            }
          } catch {}
        }, 300)
        console.log('[Background] Tab URL updated, dialogue:', peerId)
        currentDialogue = { peerId, peerName }
        chrome.runtime.sendMessage({
          type: MessageType.DIALOGUE_CHANGED,
          payload: { peerId, peerName },
        }).catch(() => {})
      }
    } catch (err) {
      console.error('[Background] Tab update error:', err)
    }
  }
})

onMessage<DialogueChangedPayload>(
  MessageType.DIALOGUE_CHANGED,
  async (payload) => {
    console.log('[Background] Dialogue changed:', payload.peerName)
    currentDialogue = { peerId: payload.peerId, peerName: payload.peerName }

    chrome.runtime.sendMessage({
      type: MessageType.DIALOGUE_CHANGED,
      payload,
    }).catch(() => {})
  }
)

onMessage<undefined>(
  MessageType.GET_CURRENT_DIALOGUE,
  async () => {
    return currentDialogue
  }
)

onMessage<undefined>(
  MessageType.GET_ACTIVE_TAB_PEER,
  async () => {
    console.log('[Background] GET_ACTIVE_TAB_PEER called')
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      console.log('[Background] Active tab:', tab?.url)
      if (tab?.url && tab.id) {
        const url = new URL(tab.url)
        console.log('[Background] Parsed URL - hostname:', url.hostname, 'hash:', url.hash)
        if (url.hostname === 'web.telegram.org' && url.hash.length > 1) {
          const peerId = url.hash.slice(1)
          console.log('[Background] Got peerId from active tab:', peerId)

          let peerName = peerId
          try {
            const extracted = await chrome.tabs.sendMessage(tab.id, {
              type: MessageType.EXTRACT_MESSAGES,
              payload: {},
            }) as { peerId: string | null; peerName: string | null }
            if (extracted?.peerName) {
              peerName = extracted.peerName
              console.log('[Background] Got peerName from content script:', peerName)
            }
          } catch (e) {
            console.log('[Background] Could not get peerName from content script')
          }

          currentDialogue = { peerId, peerName }
          return { peerId, peerName }
        }
      }
    } catch (err) {
      console.error('[Background] Error getting active tab:', err)
    }
    console.log('[Background] GET_ACTIVE_TAB_PEER returning null')
    return null
  }
)

onMessage<NewMessagePayload>(
  MessageType.NEW_MESSAGE,
  async (payload) => {
    console.log('[Background] NEW_MESSAGE received:', payload.id, payload.text.slice(0, 30))
    const message = new MessageBuilder()
      .withId(payload.id)
      .withPeerId(payload.peerId)
      .withText(payload.text)
      .withTimestamp(payload.timestamp)
      .withIsOutgoing(payload.isOutgoing)
      .withSenderName(payload.senderName)
      .build()

    await messageStore.save(message)

    if (payload.text.trim().length > 0) {
      const content = `[${payload.senderName}]: ${payload.text}`
      await ragAdapter.index(payload.peerId, content)
      console.log('[Background] Auto-indexed new message into BM25')

      const dialogue = await dialogueStore.findByPeerId(payload.peerId)
      if (dialogue) {
        await dialogueStore.save({
          ...dialogue,
          messageCount: dialogue.messageCount + 1,
          lastIndexedAt: Date.now(),
        })
      }
    }
  }
)

onMessage<MessagesExtractedPayload>(
  MessageType.MESSAGES_EXTRACTED,
  async (payload) => {
    console.log('[Background] MESSAGES_EXTRACTED received:', payload.peerId, 'count:', payload.messages.length)
    const messages = payload.messages.map((m) =>
      new MessageBuilder()
        .withId(m.id)
        .withPeerId(m.peerId)
        .withText(m.text)
        .withTimestamp(m.timestamp)
        .withIsOutgoing(m.isOutgoing)
        .withSenderName(m.senderName)
        .build()
    )
    await messageStore.saveBatch(messages)
    console.log('[Background] Messages saved to store')

    const textsToIndex = payload.messages
      .filter(m => m.text.trim().length > 0)
      .map(m => `[${m.senderName}]: ${m.text}`)

    if (textsToIndex.length > 0) {
      const content = textsToIndex.join('\n')
      await ragAdapter.index(payload.peerId, content)
      console.log('[Background] Auto-indexed', textsToIndex.length, 'messages into BM25')

      const dialogue = await dialogueStore.findByPeerId(payload.peerId)
      if (dialogue) {
        await dialogueStore.save({
          ...dialogue,
          messageCount: dialogue.messageCount + textsToIndex.length,
          lastIndexedAt: Date.now(),
        })
      }
    }
  }
)

onMessage<IndexDialoguePayload>(
  MessageType.INDEX_DIALOGUE,
  async (payload) => {
    console.log('[Background] INDEX_DIALOGUE called:', payload)

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      throw new Error('No active Telegram tab found. Please open Telegram Web.')
    }

    let extracted: { peerId: string | null; peerName: string | null; messages: Array<{ id: string; text: string; isOutgoing: boolean; senderName: string; timestamp: number }> } | null = null

    try {
      console.log('[Background] Requesting message extraction from content script...')
      extracted = await chrome.tabs.sendMessage(tab.id, {
        type: MessageType.EXTRACT_MESSAGES,
        payload: {},
      })
      console.log('[Background] Extraction result:', extracted?.messages?.length || 0, 'messages')
    } catch (err) {
      console.error('[Background] Content script not responding:', err)
      throw new Error('Content script disconnected. Please RELOAD the Telegram Web page (Cmd+R) and try again.')
    }

    if (extracted && extracted.messages && extracted.messages.length > 0) {
      const messages = extracted.messages.map((m) =>
        new MessageBuilder()
          .withId(m.id)
          .withPeerId(payload.peerId)
          .withText(m.text)
          .withTimestamp(m.timestamp)
          .withIsOutgoing(m.isOutgoing)
          .withSenderName(m.senderName)
          .build()
      )
      await messageStore.saveBatch(messages)
      console.log('[Background] Saved', messages.length, 'messages from extraction')
    }

    const messages = await messageStore.findByPeerId(payload.peerId)
    console.log('[Background] Total messages in store:', messages.length)

    if (messages.length === 0) {
      throw new Error('No messages found to index. Make sure you have a chat open in Telegram Web.')
    }

    const useCase = new IndexDialogueUseCase(messageStore, dialogueStore, ragAdapter)
    const result = await useCase.execute({
      peerId: payload.peerId,
      peerName: payload.peerName,
      messages,
    })
    console.log('[Background] Index result:', result)
    return result
  }
)

onMessage<ClearIndexPayload>(
  MessageType.CLEAR_INDEX,
  async (payload) => {
    console.log('[Background] CLEAR_INDEX called for:', payload.peerId)
    try {
      console.log('[Background] Clearing BM25 index...')
      await ragAdapter.clearByPeerId(payload.peerId)
      console.log('[Background] Deleting messages from store...')
      await messageStore.deleteByPeerId(payload.peerId)
      console.log('[Background] Deleting dialogue metadata...')
      await dialogueStore.delete(payload.peerId)
      console.log('[Background] Index cleared successfully for peer:', payload.peerId)
      return { success: true }
    } catch (err) {
      console.error('[Background] CLEAR_INDEX error:', err)
      throw err
    }
  }
)

onMessage<QueryContextPayload>(
  MessageType.QUERY_CONTEXT,
  async (payload) => {
    const useCase = new QueryContextUseCase(ragAdapter)
    return useCase.execute({ query: payload.query, topK: payload.topK })
  }
)

onMessage<GenerateHintsPayload>(
  MessageType.GENERATE_HINTS,
  async (payload) => {
    console.log('[Background] GENERATE_HINTS called:', payload)
    try {
      const adapter = await ensureLLMAdapter()
      console.log('[Background] LLM adapter ready')
      const useCase = new GenerateHintUseCase(adapter, ragAdapter, personaStore)
      const result = await useCase.execute({
        peerId: payload.peerId,
        currentMessage: payload.currentMessage,
      })
      console.log('[Background] Hints generated:', result.hints.length)
      return result
    } catch (err) {
      console.error('[Background] GENERATE_HINTS error:', err)
      throw err
    }
  }
)

onMessage<GetNotesPayload>(
  MessageType.GET_NOTES,
  async (payload) => {
    const useCase = new ManageNotesUseCase(noteStore)
    return useCase.getByPeerId(payload.peerId)
  }
)

onMessage<SaveNotePayload>(
  MessageType.SAVE_NOTE,
  async (payload) => {
    const useCase = new ManageNotesUseCase(noteStore)
    const existing = await useCase.getById(payload.id)
    if (existing) {
      return useCase.update({
        id: payload.id,
        content: payload.content,
        tags: payload.tags,
      })
    } else {
      return useCase.create({
        peerId: payload.peerId,
        content: payload.content,
        tags: payload.tags,
      })
    }
  }
)

onMessage<DeleteNotePayload>(
  MessageType.DELETE_NOTE,
  async (payload) => {
    const useCase = new ManageNotesUseCase(noteStore)
    await useCase.delete(payload.id)
  }
)

onMessage<DialogueStatusPayload>(
  MessageType.GET_DIALOGUE_STATUS,
  async (payload) => {
    return dialogueStore.findByPeerId(payload.peerId)
  }
)

onMessage<undefined>(
  MessageType.GET_SETTINGS,
  async () => {
    return getSettings()
  }
)

onMessage<SettingsPayload>(
  MessageType.SAVE_SETTINGS,
  async (payload) => {
    await saveSettings(payload)
  }
)

async function initializeExtension() {
  console.log('[Background] Extension initialized')
  console.log('[Background] BM25 RAG adapter ready')

  const settings = await getSettings()
  if (settings.apiKey) {
    llmAdapter = new LLMAdapter({
      provider: settings.apiProvider,
      apiKey: settings.apiKey,
    })
  }
}

initializeExtension()
