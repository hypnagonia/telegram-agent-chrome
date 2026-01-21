export interface Message {
  id: string
  peerId: string
  text: string
  timestamp: number
  isOutgoing: boolean
  senderName: string
}

export class MessageBuilder {
  private message: Partial<Message> = {}

  withId(id: string): this {
    this.message.id = id
    return this
  }

  withPeerId(peerId: string): this {
    this.message.peerId = peerId
    return this
  }

  withText(text: string): this {
    this.message.text = text
    return this
  }

  withTimestamp(timestamp: number): this {
    this.message.timestamp = timestamp
    return this
  }

  withIsOutgoing(isOutgoing: boolean): this {
    this.message.isOutgoing = isOutgoing
    return this
  }

  withSenderName(senderName: string): this {
    this.message.senderName = senderName
    return this
  }

  build(): Message {
    if (!this.message.id || !this.message.peerId || !this.message.text) {
      throw new Error('Message requires id, peerId, and text')
    }
    return {
      id: this.message.id,
      peerId: this.message.peerId,
      text: this.message.text,
      timestamp: this.message.timestamp ?? Date.now(),
      isOutgoing: this.message.isOutgoing ?? false,
      senderName: this.message.senderName ?? '',
    }
  }
}
