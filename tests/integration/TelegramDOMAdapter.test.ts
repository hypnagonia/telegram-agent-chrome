import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TelegramDOMAdapter } from '@infrastructure/adapters/telegram/TelegramDOMAdapter'
import { createTelegramPage, createBubble } from '../fixtures/telegram-dom'

describe('TelegramDOMAdapter', () => {
  let adapter: TelegramDOMAdapter

  beforeEach(() => {
    adapter = new TelegramDOMAdapter()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    adapter.stopObserving()
    document.body.innerHTML = ''
  })

  describe('getCurrentPeerName', () => {
    it('should return peer name from DOM', () => {
      createTelegramPage({
        peerTitle: 'John Doe',
        messages: [],
      })

      const peerName = adapter.getCurrentPeerName()
      expect(peerName).toBe('John Doe')
    })

    it('should return null when no peer title', () => {
      document.body.innerHTML = '<div class="chat"></div>'

      const peerName = adapter.getCurrentPeerName()
      expect(peerName).toBeNull()
    })
  })

  describe('extractMessagesFromDOM', () => {
    it('should extract messages from bubbles', () => {
      createTelegramPage({
        peerTitle: 'John',
        messages: [
          { id: 'msg-1', text: 'Hello', isOutgoing: false, senderName: 'John' },
          { id: 'msg-2', text: 'Hi there', isOutgoing: true },
          { id: 'msg-3', text: 'How are you?', isOutgoing: false, senderName: 'John' },
        ],
      })

      const messages = adapter.extractMessagesFromDOM()

      expect(messages.length).toBe(3)
      expect(messages[0].text).toBe('Hello')
      expect(messages[1].text).toBe('Hi there')
      expect(messages[2].text).toBe('How are you?')
    })

    it('should identify outgoing messages', () => {
      createTelegramPage({
        peerTitle: 'John',
        messages: [
          { id: 'msg-1', text: 'Incoming', isOutgoing: false },
          { id: 'msg-2', text: 'Outgoing', isOutgoing: true },
        ],
      })

      const messages = adapter.extractMessagesFromDOM()

      expect(messages[0].isOutgoing).toBe(false)
      expect(messages[1].isOutgoing).toBe(true)
    })

    it('should extract sender names', () => {
      createTelegramPage({
        peerTitle: 'Group Chat',
        messages: [
          { id: 'msg-1', text: 'Hello', senderName: 'Alice' },
          { id: 'msg-2', text: 'Hi', senderName: 'Bob' },
        ],
      })

      const messages = adapter.extractMessagesFromDOM()

      expect(messages[0].senderName).toBe('Alice')
      expect(messages[1].senderName).toBe('Bob')
    })

    it('should use "You" for outgoing messages without sender', () => {
      createTelegramPage({
        peerTitle: 'John',
        messages: [
          { id: 'msg-1', text: 'My message', isOutgoing: true },
        ],
      })

      const messages = adapter.extractMessagesFromDOM()
      expect(messages[0].senderName).toBe('You')
    })

    it('should skip bubbles without message id', () => {
      document.body.innerHTML = `
        <div class="chat">
          <div class="bubbles"><div class="bubbles-inner">
            <div class="bubble" data-mid="valid-1">
              <div class="message">Valid message</div>
            </div>
            <div class="bubble">
              <div class="message">Invalid - no id</div>
            </div>
          </div></div>
        </div>
      `

      const messages = adapter.extractMessagesFromDOM()
      expect(messages.length).toBe(1)
      expect(messages[0].id).toBe('valid-1')
    })

    it('should skip bubbles without text', () => {
      document.body.innerHTML = `
        <div class="chat">
          <div class="bubbles"><div class="bubbles-inner">
            <div class="bubble" data-mid="msg-1">
              <div class="message">Has text</div>
            </div>
            <div class="bubble" data-mid="msg-2">
              <div class="message"></div>
            </div>
          </div></div>
        </div>
      `

      const messages = adapter.extractMessagesFromDOM()
      expect(messages.length).toBe(1)
    })

    it('should return empty array when no bubbles', () => {
      document.body.innerHTML = '<div class="chat"><div class="bubbles"><div class="bubbles-inner"></div></div></div>'

      const messages = adapter.extractMessagesFromDOM()
      expect(messages).toEqual([])
    })
  })

  describe('detectCurrentDialogue', () => {
    it('should detect dialogue from URL hash', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#@johndoe' },
        writable: true,
      })
      createTelegramPage({
        peerTitle: 'John Doe',
        messages: [],
      })

      const dialogue = adapter.detectCurrentDialogue()

      expect(dialogue).not.toBeNull()
      expect(dialogue?.peerId).toBe('@johndoe')
      expect(dialogue?.peerName).toBe('John Doe')
    })

    it('should return null when no chat container', () => {
      document.body.innerHTML = '<div>No chat</div>'

      const dialogue = adapter.detectCurrentDialogue()
      expect(dialogue).toBeNull()
    })
  })

  describe('onDialogueChange', () => {
    it('should register callback', () => {
      const callback = vi.fn()
      const unsubscribe = adapter.onDialogueChange(callback)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should unsubscribe callback', () => {
      const callback = vi.fn()
      const unsubscribe = adapter.onDialogueChange(callback)

      unsubscribe()
    })
  })

  describe('onNewMessage', () => {
    it('should register callback', () => {
      const callback = vi.fn()
      const unsubscribe = adapter.onNewMessage(callback)

      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('getCurrentInputText', () => {
    it('should return input text', () => {
      document.body.innerHTML = `
        <div class="input-message-input">Draft message here</div>
      `

      const text = adapter.getCurrentInputText()
      expect(text).toBe('Draft message here')
    })

    it('should return empty string when no input', () => {
      document.body.innerHTML = '<div></div>'

      const text = adapter.getCurrentInputText()
      expect(text).toBe('')
    })
  })

  describe('startObserving / stopObserving', () => {
    it('should start and stop without errors', () => {
      createTelegramPage({
        peerTitle: 'John',
        messages: [],
      })

      expect(() => adapter.startObserving()).not.toThrow()
      expect(() => adapter.stopObserving()).not.toThrow()
    })
  })
})
