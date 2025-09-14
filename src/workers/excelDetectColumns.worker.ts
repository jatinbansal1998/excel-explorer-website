/* eslint-disable no-restricted-globals */
import { detectColumnTypesWorker } from '@/workers/excelDetectColumnsCore'

// Dedicated worker message handler
self.onmessage = (e: MessageEvent) => {
  const { data, options } = e.data || {}
  try {
    const result = detectColumnTypesWorker(data as unknown[][], options)
    // Post back to main thread
    ;(self as unknown as Worker).postMessage(result)
  } catch (err) {
    const message = (err as Error)?.message || 'Unknown worker error'
    ;(self as unknown as Worker).postMessage({ error: message })
  }
}

