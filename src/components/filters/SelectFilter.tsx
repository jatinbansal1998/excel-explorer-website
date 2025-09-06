'use client'

import React, { useMemo, useState } from 'react'

interface SelectFilterProps {
  filter: {
    values: { value: any; selected: boolean; count?: number }[]
  }
  onChange: (values: any[]) => void
  maxDisplayValues?: number
}

export function SelectFilter({ filter, onChange, maxDisplayValues = 1000 }: SelectFilterProps) {
  const [query, setQuery] = useState('')
  const values = (filter.values || []).slice(0, maxDisplayValues)
  const normalized = query.trim().toLowerCase()
  const filteredValues = useMemo(() => {
    if (!normalized) return values
    return values.filter((v) => String(v.value).toLowerCase().includes(normalized))
  }, [values, normalized])
  const toggle = (idx: number) => {
    const next = values.map((v, i) => (i === idx ? { ...v, selected: !v.selected } : v))
    const selected = next.filter((v) => v.selected).map((v) => v.value)
    onChange(selected)
  }
  return (
    <div className="space-y-2">
      <input
        type="text"
        className="border rounded px-2 py-1 w-full text-sm"
        placeholder="Search options..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-40 overflow-auto space-y-1">
        {filteredValues.length === 0 && (
          <div className="text-sm text-gray-500">No options match your search</div>
        )}
        {filteredValues.map((v, i) => (
          <label key={`${String(v.value)}-${i}`} className="flex items-center space-x-2 text-sm">
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
    </div>
  )
}
