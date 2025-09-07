'use client'

import React from 'react'
import type { FilterConfig } from '@/types/filter'

interface DateRangeFilterProps {
  filter: FilterConfig
  onChange: (startDate: Date, endDate: Date) => void
}

function toDateInputValue(d: Date | null | undefined): string {
  const date = d instanceof Date ? d : d ? new Date(d as any) : null
  if (!date || isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DateRangeFilter({ filter, onChange }: DateRangeFilterProps) {
  const range = (filter.values || {}) as { currentStart?: Date; currentEnd?: Date }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={toDateInputValue(range.currentStart as Date)}
        onChange={(e) =>
          onChange(
            e.target.value ? new Date(e.target.value) : (range.currentStart as Date),
            range.currentEnd as Date,
          )
        }
      />
      <span>-</span>
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={toDateInputValue(range.currentEnd as Date)}
        onChange={(e) =>
          onChange(
            range.currentStart as Date,
            e.target.value ? new Date(e.target.value) : (range.currentEnd as Date),
          )
        }
      />
    </div>
  )
}
