'use client'

import { useEffect } from 'react'
import { useCharts } from '@/hooks/useCharts'
import { ColumnInfo, ExcelData } from '@/types/excel'
import { ChartConfig } from '@/types/chart'
import ChartContainer from './charts/ChartContainer'
import ChartControls from './charts/ChartControls'
import { Chart, ArcElement, Tooltip, Legend, Title, PieController } from 'chart.js'

Chart.register(ArcElement, Tooltip, Legend, Title, PieController)

interface ChartViewProps {
  filteredData: ExcelData['rows']
  columnInfo: ColumnInfo[]
  onChartAdd?: (config: ChartConfig) => void
  onChartRemove?: (chartId: string) => void
}

export function ChartView({ filteredData, columnInfo, onChartAdd, onChartRemove }: ChartViewProps) {
  const {
    charts,
    suggestions,
    addChart,
    updateChart,
    removeChart,
    clearCharts,
    createManualChart,
  } = useCharts(filteredData, columnInfo)

  useEffect(() => {
    // Optionally notify parent when charts change
  }, [charts])

  const handleAddChart = (sugg: any) => {
    addChart(sugg)
  }

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-gray-500">
          No charts yet. Use suggestions to add one.
        </div>
      )}
    </div>
  )
}

export default ChartView
