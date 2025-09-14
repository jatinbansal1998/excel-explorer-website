import React from 'react'
import { CellValue, ExcelData } from '@/types/excel'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { DataTableView } from '@/components/presentational/data/DataTableView'
import { useDataTable } from '@/hooks/useDataTable'

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
  const {
    headers,
    rows,
    totalRowCount,
    columnTypes,
    dateColumnHasTime,
    useVirtualScrolling,
    formatCell,
  } = useDataTable(data, filteredRows, 100)

  if (isLoading) {
    return (
      <div className="section-container p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
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
    <DataTableView
      headers={headers}
      rows={rows}
      totalRowCount={totalRowCount}
      columnTypes={columnTypes}
      dateColumnHasTime={dateColumnHasTime}
      useVirtualScrolling={useVirtualScrolling}
      fileMeta={
        data?.metadata
          ? { fileName: data.metadata.fileName, activeSheet: data.metadata.activeSheet }
          : undefined
      }
      showDataTypes={showDataTypes}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      onDeleteColumn={onDeleteColumn}
      onToggleDataTypes={onToggleDataTypes}
      formatCell={formatCell}
    />
  )
}
