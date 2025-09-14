'use client'

import React from 'react'
import type { DateRangeFilter, FilterConfig } from '@/types/filter'

interface Props {
  filter: FilterConfig
  onChange: (_updates: Partial<FilterConfig>) => void
}

function toDateInputValue(d: Date): string {
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DateRangeFilterView({ filter, onChange }: Readonly<Props>) {
  const range = filter.values as DateRangeFilter
  const update = (key: 'currentStart' | 'currentEnd', val: string) => {
    const next = { ...range, [key]: val ? new Date(val) : range[key] } as DateRangeFilter
    onChange({ values: next, active: true, operator: 'between' })
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={toDateInputValue(range.currentStart)}
        onChange={(e) => update('currentStart', e.target.value)}
      />
      <span>-</span>
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={toDateInputValue(range.currentEnd)}
        onChange={(e) => update('currentEnd', e.target.value)}
      />
    </div>
  )
}
