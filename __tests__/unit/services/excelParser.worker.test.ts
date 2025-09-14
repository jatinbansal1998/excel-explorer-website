import { ExcelParser } from '@/services/excelParser'
import { detectColumnTypesWorker } from '@/workers/excelDetectColumnsCore'

class WorkerStub {
  // @ts-expect-error dynamic assignment by user code
  onmessage: (ev: MessageEvent) => void
  // @ts-expect-error dynamic assignment by user code
  onerror: (ev: ErrorEvent) => void
  // Accept any constructor args used by code
  constructor(_url?: unknown, _opts?: unknown) {}
  postMessage(payload: { data: unknown[][]; options: unknown }) {
    try {
      const result = detectColumnTypesWorker(payload.data, payload.options as any)
      // Simulate async
      setTimeout(() => {
        this.onmessage?.({ data: result } as unknown as MessageEvent)
      }, 0)
    } catch (e) {
      setTimeout(() => {
        this.onerror?.({ message: (e as Error)?.message || 'error' } as unknown as ErrorEvent)
      }, 0)
    }
  }
  terminate() {}
}

describe('ExcelParser processInWorker', () => {
  const RealWorker = (global as any).Worker

  beforeAll(() => {
    ;(global as any).Worker = WorkerStub
  })

  afterAll(() => {
    ;(global as any).Worker = RealWorker
  })

  it('returns column metadata via worker path', async () => {
    const parser = new ExcelParser() as any
    const headers = ['A', 'B']
    const data: unknown[][] = [
      headers,
      [1, 'x'],
      [2, 'y'],
      [3, 'z'],
    ]
    const cols = await parser.processInWorker(data, {})
    expect(Array.isArray(cols)).toBe(true)
    expect(cols).toHaveLength(headers.length)
    expect(cols[0].name).toBe('A')
    expect(cols[1].name).toBe('B')
  })
})

