import type { HintRequest } from '@domain/entities/Hint'

export interface PromptTemplateData {
  context: string
  recentMessages: string
  userInput: string
}

export class PromptBuilder {
  buildHintPrompt(
    request: HintRequest,
    promptTemplate: string,
    context: string[],
    recentMessages: string[]
  ): string {
    const contextText = context.length > 0
      ? context.join('\n')
      : '(no indexed context available)'

    const recentText = recentMessages.length > 0
      ? recentMessages.join('\n')
      : '(no recent messages)'

    const userInput = request.currentMessage || ''

    const processedTemplate = promptTemplate
      .replace(/\{\{context\}\}/g, contextText)
      .replace(/\{\{recent_messages\}\}/g, recentText)
      .replace(/\{\{user_input\}\}/g, userInput)

    return `${processedTemplate}

CRITICAL: My input "${userInput}" is just the TOPIC/IDEA. Generate replies that:
- Do NOT start with or contain "${userInput}" verbatim
- Are complete standalone messages I can send
- Respond TO the conversation, not echo my input

Generate 1-3 reply suggestions as a JSON array:
["suggestion 1", "suggestion 2"]

Only output the JSON array.`
  }
}
