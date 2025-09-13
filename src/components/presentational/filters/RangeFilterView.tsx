'use client'

import React, { useMemo, useState } from 'react'
import type { ColumnInfo, DataMatrix, DataRow } from '@/types/excel'
import type { FilterConfig, RangeFilter } from '@/types/filter'
import type { NumericRange } from '@/types/chart'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NumericRangeEditor } from '@/components/charts/NumericRangeEditor'

interface Props {
  filter: FilterConfig
  onChange: (_updates: Partial<FilterConfig>) => void
  columnInfo: Readonly<ColumnInfo[]>
  filteredData: Readonly<DataMatrix>
}

export default function RangeFilterView({ filter, onChange, columnInfo, filteredData }: Readonly<Props>) {
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
            const checked = (range.selectedRangeIds || []).includes(r.id)
            const label = `${r.includeMin ? '≥' : '>'}${r.min} & ${r.includeMax ? '≤' : '<'}${r.max} (${r.label})`
            return (
              <label key={r.id} className="flex items-center space-x-2">
                <input className="mr-2" type="checkbox" checked={checked} onChange={() => toggleBin(r.id)} />
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
}: Readonly<{
  isOpen: boolean
  onClose: () => void
  filter: FilterConfig
  onChange: (_updates: Partial<FilterConfig>) => void
  columnInfo: Readonly<ColumnInfo[]>
  filteredData: Readonly<DataMatrix>
}>) {
  const range = (filter.values as RangeFilter) || ({} as RangeFilter)
  const col = columnInfo.find((c) => c.index === filter.columnIndex)
  const sampleValues = useMemo(() => {
    if (!col) return [] as number[]
    const idx = col.index
    return (filteredData as DataMatrix)
      .map((r: DataRow) => r[idx])
      .filter((v) => typeof v === 'number' && Number.isFinite(v)) as number[]
  }, [col, filteredData])

  const handleRangesChange = (ranges: NumericRange[]) => {
    const next: RangeFilter = { ...range, mode: 'binned', ranges }
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

