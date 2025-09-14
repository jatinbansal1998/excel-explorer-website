'use client'

import React from 'react'
import type { FilterConfig, SearchFilter } from '@/types/filter'

interface Props {
  filter: FilterConfig
  onChange: (_updates: Partial<FilterConfig>) => void
}

export default function SearchFilterView({ filter, onChange }: Readonly<Props>) {
  const search = (filter.values as SearchFilter) || ({} as SearchFilter)
  const update = (patch: Partial<SearchFilter>) => {
    const next = { ...search, ...patch } as SearchFilter
    onChange({ values: next, active: true, operator: next.exactMatch ? 'equals' : 'contains' })
  }
  return (
    <div className="flex flex-col gap-2 text-sm">
      <input
        type="text"
        className="border rounded px-2 py-1 w-full"
        placeholder="Search..."
        value={search.query}
        onChange={(e) => update({ query: e.target.value })}
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={search.caseSensitive}
            onChange={(e) => update({ caseSensitive: e.target.checked })}
          />
          <span>Case sensitive</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={search.exactMatch}
            onChange={(e) => update({ exactMatch: e.target.checked })}
          />
          <span>Exact match</span>
        </label>
      </div>
    </div>
  )
}
