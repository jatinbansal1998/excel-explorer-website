'use client'

import React from 'react'

interface SelectFilterProps {
  filter: {
    values: { value: any; selected: boolean; count?: number }[]
  }
  onChange: (values: any[]) => void
  maxDisplayValues?: number
}

export function SelectFilter({ filter, onChange, maxDisplayValues = 1000 }: SelectFilterProps) {
  const values = (filter.values || []).slice(0, maxDisplayValues)
  const toggle = (idx: number) => {
    const next = values.map((v, i) => (i === idx ? { ...v, selected: !v.selected } : v))
    const selected = next.filter((v) => v.selected).map((v) => v.value)
    onChange(selected)
  }
  return (
    <div className="max-h-40 overflow-auto space-y-1">
      {values.length === 0 && <div className="text-sm text-gray-500">No options available</div>}
      {values.map((v, i) => (
        <label key={i} className="flex items-center space-x-2 text-sm">
          <input type="checkbox" checked={!!v.selected} onChange={() => toggle(i)} />
          <span className="truncate" title={String(v.value)}>
            {String(v.value)}
          </span>
          {typeof v.count === 'number' && (
            <span className="text-xs text-gray-400">({v.count})</span>
          )}
        </label>
      ))}
    </div>
  )
}
