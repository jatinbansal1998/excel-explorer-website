'use client'

import { useState, useMemo, useEffect } from 'react'
import { FileUploader } from '../components/FileUploader'
import { DataTable } from '../components/DataTable'
import { useToast } from '../components/ui/Toast'
import { useExcelData } from '../hooks/useExcelData'
import { useFilters } from '../hooks/useFilters'
import { FilterPanel } from '../components/FilterPanel'
import { ChartView } from '../components/ChartView'
import AnalyticsPanel from '../components/analytics/AnalyticsPanel'
import { useSessionPersistence } from '../hooks/useSessionPersistence'
import { SessionManagerModal } from '../components/session/SessionManagerModal'

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
        <div className="border border-blue-200 bg-blue-50 text-blue-900 rounded p-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Restore last session</span> –{' '}
            {session.lastSessionSummary.fileName} ({session.lastSessionSummary.totalRows} rows ×{' '}
            {session.lastSessionSummary.totalColumns} cols)
          </div>
          <div className="space-x-2">
            <button
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
              onClick={session.restoreLastSession}
            >
              Restore
            </button>
            <button
              className="px-3 py-1 text-sm border rounded"
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
          <div className="flex justify-end">
            <ManageSessionsButton session={session} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ManageSessionsButton({ session }: { session: ReturnType<typeof useSessionPersistence> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="px-3 py-2 text-sm border rounded" onClick={() => setOpen(true)}>
        Manage sessions
      </button>
      <SessionManager open={open} onClose={() => setOpen(false)} session={session} />
    </>
  )
}

function SessionManager({
  open,
  onClose,
  session,
}: {
  open: boolean
  onClose: () => void
  session: ReturnType<typeof useSessionPersistence>
}) {
  const [isOpen, setIsOpen] = useState(open)
  useEffect(() => setIsOpen(open), [open])
  return (
    <SessionManagerModal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false)
        onClose()
      }}
      sessions={session.sessions}
      onRestore={async (id) => {
        await session.restoreSession(id)
        setIsOpen(false)
        onClose()
      }}
      onDelete={async (id) => {
        await session.deleteSession(id)
      }}
      onClearAll={async () => {
        await session.clearAll()
        setIsOpen(false)
        onClose()
      }}
    />
  )
}
