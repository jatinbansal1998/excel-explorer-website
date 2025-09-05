import { ColumnInfo } from './excel'
import type { NumericRange } from '../types/chart'

export interface FilterConfig {
  id: string
  column: string
  columnIndex: number
  type: FilterType
  active: boolean
  // For simplicity, values holds the config data per type:
  // - 'select': FilterValue[]
  // - 'range': RangeFilter
  // - 'search': SearchFilter
  // - 'date': DateRangeFilter
  // - 'boolean': boolean | null
  // - 'null': boolean (include nulls when true)
  values: any
  operator: FilterOperator
  displayName: string
}

export type FilterType =
  | 'select' // Multi-select dropdown
  | 'range' // Min/max numeric range
  | 'search' // Text search
  | 'date' // Date range picker
  | 'boolean' // True/false toggle
  | 'null' // Include/exclude nulls

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'not_between'
  | 'is_null'
  | 'is_not_null'

export interface FilterValue {
  value: any
  selected: boolean
  count?: number // How many rows have this value
}

export interface RangeFilter {
  min: number
  max: number
  currentMin: number
  currentMax: number
  // Optional advanced mode to use pre-defined numeric bins instead of a continuous range
  mode?: 'continuous' | 'binned'
  // When in binned mode, available ranges and which ones are selected
  ranges?: NumericRange[]
  selectedRangeIds?: string[]
}

export interface DateRangeFilter {
  earliest: Date
  latest: Date
  currentStart: Date
  currentEnd: Date
}

export interface SearchFilter {
  query: string
  caseSensitive: boolean
  exactMatch: boolean
}

export interface FilterStateItem {
  id: string
  active: boolean
  values: any
  operator: FilterOperator
}

export type FilterState = FilterStateItem[]

// Helper re-exports used by services
export type { ColumnInfo }
