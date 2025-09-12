'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import {Button} from './ui/Button'
import {Badge} from './ui/Badge'
import {PerformanceAlert, usePerformance, usePerformanceAlerts} from '@/hooks/usePerformance'
import {globalProperties} from '@/types/global'

interface PerformanceMonitorProps {
  isVisible?: boolean
  onToggle?: () => void
}

export function PerformanceMonitor({isVisible = false, onToggle}: Readonly<PerformanceMonitorProps>) {
  const { metrics, summary, clearMetrics, refreshSummary, getMemoryUsage, isHighMemoryPressure } =
    usePerformance()

  const { alerts, dismissAlert, hasAlerts } = usePerformanceAlerts()

  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  const memoryUsage = useMemo(() => getMemoryUsage(), [getMemoryUsage])

  // Auto-refresh every 2 seconds when visible
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      refreshSummary()
    }, 2000)

    return () => clearInterval(interval)
  }, [isVisible, refreshSummary])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${hasAlerts ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-xs">Performance</span>
          </div>
        </Button>
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const getPerformanceGrade = () => {
    if (!summary) return 'N/A'

    const avgTime = summary.totalTime / Math.max(summary.totalOperations, 1)
    if (avgTime < 100) return 'A'
    if (avgTime < 500) return 'B'
    if (avgTime < 1000) return 'C'
    return 'D'
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800'
      case 'B':
        return 'bg-blue-100 text-blue-800'
      case 'C':
        return 'bg-yellow-100 text-yellow-800'
      case 'D':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          <Badge className={getGradeColor(getPerformanceGrade())}>
            Grade {getPerformanceGrade()}
          </Badge>
          {hasAlerts && (
            <Badge variant="destructive" className="animate-pulse">
              {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsExpanded(!isExpanded)} variant="ghost" size="sm">
            {isExpanded ? '▼' : '▲'}
          </Button>
          <Button onClick={onToggle} variant="ghost" size="sm">
            ✕
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className="p-4 border-b border-gray-200 bg-red-50">
          <h4 className="font-medium text-red-800 mb-2">Performance Alerts</h4>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert: PerformanceAlert, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    alert.severity === 'error'
                      ? 'bg-red-500'
                      : alert.severity === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-red-700">{alert.message}</p>
                </div>
                <Button
                  onClick={() => dismissAlert(alert)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </Button>
              </div>
            ))}
            {alerts.length > 3 && (
              <p className="text-xs text-red-600">+{alerts.length - 3} more alerts</p>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Operations</p>
            <p className="text-lg font-semibold">{summary?.totalOperations || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Time</p>
            <p className="text-lg font-semibold">{formatTime(summary?.totalTime || 0)}</p>
          </div>
          {memoryUsage && (
            <>
              <div>
                <p className="text-xs text-gray-500">Memory Used</p>
                <p className="text-sm font-medium">{formatBytes(memoryUsage.usedJSHeapSize)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Memory Pressure</p>
                <p
                  className={`text-sm font-medium ${
                    isHighMemoryPressure() ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100).toFixed(1)}%
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detailed Metrics */}
      {isExpanded && (
        <div className="p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Recent Operations</h4>
            <Button onClick={clearMetrics} variant="outline" size="sm">
              Clear
            </Button>
          </div>

          {metrics.length > 0 ? (
            <div className="space-y-2">
              {metrics.slice(0, 10).map((metric, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() =>
                    setSelectedMetric(selectedMetric === metric.name ? null : metric.name)
                  }
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{metric.name}</p>
                    {metric.metadata && (
                      <p className="text-xs text-gray-500">
                        {Object.entries(metric.metadata)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        (metric.duration || 0) > 1000
                          ? 'text-red-600'
                          : (metric.duration || 0) > 500
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {formatTime(metric.duration || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(metric.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No performance metrics available
            </p>
          )}

          {/* Operation Summary */}
          {summary && summary.operations.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Operation Summary</h4>
              <div className="space-y-2">
                {summary.operations.map((op, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-blue-50 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium text-blue-900">{op.name}</p>
                      <p className="text-xs text-blue-600">
                        {op.count} executions • Avg: {formatTime(op.averageTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-900">
                        {formatTime(op.totalTime)}
                      </p>
                      <p className="text-xs text-blue-600">
                        Min: {formatTime(op.minTime)} • Max: {formatTime(op.maxTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Auto-refresh: {isVisible ? 'ON' : 'OFF'}</p>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isHighMemoryPressure() ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
            <span className="text-xs text-gray-500">
              {isHighMemoryPressure() ? 'High Memory' : 'Normal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for global performance monitor toggle
export function usePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)

  const toggle = useCallback(() => setIsVisible((v) => !v), [])
  const show = useCallback(() => setIsVisible(true), [])
  const hide = useCallback(() => setIsVisible(false), [])

  // Global access for other components
  useEffect(() => {
    globalProperties.set('performanceMonitor', {
      show,
      hide,
      toggle,
      isVisible: () => isVisible,
    })
  }, [isVisible, show, hide, toggle])

  return {
    isVisible,
    toggle,
    show,
    hide,
  }
}
