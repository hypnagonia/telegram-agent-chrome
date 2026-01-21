import type { MessageRepository } from '@domain/ports/MessageRepository'
import type { DialogueRepository } from '@domain/ports/DialogueRepository'
import type { RagIndexer } from '@domain/ports/RagIndexer'

export interface SyncIndexOutput {
  success: boolean
  dialoguesProcessed: number
  totalMessages: number
}

export class SyncIndexUseCase {
  constructor(
    private messageRepository: MessageRepository,
    private dialogueRepository: DialogueRepository,
    private ragIndexer: RagIndexer
  ) {}

  async execute(): Promise<SyncIndexOutput> {
    await this.ragIndexer.clear()

    const dialogues = await this.dialogueRepository.findAll()
    let totalMessages = 0

    for (const dialogue of dialogues) {
      if (!dialogue.isIndexed) {
        continue
      }

      const messages = await this.messageRepository.findByPeerId(dialogue.peerId)
      if (messages.length === 0) {
        continue
      }

      const content = this.formatMessages(messages)
      await this.ragIndexer.index(`dialogue-${dialogue.peerId}`, content)
      totalMessages += messages.length
    }

    return {
      success: true,
      dialoguesProcessed: dialogues.filter((d) => d.isIndexed).length,
      totalMessages,
    }
  }

  private formatMessages(
    messages: { timestamp: number; isOutgoing: boolean; senderName: string; text: string }[]
  ): string {
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
