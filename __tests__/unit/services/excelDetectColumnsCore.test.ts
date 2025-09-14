import { detectColumnTypesWorker } from '@/workers/excelDetectColumnsCore'

describe('excelDetectColumnsCore - detectColumnTypesWorker', () => {
  it('detects basic types and counts', () => {
    const headers = ['A', 'B', 'C', 'D']
    const now = new Date('2024-01-01T00:00:00.000Z')
    const data: unknown[][] = [
      headers,
      [1, 'true', now.toISOString(), 'alpha'],
      [2, 'false', now.toISOString(), 'beta'],
      ['3', 'yes', now.getTime(), 'gamma'],
      [null, 'no', '', 'delta'],
    ]

    const cols = detectColumnTypesWorker(data)
    expect(cols).toHaveLength(headers.length)

    const [c0, c1, c2, c3] = cols
    expect(c0.name).toBe('A')
    expect(c0.type === 'number' || c0.type === 'mixed').toBeTruthy()
    expect(c0.uniqueCount).toBeGreaterThan(0)

    expect(c1.name).toBe('B')
    expect(c1.type === 'boolean' || c1.type === 'mixed').toBeTruthy()

    expect(c2.name).toBe('C')
    expect(['date', 'mixed']).toContain(c2.type)

    expect(c3.name).toBe('D')
    expect(c3.type).toBe('string')
  })
})

