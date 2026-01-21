export const SELECTORS = {
  BUBBLE: '.bubble',
  BUBBLE_CONTENT: '.bubble-content',
  MESSAGE_TEXT: '.message',
  IS_OUTGOING: '.is-out',
  MESSAGE_ID_ATTR: 'data-mid',
  CHAT_INFO: '.chat-info',
  PEER_TITLE: '.peer-title',
  CHAT_CONTAINER: '.chat',
  BUBBLES_CONTAINER: '.bubbles',
  BUBBLES_INNER: '.bubbles-inner',
  SENDER_NAME: '.name',
  TIME: '.time',
  INPUT_MESSAGE: '.input-message-input',
} as const

export function getBubbleMessageId(bubble: Element): string | null {
  return bubble.getAttribute(SELECTORS.MESSAGE_ID_ATTR)
}

export function isBubbleOutgoing(bubble: Element): boolean {
  return bubble.classList.contains('is-out')
}
