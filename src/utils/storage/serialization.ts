import LZString from 'lz-string'

const COMPRESSION_THRESHOLD_BYTES = 50 * 1024 // 50KB

export interface SerializedPayload {
  c: 0 | 1 // compressed flag
  d: string // data string (JSON or compressed)
}

export function serialize<T>(value: T): SerializedPayload {
  const json = JSON.stringify(value)
  if (json.length > COMPRESSION_THRESHOLD_BYTES) {
    const compressed = LZString.compressToUTF16(json)
    return { c: 1, d: compressed }
  }
  return { c: 0, d: json }
}

export function deserialize<T>(payload: SerializedPayload): T {
  if (!payload) {
    throw new Error('Invalid payload')
  }
  const json = payload.c === 1 ? LZString.decompressFromUTF16(payload.d) : payload.d
  if (!json) {
    throw new Error('Failed to decompress payload')
  }
  return JSON.parse(json) as T
}

export function estimateSizeBytes(payload: SerializedPayload): number {
  // UTF-16 ~2 bytes per char
  return payload.d.length * 2
}
