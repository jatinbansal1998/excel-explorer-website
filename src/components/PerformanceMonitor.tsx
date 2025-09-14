'use client'

import {useEffect, useMemo, useState} from 'react'
import {usePerformance, usePerformanceAlerts} from '@/hooks/usePerformance'
import PerformanceMonitorView from '@/components/presentational/performance/PerformanceMonitorView'

interface PerformanceMonitorProps {
  isVisible?: boolean
  onToggle?: () => void
}

export function PerformanceMonitor({isVisible = false, onToggle}: Readonly<PerformanceMonitorProps>) {
  const { metrics, summary, clearMetrics, refreshSummary, getMemoryUsage, isHighMemoryPressure } =
    usePerformance()
  const { alerts, dismissAlert, hasAlerts } = usePerformanceAlerts()

  const [isExpanded, setIsExpanded] = useState(false)

  const memoryUsage = useMemo(() => getMemoryUsage(), [getMemoryUsage])
  const highMemory = isHighMemoryPressure()

  // Auto-refresh every 2 seconds when visible
  useEffect(() => {
    if (!isVisible) return
    const interval = setInterval(() => {
      refreshSummary()
    }, 2000)
    return () => clearInterval(interval)
  }, [isVisible, refreshSummary])

  return (
      <PerformanceMonitorView
          visible={isVisible}
          onToggle={onToggle || (() => {
          })}
          alerts={alerts}
          hasAlerts={hasAlerts}
          onDismissAlert={dismissAlert}
          summary={summary}
          metrics={metrics}
          memoryUsage={memoryUsage}
          highMemory={highMemory}
          expanded={isExpanded}
          onToggleExpanded={() => setIsExpanded((v) => !v)}
          onClearMetrics={clearMetrics}
      />
  )
}

// Re-export the toggle hook to preserve public API
export {usePerformanceMonitor} from '@/hooks/usePerformanceMonitorToggle'
