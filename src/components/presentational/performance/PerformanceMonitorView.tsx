import React from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { PerformanceAlert } from '@/hooks/usePerformance'
import type { PerformanceMetric, PerformanceSummary } from '@/utils/performanceMonitor'
import { formatBytes, formatTime, getPerformanceGrade, gradeColor } from '@/utils/performanceUi'

export interface PerformanceMonitorViewProps {
  visible: boolean
  onToggle: () => void

  alerts: PerformanceAlert[]
  hasAlerts: boolean
  onDismissAlert: (alert: PerformanceAlert) => void

  summary: PerformanceSummary | null
  metrics: PerformanceMetric[]

  memoryUsage: { usedJSHeapSize: number; jsHeapSizeLimit: number } | null
  highMemory: boolean

  expanded: boolean
  onToggleExpanded: () => void
  onClearMetrics: () => void
}

export default function PerformanceMonitorView({
  visible,
  onToggle,
  alerts,
  hasAlerts,
  onDismissAlert,
  summary,
  metrics,
  memoryUsage,
  highMemory,
  expanded,
  onToggleExpanded,
  onClearMetrics,
}: Readonly<PerformanceMonitorViewProps>) {
  if (!visible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasAlerts ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-xs">Performance</span>
          </div>
        </Button>
      </div>
    )
  }

  const grade = getPerformanceGrade(summary)

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          <Badge className={gradeColor(grade)}>Grade {grade}</Badge>
          {hasAlerts && (
            <Badge variant="destructive" className="animate-pulse">
              {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onToggleExpanded} variant="ghost" size="sm" aria-label="Toggle details">
            {expanded ? '▼' : '▲'}
          </Button>
          <Button onClick={onToggle} variant="ghost" size="sm" aria-label="Close">
            ✕
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className="p-4 border-b border-gray-200 bg-red-50">
          <h4 className="font-medium text-red-800 mb-2">Performance Alerts</h4>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-start gap-2">
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
                  onClick={() => onDismissAlert(alert)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  aria-label="Dismiss alert"
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
                  className={`text-sm font-medium ${highMemory ? 'text-red-600' : 'text-green-600'}`}
                >
                  {((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100).toFixed(1)}%
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detailed Metrics */}
      {expanded && (
        <div className="p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Recent Operations</h4>
            <Button onClick={onClearMetrics} variant="outline" size="sm">
              Clear
            </Button>
          </div>

          {metrics.length > 0 ? (
            <div className="space-y-2">
              {metrics.slice(0, 10).map((metric, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{metric.name}</p>
                    {metric.metadata && (
                      <p className="text-xs text-gray-500">
                        {Object.entries(metric.metadata)
                          .map(([key, value]) => `${key}: ${String(value)}`)
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
          <p className="text-xs text-gray-500">Auto-refresh: {visible ? 'ON' : 'OFF'}</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${highMemory ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-xs text-gray-500">{highMemory ? 'High Memory' : 'Normal'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
