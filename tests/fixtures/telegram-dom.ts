export function createBubble(options: {
  id: string
  text: string
  isOutgoing?: boolean
  senderName?: string
  time?: string
}): string {
  const { id, text, isOutgoing = false, senderName, time = '12:00' } = options
  const outClass = isOutgoing ? ' is-out' : ''
  const nameHtml = senderName ? `<span class="name">${senderName}</span>` : ''

  return `
    <div class="bubble${outClass}" data-mid="${id}">
      <div class="bubble-content">
        ${nameHtml}
        <div class="message">${text}</div>
        <span class="time">${time}</span>
      </div>
    </div>
  `
}

export function createChatContainer(options: {
  peerTitle: string
  bubbles: string[]
}): string {
  return `
    <div class="chat">
      <div class="chat-info">
        <span class="peer-title">${options.peerTitle}</span>
      </div>
      <div class="bubbles">
        <div class="bubbles-inner">
          ${options.bubbles.join('\n')}
        </div>
      </div>
    </div>
  `
}

export function createTelegramPage(options: {
  hash?: string
  peerTitle: string
  messages: Array<{
    id: string
    text: string
    isOutgoing?: boolean
    senderName?: string
    time?: string
  }>
}): void {
  const bubbles = options.messages.map(msg => createBubble(msg))
  const chatHtml = createChatContainer({
    peerTitle: options.peerTitle,
    bubbles,
  })

  document.body.innerHTML = chatHtml

  if (options.hash) {
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        hash: options.hash,
      },
      writable: true,
    })
  }
}
