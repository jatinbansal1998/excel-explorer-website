'use client'

import { useCallback, useEffect } from 'react'
import { useCharts } from '@/hooks/useCharts'
import { ColumnInfo, ExcelData } from '@/types/excel'
import { ChartConfig, ChartSuggestion } from '@/types/chart'
import ChartContainer from './charts/ChartContainer'
import ChartControls from './charts/ChartControls'
import { ArcElement, Chart, Legend, PieController, Title, Tooltip } from 'chart.js'
import type { UseSessionPersistenceReturn } from '@/hooks/useSessionPersistence'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

Chart.register(ArcElement, Tooltip, Legend, Title, PieController)

interface ChartViewProps {
  filteredData: ExcelData['rows']
  columnInfo: ColumnInfo[]
  registerExternalApplyChart?: (_fn: (_config: ChartConfig) => void) => void
  session?: UseSessionPersistenceReturn
  collapsed?: boolean
  onCollapseChange?: (_collapsed: boolean) => void
}

export function ChartView({
  filteredData,
  columnInfo,
  registerExternalApplyChart,
  session,
  collapsed = false,
  onCollapseChange,
}: ChartViewProps) {
  const {
    charts,
    suggestions,
    addChart,
    updateChart,
    removeChart,
    clearCharts,
    createManualChart,
  } = useCharts(filteredData, columnInfo, session)

  useEffect(() => {
    // Optionally notify parent when charts change
  }, [charts])

  const handleAddChart = useCallback(
    (sugg: ChartSuggestion) => {
      addChart(sugg)
    },
    [addChart],
  )

  useEffect(() => {
    if (!registerExternalApplyChart) return
    registerExternalApplyChart((cfg: ChartConfig) => {
      try {
        createManualChart({
          type: cfg.type,
          dataColumn: cfg.dataColumn,
          labelColumn: cfg.labelColumn,
          aggregation: cfg.aggregation,
          title: cfg.title,
          maxSegments: cfg.maxSegments,
          numericRanges: cfg.numericRanges,
        })
      } catch (e) {
        console.warn('Failed to apply chart from external payload', e)
      }
    })
  }, [registerExternalApplyChart, createManualChart])

  return (
    <div className="section-container flex flex-col">
      <div className="px-4 py-3 flex justify-between items-center bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onCollapseChange?.(!collapsed)}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-md p-1 -ml-1 hover:bg-gray-100 transition-colors"
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand Data Visualization' : 'Collapse Data Visualization'}
          >
            <ChevronDownIcon
              className={clsx(
                'h-5 w-5 text-gray-500 transition-transform duration-200',
                collapsed ? '-rotate-90' : 'rotate-0',
              )}
            />
            <h2 className="text-lg font-semibold text-gray-900">Data Visualization</h2>
          </button>
          {charts.length > 0 && (
            <span className="text-sm text-gray-500">
              {charts.length} chart{charts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <ChartControls
          suggestions={suggestions}
          onAddChart={handleAddChart}
          onClearCharts={clearCharts}
          onCreateManualChart={createManualChart}
          columnInfo={columnInfo}
          filteredData={filteredData}
        />
      </div>

      {!collapsed && (
        <div className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {charts.map((chart) => (
              <ChartContainer
                key={chart.id}
                config={chart}
                data={filteredData}
                columnInfo={columnInfo}
                onConfigChange={(updates) => updateChart(chart.id, updates)}
                onRemove={() => removeChart(chart.id)}
              />
            ))}
          </div>

          {charts.length === 0 && (
            <div className="text-gray-500">No charts yet. Use suggestions to add one.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChartView
