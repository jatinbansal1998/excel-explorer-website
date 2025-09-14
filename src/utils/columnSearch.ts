import { ColumnInfo } from '@/types/excel'
import { ChartType } from '@/types/chart'
import { chartTypeConfigs } from './chartConfig'

export function getCompatibleColumns(columnInfo: ColumnInfo[], selectedType: ChartType): ColumnInfo[] {
  const config = chartTypeConfigs.find((c) => c.type === selectedType)
  if (!config) return []
  return columnInfo.filter((col) => config.supportedDataTypes.includes(col.type))
}

export function rankColumns(
  columns: ColumnInfo[],
  searchTerm: string,
  selectedType: ChartType,
): ColumnInfo[] {
  if (!searchTerm) {
    // Sort by relevance when no search: numeric columns first for pie charts, then alphabetically
    return [...columns].sort((a, b) => {
      if (selectedType === 'pie') {
        if (a.type === 'number' && b.type !== 'number') return -1
        if (a.type !== 'number' && b.type === 'number') return 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  const lowerSearch = searchTerm.toLowerCase().trim()

  return columns
    .map((col) => {
      const colName = col.name.toLowerCase().trim()
      const search = lowerSearch
      let score = 0

      // Exact match gets highest score (case-insensitive)
      if (colName === search) score += 100
      // Exact match ignoring spaces/underscores/hyphens
      else if (normalize(colName) === normalize(search)) score += 95
      // Starts with search term
      else if (colName.startsWith(search)) score += 50
      // Starts with after removing separators
      else if (normalize(colName).startsWith(normalize(search))) score += 45
      // Contains search term
      else if (colName.includes(search)) score += 25
      // Contains after removing separators
      else if (normalize(colName).includes(normalize(search))) score += 20
      // Word boundary matches
      else if (new RegExp(`\\b${escapeRegex(search)}`, 'i').test(col.name)) score += 15
      // Fuzzy matching for common patterns
      else if (fuzzyMatch(colName, search)) score += 10

      // Boost score for numeric columns in pie charts
      if (selectedType === 'pie' && col.type === 'number') score += 5

      return { column: col, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.column.name.localeCompare(b.column.name))
    .map((item) => item.column)
}

function normalize(s: string): string {
  return s.replace(/[_\s-]/g, '')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Simple fuzzy matching for common financial/data terms
export function fuzzyMatch(columnName: string, searchTerm: string): boolean {
  const synonyms: { [key: string]: string[] } = {
    price: ['cost', 'value', 'amount', 'rate'],
    amount: ['price', 'cost', 'value', 'sum'],
    date: ['time', 'day', 'month', 'year'],
    name: ['title', 'label', 'description'],
    count: ['number', 'quantity', 'total'],
    percent: ['rate', 'ratio', '%'],
  }

  for (const [key, values] of Object.entries(synonyms)) {
    if (searchTerm.includes(key) && values.some((v) => columnName.includes(v))) {
      return true
    }
    if (columnName.includes(key) && values.some((v) => searchTerm.includes(v))) {
      return true
    }
  }

  return false
}

