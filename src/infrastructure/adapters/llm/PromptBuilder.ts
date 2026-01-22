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

Generate from 1 to 3 reply suggestions. Format your response as a JSON array of strings:
["suggestion 1", "suggestion 2", "suggestion 3"]

Only output the JSON array, nothing else.`
  }
}
