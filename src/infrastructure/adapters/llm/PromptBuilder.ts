import type { Persona } from '@domain/entities/Persona'
import type { HintRequest } from '@domain/entities/Hint'

export class PromptBuilder {
  buildHintPrompt(request: HintRequest, persona: Persona, context: string[]): string {
    const contextSection = context.length > 0
      ? `\n\nRelevant conversation context:\n${context.join('\n')}`
      : ''

    const currentMessageSection = request.currentMessage
      ? `\n\nUser is currently typing: "${request.currentMessage}"`
      : ''

    return `${persona.promptTemplate}

Tone: ${persona.tone}
${contextSection}
${currentMessageSection}

Generate exactly 3 reply suggestions. Format your response as a JSON array of strings:
["suggestion 1", "suggestion 2", "suggestion 3"]

Only output the JSON array, nothing else.`
  }
}
