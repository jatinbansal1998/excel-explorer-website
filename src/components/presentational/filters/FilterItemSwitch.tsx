'use client'

import React from 'react'
import type { ColumnInfo, DataMatrix } from '@/types/excel'
import type { FilterConfig } from '@/types/filter'
import { Button } from '@/components/ui/Button'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import SelectFilterView from './SelectFilterView'
import RangeFilterView from './RangeFilterView'
import SearchFilterView from './SearchFilterView'
import DateRangeFilterView from './DateRangeFilterView'
import BooleanFilterView from './BooleanFilterView'
import NullFilterView from './NullFilterView'

interface Props {
  filter: FilterConfig
  onChange: (_updates: Partial<FilterConfig>) => void
  onReset: () => void
  columnInfo: Readonly<ColumnInfo[]>
  filteredData: Readonly<DataMatrix>
}

export default function FilterItemSwitch({
  filter,
  onChange,
  onReset,
  columnInfo,
  filteredData,
}: Readonly<Props>) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filter.active}
            onChange={(e) => onChange({ active: e.target.checked })}
            className="mr-2"
          />
          <span className="font-medium text-sm text-gray-500 truncate" title={filter.displayName}>
            {filter.displayName}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 uppercase">
            {filter.type}
          </span>
        </div>
        <div>
          <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset filter" title="Reset filter">
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {renderFilterBody(filter, onChange, columnInfo, filteredData)}
    </div>
  )
}

function renderFilterBody(
  filter: FilterConfig,
  onChange: (_updates: Partial<FilterConfig>) => void,
  columnInfo: Readonly<ColumnInfo[]>,
  filteredData: Readonly<DataMatrix>,
) {
  switch (filter.type) {
    case 'select':
      return <SelectFilterView filter={filter} onChange={onChange} />
    case 'range':
      return (
        <RangeFilterView filter={filter} onChange={onChange} columnInfo={columnInfo} filteredData={filteredData} />
      )
    case 'search':
      return <SearchFilterView filter={filter} onChange={onChange} />
    case 'date':
      return <DateRangeFilterView filter={filter} onChange={onChange} />
    case 'boolean':
      return <BooleanFilterView filter={filter} onChange={onChange} />
    case 'null':
      return <NullFilterView filter={filter} onChange={onChange} />
    default:
      return null
  }
}

