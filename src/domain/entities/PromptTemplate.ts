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

My reply idea/topic: "{{user_input}}"

Generate full reply messages based on my idea above. Do NOT just repeat my input - expand it into complete, natural replies that match MY writing style from [You] messages. Mimic my punctuation, emoji usage, and tone.`,
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

My reply idea/topic: "{{user_input}}"

Generate full formal reply messages based on my idea above. Do NOT just repeat my input - expand it into complete, professional replies.`,
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

My reply idea/topic: "{{user_input}}"

Expand my idea into full reply messages (under 20 words each). Do NOT just repeat my input. Match my messaging style.`,
    isDefault: false,
    createdAt: 0,
  },
]
