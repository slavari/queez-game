const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

export function createSecureId(prefix: string, length = 24) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  let value = prefix
  for (const byte of bytes) value += ALPHABET[byte % ALPHABET.length]

  return value
}
