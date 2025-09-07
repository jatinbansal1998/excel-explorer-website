'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import type { ExcelData, ParseOptions, ParseProgressEvent } from '@/types/excel'
import { ExcelParser } from '@/services/excelParser'
import { useSessionPersistence } from './useSessionPersistence'
import type { UseSessionPersistenceReturn } from './useSessionPersistence'
import { PerformanceMonitor } from '@/utils/performanceMonitor'

export function useExcelData(sessionExt?: UseSessionPersistenceReturn) {
  const [currentData, setCurrentData] = useState<ExcelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ParseProgressEvent | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const parser = useMemo(() => new ExcelParser(), [])
  const defaultSession = useSessionPersistence()
  const session = sessionExt ?? defaultSession
  const performanceMonitor = useMemo(() => PerformanceMonitor.getInstance(), [])

  // Register loader callback for restore when persistence becomes available
  useEffect(() => {
    session.registerOnLoadDataset?.((d) => {
      setCurrentData(d)
      setIsRestoring(false)
    })
  }, [session])

  // Sync restoration state from session hook
  useEffect(() => {
    setIsRestoring(session.isRestoring || false)
  }, [session.isRestoring])

  const parseFile = useCallback(
    async (file: File, options: ParseOptions = {}): Promise<ExcelData> => {
      return performanceMonitor.measureAsync(
        'excel_file_parse',
        async () => {
          setIsLoading(true)
          setError(null)
          setProgress({ stage: 'validating', message: 'Validating file' })

          try {
            const data = await parser.parseFile(file, {
              ...options,
              // Default to lightweight metadata for responsiveness; caller can override
              computeStatistics: options.computeStatistics ?? false,
              uniqueValuesTrackingCap: options.uniqueValuesTrackingCap ?? 2000,
              uniqueValuesReturnLimit: options.uniqueValuesReturnLimit ?? 50,
              sampleValuesCount: options.sampleValuesCount ?? 5,
              progress: (ev) => {
                setProgress(ev)
                options.progress?.(ev)
              },
            })

            setCurrentData(data)
            // Save session summary and dataset snapshot
            try {
              if (!session.service) {
                console.warn('⚠️ Persistence service not ready; skipping dataset save')
                return data
              }
              const summary = {
                fileName: data.metadata.fileName,
                sheetName: data.metadata.activeSheet,
                totalRows: data.metadata.totalRows,
                totalColumns: data.metadata.totalColumns,
                columns: (data.metadata.columns || []).map((c) => c.name).slice(0, 50),
              }
              const s = await session.service.createOrUpdateSession(summary)
              await session.service.saveDataset(s.id, data)
            } catch (e) {
              // Non-blocking persistence errors
              console.warn('⚠️ Dataset persistence failed:', e)
            }
            return data
          } catch (e: any) {
            const msg = e?.message || 'Failed to parse file'
            setError(msg)
            throw e
          } finally {
            setIsLoading(false)
          }
        },
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      )
    },
    [parser, session.service, performanceMonitor],
  )

  const reset = useCallback(() => {
    setCurrentData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  const deleteColumn = useCallback(
    (columnIndex: number) => {
      setCurrentData((prev) => {
        if (!prev) return prev
        const headers = prev.headers || []
        if (columnIndex < 0 || columnIndex >= headers.length) return prev

        const newHeaders = headers.filter((_, i) => i !== columnIndex)
        const newRows = (prev.rows || []).map((row) => row.filter((_, i) => i !== columnIndex))

        // Recompute column metadata using the existing parser utilities
        const recomputedColumns = parser.detectColumnTypes([newHeaders as any, ...newRows])

        const newMetadata = {
          ...prev.metadata,
          totalColumns: newHeaders.length,
          totalRows: newRows.length,
          columns: recomputedColumns,
        } as ExcelData['metadata']

        const updated: ExcelData = {
          headers: newHeaders,
          rows: newRows,
          metadata: newMetadata,
        }
        return updated
      })
    },
    [parser],
  )

  return {
    parseFile,
    currentData,
    isLoading,
    error,
    progress,
    reset,
    deleteColumn,
    isRestoring,
    restoreProgress: session.restoreProgress,
    cancelRestore: session.cancelRestore,
  } as const
}
