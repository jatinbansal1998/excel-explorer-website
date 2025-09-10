'use client'

import React from 'react'
import type {FilterConfig} from '@/types/filter'

interface SearchFilterProps {
  filter: FilterConfig
    onChange: (_query: string, _options: { caseSensitive: boolean; exactMatch: boolean }) => void
}

export function SearchFilter({ filter, onChange }: SearchFilterProps) {
  const search = (filter.values || { query: '', caseSensitive: false, exactMatch: false }) as {
    query: string
    caseSensitive: boolean
    exactMatch: boolean
  }

  return (
    <div className="space-y-2 text-sm">
      <input
        type="text"
        className="border rounded px-2 py-1 w-full"
        placeholder="Search..."
        value={search.query}
        onChange={(e) =>
          onChange(e.target.value, {
            caseSensitive: search.caseSensitive,
            exactMatch: search.exactMatch,
          })
        }
      />
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={search.caseSensitive}
            onChange={(e) =>
              onChange(search.query, {
                caseSensitive: e.target.checked,
                exactMatch: search.exactMatch,
              })
            }
            className="mr-2"
          />
          <span>Case sensitive</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={search.exactMatch}
            onChange={(e) =>
              onChange(search.query, {
                caseSensitive: search.caseSensitive,
                exactMatch: e.target.checked,
              })
            }
            className="mr-2"
          />
          <span>Exact match</span>
        </label>
      </div>
    </div>
  )
}
