'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChartConfig,
  ChartSuggestion,
  ChartType,
  AggregationType,
  NumericRange,
} from '@/types/chart'
import { ColumnInfo } from '@/types/excel'
import { chartSuggestionEngine } from '@/services/chartSuggestion'
import { v4 as uuidv4 } from 'uuid'
import { useSessionPersistence } from './useSessionPersistence'
import type { UseSessionPersistenceReturn } from './useSessionPersistence'

export function useCharts(
  filteredData: any[][],
  columnInfo: ColumnInfo[],
  sessionExt?: UseSessionPersistenceReturn,
) {
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([])
  const [autoCreateDefault, setAutoCreateDefault] = useState(false)
  const defaultSession = useSessionPersistence()
  const session = sessionExt ?? defaultSession

  // Register restore handler when persistence is available
  useEffect(() => {
    session.registerOnLoadCharts?.((c) => setCharts(c))
  }, [session])

  useEffect(() => {
    if (filteredData?.length && columnInfo?.length) {
      const newSuggestions = chartSuggestionEngine.suggestCharts(columnInfo, filteredData)
      setSuggestions(newSuggestions)
    } else {
      setSuggestions([])
    }
  }, [filteredData, columnInfo])

  useEffect(() => {
    if (autoCreateDefault && charts.length === 0 && suggestions.length > 0) {
      const defaultChart = createChartFromSuggestion(suggestions[0])
      setCharts([defaultChart])
    }
  }, [suggestions, charts.length, autoCreateDefault])

  const addChart = useCallback((suggestion: ChartSuggestion) => {
    const newChart = createChartFromSuggestion(suggestion)
    setCharts((prev) => [...prev, newChart])
  }, [])

  const updateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setCharts((prev) => prev.map((c) => (c.id === chartId ? { ...c, ...updates } : c)))
  }, [])

  const removeChart = useCallback((chartId: string) => {
    setCharts((prev) => {
      const next = prev.filter((c) => c.id !== chartId)
      if (next.length === 0) {
        setAutoCreateDefault(false)
      }
      return next
    })
  }, [])

  const clearCharts = useCallback(() => {
    setAutoCreateDefault(false)
    setCharts([])
  }, [])

  const createManualChart = useCallback(
    (config: {
      type: ChartType
      dataColumn: string
      labelColumn?: string
      aggregation: AggregationType
      title: string
      maxSegments?: number
      numericRanges?: NumericRange[]
    }) => {
      const manualSuggestion: ChartSuggestion = {
        type: config.type,
        title: config.title,
        dataColumn: config.dataColumn,
        labelColumn: config.labelColumn,
        aggregation: config.aggregation,
        confidence: 0.5,
        reason: 'Manual chart creation',
      }

      const newChart = createChartFromSuggestion(
        manualSuggestion,
        config.maxSegments,
        config.numericRanges,
      )
      setCharts((prev) => [...prev, newChart])
    },
    [],
  )

  // Persist charts when they change and a session exists
  useEffect(() => {
    const timer = setTimeout(() => {
      ;(async () => {
        const svc = session.service
        if (!svc) return
        const active = await session.getActiveSessionId?.()
        if (!active) return
        try {
          await svc.saveCharts(active, charts)
        } catch (e) {
          console.warn('Persist charts failed', e)
        }
      })()
    }, 300)
    return () => clearTimeout(timer)
  }, [charts, session])

  return {
    charts,
    suggestions,
    addChart,
    updateChart,
    removeChart,
    clearCharts,
    createManualChart,
  } as const
}

function createChartFromSuggestion(
  s: ChartSuggestion,
  maxSegments?: number,
  numericRanges?: NumericRange[],
): ChartConfig {
  // Configure legend position based on chart type
  const legendPosition = s.type === 'pie' || s.type === 'doughnut' ? 'right' : 'top'

  return {
    id: uuidv4(),
    title: s.title,
    type: s.type,
    dataColumn: s.dataColumn,
    labelColumn: s.labelColumn,
    aggregation: s.aggregation,
    maxSegments: maxSegments || 10, // Default to 10 if not specified
    numericRanges: numericRanges,
    position: { row: 0, column: 0, width: 1, height: 1 },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: legendPosition,
        },
        title: { display: false, text: s.title },
        tooltip: { enabled: true },
      },
      animation: { duration: 250, easing: 'easeOutQuart' },
    },
  }
}
