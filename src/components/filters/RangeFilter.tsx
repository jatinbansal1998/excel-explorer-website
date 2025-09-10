'use client'

import React from 'react'
import type {FilterConfig} from '@/types/filter'

interface RangeFilterProps {
  filter: FilterConfig
    onChange: (_min: number, _max: number) => void
}

export function RangeFilter({ filter, onChange }: RangeFilterProps) {
  const range = filter.values as { currentMin: number; currentMax: number }
  return (
    <div className="flex items-center space-x-2 text-sm">
      <input
        type="number"
        className="border rounded px-2 py-1 w-28"
        value={range?.currentMin ?? ''}
        onChange={(e) => onChange(Number(e.target.value), range?.currentMax ?? Number.NaN)}
      />
      <span>-</span>
      <input
        type="number"
        className="border rounded px-2 py-1 w-28"
        value={range?.currentMax ?? ''}
        onChange={(e) => onChange(range?.currentMin ?? Number.NaN, Number(e.target.value))}
      />
    </div>
  )
}
