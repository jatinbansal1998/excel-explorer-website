'use client'

import { useMemo } from 'react'
import { ChartConfig } from '../../types/chart'
import { ColumnInfo } from '../../types/excel'
import { chartDataProcessor } from '../../services/chartDataProcessor'
import { Button } from '../ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Pie } from 'react-chartjs-2'

interface ChartContainerProps {
  config: ChartConfig
  data: any[][]
  columnInfo: ColumnInfo[]
  onConfigChange: (updates: Partial<ChartConfig>) => void
  onRemove: () => void
}

export function ChartContainer({
  config,
  data,
  columnInfo,
  onConfigChange,
  onRemove,
}: ChartContainerProps) {
  const { chartData, error } = useMemo(() => {
    try {
      const processedData = chartDataProcessor.prepareChartData(data, config, columnInfo)
      return { chartData: processedData, error: null }
    } catch (error) {
      console.error('Error preparing chart data:', error)
      return {
        chartData: {
          labels: ['Error'],
          datasets: [
            {
              label: 'Error',
              data: [1],
              backgroundColor: ['#ef4444'],
              borderColor: ['#ef4444'],
              borderWidth: 1,
            },
          ],
        },
        error: error as Error,
      }
    }
  }, [data, config, columnInfo])

  const renderErrorMessage = (error: Error) => {
    const errorMessage = error.message.toLowerCase()

    if (errorMessage.includes('column not found')) {
      return (
        <div className="text-center text-gray-600">
          <div className="text-lg font-medium mb-2">Column Not Found</div>
          <div className="text-sm">
            The selected column &ldquo;{config.dataColumn}&rdquo; doesn&apos;t exist in your data.
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Please select a different column for this chart.
          </div>
        </div>
      )
    }

    if (errorMessage.includes('no data') || errorMessage.includes('empty')) {
      return (
        <div className="text-center text-gray-600">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">
            The selected column &ldquo;{config.dataColumn}&rdquo; doesn&apos;t contain any valid
            data for pie chart.
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Try filtering your data or selecting a different column.
          </div>
        </div>
      )
    }

    if (
      config.type === 'pie' &&
      (errorMessage.includes('numeric') || errorMessage.includes('number'))
    ) {
      return (
        <div className="text-center text-gray-600">
          <div className="text-lg font-medium mb-2">Data Type Issue</div>
          <div className="text-sm">
            Pie charts work best with categorical data (text) or when grouping numeric data.
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Column &ldquo;{config.dataColumn}&rdquo; contains continuous numeric values that need to
            be grouped first.
          </div>
        </div>
      )
    }

    return (
      <div className="text-center text-gray-600">
        <div className="text-lg font-medium mb-2">Chart Display Error</div>
        <div className="text-sm">{error.message}</div>
        <div className="text-sm text-gray-500 mt-1">
          Please try selecting different data columns or chart settings.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{config.title}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Remove chart">
            <XMarkIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="relative h-96">
        {error ? (
          <div className="flex items-center justify-center h-full">{renderErrorMessage(error)}</div>
        ) : config.type === 'pie' || config.type === 'doughnut' ? (
          <Pie data={chartData as any} options={config.options as any} />
        ) : (
          <div className="flex items-center justify-center h-full text-center text-gray-600">
            <div>
              <div className="text-lg font-medium mb-2">Chart Type Not Available</div>
              <div className="text-sm">Currently only pie charts are supported.</div>
              <div className="text-sm text-gray-500 mt-1">
                Please use pie chart for data visualization.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChartContainer
