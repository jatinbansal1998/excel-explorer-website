import { ExcelData } from '../types/excel'
import { parseDateFlexible } from '../utils/dataTypes'
import {
  FilterConfig,
  FilterValue,
  RangeFilter,
  DateRangeFilter,
  SearchFilter,
  FilterState,
} from '../types/filter'

export class DataFilter {
  private activeFilters: Map<string, FilterConfig>
  private initialFilters: Map<string, FilterConfig>

  constructor(filters: FilterConfig[]) {
    this.activeFilters = new Map(filters.map((f) => [f.id, this.cloneFilter(f)]))
    this.initialFilters = new Map(filters.map((f) => [f.id, this.cloneFilter(f)]))
  }

  applyFilters(data: ExcelData): any[][] {
    const rows = data.rows || []
    const active = Array.from(this.activeFilters.values()).filter((f) => f.active)
    if (active.length === 0) return rows

    return rows.filter((row) => {
      for (let i = 0; i < active.length; i++) {
        if (!this.evaluateFilter(row, active[i])) return false // early exit
      }
      return true
    })
  }

  private evaluateFilter(row: any[], filter: FilterConfig): boolean {
    const cellValue = row[filter.columnIndex]

    switch (filter.type) {
      case 'select':
        return this.evaluateSelectFilter(cellValue, filter.values as FilterValue[], filter.operator)
      case 'range':
        return this.evaluateRangeFilter(cellValue, filter.values as RangeFilter, filter.operator)
      case 'search':
        return this.evaluateSearchFilter(cellValue, filter.values as SearchFilter, filter.operator)
      case 'date':
        return this.evaluateDateFilter(cellValue, filter.values as DateRangeFilter, filter.operator)
      case 'boolean':
        return this.evaluateBooleanFilter(
          cellValue,
          filter.values as boolean | null,
          filter.operator,
        )
      case 'null':
        return this.evaluateNullFilter(cellValue, filter.operator)
      default:
        return true
    }
  }

  private evaluateSelectFilter(
    value: any,
    options: FilterValue[],
    operator: FilterConfig['operator'],
  ): boolean {
    const selected = options.filter((v) => v.selected).map((v) => v.value)
    if (selected.length === 0) return true // nothing selected means pass-through
    const set = new Set(selected)
    const contains = set.has(value)
    if (operator === 'not_equals') return !contains
    return contains // default equals/in-set
  }

  private evaluateRangeFilter(
    value: any,
    range: RangeFilter,
    operator: FilterConfig['operator'],
  ): boolean {
    const num = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(num)) return false

    // If binned mode with selected ranges, evaluate membership in any selected bin
    if (
      range.mode === 'binned' &&
      Array.isArray(range.ranges) &&
      Array.isArray(range.selectedRangeIds) &&
      range.selectedRangeIds.length > 0
    ) {
      const selectedSet = new Set(range.selectedRangeIds)
      const isInAnySelected = range.ranges.some((r) => {
        if (!selectedSet.has(r.id)) return false
        const minOk = r.includeMin ? num >= r.min : num > r.min
        const maxOk = r.includeMax ? num <= r.max : num < r.max
        return minOk && maxOk
      })

      // Operator semantics for binned selection
      if (operator === 'not_equals' || operator === 'not_between') return !isInAnySelected
      // equals/between behave the same: in any selected bin
      return isInAnySelected
    }

    // Default continuous evaluation
    const inRange = num >= range.currentMin && num <= range.currentMax
    if (operator === 'not_between') return !inRange
    if (operator === 'greater_than') return num > range.currentMin
    if (operator === 'less_than') return num < range.currentMax
    return inRange // between by default
  }

  private evaluateDateFilter(
    value: any,
    range: DateRangeFilter,
    operator: FilterConfig['operator'],
  ): boolean {
    const parsed = value instanceof Date ? value : parseDateFlexible(value)
    const date = parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : new Date(NaN)
    if (isNaN(date.getTime())) return false
    const inRange = date >= range.currentStart && date <= range.currentEnd
    if (operator === 'not_between') return !inRange
    if (operator === 'greater_than') return date > range.currentStart
    if (operator === 'less_than') return date < range.currentEnd
    return inRange // between by default
  }

  private evaluateSearchFilter(
    value: any,
    search: SearchFilter,
    operator: FilterConfig['operator'],
  ): boolean {
    const v = value == null ? '' : String(value)
    const q = search.query || ''
    if (!q) return true
    if (search.exactMatch) {
      if (search.caseSensitive) {
        return operator === 'not_contains' ? v !== q : v === q
      } else {
        return operator === 'not_contains'
          ? v.toLowerCase() !== q.toLowerCase()
          : v.toLowerCase() === q.toLowerCase()
      }
    } else {
      if (search.caseSensitive) {
        return operator === 'not_contains' ? !v.includes(q) : v.includes(q)
      } else {
        return operator === 'not_contains'
          ? !v.toLowerCase().includes(q.toLowerCase())
          : v.toLowerCase().includes(q.toLowerCase())
      }
    }
  }

  private evaluateBooleanFilter(
    value: any,
    expected: boolean | null,
    operator: FilterConfig['operator'],
  ): boolean {
    if (expected == null) return true // All
    const boolVal =
      typeof value === 'boolean'
        ? value
        : value == null
          ? null
          : String(value).toLowerCase() === 'true'
    if (boolVal == null) return false
    if (operator === 'not_equals') return boolVal !== expected
    return boolVal === expected
  }

  private evaluateNullFilter(value: any, operator: FilterConfig['operator']): boolean {
    const isNull = value == null || value === ''
    if (operator === 'is_not_null') return !isNull
    return isNull // is_null by default
  }

  updateFilter(filterId: string, updates: Partial<FilterConfig>): void {
    const existing = this.activeFilters.get(filterId)
    if (!existing) return
    const updated: FilterConfig = {
      ...existing,
      ...updates,
      values: updates.values !== undefined ? updates.values : existing.values,
      active: updates.active !== undefined ? updates.active : true,
    } as FilterConfig
    this.activeFilters.set(filterId, this.cloneFilter(updated))
  }

  resetFilter(filterId: string): void {
    const initial = this.initialFilters.get(filterId)
    if (!initial) return
    this.activeFilters.set(filterId, this.cloneFilter(initial))
  }

  resetAllFilters(): void {
    this.activeFilters = new Map(
      Array.from(this.initialFilters.entries()).map(([k, v]) => [k, this.cloneFilter(v)]),
    )
  }

  getActiveFilterCount(): number {
    let count = 0
    for (const f of this.activeFilters.values()) if (f.active) count++
    return count
  }

  exportFilterState(): FilterState {
    return Array.from(this.activeFilters.values()).map((f) => ({
      id: f.id,
      active: f.active,
      values: this.cloneValues(f.type, f.values),
      operator: f.operator,
    }))
  }

  importFilterState(state: FilterState): void {
    for (const s of state) {
      const existing = this.activeFilters.get(s.id)
      if (!existing) continue
      this.activeFilters.set(
        s.id,
        this.cloneFilter({ ...existing, active: s.active, values: s.values, operator: s.operator }),
      )
    }
  }

  // Helpers
  private cloneFilter(f: FilterConfig): FilterConfig {
    return {
      ...f,
      values: this.cloneValues(f.type, f.values),
    } as FilterConfig
  }

  private cloneValues(type: FilterConfig['type'], values: any): any {
    switch (type) {
      case 'select':
        return (values as FilterValue[]).map((v) => ({ ...v }))
      case 'range':
      case 'date':
      case 'search':
        return values ? { ...values } : values
      default:
        return values
    }
  }
}

export const dataFilterFactory = (filters: FilterConfig[]) => new DataFilter(filters)
