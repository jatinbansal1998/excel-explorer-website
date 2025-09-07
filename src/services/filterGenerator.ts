import { ColumnInfo } from '@/types/excel'
import {
  FilterConfig,
  FilterType,
  FilterValue,
  RangeFilter,
  DateRangeFilter,
  SearchFilter,
} from '@/types/filter'
import { numericRangeGenerator } from './numericRangeGenerator'

function toId(name: string, index: number, suffix?: string) {
  return `filter-${index}${suffix ? '-' + suffix : ''}`
}

export class FilterGenerator {
  generateFilters(columns: ColumnInfo[]): FilterConfig[] {
    return columns.flatMap((column) => {
      const baseFilter = (() => {
        switch (column.type) {
          case 'string':
            return this.generateStringFilter(column)
          case 'number':
            return this.generateNumericFilter(column)
          case 'date':
            return this.generateDateFilter(column)
          case 'boolean':
            return this.generateBooleanFilter(column)
          default:
            return this.generateGenericFilter(column)
        }
      })()

      const filters: FilterConfig[] = [baseFilter]
      if (column.hasNulls) {
        filters.push(this.generateNullFilter(column))
      }
      return filters
    })
  }

  // String: choose select for low cardinality, else search
  private generateStringFilter(column: ColumnInfo): FilterConfig {
    const useSelect =
      column.uniqueCount > 0 && column.uniqueCount <= 1000 && column.uniqueValues?.length
    if (useSelect) {
      const values: FilterValue[] = (column.uniqueValues || [])
        .slice(0, 1000)
        .map((v) => ({ value: v, selected: false }))

      return {
        id: toId(column.name, column.index),
        column: column.name,
        columnIndex: column.index,
        type: 'select',
        active: false,
        values,
        operator: 'equals',
        displayName: column.name,
      } as FilterConfig
    }

    const search: SearchFilter = {
      query: '',
      caseSensitive: false,
      exactMatch: false,
    }

    return {
      id: toId(column.name, column.index),
      column: column.name,
      columnIndex: column.index,
      type: 'search',
      active: false,
      values: search,
      operator: 'contains',
      displayName: column.name,
    } as FilterConfig
  }

  private generateNumericFilter(column: ColumnInfo): FilterConfig {
    const minVal =
      typeof column.statistics?.min === 'number' ? (column.statistics?.min as number) : 0
    const maxVal =
      typeof column.statistics?.max === 'number' ? (column.statistics?.max as number) : 0
    const baseRange: RangeFilter = {
      min: minVal,
      max: maxVal,
      currentMin: minVal,
      currentMax: maxVal,
      mode: 'continuous',
    }

    // Try preparing sensible default bins using sample values
    const numericSamples = (column.sampleValues || []).filter(
      (v) => typeof v === 'number' && Number.isFinite(v),
    ) as number[]
    if (numericSamples.length >= 5) {
      const ranges = numericRangeGenerator.generateDefaultRanges(numericSamples, column.name)
      if (ranges.length) {
        baseRange.ranges = ranges
        baseRange.selectedRangeIds = ranges.map((r) => r.id) // default select all
      }
    }

    return {
      id: toId(column.name, column.index),
      column: column.name,
      columnIndex: column.index,
      type: 'range',
      active: false,
      values: baseRange,
      operator: 'between',
      displayName: column.name,
    } as FilterConfig
  }

  private generateDateFilter(column: ColumnInfo): FilterConfig {
    const min =
      column.statistics?.min instanceof Date
        ? (column.statistics?.min as Date)
        : column.statistics?.min
          ? new Date(column.statistics?.min as any)
          : new Date(0)
    const max =
      column.statistics?.max instanceof Date
        ? (column.statistics?.max as Date)
        : column.statistics?.max
          ? new Date(column.statistics?.max as any)
          : new Date()

    const range: DateRangeFilter = {
      earliest: min,
      latest: max,
      currentStart: min,
      currentEnd: max,
    }

    return {
      id: toId(column.name, column.index),
      column: column.name,
      columnIndex: column.index,
      type: 'date',
      active: false,
      values: range,
      operator: 'between',
      displayName: column.name,
    } as FilterConfig
  }

  private generateBooleanFilter(column: ColumnInfo): FilterConfig {
    // values: boolean | null (null means All)
    return {
      id: toId(column.name, column.index),
      column: column.name,
      columnIndex: column.index,
      type: 'boolean',
      active: false,
      values: null,
      operator: 'equals',
      displayName: column.name,
    } as FilterConfig
  }

  private generateGenericFilter(column: ColumnInfo): FilterConfig {
    // Fallback to search
    return this.generateStringFilter({ ...column, type: 'string' } as ColumnInfo)
  }

  private generateNullFilter(column: ColumnInfo): FilterConfig {
    return {
      id: toId(column.name, column.index, 'null'),
      column: column.name,
      columnIndex: column.index,
      type: 'null',
      active: false,
      values: true,
      operator: 'is_null',
      displayName: `${column.name} (Nulls)`,
    } as FilterConfig
  }

  // Utilities for large datasets (optional use)
  extractUniqueValues(data: any[][], columnIndex: number, maxValues: number = 1000): FilterValue[] {
    const counts = this.calculateValueCounts(data, columnIndex)
    const values: FilterValue[] = []
    let i = 0
    for (const [value, count] of counts.entries()) {
      values.push({ value, selected: false, count })
      i++
      if (i >= maxValues) break
    }
    return values
  }

  calculateValueCounts(data: any[][], columnIndex: number): Map<any, number> {
    const map = new Map<any, number>()
    for (let i = 0; i < data.length; i++) {
      const v = data[i][columnIndex]
      const key = v ?? null // normalize undefined to null
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }
}

export const filterGenerator = new FilterGenerator()
