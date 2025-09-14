'use client'

import React from 'react'
import type { FilterConfig } from '@/types/filter'

interface Props {
  filter: FilterConfig
  onChange: (_updates: Partial<FilterConfig>) => void
}

export default function BooleanFilterView({ filter, onChange }: Readonly<Props>) {
  const val = (filter.values as boolean | null) ?? null
  const setVal = (v: boolean | null) => onChange({ values: v, active: true, operator: 'equals' })
  return (
    <div className="flex items-center gap-4 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={`${filter.id}-bool`}
          checked={val === null}
          onChange={() => setVal(null)}
        />
        <span>All</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={`${filter.id}-bool`}
          checked={val === true}
          onChange={() => setVal(true)}
        />
        <span>True</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={`${filter.id}-bool`}
          checked={val === false}
          onChange={() => setVal(false)}
        />
        <span>False</span>
      </label>
    </div>
  )
}
