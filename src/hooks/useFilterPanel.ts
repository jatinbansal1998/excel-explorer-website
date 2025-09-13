'use client'

import { useMemo, useState } from 'react'
import type { FilterConfig } from '@/types/filter'

interface UseFilterPanelResult {
  collapsed: boolean
  setCollapsed: (_v: boolean | ((prev: boolean) => boolean)) => void
  filterListQuery: string
  setFilterListQuery: (_v: string) => void
  visibleFilters: FilterConfig[]
}

export function useFilterPanel(filters: Readonly<FilterConfig[]>): UseFilterPanelResult {
  const [filterListQuery, setFilterListQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const visibleFilters = useMemo(() => {
    const normalized = filterListQuery.trim().toLowerCase()
    if (!normalized) return filters as FilterConfig[]
    return (filters as FilterConfig[]).filter((f) => {
      const name = (f.displayName || '').toString().toLowerCase()
      const col = (f.column || '').toString().toLowerCase()
      const type = (f.type || '').toString().toLowerCase()
      return name.includes(normalized) || col.includes(normalized) || type.includes(normalized)
    })
  }, [filters, filterListQuery])

  return {
    collapsed,
    setCollapsed,
    filterListQuery,
    setFilterListQuery,
    visibleFilters,
  }
}

