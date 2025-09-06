'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ExcelData, ParseOptions, ParseProgressEvent } from '../types/excel'
import { ExcelParser } from '../services/excelParser'

export function useExcelData() {
  const [currentData, setCurrentData] = useState<ExcelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ParseProgressEvent | null>(null)

  const parser = useMemo(() => new ExcelParser(), [])

  const parseFile = useCallback(
    async (file: File, options: ParseOptions = {}): Promise<ExcelData> => {
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
        return data
      } catch (e: any) {
        const msg = e?.message || 'Failed to parse file'
        setError(msg)
        throw e
      } finally {
        setIsLoading(false)
      }
    },
    [parser],
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

  return { parseFile, currentData, isLoading, error, reset, deleteColumn } as const
}
