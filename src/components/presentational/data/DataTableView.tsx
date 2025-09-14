import React from 'react'
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CellValue, DataMatrix, DataType } from '@/types/excel'
import { clsx } from 'clsx'

export interface DataTableViewProps {
  headers: string[]
  rows: DataMatrix
  totalRowCount: number
  columnTypes: DataType[]
  dateColumnHasTime: boolean[]
  useVirtualScrolling: boolean
  fileMeta?: { fileName: string; activeSheet?: string }
  showDataTypes: boolean
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onDeleteColumn?: (columnIndex: number) => void
  onToggleDataTypes?: (show: boolean) => void
  formatCell: (value: CellValue | null, type: DataType, showTime: boolean) => string
}

export function DataTableView({
  headers,
  rows,
  totalRowCount,
  columnTypes,
  dateColumnHasTime,
  useVirtualScrolling,
  fileMeta,
  showDataTypes,
  sortColumn,
  sortDirection,
  onSort,
  onDeleteColumn,
  onToggleDataTypes,
  formatCell,
}: Readonly<DataTableViewProps>) {
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
              Showing {totalRowCount.toLocaleString()} rows × {headers.length} columns
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
            {fileMeta && (
              <div className="text-sm text-gray-500">
                <span className="font-medium">{fileMeta.fileName}</span>
                {fileMeta.activeSheet && (
                  <span className="ml-2">• Sheet: {fileMeta.activeSheet}</span>
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
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, cellIndex) => {
                  const cellType = columnTypes[cellIndex] || 'string'
                  const formattedValue = formatCell(
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
            ⚡ Showing first 200 rows of {totalRowCount.toLocaleString()} total rows for optimal
            performance
          </p>
        </div>
      )}
    </div>
  )
}
