import { DataType, NullableCellValue } from '@/types/excel'
import { parseDateFlexible } from '@/utils/dataTypes'

// Helper to decide if a time is near midnight within a threshold (in seconds)
export function isNearMidnightSeconds(
  totalSecondsSinceMidnight: number,
  thresholdSeconds = 30 * 60,
): boolean {
  const secondsUntilMidnight = 24 * 3600 - totalSecondsSinceMidnight
  return totalSecondsSinceMidnight <= thresholdSeconds || secondsUntilMidnight <= thresholdSeconds
}

export function formatCellValue(
  value: NullableCellValue,
  type: DataType,
  showTime: boolean,
): string {
  if (value === null || value === undefined || value === '') return ''

  switch (type) {
    case 'date': {
      const d = parseDateFlexible(value)
      if (!d) return String(value)
      const secondsSinceMidnight = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
      const isNearMidnight = isNearMidnightSeconds(secondsSinceMidnight)
      if (!showTime || isNearMidnight) {
        return d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      }
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    }
    case 'number': {
      const num = Number(value)
      return isNaN(num) ? String(value) : num.toLocaleString()
    }
    case 'boolean':
      return String(value)
    default:
      return String(value)
  }
}
