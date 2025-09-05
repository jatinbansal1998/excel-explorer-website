'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ExcelData } from '../types/excel'
import { FilterConfig, FilterState } from '../types/filter'
import { filterGenerator } from '../services/filterGenerator'
import { DataFilter } from '../services/dataFilter'

export function useFilters(excelData: ExcelData | null) {
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const [filteredData, setFilteredData] = useState<any[][]>([])
  const [isFiltering, setIsFiltering] = useState(false)
  const engineRef = useRef<DataFilter | null>(null)

  // Generate filters when data changes
  useEffect(() => {
    if (excelData && excelData.metadata?.columns) {
      const generated = filterGenerator.generateFilters(excelData.metadata.columns)
      setFilters(generated)
      engineRef.current = new DataFilter(generated)
    } else {
      setFilters([])
      engineRef.current = null
    }
  }, [excelData?.metadata?.columns, excelData?.headers, excelData])

  // Apply filters when filters or data change
  useEffect(() => {
    if (excelData && engineRef.current) {
      setIsFiltering(true)
      const result = engineRef.current.applyFilters(excelData)
      setFilteredData(result)
      setIsFiltering(false)
    } else {
      setFilteredData(excelData?.rows || [])
    }
  }, [excelData, filters])

  const updateFilter = (filterId: string, updates: Partial<FilterConfig>) => {
    if (!engineRef.current) return
    engineRef.current.updateFilter(filterId, updates)
    setFilters((prev) =>
      prev.map((f) =>
        f.id === filterId
          ? { ...f, ...updates, values: updates.values ?? f.values, active: updates.active ?? true }
          : f,
      ),
    )
  }

  const resetFilter = (filterId: string) => {
    if (!engineRef.current) return
    engineRef.current.resetFilter(filterId)
    // Re-sync from engine state export for this filter
    const exported = engineRef.current.exportFilterState()
    setFilters((prev) =>
      prev.map((f) => {
        const s = exported.find((e) => e.id === f.id)
        if (!s) return f
        if (f.id === filterId) {
          return { ...f, active: s.active, values: s.values, operator: s.operator } as FilterConfig
        }
        return f
      }),
    )
  }

  const resetAllFilters = () => {
    if (!engineRef.current) return
    engineRef.current.resetAllFilters()
    const exported = engineRef.current.exportFilterState()
    setFilters((prev) =>
      prev.map((f) => {
        const s = exported.find((e) => e.id === f.id)
        return s
          ? ({ ...f, active: s.active, values: s.values, operator: s.operator } as FilterConfig)
          : f
      }),
    )
  }

  const exportState = (): FilterState => {
    return engineRef.current ? engineRef.current.exportFilterState() : []
  }

  const importState = (state: FilterState) => {
    if (!engineRef.current) return
    engineRef.current.importFilterState(state)
    // Sync filters
    setFilters((prev) =>
      prev.map((f) => {
        const s = state.find((e) => e.id === f.id)
        return s
          ? ({ ...f, active: s.active, values: s.values, operator: s.operator } as FilterConfig)
          : f
      }),
    )
  }

  const getFilterSummary = () => ({
    totalFilters: filters.length,
    activeFilters: filters.filter((f) => f.active).length,
    filteredRows: filteredData.length,
    totalRows: excelData?.metadata.totalRows || 0,
  })

  return {
    filters,
    filteredData,
    isFiltering,
    updateFilter,
    resetFilter,
    resetAllFilters,
    exportState,
    importState,
    getFilterSummary,
  }
}
