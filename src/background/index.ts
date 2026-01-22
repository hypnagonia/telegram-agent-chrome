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
import { DialogueStore } from '@infrastructure/adapters/persistence/DialogueStore'
import { BM25Adapter } from '@infrastructure/adapters/rag/BM25Adapter'
import { LLMAdapter, type LLMProviderType } from '@infrastructure/adapters/llm/LLMAdapter'
import { IndexDialogueUseCase } from '@application/use-cases/IndexDialogueUseCase'
import { QueryContextUseCase } from '@application/use-cases/QueryContextUseCase'
import { GenerateHintUseCase } from '@application/use-cases/GenerateHintUseCase'
import { ManageNotesUseCase } from '@application/use-cases/ManageNotesUseCase'
import { MessageBuilder } from '@domain/entities/Message'
import { createLogger } from '@infrastructure/logging/remoteLog'

const log = createLogger('Background')

const messageStore = new MessageStore()
const noteStore = new NoteStore()
const dialogueStore = new DialogueStore()
const ragAdapter = new BM25Adapter()

let llmAdapter: LLMAdapter | null = null
let currentDialogue: { peerId: string; peerName: string } | null = null

const DEFAULT_PROMPT_TEMPLATE = `You are a helpful assistant generating reply suggestions for a Telegram conversation.

Tone: friendly, casual

Conversation context:
{{context}}

Recent messages:
{{recent_messages}}

User wants to reply: "{{user_input}}"

Based on the context, suggest brief, natural replies that match the conversation tone.`

interface Settings {
  apiKey: string
  apiProvider: LLMProviderType
  personaId: string
  theme: 'light' | 'dark'
  promptTemplate: string
}

async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(['apiKey', 'apiProvider', 'personaId', 'theme', 'promptTemplate'])
  return {
    apiKey: result.apiKey || '',
    apiProvider: result.apiProvider || 'deepseek',
    personaId: result.personaId || 'default',
    theme: result.theme || 'dark',
    promptTemplate: result.promptTemplate || DEFAULT_PROMPT_TEMPLATE,
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
  log.log(' ensureLLMAdapter called, current adapter:', !!llmAdapter)
  if (!llmAdapter) {
    const settings = await getSettings()
    log.log(' Settings loaded:', {
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
    log.log(' LLM adapter created for provider:', settings.apiProvider)
  }
  return llmAdapter
}

function isTelegramUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname === 'web.telegram.org'
  } catch {
    return false
  }
}

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

chrome.sidePanel.setOptions({ enabled: false })

async function updateSidePanelForTab(tabId: number, url: string | undefined) {
  const isTelegram = isTelegramUrl(url)
  if (isTelegram) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: true
    })
  } else {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    })
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  log.log(' Tab activated:', activeInfo.tabId)
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    await updateSidePanelForTab(activeInfo.tabId, tab.url)
    const isTelegram = isTelegramUrl(tab.url)

    if (!isTelegram) {
      currentDialogue = null
      chrome.runtime.sendMessage({
        type: MessageType.DIALOGUE_CHANGED,
        payload: { peerId: null, peerName: null },
      }).catch(() => {})
      return
    }

    if (tab.url && tab.id) {
      const url = new URL(tab.url)
      if (url.hash.length > 1) {
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
        log.log(' Tab has Telegram dialogue:', peerId, 'name:', peerName)
        currentDialogue = { peerId, peerName }
        chrome.runtime.sendMessage({
          type: MessageType.DIALOGUE_CHANGED,
          payload: { peerId, peerName },
        }).catch(() => {})
      }
    }
  } catch (err) {
    log.error(' Tab activation error:', err)
  }
})

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url && tab.id) {
    await updateSidePanelForTab(tab.id, tab.url)
    const isTelegram = isTelegramUrl(tab.url)

    if (isTelegram) {
      try {
        const url = new URL(tab.url)
        if (url.hash.length > 1) {
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
          log.log(' Tab URL updated, dialogue:', peerId)
          currentDialogue = { peerId, peerName }
          chrome.runtime.sendMessage({
            type: MessageType.DIALOGUE_CHANGED,
            payload: { peerId, peerName },
          }).catch(() => {})
        }
      } catch (err) {
        log.error(' Tab update error:', err)
      }
    }
  }
})

onMessage<DialogueChangedPayload>(
  MessageType.DIALOGUE_CHANGED,
  async (payload) => {
    log.log(' Dialogue changed:', payload.peerName)
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
    log.log(' GET_ACTIVE_TAB_PEER called')
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      log.log(' Active tab:', tab?.url)
      if (tab?.url && tab.id) {
        const url = new URL(tab.url)
        log.log(' Parsed URL - hostname:', url.hostname, 'hash:', url.hash)
        if (url.hostname === 'web.telegram.org' && url.hash.length > 1) {
          const peerId = url.hash.slice(1)
          log.log(' Got peerId from active tab:', peerId)

          let peerName = peerId
          try {
            const extracted = await chrome.tabs.sendMessage(tab.id, {
              type: MessageType.EXTRACT_MESSAGES,
              payload: {},
            }) as { peerId: string | null; peerName: string | null }
            if (extracted?.peerName) {
              peerName = extracted.peerName
              log.log(' Got peerName from content script:', peerName)
            }
          } catch (e) {
            log.log(' Could not get peerName from content script')
          }

          currentDialogue = { peerId, peerName }
          return { peerId, peerName }
        }
      }
    } catch (err) {
      log.error(' Error getting active tab:', err)
    }
    log.log(' GET_ACTIVE_TAB_PEER returning null')
    return null
  }
)

onMessage<NewMessagePayload>(
  MessageType.NEW_MESSAGE,
  async (payload) => {
    log.log(' NEW_MESSAGE received:', payload.id, payload.text.slice(0, 30))
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
      log.log(' Auto-indexed new message into BM25')

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
    log.log(' MESSAGES_EXTRACTED received:', payload.peerId, 'count:', payload.messages.length)
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
    log.log(' Messages saved to store')

    const textsToIndex = payload.messages
      .filter(m => m.text.trim().length > 0)
      .map(m => `[${m.senderName}]: ${m.text}`)

    if (textsToIndex.length > 0) {
      const content = textsToIndex.join('\n')
      await ragAdapter.index(payload.peerId, content)
      log.log(' Auto-indexed', textsToIndex.length, 'messages into BM25')

      const dialogue = await dialogueStore.findByPeerId(payload.peerId)
      const newCount = (dialogue?.messageCount || 0) + textsToIndex.length
      if (dialogue) {
        await dialogueStore.save({
          ...dialogue,
          messageCount: newCount,
          lastIndexedAt: Date.now(),
        })
      }

      chrome.runtime.sendMessage({
        type: MessageType.INDEX_UPDATED,
        payload: { peerId: payload.peerId, messageCount: newCount },
      }).catch(() => {})
    }
  }
)

onMessage<IndexDialoguePayload>(
  MessageType.INDEX_DIALOGUE,
  async (payload) => {
    log.log(' INDEX_DIALOGUE called:', payload)

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      throw new Error('No active Telegram tab found. Please open Telegram Web.')
    }

    let extracted: { peerId: string | null; peerName: string | null; messages: Array<{ id: string; text: string; isOutgoing: boolean; senderName: string; timestamp: number }> } | null = null

    try {
      log.log(' Requesting message extraction from content script...')
      extracted = await chrome.tabs.sendMessage(tab.id, {
        type: MessageType.EXTRACT_MESSAGES,
        payload: {},
      })
      log.log(' Extraction result:', extracted?.messages?.length || 0, 'messages')
    } catch (err) {
      log.error(' Content script not responding:', err)
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
      log.log(' Saved', messages.length, 'messages from extraction')
    }

    const messages = await messageStore.findByPeerId(payload.peerId)
    log.log(' Total messages in store:', messages.length)

    if (messages.length === 0) {
      throw new Error('No messages found to index. Make sure you have a chat open in Telegram Web.')
    }

    const useCase = new IndexDialogueUseCase(messageStore, dialogueStore, ragAdapter)
    const result = await useCase.execute({
      peerId: payload.peerId,
      peerName: payload.peerName,
      messages,
    })
    log.log(' Index result:', result)
    return result
  }
)

onMessage<ClearIndexPayload>(
  MessageType.CLEAR_INDEX,
  async (payload) => {
    log.log(' CLEAR_INDEX called for:', payload.peerId)
    try {
      log.log(' Clearing BM25 index...')
      await ragAdapter.clearByPeerId(payload.peerId)
      log.log(' Deleting messages from store...')
      await messageStore.deleteByPeerId(payload.peerId)
      log.log(' Deleting dialogue metadata...')
      await dialogueStore.delete(payload.peerId)
      log.log(' Index cleared successfully for peer:', payload.peerId)
      return { success: true }
    } catch (err) {
      log.error(' CLEAR_INDEX error:', err)
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
    log.log(' GENERATE_HINTS called:', payload)
    try {
      const adapter = await ensureLLMAdapter()
      const settings = await getSettings()
      log.log(' LLM adapter ready')
      const useCase = new GenerateHintUseCase(adapter, ragAdapter, messageStore)
      const result = await useCase.execute({
        peerId: payload.peerId,
        currentMessage: payload.currentMessage,
        promptTemplate: settings.promptTemplate,
      })
      log.log(' Hints generated:', result.hints.length)
      return result
    } catch (err) {
      log.error(' GENERATE_HINTS error:', err)
      throw err
    }
  }
)

onMessage<GetNotesPayload>(
  MessageType.GET_NOTES,
  async (payload) => {
    log.log(' GET_NOTES called:', payload.peerId)
    const useCase = new ManageNotesUseCase(noteStore)
    const notes = await useCase.getByPeerId(payload.peerId)
    log.log(' GET_NOTES returning:', notes.length, 'notes')
    return notes
  }
)

onMessage<SaveNotePayload>(
  MessageType.SAVE_NOTE,
  async (payload) => {
    log.log(' SAVE_NOTE called:', { id: payload.id, peerId: payload.peerId })
    const useCase = new ManageNotesUseCase(noteStore)
    const existing = await useCase.getById(payload.id)
    if (existing) {
      log.log(' Updating existing note:', payload.id)
      return useCase.update({
        id: payload.id,
        content: payload.content,
        tags: payload.tags,
      })
    } else {
      log.log(' Creating new note:', payload.id)
      return useCase.create({
        id: payload.id,
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
    log.log(' DELETE_NOTE called:', payload.id)
    const useCase = new ManageNotesUseCase(noteStore)
    await useCase.delete(payload.id)
    log.log(' DELETE_NOTE completed')
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
  log.log(' Extension initialized')
  log.log(' BM25 RAG adapter ready')

  const settings = await getSettings()
  if (settings.apiKey) {
    llmAdapter = new LLMAdapter({
      provider: settings.apiProvider,
      apiKey: settings.apiKey,
    })
  }

  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.id) {
      await updateSidePanelForTab(tab.id, tab.url)
    }
  }
}

initializeExtension()
