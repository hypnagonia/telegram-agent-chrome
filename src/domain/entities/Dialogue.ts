export interface Dialogue {
  peerId: string
  peerName: string
  isIndexed: boolean
  lastIndexedAt: number | null
  messageCount: number
}

export class DialogueBuilder {
  private dialogue: Partial<Dialogue> = {}

  withPeerId(peerId: string): this {
    this.dialogue.peerId = peerId
    return this
  }

  withPeerName(peerName: string): this {
    this.dialogue.peerName = peerName
    return this
  }

  withIsIndexed(isIndexed: boolean): this {
    this.dialogue.isIndexed = isIndexed
    return this
  }

  withLastIndexedAt(lastIndexedAt: number | null): this {
    this.dialogue.lastIndexedAt = lastIndexedAt
    return this
  }

  withMessageCount(messageCount: number): this {
    this.dialogue.messageCount = messageCount
    return this
  }

  build(): Dialogue {
    if (!this.dialogue.peerId) {
      throw new Error('Dialogue requires peerId')
    }
    return {
      peerId: this.dialogue.peerId,
      peerName: this.dialogue.peerName ?? '',
      isIndexed: this.dialogue.isIndexed ?? false,
      lastIndexedAt: this.dialogue.lastIndexedAt ?? null,
      messageCount: this.dialogue.messageCount ?? 0,
    }
  }
}
