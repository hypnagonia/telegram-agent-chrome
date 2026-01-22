import { TelegramDOMAdapter } from '@infrastructure/adapters/telegram/TelegramDOMAdapter'
import {
  MessageType,
  sendToBackground,
  type DialogueChangedPayload,
  type NewMessagePayload,
  type MessagesExtractedPayload,
  type BridgeMessage,
} from '@infrastructure/adapters/telegram/MessageBridge'
import { createLogger } from '@infrastructure/logging/remoteLog'

const { log } = createLogger('Content')

const adapter = new TelegramDOMAdapter()
let indexedMessageIds = new Set<string>()

chrome.runtime.onMessage.addListener((message: BridgeMessage, _sender, sendResponse) => {
  if (message.type === MessageType.EXTRACT_MESSAGES) {
    console.log('[Content] EXTRACT_MESSAGES received, extracting...')
    const hash = window.location.hash
    if (hash && hash.length > 1) {
      const peerId = hash.slice(1)
      const peerName = adapter.getCurrentPeerName() || peerId
      const messages = adapter.extractMessagesFromDOM()
      console.log('[Content] Extracted', messages.length, 'messages for', peerId)
      sendResponse({ peerId, peerName, messages })
    } else {
      console.log('[Content] No hash in URL')
      sendResponse({ peerId: null, peerName: null, messages: [] })
    }
    return true
  }

  if (message.type === MessageType.INSERT_TEXT) {
    const payload = message.payload as { text: string }
    log('INSERT_TEXT received', { text: payload.text.slice(0, 50) })
    const success = adapter.insertTextToInput(payload.text)
    log('INSERT_TEXT result', { success })
    sendResponse({ success })
    return true
  }

  return false
})

async function sendDialogueUpdate(peerId: string, peerName: string) {
  console.log('[Content] Sending dialogue update:', { peerId, peerName })

  await sendToBackground<DialogueChangedPayload, void>({
    type: MessageType.DIALOGUE_CHANGED,
    payload: { peerId, peerName },
  })

  const messages = adapter.extractMessagesFromDOM()
  console.log('[Content] Extracted messages:', messages.length)

  if (messages.length > 0) {
    const newMessages = messages.filter(m => !indexedMessageIds.has(m.id))
    console.log('[Content] New messages to index:', newMessages.length)

    if (newMessages.length > 0) {
      const payload: MessagesExtractedPayload = {
        peerId,
        messages: newMessages.map((m) => ({
          id: m.id,
          peerId,
          text: m.text,
          isOutgoing: m.isOutgoing,
          senderName: m.senderName,
          timestamp: m.timestamp,
        })),
      }
      await sendToBackground<MessagesExtractedPayload, void>({
        type: MessageType.MESSAGES_EXTRACTED,
        payload,
      })
      newMessages.forEach(m => indexedMessageIds.add(m.id))
    }
  }
}

async function checkForNewMessagesOnScroll() {
  const hash = window.location.hash
  if (!hash || hash.length <= 1) {
    log('Check: no hash in URL')
    return
  }

  const peerId = hash.slice(1)
  const messages = adapter.extractMessagesFromDOM()
  log('Check: extracted messages', { count: messages.length, indexedSoFar: indexedMessageIds.size, peerId })

  const newMessages = messages.filter(m => !indexedMessageIds.has(m.id))

  if (newMessages.length > 0) {
    log('Found NEW messages to index', { count: newMessages.length, ids: newMessages.map(m => m.id).slice(0, 5) })

    const payload: MessagesExtractedPayload = {
      peerId,
      messages: newMessages.map((m) => ({
        id: m.id,
        peerId,
        text: m.text,
        isOutgoing: m.isOutgoing,
        senderName: m.senderName,
        timestamp: m.timestamp,
      })),
    }
    try {
      await sendToBackground<MessagesExtractedPayload, void>({
        type: MessageType.MESSAGES_EXTRACTED,
        payload,
      })
      newMessages.forEach(m => indexedMessageIds.add(m.id))
      log('Auto-indexed messages successfully', { count: newMessages.length })
    } catch (err) {
      log('Failed to send messages to background', { error: String(err) })
    }
  } else {
    log('No new messages found')
  }
}

let scrollCheckInterval: ReturnType<typeof setInterval> | null = null

function setupScrollListener() {
  if (scrollCheckInterval) {
    clearInterval(scrollCheckInterval)
  }

  log('Setting up periodic message check (every 2s)')

  scrollCheckInterval = setInterval(() => {
    log('Periodic check triggered')
    checkForNewMessagesOnScroll()
  }, 2000)

  log('Periodic message check started', { intervalId: scrollCheckInterval })
}

async function detectAndSendDialogue() {
  const hash = window.location.hash
  if (hash && hash.length > 1) {
    const peerId = hash.slice(1)
    const peerName = adapter.getCurrentPeerName() || peerId
    console.log('[Content] Detected dialogue from URL:', { peerId, peerName })
    await sendDialogueUpdate(peerId, peerName)
  }
}

async function initialize() {
  log('Content script initialized', { url: window.location.href, hash: window.location.hash })

  adapter.onDialogueChange(async (event) => {
    log('Dialogue changed event', event)
    indexedMessageIds.clear()
    if (scrollCheckInterval) {
      clearInterval(scrollCheckInterval)
      scrollCheckInterval = null
    }
    await sendDialogueUpdate(event.peerId, event.peerName)
    setupScrollListener()
  })

  adapter.onNewMessage(async (event) => {
    if (indexedMessageIds.has(event.message.id)) {
      return
    }
    console.log('[Content] New message:', event.message.text.slice(0, 50))
    indexedMessageIds.add(event.message.id)

    const payload: NewMessagePayload = {
      id: event.message.id,
      peerId: event.peerId,
      text: event.message.text,
      isOutgoing: event.message.isOutgoing,
      senderName: event.message.senderName,
      timestamp: event.message.timestamp,
    }

    await sendToBackground<NewMessagePayload, void>({
      type: MessageType.NEW_MESSAGE,
      payload,
    })
  })

  window.addEventListener('hashchange', () => {
    console.log('[Content] Hash changed:', window.location.hash)
    indexedMessageIds.clear()
    if (scrollCheckInterval) {
      clearInterval(scrollCheckInterval)
      scrollCheckInterval = null
    }
    detectAndSendDialogue()
    setTimeout(setupScrollListener, 500)
  })

  adapter.startObserving()

  setTimeout(() => {
    detectAndSendDialogue()
    setupScrollListener()
  }, 500)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}
