'use client'

import { useState } from 'react'
import { FileUploader } from '@/components/FileUploader'
import { DataTable } from '@/components/DataTable'
import { useToast } from '@/components/ui/Toast'
import { useExcelData } from '@/hooks/useExcelData'
import { useFilters } from '@/hooks/useFilters'
import { FilterPanel } from '@/components/FilterPanel'
import { ChartView } from '@/components/ChartView'
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel'
import { useSessionPersistence } from '@/hooks/useSessionPersistence'

export default function HomePage() {
  const [showDataTypes, setShowDataTypes] = useState(false)
  const { addToast } = useToast()
  const session = useSessionPersistence({ enabled: true })
  const { parseFile, currentData, isLoading, deleteColumn } = useExcelData(session)
  const { filters, filteredData, isFiltering, updateFilter, resetFilter, resetAllFilters } =
    useFilters(currentData, session)

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
      {session.showRestoreBanner && session.lastSessionSummary && (
        <div className="border border-primary-200 bg-primary-50 text-primary-900 rounded p-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Restore last session</span> –{' '}
            {session.lastSessionSummary.fileName} ({session.lastSessionSummary.totalRows} rows ×{' '}
            {session.lastSessionSummary.totalColumns} cols)
          </div>
          <div className="space-x-2">
            <button
              className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded"
              onClick={session.restoreLastSession}
            >
              Restore
            </button>
            <button
              className="px-3 py-1 text-sm border border-gray-300 rounded"
              onClick={session.dismissRestoreBanner}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
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
            <>
              <ChartView
                filteredData={filteredData}
                columnInfo={currentData.metadata.columns}
                session={session}
                registerExternalApplyChart={(fn) => {
                  ;(window as any).__applyChartFromAI = fn
                }}
              />
              <AnalyticsPanel
                excelData={currentData}
                onApplyChart={(cfg) => {
                  try {
                    const apply = (window as any).__applyChartFromAI
                    if (typeof apply === 'function') apply(cfg)
                  } catch {}
                }}
                onApplyFilters={(f) => {
                  try {
                    // Import filters when provided. If it's a full FilterState array, call importState.
                    if (Array.isArray(f)) {
                      // Note: useFilters hook instance is not directly accessible here; integrate via a global shim for MVP
                      const importer = (window as any).__importFiltersFromAI
                      if (typeof importer === 'function') importer(f)
                    }
                  } catch {}
                }}
              />
            </>
          )}
          <div className="flex justify-end"></div>
        </div>
      </div>
    </div>
  )
}

// Sessions are now managed from the Header
