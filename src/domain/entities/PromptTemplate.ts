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

Message format:
- [You]: messages from me (the user who needs reply suggestions)
- [@personA], [@personB], etc.: messages from other people (anonymized)

IMPORTANT: Analyze my messaging style from [You] messages - pay attention to:
- Punctuation habits (do I use periods, commas, ellipsis?)
- Emoji and emoticon usage (smileys, reactions)
- Capitalization style
- Message length and structure
- Language quirks and expressions

Conversation context:
{{context}}

Recent messages:
{{recent_messages}}

I want to reply: "{{user_input}}"

Generate replies that match MY writing style exactly as shown in [You] messages. Mimic my punctuation, emoji usage, and tone.`,
    isDefault: true,
    createdAt: 0,
  },
  {
    id: 'formal',
    name: 'Formal',
    template: `You are a professional assistant generating formal reply suggestions for a business conversation.

Message format:
- [You]: messages from me (the user who needs reply suggestions)
- [@personA], [@personB], etc.: messages from other people (anonymized)

Tone: professional, polite, formal

Conversation context:
{{context}}

Recent messages:
{{recent_messages}}

I want to reply: "{{user_input}}"

Generate formal, professional replies suitable for business communication.`,
    isDefault: false,
    createdAt: 0,
  },
  {
    id: 'brief',
    name: 'Brief',
    template: `Generate short, concise reply suggestions.

Message format: [You] = me, [@personA/B/etc] = others

Analyze my style from [You] messages - match my punctuation, emoji usage, and tone.

Context:
{{context}}

Recent:
{{recent_messages}}

I want to reply: "{{user_input}}"

Keep replies under 20 words. Match my messaging style.`,
    isDefault: false,
    createdAt: 0,
  },
]
