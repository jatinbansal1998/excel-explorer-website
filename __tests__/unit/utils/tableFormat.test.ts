import { formatCellValue } from '@/utils/tableFormat'

describe('tableFormat - formatCellValue', () => {
  it('formats date without time near midnight even when showTime=true', () => {
    const val = '2024-01-01T00:05:00'
    const out = formatCellValue(val, 'date', true)
    // Should not include time separator when near midnight
    expect(out).not.toMatch(/:\d{2}/)
  })

  it('formats date with time when showTime=true and not near midnight', () => {
    const val = '2024-01-01T12:34:56'
    const out = formatCellValue(val, 'date', true)
    // Should include time components
    expect(out).toMatch(/\d{1,2}:\d{2}/)
  })

  it('formats date without time when showTime=false', () => {
    const val = '2024-01-01T12:34:56'
    const out = formatCellValue(val, 'date', false)
    expect(out).not.toMatch(/:\d{2}/)
  })

  it('passes through non-date values', () => {
    expect(formatCellValue('hello', 'string', false)).toBe('hello')
    expect(formatCellValue(true, 'boolean', false)).toBe('true')
    expect(formatCellValue(false, 'boolean', false)).toBe('false')
    // number NaN handling falls back to string
    expect(formatCellValue('not-a-number', 'number', false)).toBe('not-a-number')
  })
})
