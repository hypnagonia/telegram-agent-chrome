export interface Note {
  id: string
  peerId: string
  content: string
  createdAt: number
  updatedAt: number
  tags: string[]
}

export class NoteBuilder {
  private note: Partial<Note> = {}

  withId(id: string): this {
    this.note.id = id
    return this
  }

  withPeerId(peerId: string): this {
    this.note.peerId = peerId
    return this
  }

  withContent(content: string): this {
    this.note.content = content
    return this
  }

  withCreatedAt(createdAt: number): this {
    this.note.createdAt = createdAt
    return this
  }

  withUpdatedAt(updatedAt: number): this {
    this.note.updatedAt = updatedAt
    return this
  }

  withTags(tags: string[]): this {
    this.note.tags = tags
    return this
  }

  build(): Note {
    if (!this.note.id || !this.note.peerId) {
      throw new Error('Note requires id and peerId')
    }
    const now = Date.now()
    return {
      id: this.note.id,
      peerId: this.note.peerId,
      content: this.note.content ?? '',
      createdAt: this.note.createdAt ?? now,
      updatedAt: this.note.updatedAt ?? now,
      tags: this.note.tags ?? [],
    }
  }
}
