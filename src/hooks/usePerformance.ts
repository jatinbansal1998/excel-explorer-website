import {useCallback, useEffect, useRef, useState} from 'react'
import {PerformanceMetric, PerformanceMonitor, PerformanceSummary,} from '@/utils/performanceMonitor'

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const performanceMonitor = useRef(PerformanceMonitor.getInstance())

    const startTiming = useCallback((name: string, metadata?: Record<string, unknown>) => {
    performanceMonitor.current.startTiming(name, metadata)
  }, [])

  const endTiming = useCallback((name: string) => {
    const metric = performanceMonitor.current.endTiming(name)
    if (metric) {
      setMetrics((prev) => [metric, ...prev].slice(0, 50)) // Keep last 50 metrics
    }
    return metric
  }, [])

  const measureSync = useCallback(
      <T>(name: string, operation: () => T, metadata?: Record<string, unknown>): T => {
      return performanceMonitor.current.measure(name, operation, metadata)
    },
    [],
  )

  const measureAsync = useCallback(
    async <T>(
      name: string,
      operation: () => Promise<T>,
      metadata?: Record<string, unknown>,
    ): Promise<T> => {
      return performanceMonitor.current.measureAsync(name, operation, metadata)
    },
    [],
  )

  const getAverageTime = useCallback((operationName: string): number => {
    return performanceMonitor.current.getAverageTime(operationName)
  }, [])

  const getTotalTime = useCallback((operationName: string): number => {
    return performanceMonitor.current.getTotalTime(operationName)
  }, [])

  const getOperationCount = useCallback((operationName: string): number => {
    return performanceMonitor.current.getOperationCount(operationName)
  }, [])

  const clearMetrics = useCallback(() => {
    performanceMonitor.current.clearMetrics()
    setMetrics([])
    setSummary(null)
  }, [])

  const refreshSummary = useCallback(() => {
    const newSummary = performanceMonitor.current.getSummary()
    setSummary(newSummary)
    return newSummary
  }, [])

  const logMemoryUsage = useCallback((context: string) => {
    performanceMonitor.current.logMemoryUsage(context)
  }, [])

  const getMemoryUsage = useCallback(() => {
    return performanceMonitor.current.getMemoryUsage()
  }, [])

  const isHighMemoryPressure = useCallback(() => {
    return performanceMonitor.current.isHighMemoryPressure()
  }, [])

  // Auto-refresh summary periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSummary()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [refreshSummary])

  return {
    metrics,
    summary,
    startTiming,
    endTiming,
    measureSync,
    measureAsync,
    getAverageTime,
    getTotalTime,
    getOperationCount,
    clearMetrics,
    refreshSummary,
    logMemoryUsage,
    getMemoryUsage,
    isHighMemoryPressure,
  }
}

// Hook for timing React component renders
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef<number | null>(null)
  const { startTiming, endTiming } = usePerformance()

  useEffect(() => {
    renderCountRef.current += 1
    const renderStart = performance.now()

    if (lastRenderTimeRef.current) {
      const timeSinceLastRender = renderStart - lastRenderTimeRef.current
      startTiming(`${componentName}-render`, {
        renderCount: renderCountRef.current,
        timeSinceLastRender,
      })
    } else {
      startTiming(`${componentName}-render`, {
        renderCount: renderCountRef.current,
        isFirstRender: true,
      })
    }

    lastRenderTimeRef.current = renderStart

    // End timing on next tick to capture full render cycle
    const timeoutId = setTimeout(() => {
      endTiming(`${componentName}-render`)
    }, 0)

    return () => clearTimeout(timeoutId)
  })

  return {
    renderCount: renderCountRef.current,
  }
}

// Hook for measuring user interactions
export function useInteractionPerformance() {
  const { measureAsync, measureSync } = usePerformance()

  const measureClick = useCallback(
    async (buttonName: string, onClick: () => Promise<void> | void) => {
      const result = onClick()

      if (result instanceof Promise) {
        return measureAsync(`click-${buttonName}`, () => result)
      } else {
        return measureSync(`click-${buttonName}`, () => result)
      }
    },
    [measureAsync, measureSync],
  )

  const measureFormSubmit = useCallback(
    async (formName: string, onSubmit: () => Promise<void> | void) => {
      const result = onSubmit()

      if (result instanceof Promise) {
        return measureAsync(`form-submit-${formName}`, () => result)
      } else {
        return measureSync(`form-submit-${formName}`, () => result)
      }
    },
    [measureAsync, measureSync],
  )

  const measureNavigation = useCallback(
    async (route: string, onNavigate: () => Promise<void> | void) => {
      const result = onNavigate()

      if (result instanceof Promise) {
        return measureAsync(`navigation-${route}`, () => result)
      } else {
        return measureSync(`navigation-${route}`, () => result)
      }
    },
    [measureAsync, measureSync],
  )

  return {
    measureClick,
    measureFormSubmit,
    measureNavigation,
  }
}

// Hook for monitoring file operations performance
export function useFilePerformance() {
  const { measureAsync, logMemoryUsage } = usePerformance()

  const measureFileRead = useCallback(
      async (fileName: string, fileSize: number, operation: () => Promise<unknown>) => {
      logMemoryUsage(`before-file-read-${fileName}`)

      const result = await measureAsync('file-read', operation, { fileName, fileSize })

      logMemoryUsage(`after-file-read-${fileName}`)
      return result
    },
    [measureAsync, logMemoryUsage],
  )

  const measureFileParse = useCallback(
      async (fileName: string, fileType: string, operation: () => Promise<unknown>) => {
      logMemoryUsage(`before-file-parse-${fileName}`)

      const result = await measureAsync('file-parse', operation, { fileName, fileType })

      logMemoryUsage(`after-file-parse-${fileName}`)
      return result
    },
    [measureAsync, logMemoryUsage],
  )

  const measureDataProcessing = useCallback(
    async (
      operationName: string,
      rowCount: number,
      columnCount: number,
      operation: () => Promise<unknown>,
    ) => {
      logMemoryUsage(`before-${operationName}`)

      const result = await measureAsync(`data-processing-${operationName}`, operation, {
        rowCount,
        columnCount,
      })

      logMemoryUsage(`after-${operationName}`)
      return result
    },
    [measureAsync, logMemoryUsage],
  )

  return {
    measureFileRead,
    measureFileParse,
    measureDataProcessing,
  }
}

// Hook for performance warnings and alerts
export function usePerformanceAlerts() {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const { summary, isHighMemoryPressure } = usePerformance()

  useEffect(() => {
    if (!summary) return

    const newAlerts: PerformanceAlert[] = []

    // Check for slow operations
    summary.operations.forEach((op) => {
      if (op.averageTime > 2000) {
        // 2 seconds
        newAlerts.push({
          type: 'slow-operation',
          message: `Operation "${op.name}" is running slowly (${op.averageTime.toFixed(0)}ms average)`,
          severity: 'warning',
          operation: op.name,
        })
      }

      if (op.maxTime > 5000) {
        // 5 seconds
        newAlerts.push({
          type: 'very-slow-operation',
          message: `Operation "${op.name}" had a very slow execution (${op.maxTime.toFixed(0)}ms max)`,
          severity: 'error',
          operation: op.name,
        })
      }
    })

    // Check memory pressure
    if (isHighMemoryPressure()) {
      newAlerts.push({
        type: 'high-memory-pressure',
        message: 'High memory usage detected. Consider processing smaller files.',
        severity: 'warning',
      })
    }

    setAlerts(newAlerts)
  }, [summary, isHighMemoryPressure])

  const dismissAlert = useCallback((alert: PerformanceAlert) => {
    setAlerts((prev) => prev.filter((a) => a !== alert))
  }, [])

  return {
    alerts,
    dismissAlert,
    hasAlerts: alerts.length > 0,
  }
}

export interface PerformanceAlert {
  type: 'slow-operation' | 'very-slow-operation' | 'high-memory-pressure'
  message: string
  severity: 'info' | 'warning' | 'error'
  operation?: string
}
