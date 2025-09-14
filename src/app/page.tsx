'use client'

import { lazy, Suspense, useState } from 'react'
import { FileUploader } from '@/components/FileUploader'
import { DataTable } from '@/components/DataTable'
import { useToast } from '@/components/ui/Toast'
import { useExcelData } from '@/hooks/useExcelData'
import { useFilters } from '@/hooks/useFilters'
import { useSessionPersistence } from '@/hooks/useSessionPersistence'
import { globalProperties } from '@/types/global'
import {
  ChartErrorBoundary,
  DataProcessingErrorBoundary,
  ErrorBoundaryWrapper,
} from '@/components/ErrorBoundaryWrapper'
import { PerformanceMonitor, usePerformanceMonitor } from '@/components/PerformanceMonitor'
import { SessionRestoreProgress } from '@/components/session/SessionRestoreProgress'

// Lazy load heavy components
const FilterPanel = lazy(() =>
  import('@/components/FilterPanel').then((module) => ({ default: module.FilterPanel })),
)
const ChartView = lazy(() =>
  import('@/components/ChartView').then((module) => ({ default: module.ChartView })),
)
const AnalyticsPanel = lazy(() =>
  import('@/components/analytics/AnalyticsPanel').then((module) => ({
    default: module.AnalyticsPanel,
  })),
)

export default function HomePage() {
  const [showDataTypes, setShowDataTypes] = useState(false)
  const { addToast } = useToast()
  const session = useSessionPersistence({ enabled: true })
  const { parseFile, currentData, isLoading, progress, deleteColumn } = useExcelData(session)
  const { filters, filteredData, isFiltering, updateFilter, resetFilter, resetAllFilters } =
    useFilters(currentData, session)
  const { isVisible: showPerfMonitor, toggle: togglePerfMonitor } = usePerformanceMonitor()

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
        message: (error as Error)?.message || 'There was an error processing your file',
      })
    }
  }

  const handleRestoreSession = async (restoreFn: () => Promise<void>) => {
    try {
      await restoreFn()
    } catch (error) {
      console.error('Session restoration failed:', error)
      addToast({
        type: 'error',
        title: 'Session Restoration Failed',
        message:
          (error as Error)?.message ||
          'Failed to restore session. Please try again or upload a new file.',
        duration: 8000, // Longer duration for session errors
      })
    }
  }

  return (
    <ErrorBoundaryWrapper>
      <div className="space-y-3 xl:space-y-2 h-full flex flex-col">
        {session.showRestoreBanner && session.lastSessionSummary && (
          <div className="border border-primary-200 bg-primary-50 text-primary-900 rounded p-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Restore last session</span> –{' '}
              {session.lastSessionSummary.fileName} ({session.lastSessionSummary.totalRows} rows ×{' '}
              {session.lastSessionSummary.totalColumns} cols)
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded"
                onClick={() => handleRestoreSession(session.restoreLastSession)}
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
        <DataProcessingErrorBoundary>
          <FileUploader
            onFileSelect={handleFileSelect}
            isLoading={isLoading || isFiltering}
            progress={progress || undefined}
          />
        </DataProcessingErrorBoundary>

        <div className="space-y-3 xl:space-y-2 flex-1 min-h-0">
          {/* Section 1: Filters and DataTable */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 xl:gap-2">
            <div className="lg:col-span-1">
              <Suspense
                fallback={<div className="p-4 text-center text-gray-500">Loading filters...</div>}
              >
                <FilterPanel
                  filters={filters}
                  onFilterChange={updateFilter}
                  onFilterReset={resetFilter}
                  onResetAll={resetAllFilters}
                  columnInfo={currentData?.metadata?.columns || []}
                  filteredData={filteredData}
                />
              </Suspense>
            </div>
            <div className="lg:col-span-3">
              <DataProcessingErrorBoundary>
                <DataTable
                  data={currentData}
                  filteredRows={filteredData}
                  isLoading={isLoading || isFiltering}
                  onDeleteColumn={(idx) => deleteColumn(idx)}
                  showDataTypes={showDataTypes}
                  onToggleDataTypes={setShowDataTypes}
                />
              </DataProcessingErrorBoundary>
            </div>
          </div>

          {/* Section 2: Data Visualization - spans full width */}
          {currentData?.metadata?.columns && (
            <ChartErrorBoundary>
              <Suspense
                fallback={<div className="p-8 text-center text-gray-500">Loading charts...</div>}
              >
                <ChartView
                  filteredData={filteredData}
                  columnInfo={currentData.metadata.columns}
                  session={session}
                  registerExternalApplyChart={(fn) => {
                    globalProperties.setApplyChartFromAI(fn as (config: unknown) => void)
                  }}
                />
              </Suspense>
            </ChartErrorBoundary>
          )}

          {/* Section 3: AI Insights - spans full width */}
          {currentData?.metadata?.columns && (
            <DataProcessingErrorBoundary>
              <Suspense
                fallback={<div className="p-8 text-center text-gray-500">Loading analytics...</div>}
              >
                <AnalyticsPanel
                  excelData={currentData}
                  filteredRows={filteredData}
                  filtersActive={filters.some((f) => f.active)}
                  _onApplyChart={(cfg) => {
                    try {
                      const apply = globalProperties.getApplyChartFromAI()
                      if (typeof apply === 'function') apply(cfg)
                    } catch {}
                  }}
                  _onApplyFilters={(f) => {
                    try {
                      // Import filters when provided. If it's a full FilterState array, call importState.
                      if (Array.isArray(f)) {
                        // Note: useFilters hook instance is not directly accessible here; integrate via global property manager for MVP
                        const importer = globalProperties.getImportFiltersFromAI()
                        if (typeof importer === 'function') importer(f)
                      }
                    } catch {}
                  }}
                />
              </Suspense>
            </DataProcessingErrorBoundary>
          )}
        </div>

        {/* Performance Monitor */}
        <PerformanceMonitor isVisible={showPerfMonitor} onToggle={togglePerfMonitor} />

        {/* Session Restoration Progress Modal */}
        <SessionRestoreProgress
          isOpen={session.isRestoring}
          progress={session.restoreProgress}
          onCancel={session.cancelRestore}
        />
      </div>
    </ErrorBoundaryWrapper>
  )
}

// Sessions are now managed from the Header
