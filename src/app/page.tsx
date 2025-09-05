'use client'

import { useState } from 'react'
import { FileUploader } from '../components/FileUploader'
import { DataTable } from '../components/DataTable'
import { useToast } from '../components/ui/Toast'
import { useExcelData } from '../hooks/useExcelData'
import { useFilters } from '../hooks/useFilters'
import { FilterPanel } from '../components/FilterPanel'
import { ChartView } from '../components/ChartView'

export default function HomePage() {
  const [showDataTypes, setShowDataTypes] = useState(false)
  const { addToast } = useToast()
  const { parseFile, currentData, isLoading, deleteColumn } = useExcelData()
  const { filters, filteredData, isFiltering, updateFilter, resetFilter, resetAllFilters } =
    useFilters(currentData)

  const handleFileSelect = async (file: File) => {
    try {
      const data = await parseFile(file)
      addToast({
        type: 'success',
        title: 'File Parsed Successfully',
        message: `${data.metadata.fileName} • ${data.metadata.totalRows} rows × ${data.metadata.totalColumns} columns`,
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: (error as any)?.message || 'There was an error processing your file',
      })
    }
  }

  return (
    <div className="space-y-3 xl:space-y-2 h-full flex flex-col">
      <FileUploader onFileSelect={handleFileSelect} isLoading={isLoading || isFiltering} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 xl:gap-2 items-start flex-1 min-h-0">
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            onFilterChange={updateFilter}
            onFilterReset={resetFilter}
            onResetAll={resetAllFilters}
            columnInfo={currentData?.metadata?.columns || []}
            filteredData={filteredData}
          />
        </div>
        <div className="lg:col-span-3 space-y-3 xl:space-y-2">
          <DataTable
            data={currentData}
            filteredRows={filteredData}
            isLoading={isLoading || isFiltering}
            onDeleteColumn={(idx) => deleteColumn(idx)}
            showDataTypes={showDataTypes}
            onToggleDataTypes={setShowDataTypes}
          />
          {currentData?.metadata?.columns && (
            <ChartView filteredData={filteredData} columnInfo={currentData.metadata.columns} />
          )}
        </div>
      </div>
    </div>
  )
}
