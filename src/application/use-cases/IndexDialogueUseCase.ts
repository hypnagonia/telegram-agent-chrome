import type { Message } from '@domain/entities/Message'
import type { MessageRepository } from '@domain/ports/MessageRepository'
import type { DialogueRepository } from '@domain/ports/DialogueRepository'
import type { RagIndexer } from '@domain/ports/RagIndexer'
import { DialogueBuilder } from '@domain/entities/Dialogue'

export interface IndexDialogueInput {
  peerId: string
  peerName: string
  messages: Message[]
}

export interface IndexDialogueOutput {
  success: boolean
  messageCount: number
  chunkCount: number
}

export class IndexDialogueUseCase {
  constructor(
    private messageRepository: MessageRepository,
    private dialogueRepository: DialogueRepository,
    private ragIndexer: RagIndexer
  ) {}

  async execute(input: IndexDialogueInput): Promise<IndexDialogueOutput> {
    await this.messageRepository.saveBatch(input.messages)

    await this.ragIndexer.clear()

    const content = this.formatMessagesForIndex(input.messages)
    await this.ragIndexer.index(`dialogue-${input.peerId}`, content)

    const stats = await this.ragIndexer.getStats()

    const dialogue = new DialogueBuilder()
      .withPeerId(input.peerId)
      .withPeerName(input.peerName)
      .withIsIndexed(true)
      .withLastIndexedAt(Date.now())
      .withMessageCount(input.messages.length)
      .build()

    await this.dialogueRepository.save(dialogue)

    return {
      success: true,
      messageCount: input.messages.length,
      chunkCount: stats.chunkCount,
    }
  }

  private formatMessagesForIndex(messages: Message[]): string {
    return messages
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((msg) => {
        const sender = msg.isOutgoing ? 'You' : msg.senderName
        const time = new Date(msg.timestamp).toLocaleTimeString()
        return `[${time}] ${sender}: ${msg.text}`
      })
      .join('\n')
  }
}
