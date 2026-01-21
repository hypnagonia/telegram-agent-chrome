export interface Persona {
  id: string
  name: string
  promptTemplate: string
  tone: string
  isDefault: boolean
}

export class PersonaBuilder {
  private persona: Partial<Persona> = {}

  withId(id: string): this {
    this.persona.id = id
    return this
  }

  withName(name: string): this {
    this.persona.name = name
    return this
  }

  withPromptTemplate(promptTemplate: string): this {
    this.persona.promptTemplate = promptTemplate
    return this
  }

  withTone(tone: string): this {
    this.persona.tone = tone
    return this
  }

  withIsDefault(isDefault: boolean): this {
    this.persona.isDefault = isDefault
    return this
  }

  build(): Persona {
    if (!this.persona.id || !this.persona.name) {
      throw new Error('Persona requires id and name')
    }
    return {
      id: this.persona.id,
      name: this.persona.name,
      promptTemplate: this.persona.promptTemplate ?? '',
      tone: this.persona.tone ?? 'neutral',
      isDefault: this.persona.isDefault ?? false,
    }
  }
}

export const DEFAULT_PERSONA: Persona = {
  id: 'default',
  name: 'Default Assistant',
  promptTemplate: `You are a helpful assistant generating reply suggestions for a Telegram conversation.
Based on the conversation context provided, suggest 3 brief, natural replies.
Consider the tone and style of the conversation.
Keep suggestions concise and conversational.`,
  tone: 'friendly',
  isDefault: true,
}
