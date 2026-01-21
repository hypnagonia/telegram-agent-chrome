export interface Hint {
  id: string
  text: string
  confidence: number
  generatedAt: number
}

export interface HintRequest {
  peerId: string
  currentMessage: string
  contextMessages: string[]
}

export interface HintResponse {
  hints: Hint[]
  contextUsed: number
}

export class HintBuilder {
  private hint: Partial<Hint> = {}

  withId(id: string): this {
    this.hint.id = id
    return this
  }

  withText(text: string): this {
    this.hint.text = text
    return this
  }

  withConfidence(confidence: number): this {
    this.hint.confidence = confidence
    return this
  }

  withGeneratedAt(generatedAt: number): this {
    this.hint.generatedAt = generatedAt
    return this
  }

  build(): Hint {
    if (!this.hint.id || !this.hint.text) {
      throw new Error('Hint requires id and text')
    }
    return {
      id: this.hint.id,
      text: this.hint.text,
      confidence: this.hint.confidence ?? 0.5,
      generatedAt: this.hint.generatedAt ?? Date.now(),
    }
  }
}
