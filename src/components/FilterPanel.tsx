'use client'

import React, { useMemo, useState } from 'react'
import { Button } from './ui/Button'
import { ChevronUpIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Modal } from './ui/Modal'
import {
  FilterConfig,
  FilterValue,
  RangeFilter,
  DateRangeFilter,
  SearchFilter,
} from '@/types/filter'
import type { NumericRange } from '@/types/chart'
import type { ColumnInfo } from '@/types/excel'
import { NumericRangeEditor } from './charts/NumericRangeEditor'

interface FilterPanelProps {
  filters: FilterConfig[]
  onFilterChange: (filterId: string, updates: Partial<FilterConfig>) => void
  onFilterReset: (filterId: string) => void
  onResetAll: () => void
  columnInfo: ColumnInfo[]
  filteredData: any[][]
}

export function FilterPanel({
  filters,
  onFilterChange,
  onFilterReset,
  onResetAll,
  columnInfo,
  filteredData,
}: FilterPanelProps) {
  const [filterListQuery, setFilterListQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const normalizedQuery = filterListQuery.trim().toLowerCase()
  const visibleFilters = useMemo(() => {
    if (!normalizedQuery) return filters
    return filters.filter((f) => {
      const name = (f.displayName || '').toString().toLowerCase()
      const col = (f.column || '').toString().toLowerCase()
      const type = (f.type || '').toString().toLowerCase()
      return (
        name.includes(normalizedQuery) ||
        col.includes(normalizedQuery) ||
        type.includes(normalizedQuery)
      )
    })
  }, [filters, normalizedQuery])
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col"
      style={collapsed ? undefined : { height: 'calc(100vh - 200px)', minHeight: '500px' }}
    >
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Filters</h3>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCollapsed((v) => !v)}
              className="whitespace-nowrap"
              aria-label={collapsed ? 'Expand filters' : 'Collapse filters'}
              title={collapsed ? 'Expand filters' : 'Collapse filters'}
            >
              {collapsed ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronUpIcon className="h-4 w-4" />
              )}
            </Button>
            {!collapsed && (
              <Button
                variant="outline"
                size="icon"
                onClick={onResetAll}
                className="whitespace-nowrap"
                aria-label="Reset all filters"
                title="Reset all filters"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!collapsed && (
            <input
              type="text"
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder="Search filters..."
              value={filterListQuery}
              onChange={(e) => setFilterListQuery(e.target.value)}
            />
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="overflow-auto flex-1 px-3 py-2">
          <div className="grid grid-cols-1 gap-2">
            {filters.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-500">
                  No filters available. Upload data to create filters.
                </p>
              </div>
            ) : (
              visibleFilters.map((filter) => (
                <div key={filter.id} className="border border-gray-200 rounded-md p-2 bg-gray-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filter.active}
                        onChange={(e) => onFilterChange(filter.id, { active: e.target.checked })}
                      />
                      <span
                        className="font-medium text-sm text-gray-500 truncate"
                        title={filter.displayName}
                      >
                        {filter.displayName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                        {filter.type}
                      </span>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onFilterReset(filter.id)}
                        aria-label="Reset filter"
                        title="Reset filter"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <FilterComponent
                    filter={filter}
                    onChange={(updates) => onFilterChange(filter.id, updates)}
                    columnInfo={columnInfo}
                    filteredData={filteredData}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterComponent({
  filter,
  onChange,
  columnInfo,
  filteredData,
}: {
  filter: FilterConfig
  onChange: (updates: Partial<FilterConfig>) => void
  columnInfo: ColumnInfo[]
  filteredData: any[][]
}) {
  switch (filter.type) {
    case 'select':
      return <SelectFilterView filter={filter} onChange={onChange} />
    case 'range':
      return (
        <RangeFilterView
          filter={filter}
          onChange={onChange}
          columnInfo={columnInfo}
          filteredData={filteredData}
        />
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

function SelectFilterView({
  filter,
  onChange,
}: {
  filter: FilterConfig
  onChange: (updates: Partial<FilterConfig>) => void
}) {
  const values = filter.values as FilterValue[]
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

function RangeFilterView({
  filter,
  onChange,
  columnInfo,
  filteredData,
}: {
  filter: FilterConfig
  onChange: (updates: Partial<FilterConfig>) => void
  columnInfo: ColumnInfo[]
  filteredData: any[][]
}) {
  const range = (filter.values as RangeFilter) || ({} as RangeFilter)
  const [showEditBins, setShowEditBins] = useState(false)

  const setMode = (mode: 'continuous' | 'binned') => {
    const next: RangeFilter = { ...range, mode }
    onChange({ values: next, active: true, operator: mode === 'binned' ? 'equals' : 'between' })
  }

  const updateContinuous = (key: 'currentMin' | 'currentMax', val: number) => {
    const next = { ...range, [key]: val, mode: range.mode || 'continuous' } as RangeFilter
    onChange({ values: next, active: true, operator: 'between' })
  }

  const toggleBin = (id: string) => {
    const selected = new Set(range.selectedRangeIds || [])
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    const next = { ...range, mode: 'binned', selectedRangeIds: Array.from(selected) } as RangeFilter
    onChange({ values: next, active: true, operator: 'equals' })
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name={`${filter.id}-range-mode`}
            checked={(range.mode || 'continuous') === 'continuous'}
            onChange={() => setMode('continuous')}
          />
          <span>Continuous</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name={`${filter.id}-range-mode`}
            checked={range.mode === 'binned'}
            onChange={() => setMode('binned')}
          />
          <span>Binned</span>
        </label>
      </div>

      {(range.mode || 'continuous') === 'continuous' && (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            className="border rounded px-2 py-1 w-28"
            value={range.currentMin}
            onChange={(e) => updateContinuous('currentMin', Number(e.target.value))}
          />
          <span>-</span>
          <input
            type="number"
            className="border rounded px-2 py-1 w-28"
            value={range.currentMax}
            onChange={(e) => updateContinuous('currentMax', Number(e.target.value))}
          />
        </div>
      )}

      {range.mode === 'binned' && Array.isArray(range.ranges) && range.ranges.length > 0 && (
        <div className="max-h-40 overflow-auto space-y-1">
          <div className="flex justify-between items-center pb-1">
            <div className="text-xs text-gray-500">Select one or more bins</div>
            <Button size="sm" variant="outline" onClick={() => setShowEditBins(true)}>
              Edit bins
            </Button>
          </div>
          {range.ranges.map((r: NumericRange) => {
            const checked = !!(range.selectedRangeIds || []).includes(r.id)
            const label = `${r.includeMin ? '≥' : '>'}${r.min} & ${r.includeMax ? '≤' : '<'}${r.max} (${r.label})`
            return (
              <label key={r.id} className="flex items-center space-x-2">
                <input type="checkbox" checked={checked} onChange={() => toggleBin(r.id)} />
                <span className="truncate" title={label}>
                  {label}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {range.mode === 'binned' && (!Array.isArray(range.ranges) || range.ranges.length === 0) && (
        <div className="text-xs text-gray-500">No default ranges available for this column.</div>
      )}
      {/* Bin editor modal */}
      <EditBinsModal
        isOpen={showEditBins}
        onClose={() => setShowEditBins(false)}
        filter={filter}
        onChange={onChange}
        columnInfo={columnInfo}
        filteredData={filteredData}
      />
    </div>
  )
}

function EditBinsModal({
  isOpen,
  onClose,
  filter,
  onChange,
  columnInfo,
  filteredData,
}: {
  isOpen: boolean
  onClose: () => void
  filter: FilterConfig
  onChange: (updates: Partial<FilterConfig>) => void
  columnInfo: ColumnInfo[]
  filteredData: any[][]
}) {
  const range = (filter.values as RangeFilter) || ({} as RangeFilter)
  const col = columnInfo.find((c) => c.index === filter.columnIndex)
  const sampleValues = useMemo(() => {
    if (!col) return [] as number[]
    const idx = col.index
    return filteredData
      .map((r) => r[idx])
      .filter((v) => typeof v === 'number' && Number.isFinite(v)) as number[]
  }, [col, filteredData])

  const handleRangesChange = (ranges: NumericRange[]) => {
    const next: RangeFilter = { ...range, mode: 'binned', ranges }
    // Ensure selected ids remain valid; if none, select all by default
    const idSet = new Set(ranges.map((r) => r.id))
    const selected = (range.selectedRangeIds || []).filter((id) => idSet.has(id))
    next.selectedRangeIds = selected.length > 0 ? selected : ranges.map((r) => r.id)
    onChange({ values: next, active: true, operator: 'equals' })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Bins - ${filter.displayName}`} size="lg">
      <div className="space-y-4">
        <NumericRangeEditor
          ranges={range.ranges || []}
          onRangesChange={handleRangesChange}
          columnName={col?.name || filter.displayName}
          sampleValues={sampleValues}
        />
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function SearchFilterView({
  filter,
  onChange,
}: {
  filter: FilterConfig
  onChange: (updates: Partial<FilterConfig>) => void
}) {
  const search = filter.values as SearchFilter
  const update = (patch: Partial<SearchFilter>) => {
    const next = { ...search, ...patch } as SearchFilter
    onChange({ values: next, active: true, operator: search.exactMatch ? 'equals' : 'contains' })
  }
  return (
    <div className="space-y-2 text-sm">
      <input
        type="text"
        className="border rounded px-2 py-1 w-full"
        placeholder="Search..."
        value={search.query}
        onChange={(e) => update({ query: e.target.value })}
      />
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={search.caseSensitive}
            onChange={(e) => update({ caseSensitive: e.target.checked })}
          />
          <span>Case sensitive</span>
        </label>
        <label className="flex items-center space-x-2">
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

function toDateInputValue(d: Date): string {
  if (!(d instanceof Date) || isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function DateRangeFilterView({
  filter,
  onChange,
}: {
  filter: FilterConfig
  onChange: (updates: Partial<FilterConfig>) => void
}) {
  const range = filter.values as DateRangeFilter
  const update = (key: 'currentStart' | 'currentEnd', val: string) => {
    const next = { ...range, [key]: val ? new Date(val) : range[key] } as DateRangeFilter
    onChange({ values: next, active: true, operator: 'between' })
  }
  return (
    <div className="flex items-center space-x-2 text-sm">
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

function BooleanFilterView({
  filter,
  onChange,
}: {
  filter: FilterConfig
  onChange: (updates: Partial<FilterConfig>) => void
}) {
  const val = filter.values as boolean | null
  const setVal = (v: boolean | null) => onChange({ values: v, active: true, operator: 'equals' })
  return (
    <div className="flex items-center space-x-4 text-sm">
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          name={`${filter.id}-bool`}
          checked={val === null}
          onChange={() => setVal(null)}
        />
        <span>All</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          name={`${filter.id}-bool`}
          checked={val === true}
          onChange={() => setVal(true)}
        />
        <span>True</span>
      </label>
      <label className="flex items-center space-x-2">
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

function NullFilterView({
  filter,
  onChange,
}: {
  filter: FilterConfig
  onChange: (updates: Partial<FilterConfig>) => void
}) {
  // values boolean not used in engine; we drive via operator
  const includeNulls = filter.operator === 'is_null'
  const toggle = (checked: boolean) => {
    onChange({ operator: checked ? 'is_null' : 'is_not_null', active: true })
  }
  return (
    <div className="flex items-center space-x-2 text-sm">
      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={includeNulls} onChange={(e) => toggle(e.target.checked)} />
        <span>Include only nulls</span>
      </label>
    </div>
  )
}
