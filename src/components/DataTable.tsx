import React, { useMemo } from 'react'
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CellValue, DataType, ExcelData, NullableCellValue } from '@/types/excel'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { clsx } from 'clsx'
import { parseDateFlexible } from '@/utils/dataTypes'

interface DataTableProps {
  data: ExcelData | null
  filteredRows?: CellValue[][]
  onSort?: (_column: string, _direction: 'asc' | 'desc') => void
  isLoading?: boolean
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onDeleteColumn?: (_columnIndex: number) => void
  showDataTypes?: boolean
  onToggleDataTypes?: (_show: boolean) => void
}

function formatCellValue(value: NullableCellValue, type: DataType, showTime: boolean): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  switch (type) {
    case 'date':
      // Parse using flexible parser (handles Excel serials, strings, Date)
      const d = parseDateFlexible(value)
      if (!d) return String(value)
      // Heuristic: if time is essentially midnight (within threshold) show only date
      const secondsSinceMidnight = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
      const secondsUntilMidnight = 24 * 3600 - secondsSinceMidnight
      const nearMidnightThreshold = 30 * 60 // 30 minutes
      const isNearMidnight =
        secondsSinceMidnight <= nearMidnightThreshold ||
        secondsUntilMidnight <= nearMidnightThreshold
      if (!showTime || isNearMidnight) {
        return d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      }
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

    case 'number':
      const num = Number(value)
      return isNaN(num) ? String(value) : num.toLocaleString()

    case 'boolean':
      return String(value)

    default:
      return String(value)
  }
}

export function DataTable({
  data,
  filteredRows,
  onSort,
  isLoading = false,
  sortColumn,
  sortDirection,
  onDeleteColumn,
  showDataTypes = false,
  onToggleDataTypes,
}: Readonly<DataTableProps>) {
  const displayRows = useMemo(() => filteredRows || data?.rows || [], [filteredRows, data?.rows])
  const headers = data?.headers || []

  const columnTypes = useMemo(() => {
    if (!data?.metadata?.columns) return []
    return data.metadata.columns.map((col) => col.type)
  }, [data?.metadata?.columns])

  const dateColumnHasTime = useMemo(() => {
    if (!data?.metadata?.columns) return [] as boolean[]
    return data.metadata.columns.map((col) => {
      if (col.type !== 'date') return false
      const samples = col.sampleValues || []
      const nearMidnightThreshold = 30 * 60 // 30 minutes
      for (const element of samples) {
        const d = parseDateFlexible(element)
        if (!d) continue
        const secondsSinceMidnight = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
        const secondsUntilMidnight = 24 * 3600 - secondsSinceMidnight
        const isNearMidnight =
          secondsSinceMidnight <= nearMidnightThreshold ||
          secondsUntilMidnight <= nearMidnightThreshold
        if (!isNearMidnight) return true // significant time present in samples
      }
      return false // all samples near midnight → treat as date-only
    })
  }, [data?.metadata?.columns])
  useMemo(
    () => ({
      rows: displayRows,
      columnTypes,
      dateColumnHasTime,
    }),
    [displayRows, columnTypes, dateColumnHasTime],
  )
  const useVirtualScrolling = displayRows.length > 100

  if (isLoading) {
    return (
      <div className="section-container p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  if (!data || headers.length === 0) {
    return (
      <div className="section-container p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No data to display</h3>
          <p className="mt-1 text-sm text-gray-500">Upload an Excel or CSV file to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="section-container overflow-hidden flex flex-col"
      style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
    >
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Data Table</h3>
            <p className="text-sm text-gray-500">
              Showing {displayRows.length.toLocaleString()} rows × {headers.length} columns
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {onToggleDataTypes && (
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showDataTypes}
                  onChange={(e) => onToggleDataTypes(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Show data types</span>
              </label>
            )}
            {data?.metadata && (
              <div className="text-sm text-gray-500">
                <span className="font-medium">{data.metadata.fileName}</span>
                {data.metadata.activeSheet && (
                  <span className="ml-2">• Sheet: {data.metadata.activeSheet}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className={clsx(
                    'px-2 py-1.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider',
                    (onSort || onDeleteColumn) && 'hover:bg-gray-100',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <button
                      className={clsx('flex-1 text-left', onSort && 'cursor-pointer select-none')}
                      onClick={() =>
                        onSort &&
                        onSort(
                          header,
                          sortColumn === header && sortDirection === 'asc' ? 'desc' : 'asc',
                        )
                      }
                    >
                      <div>
                        <span>{header}</span>
                        {showDataTypes && columnTypes[index] && (
                          <div className="text-xs text-gray-400 font-normal mt-0.5 capitalize">
                            {columnTypes[index]}
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center space-x-1">
                      {onSort && (
                        <div className="flex flex-col">
                          <ChevronUpIcon
                            className={clsx(
                              'h-3 w-3',
                              sortColumn === header && sortDirection === 'asc'
                                ? 'text-primary-600'
                                : 'text-gray-300',
                            )}
                          />
                          <ChevronDownIcon
                            className={clsx(
                              'h-3 w-3 -mt-1',
                              sortColumn === header && sortDirection === 'desc'
                                ? 'text-primary-600'
                                : 'text-gray-300',
                            )}
                          />
                        </div>
                      )}
                      {onDeleteColumn && (
                        <button
                          className="text-red-600 hover:text-red-700 ml-2"
                          title="Delete column"
                          aria-label="Delete column"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteColumn?.(index)
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRows
              .slice(0, useVirtualScrolling ? 200 : displayRows.length)
              .map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIndex) => {
                    const cellType = columnTypes[cellIndex] || 'string'
                    const formattedValue = formatCellValue(
                      cell,
                      cellType,
                      cellType === 'date' ? dateColumnHasTime[cellIndex] === true : false,
                    )
                    return (
                      <td
                        key={cellIndex}
                        className="px-2 py-0.5 whitespace-nowrap text-sm text-gray-900"
                      >
                        <div className="max-w-xs truncate" title={formattedValue}>
                          {formattedValue}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {useVirtualScrolling && (
        <div className="px-3 py-1 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            ⚡ Showing first 200 rows of {displayRows.length.toLocaleString()} total rows for
            optimal performance
          </p>
        </div>
      )}
    </div>
  )
}
