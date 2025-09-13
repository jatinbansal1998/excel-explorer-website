'use client'

import React from 'react'
import type { FilterConfig } from '@/types/filter'

interface Props {
  filter: FilterConfig
  onChange: (_updates: Partial<FilterConfig>) => void
}

export default function NullFilterView({ filter, onChange }: Readonly<Props>) {
  const includeNulls = filter.operator === 'is_null'
  const toggle = (checked: boolean) => {
    onChange({ operator: checked ? 'is_null' : 'is_not_null', active: true })
  }
  return (
    <div className="flex items-center space-x-2 text-sm">
      <label className="flex items-center space-x-2">
        <input className="mr-2" type="checkbox" checked={includeNulls} onChange={(e) => toggle(e.target.checked)} />
        <span>Include only nulls</span>
      </label>
    </div>
  )
}

