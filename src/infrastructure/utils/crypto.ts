const ENCRYPTION_KEY_NAME = 'telegram-assistant-encryption-key'

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.local.get(ENCRYPTION_KEY_NAME)

  if (stored[ENCRYPTION_KEY_NAME]) {
    const keyData = Uint8Array.from(atob(stored[ENCRYPTION_KEY_NAME]), c => c.charCodeAt(0))
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  const exported = await crypto.subtle.exportKey('raw', key)
  const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
  await chrome.storage.local.set({ [ENCRYPTION_KEY_NAME]: keyBase64 })

  return key
}

export async function encryptApiKey(plaintext: string): Promise<string> {
  if (!plaintext) return ''

  const key = await getOrCreateEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decryptApiKey(encrypted: string): Promise<string> {
  if (!encrypted) return ''

  try {
    const key = await getOrCreateEncryptionKey()
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))

    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )

    return new TextDecoder().decode(decrypted)
  } catch {
    return encrypted
  }
}

export function isEncrypted(value: string): boolean {
  if (!value) return false
  try {
    const decoded = atob(value)
    return decoded.length > 12 && !value.startsWith('sk-')
  } catch {
    return false
  }
}
