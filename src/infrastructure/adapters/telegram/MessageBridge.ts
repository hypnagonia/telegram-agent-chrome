export enum MessageType {
  DIALOGUE_CHANGED = 'DIALOGUE_CHANGED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGES_EXTRACTED = 'MESSAGES_EXTRACTED',
  INDEX_DIALOGUE = 'INDEX_DIALOGUE',
  INDEX_UPDATED = 'INDEX_UPDATED',
  CLEAR_INDEX = 'CLEAR_INDEX',
  QUERY_CONTEXT = 'QUERY_CONTEXT',
  GENERATE_HINTS = 'GENERATE_HINTS',
  GET_NOTES = 'GET_NOTES',
  SAVE_NOTE = 'SAVE_NOTE',
  DELETE_NOTE = 'DELETE_NOTE',
  SEARCH_NOTES = 'SEARCH_NOTES',
  GET_DIALOGUE_STATUS = 'GET_DIALOGUE_STATUS',
  GET_CURRENT_DIALOGUE = 'GET_CURRENT_DIALOGUE',
  GET_ACTIVE_TAB_PEER = 'GET_ACTIVE_TAB_PEER',
  GET_SETTINGS = 'GET_SETTINGS',
  SAVE_SETTINGS = 'SAVE_SETTINGS',
  EXTRACT_MESSAGES = 'EXTRACT_MESSAGES',
  GET_PROMPT_TEMPLATES = 'GET_PROMPT_TEMPLATES',
  SAVE_PROMPT_TEMPLATE = 'SAVE_PROMPT_TEMPLATE',
  DELETE_PROMPT_TEMPLATE = 'DELETE_PROMPT_TEMPLATE',
  INSERT_TEXT = 'INSERT_TEXT',
}

export interface BridgeMessage<T = unknown> {
  type: MessageType
  payload: T
}

export interface DialogueChangedPayload {
  peerId: string
  peerName: string
}

export interface NewMessagePayload {
  id: string
  peerId: string
  text: string
  isOutgoing: boolean
  senderName: string
  timestamp: number
}

export interface MessagesExtractedPayload {
  peerId: string
  messages: NewMessagePayload[]
}

export interface IndexDialoguePayload {
  peerId: string
  peerName: string
}

export interface ClearIndexPayload {
  peerId: string
}

export interface IndexUpdatedPayload {
  peerId: string
  messageCount: number
}

export interface QueryContextPayload {
  query: string
  topK: number
}

export interface GenerateHintsPayload {
  peerId: string
  currentMessage: string
}

export interface GetNotesPayload {
  peerId: string
}

export interface SaveNotePayload {
  id: string
  peerId: string
  content: string
  tags: string[]
}

export interface DeleteNotePayload {
  id: string
}

export interface DialogueStatusPayload {
  peerId: string
}

export interface SettingsPayload {
  apiKey?: string
  apiProvider?: 'openai' | 'claude' | 'deepseek'
  apiBaseUrl?: string
  personaId?: string
  theme?: 'light' | 'dark' | 'system'
  promptTemplate?: string
  activeTemplateId?: string
}

export interface SearchNotesPayload {
  query: string
}

export interface SavePromptTemplatePayload {
  id: string
  name: string
  template: string
}

export interface DeletePromptTemplatePayload {
  id: string
}

export interface InsertTextPayload {
  text: string
}

export function sendToBackground<T, R>(message: BridgeMessage<T>): Promise<R> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (response?.error) {
        reject(new Error(response.error))
      } else {
        resolve(response)
      }
    })
  })
}

export function sendToContent<T>(tabId: number, message: BridgeMessage<T>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response)
      }
    })
  })
}

export function onMessage<T>(
  type: MessageType,
  handler: (payload: T, sender: chrome.runtime.MessageSender) => Promise<unknown> | unknown
): void {
  chrome.runtime.onMessage.addListener((message: BridgeMessage<T>, sender, sendResponse) => {
    if (message.type === type) {
      const result = handler(message.payload, sender)
      if (result instanceof Promise) {
        result
          .then((data) => sendResponse(data))
          .catch((err) => sendResponse({ error: err.message }))
        return true
      } else {
        sendResponse(result)
      }
    }
    return false
  })
}
