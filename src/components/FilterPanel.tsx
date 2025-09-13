'use client'

import React from 'react'
import type { FilterConfig } from '@/types/filter'
import type { ColumnInfo, DataMatrix } from '@/types/excel'
import FilterPanelView from '@/components/presentational/filters/FilterPanelView'
import FilterItemSwitch from '@/components/presentational/filters/FilterItemSwitch'
import { useFilterPanel } from '@/hooks/useFilterPanel'

interface FilterPanelProps {
  filters: FilterConfig[]
  onFilterChange: (_filterId: string, _updates: Partial<FilterConfig>) => void
  onFilterReset: (_filterId: string) => void
  onResetAll: () => void
  columnInfo: ColumnInfo[]
  filteredData: DataMatrix
}

export function FilterPanel({
  filters,
  onFilterChange,
  onFilterReset,
  onResetAll,
  columnInfo,
  filteredData,
}: Readonly<FilterPanelProps>) {
  const { collapsed, setCollapsed, filterListQuery, setFilterListQuery, visibleFilters } =
    useFilterPanel(filters)

  return (
    <FilterPanelView
      collapsed={collapsed}
      onToggleCollapsed={() => setCollapsed((v) => !v)}
      filterListQuery={filterListQuery}
      onChangeQuery={setFilterListQuery}
      filters={visibleFilters}
      onResetAll={onResetAll}
      renderFilterItem={(filter) => (
        <FilterItemSwitch
          filter={filter}
          onChange={(updates) => onFilterChange(filter.id, updates)}
          onReset={() => onFilterReset(filter.id)}
          columnInfo={columnInfo}
          filteredData={filteredData}
        />
      )}
    />
  )
}
