import Dexie, { type Table } from 'dexie'
import type { Message } from '@domain/entities/Message'
import type { Note } from '@domain/entities/Note'
import type { Persona } from '@domain/entities/Persona'
import type { Dialogue } from '@domain/entities/Dialogue'

export interface MessageRecord {
  id: string
  peerId: string
  text: string
  timestamp: number
  isOutgoing: boolean
  senderName: string
}

export interface NoteRecord {
  id: string
  peerId: string
  content: string
  createdAt: number
  updatedAt: number
  tags: string[]
}

export interface PersonaRecord {
  id: string
  name: string
  promptTemplate: string
  tone: string
  isDefault: boolean
}

export interface DialogueRecord {
  peerId: string
  peerName: string
  isIndexed: boolean
  lastIndexedAt: number | null
  messageCount: number
}

export class TelegramAssistantDB extends Dexie {
  messages!: Table<MessageRecord, string>
  notes!: Table<NoteRecord, string>
  personas!: Table<PersonaRecord, string>
  dialogues!: Table<DialogueRecord, string>

  constructor() {
    super('TelegramAssistantDB')

    this.version(1).stores({
      messages: 'id, peerId, timestamp',
      notes: 'id, peerId, createdAt, updatedAt',
      personas: 'id, isDefault',
      dialogues: 'peerId, isIndexed',
    })
  }
}

export const db = new TelegramAssistantDB()

export function messageToRecord(message: Message): MessageRecord {
  return {
    id: message.id,
    peerId: message.peerId,
    text: message.text,
    timestamp: message.timestamp,
    isOutgoing: message.isOutgoing,
    senderName: message.senderName,
  }
}

export function recordToMessage(record: MessageRecord): Message {
  return {
    id: record.id,
    peerId: record.peerId,
    text: record.text,
    timestamp: record.timestamp,
    isOutgoing: record.isOutgoing,
    senderName: record.senderName,
  }
}

export function noteToRecord(note: Note): NoteRecord {
  return {
    id: note.id,
    peerId: note.peerId,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    tags: note.tags,
  }
}

export function recordToNote(record: NoteRecord): Note {
  return {
    id: record.id,
    peerId: record.peerId,
    content: record.content,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    tags: record.tags,
  }
}

export function personaToRecord(persona: Persona): PersonaRecord {
  return {
    id: persona.id,
    name: persona.name,
    promptTemplate: persona.promptTemplate,
    tone: persona.tone,
    isDefault: persona.isDefault,
  }
}

export function recordToPersona(record: PersonaRecord): Persona {
  return {
    id: record.id,
    name: record.name,
    promptTemplate: record.promptTemplate,
    tone: record.tone,
    isDefault: record.isDefault,
  }
}

export function dialogueToRecord(dialogue: Dialogue): DialogueRecord {
  return {
    peerId: dialogue.peerId,
    peerName: dialogue.peerName,
    isIndexed: dialogue.isIndexed,
    lastIndexedAt: dialogue.lastIndexedAt,
    messageCount: dialogue.messageCount,
  }
}

export function recordToDialogue(record: DialogueRecord): Dialogue {
  return {
    peerId: record.peerId,
    peerName: record.peerName,
    isIndexed: record.isIndexed,
    lastIndexedAt: record.lastIndexedAt,
    messageCount: record.messageCount,
  }
}
