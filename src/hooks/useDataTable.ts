import { useMemo, useCallback } from 'react'
import { CellValue, DataMatrix, DataType, ExcelData, NullableCellValue } from '@/types/excel'
import { parseDateFlexible } from '@/utils/dataTypes'
import { formatCellValue, isNearMidnightSeconds } from '@/utils/tableFormat'

export interface UseDataTableResult {
  headers: string[]
  rows: DataMatrix
  totalRowCount: number
  columnTypes: DataType[]
  dateColumnHasTime: boolean[]
  useVirtualScrolling: boolean
  formatCell: (value: NullableCellValue, type: DataType, showTime: boolean) => string
}

const VIRTUALIZED_SLICE_COUNT = 200

export function useDataTable(
  data: ExcelData | null,
  filteredRows?: CellValue[][],
  virtualizationThreshold = 100,
): UseDataTableResult {
  const displayRows = useMemo<DataMatrix>(() => {
    return (filteredRows as DataMatrix) || data?.rows || []
  }, [filteredRows, data?.rows])

  const headers = useMemo(() => data?.headers || [], [data?.headers])

  const columnTypes = useMemo<DataType[]>(() => {
    if (!data?.metadata?.columns) return []
    return data.metadata.columns.map((col) => col.type)
  }, [data?.metadata?.columns])

  const dateColumnHasTime = useMemo<boolean[]>(() => {
    if (!data?.metadata?.columns) return []
    return data.metadata.columns.map((col) => {
      if (col.type !== 'date') return false
      const samples = col.sampleValues || []
      for (const element of samples) {
        const d = parseDateFlexible(element)
        if (!d) continue
        const secondsSinceMidnight = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
        if (!isNearMidnightSeconds(secondsSinceMidnight)) return true
      }
      return false
    })
  }, [data?.metadata?.columns])

  // Memoize compound derived state structure to keep referential stability
  useMemo(
    () => ({ rows: displayRows, columnTypes, dateColumnHasTime }),
    [displayRows, columnTypes, dateColumnHasTime],
  )

  const useVirtualScrolling = displayRows.length > virtualizationThreshold

  const rows = useMemo<DataMatrix>(() => {
    return useVirtualScrolling ? displayRows.slice(0, VIRTUALIZED_SLICE_COUNT) : displayRows
  }, [displayRows, useVirtualScrolling])

  const totalRowCount = displayRows.length

  const formatCell = useCallback(
    (value: NullableCellValue, type: DataType, showTime: boolean) =>
      formatCellValue(value, type, showTime),
    [],
  )

  return {
    headers,
    rows,
    totalRowCount,
    columnTypes,
    dateColumnHasTime,
    useVirtualScrolling,
    formatCell,
  }
}
