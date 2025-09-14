'use client'

import React, { useMemo, useState } from 'react'
import type { FilterConfig, FilterValue } from '@/types/filter'

interface Props {
  filter: FilterConfig
  onChange: (_updates: Partial<FilterConfig>) => void
}

export default function SelectFilterView({ filter, onChange }: Readonly<Props>) {
  const values = useMemo(() => (filter.values as FilterValue[]) || [], [filter.values])
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const filteredValues = useMemo(() => {
    if (!normalized) return values
    return values.filter((v) => String(v.value).toLowerCase().includes(normalized))
  }, [values, normalized])

  const toggle = (idx: number) => {
    const next = values.map((v, i) => (i === idx ? { ...v, selected: !v.selected } : v))
    onChange({ values: next, active: true })
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        className="border rounded px-2 py-1 w-full text-sm"
        placeholder="Search options..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-40 overflow-auto flex flex-col gap-1">
        {filteredValues.length === 0 && (
          <div className="text-sm text-gray-500">No options match your search</div>
        )}
        {filteredValues.map((v, i) => (
          <label key={`${String(v.value)}-${i}`} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={v.selected} onChange={() => toggle(i)} />
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
