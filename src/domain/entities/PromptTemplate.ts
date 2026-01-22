export interface PromptTemplate {
  id: string
  name: string
  template: string
  isDefault: boolean
  createdAt: number
}

export const PRESET_TEMPLATES: PromptTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    template: `You are a helpful assistant generating reply suggestions for a Telegram conversation.

Tone: friendly, casual

Conversation context:
{{context}}

Recent messages:
{{recent_messages}}

User wants to reply: "{{user_input}}"

Based on the context, suggest brief, natural replies that match the conversation tone.`,
    isDefault: true,
    createdAt: 0,
  },
  {
    id: 'formal',
    name: 'Formal',
    template: `You are a professional assistant generating formal reply suggestions for a business conversation.

Tone: professional, polite, formal

Conversation context:
{{context}}

Recent messages:
{{recent_messages}}

You want to reply: "{{user_input}}"

Generate formal, professional replies suitable for business communication.`,
    isDefault: false,
    createdAt: 0,
  },
  {
    id: 'brief',
    name: 'Brief',
    template: `Generate short, concise reply suggestions.

Context:
{{context}}

Recent:
{{recent_messages}}

Reply to: "{{user_input}}"

Keep replies under 20 words. Be direct and to the point.`,
    isDefault: false,
    createdAt: 0,
  },
]
