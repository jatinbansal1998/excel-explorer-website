'use client'

import { useEffect } from 'react'
import { useCharts } from '@/hooks/useCharts'
import { ColumnInfo, ExcelData } from '@/types/excel'
import { ChartConfig, ChartSuggestion } from '@/types/chart'
import ChartContainer from './charts/ChartContainer'
import ChartControls from './charts/ChartControls'
import { ArcElement, Chart, Legend, PieController, Title, Tooltip } from 'chart.js'
import type { UseSessionPersistenceReturn } from '@/hooks/useSessionPersistence'

Chart.register(ArcElement, Tooltip, Legend, Title, PieController)

interface ChartViewProps {
  filteredData: ExcelData['rows']
  columnInfo: ColumnInfo[]
  registerExternalApplyChart?: (_fn: (_config: ChartConfig) => void) => void
  session?: UseSessionPersistenceReturn
}

export function ChartView({
  filteredData,
  columnInfo,
  registerExternalApplyChart,
  session,
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

  const handleAddChart = (sugg: ChartSuggestion) => {
    addChart(sugg)
  }

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
    <div className="section-container p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Data Visualization</h2>
        <ChartControls
          suggestions={suggestions}
          onAddChart={handleAddChart}
          onClearCharts={clearCharts}
          onCreateManualChart={createManualChart}
          columnInfo={columnInfo}
          filteredData={filteredData}
        />
      </div>

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
  )
}

export default ChartView
