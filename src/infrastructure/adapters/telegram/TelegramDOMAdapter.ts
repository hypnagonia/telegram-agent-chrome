import type { Message } from '@domain/entities/Message'
import { MessageBuilder } from '@domain/entities/Message'
import { SELECTORS, getBubbleMessageId, isBubbleOutgoing } from './selectors'

export interface ExtractedMessage {
  id: string
  text: string
  isOutgoing: boolean
  senderName: string
  timestamp: number
}

export interface DialogueChangeEvent {
  peerId: string
  peerName: string
}

export interface NewMessageEvent {
  message: ExtractedMessage
  peerId: string
}

export type DialogueChangeCallback = (event: DialogueChangeEvent) => void
export type NewMessageCallback = (event: NewMessageEvent) => void

export class TelegramDOMAdapter {
  private bubblesObserver: MutationObserver | null = null
  private chatObserver: MutationObserver | null = null
  private dialogueChangeCallbacks: DialogueChangeCallback[] = []
  private newMessageCallbacks: NewMessageCallback[] = []
  private currentPeerId: string | null = null
  private processedMessageIds = new Set<string>()

  getCurrentPeerId(): string | null {
    return this.currentPeerId
  }

  getCurrentPeerName(): string | null {
    const peerTitle = document.querySelector(SELECTORS.PEER_TITLE)
    return peerTitle?.textContent?.trim() || null
  }

  extractMessagesFromDOM(): ExtractedMessage[] {
    const messages: ExtractedMessage[] = []
    const bubbles = document.querySelectorAll(SELECTORS.BUBBLE)

    bubbles.forEach((bubble) => {
      const extracted = this.extractMessageFromBubble(bubble)
      if (extracted) {
        messages.push(extracted)
      }
    })

    return messages.sort((a, b) => a.timestamp - b.timestamp)
  }

  private cleanMessageText(text: string): string {
    return text
      .replace(/edited\d{1,2}:\d{2}edited\d{1,2}:\d{2}$/g, '')
      .replace(/\d{1,2}:\d{2}\d{1,2}:\d{2}$/g, '')
      .replace(/edited\d{1,2}:\d{2}$/g, '')
      .replace(/\d{1,2}:\d{2}$/g, '')
      .trim()
  }

  private extractMessageFromBubble(bubble: Element): ExtractedMessage | null {
    const messageId = getBubbleMessageId(bubble)
    if (!messageId) {
      return null
    }

    const messageEl = bubble.querySelector(SELECTORS.MESSAGE_TEXT)
    const rawText = messageEl?.textContent?.trim()
    if (!rawText) {
      return null
    }

    const text = this.cleanMessageText(rawText)
    if (!text) {
      return null
    }

    const isOutgoing = isBubbleOutgoing(bubble)
    const senderEl = bubble.querySelector(SELECTORS.SENDER_NAME)
    const peerId = window.location.hash?.slice(1) || this.currentPeerId
    const senderName = senderEl?.textContent?.trim() || (isOutgoing ? 'You' : peerId || 'Unknown')

    const timeEl = bubble.querySelector(SELECTORS.TIME)
    const timeText = timeEl?.textContent?.trim()
    const timestamp = this.parseTimeToTimestamp(timeText)

    return {
      id: messageId,
      text,
      isOutgoing,
      senderName,
      timestamp,
    }
  }

  private parseTimeToTimestamp(timeText: string | undefined): number {
    if (!timeText) {
      return Date.now()
    }

    const parts = timeText.split(':')
    if (parts.length === 2) {
      const hours = parseInt(parts[0], 10)
      const minutes = parseInt(parts[1], 10)
      const now = new Date()
      now.setHours(hours, minutes, 0, 0)
      return now.getTime()
    }

    return Date.now()
  }

  toMessage(extracted: ExtractedMessage, peerId: string): Message {
    return new MessageBuilder()
      .withId(extracted.id)
      .withPeerId(peerId)
      .withText(extracted.text)
      .withTimestamp(extracted.timestamp)
      .withIsOutgoing(extracted.isOutgoing)
      .withSenderName(extracted.senderName)
      .build()
  }

  detectCurrentDialogue(): DialogueChangeEvent | null {
    const chatContainer = document.querySelector(SELECTORS.CHAT_CONTAINER)
    if (!chatContainer) {
      return null
    }

    const peerId = this.extractPeerIdFromDOM()
    const peerName = this.getCurrentPeerName()

    if (!peerId || !peerName) {
      return null
    }

    return { peerId, peerName }
  }

  private extractPeerIdFromDOM(): string | null {
    const hash = window.location.hash
    if (hash && hash.length > 1) {
      return hash.slice(1)
    }

    const chatContainer = document.querySelector(SELECTORS.CHAT_CONTAINER)
    if (!chatContainer) {
      return null
    }

    const classList = Array.from(chatContainer.classList)
    for (const cls of classList) {
      const match = cls.match(/^peer-(\d+)$/)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  startObserving(): void {
    this.observeChatChanges()
    this.observeNewMessages()
  }

  stopObserving(): void {
    this.bubblesObserver?.disconnect()
    this.chatObserver?.disconnect()
    this.bubblesObserver = null
    this.chatObserver = null
  }

  private observeChatChanges(): void {
    const targetNode = document.body

    this.chatObserver = new MutationObserver(() => {
      const dialogue = this.detectCurrentDialogue()
      if (dialogue && dialogue.peerId !== this.currentPeerId) {
        this.currentPeerId = dialogue.peerId
        this.processedMessageIds.clear()
        this.dialogueChangeCallbacks.forEach((cb) => cb(dialogue))
        this.reattachBubblesObserver()
      }
    })

    this.chatObserver.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    })

    const initialDialogue = this.detectCurrentDialogue()
    if (initialDialogue) {
      this.currentPeerId = initialDialogue.peerId
      this.dialogueChangeCallbacks.forEach((cb) => cb(initialDialogue))
    }
  }

  private reattachBubblesObserver(): void {
    this.bubblesObserver?.disconnect()
    this.observeNewMessages()
  }

  private observeNewMessages(): void {
    const bubblesContainer = document.querySelector(SELECTORS.BUBBLES_INNER)
    if (!bubblesContainer) {
      return
    }

    this.bubblesObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            this.processNewNode(node)
          }
        }
      }
    })

    this.bubblesObserver.observe(bubblesContainer, {
      childList: true,
      subtree: true,
    })
  }

  private processNewNode(node: Element): void {
    if (!this.currentPeerId) {
      return
    }

    const bubbles = node.classList.contains('bubble')
      ? [node]
      : Array.from(node.querySelectorAll(SELECTORS.BUBBLE))

    for (const bubble of bubbles) {
      const messageId = getBubbleMessageId(bubble)
      if (!messageId || this.processedMessageIds.has(messageId)) {
        continue
      }

      const extracted = this.extractMessageFromBubble(bubble)
      if (extracted) {
        this.processedMessageIds.add(messageId)
        this.newMessageCallbacks.forEach((cb) =>
          cb({ message: extracted, peerId: this.currentPeerId! })
        )
      }
    }
  }

  onDialogueChange(callback: DialogueChangeCallback): () => void {
    this.dialogueChangeCallbacks.push(callback)
    return () => {
      const index = this.dialogueChangeCallbacks.indexOf(callback)
      if (index > -1) {
        this.dialogueChangeCallbacks.splice(index, 1)
      }
    }
  }

  onNewMessage(callback: NewMessageCallback): () => void {
    this.newMessageCallbacks.push(callback)
    return () => {
      const index = this.newMessageCallbacks.indexOf(callback)
      if (index > -1) {
        this.newMessageCallbacks.splice(index, 1)
      }
    }
  }

  getCurrentInputText(): string {
    const input = document.querySelector(SELECTORS.INPUT_MESSAGE)
    return input?.textContent?.trim() || ''
  }

  insertTextToInput(text: string): boolean {
    const input = document.querySelector(SELECTORS.INPUT_MESSAGE) as HTMLElement
    if (!input) {
      console.log('[TelegramDOM] Input not found')
      return false
    }

    console.log('[TelegramDOM] Inserting text:', text.slice(0, 50))

    input.focus()

    input.innerHTML = ''
    const textNode = document.createTextNode(text)
    input.appendChild(textNode)

    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text,
    })
    input.dispatchEvent(inputEvent)

    input.dispatchEvent(new Event('change', { bubbles: true }))

    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(input)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)

    return true
  }
}
