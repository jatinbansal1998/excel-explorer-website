export async function encryptString(plaintext: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext)),
  )
  const payload = {
    v: 1,
    s: Array.from(salt),
    i: Array.from(iv),
    c: Array.from(ciphertext),
  }
  return btoa(JSON.stringify(payload))
}

export async function decryptString(payloadB64: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  const payload = JSON.parse(atob(payloadB64)) as {
    v: number
    s: number[]
    i: number[]
    c: number[]
  }
  const salt = new Uint8Array(payload.s)
  const iv = new Uint8Array(payload.i)
  const ciphertext = new Uint8Array(payload.c)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return dec.decode(new Uint8Array(plaintext))
}
