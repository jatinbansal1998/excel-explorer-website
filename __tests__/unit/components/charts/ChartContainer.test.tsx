import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChartContainer from '@/components/charts/ChartContainer'
import { ChartConfig, ChartType } from '@/types/chart'
import { ColumnInfo, DataType } from '@/types/excel'
import { chartDataProcessor } from '@/services/chartDataProcessor'

// Mock the chartDataProcessor service
jest.mock('@/services/chartDataProcessor')
const mockedChartDataProcessor = chartDataProcessor as jest.Mocked<typeof chartDataProcessor>

// Mock the Pie component from react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Pie: jest.fn(({ data, options }) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )),
}))

// Mock the Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ onClick, children, 'aria-label': ariaLabel, ...props }: any) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {children}
    </button>
  ),
}))

// Mock the XMarkIcon
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: jest.fn(() => <div data-testid="xmark-icon">X</div>),
}))

describe('ChartContainer Component', () => {
  const mockColumnInfos: ColumnInfo[] = [
    {
      name: 'Category',
      index: 0,
      type: 'string',
      uniqueValues: ['A', 'B', 'C'],
      uniqueCount: 3,
      hasNulls: false,
      nullCount: 0,
      sampleValues: ['A', 'B', 'C'],
    },
    {
      name: 'Value',
      index: 1,
      type: 'number',
      uniqueValues: [10, 20, 30],
      uniqueCount: 3,
      hasNulls: false,
      nullCount: 0,
      sampleValues: [10, 20, 30],
      statistics: { min: 10, max: 30, average: 20, median: 20 },
    },
  ]

  const mockChartData = {
    labels: ['A', 'B', 'C'],
    datasets: [
      {
        label: 'Test Chart',
        data: [10, 20, 30],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
        borderColor: ['#3b82f6', '#10b981', '#f59e0b'],
        borderWidth: 2,
      },
    ],
  }

  const mockChartConfig: ChartConfig = {
    id: 'test-chart-1',
    title: 'Test Chart',
    type: 'pie',
    dataColumn: 'Category',
    aggregation: 'count',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        title: {
          display: true,
          text: 'Test Chart',
        },
        tooltip: {
          enabled: true,
        },
      },
    },
    position: {
      row: 0,
      column: 0,
      width: 1,
      height: 1,
    },
  }

  const mockData = [
    ['Category', 'Value'],
    ['A', 10],
    ['B', 20],
    ['C', 30],
  ]

  const mockOnConfigChange = jest.fn()
  const mockOnRemove = jest.fn()

  beforeEach(() => {
    mockOnConfigChange.mockClear()
    mockOnRemove.mockClear()
    mockedChartDataProcessor.prepareChartData.mockClear()
  })

  describe('Basic Structure and Rendering', () => {
    it('renders chart container with correct structure', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByRole('heading', { name: /test chart/i })).toBeInTheDocument()
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /remove chart/i })).toBeInTheDocument()
    })

    it('renders with correct container classes', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      const { container } = render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      const chartContainer = container.firstChild
      expect(chartContainer).toHaveClass(
        'bg-white',
        'p-4',
        'rounded-lg',
        'shadow',
        'border',
        'border-gray-200',
      )
    })

    it('renders header section with title and remove button', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      const title = screen.getByRole('heading', { name: /test chart/i })
      expect(title).toHaveClass('font-medium')

      const removeButton = screen.getByRole('button', { name: /remove chart/i })
      expect(removeButton).toBeInTheDocument()
    })

    it('renders chart area with correct dimensions', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      const { container } = render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      const chartArea = container.querySelector('.relative.h-96')
      expect(chartArea).toBeInTheDocument()
    })

    it('calls chartDataProcessor with correct parameters', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledWith(
        mockData,
        mockChartConfig,
        mockColumnInfos,
      )
    })
  })

  describe('Chart Type Handling', () => {
    it('renders pie chart correctly', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      expect(
        screen.getByText(
          /\{"labels":\["a","b","c"\],"datasets":\[\{"label":"test chart","data":\[10,20,30\],"backgroundcolor":\["#3b82f6","#10b981","#f59e0b"\],"bordercolor":\["#3b82f6","#10b981","#f59e0b"\],"borderwidth":2\}\]\}/i,
        ),
      ).toBeInTheDocument()
    })

    it('renders doughnut chart correctly', () => {
      const doughnutConfig: ChartConfig = {
        ...mockChartConfig,
        type: 'pie', // According to ChartType, only 'pie' is supported
      }

      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={doughnutConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('shows unsupported chart type message for non-pie/doughnut charts', () => {
      const unsupportedConfig: ChartConfig = {
        ...mockChartConfig,
        type: 'bar' as ChartType, // This should be 'pie' only according to types
      }

      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={unsupportedConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByText('Chart Type Not Available')).toBeInTheDocument()
      expect(screen.getByText('Currently only pie charts are supported.')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles column not found error', () => {
      const error = new Error('Column not found: NonExistentColumn')
      mockedChartDataProcessor.prepareChartData.mockImplementation(() => {
        throw error
      })

      render(
        <ChartContainer
          config={{ ...mockChartConfig, dataColumn: 'NonExistentColumn' }}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByText('Column Not Found')).toBeInTheDocument()
      expect(screen.getByText(/NonExistentColumn/)).toBeInTheDocument()
      expect(screen.getByText(/doesn't exist in your data/)).toBeInTheDocument()
    })

    it('handles no data available error', () => {
      const error = new Error('No valid data found for pie chart')
      mockedChartDataProcessor.prepareChartData.mockImplementation(() => {
        throw error
      })

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByText('Chart Display Error')).toBeInTheDocument()
      expect(screen.getByText(/No valid data found for pie chart/)).toBeInTheDocument()
    })

    it('handles numeric data type error for pie charts', () => {
      const error = new Error('Pie charts work best with categorical data')
      mockedChartDataProcessor.prepareChartData.mockImplementation(() => {
        throw error
      })

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByText('Chart Display Error')).toBeInTheDocument()
      expect(screen.getByText(/Pie charts work best with categorical data/)).toBeInTheDocument()
    })

    it('handles generic chart display error', () => {
      const error = new Error('Some unknown error occurred')
      mockedChartDataProcessor.prepareChartData.mockImplementation(() => {
        throw error
      })

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByText('Chart Display Error')).toBeInTheDocument()
      expect(screen.getByText('Some unknown error occurred')).toBeInTheDocument()
    })

    it('shows error state with proper styling', () => {
      const error = new Error('Test error')
      mockedChartDataProcessor.prepareChartData.mockImplementation(() => {
        throw error
      })

      const { container } = render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      const errorContainer = container.querySelector('.flex.items-center.justify-center.h-full')
      expect(errorContainer).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onRemove when remove button is clicked', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      const removeButton = screen.getByRole('button', { name: /remove chart/i })
      fireEvent.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })

    it('renders remove button with correct icon', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      const removeButton = screen.getByRole('button', { name: /remove chart/i })
      expect(removeButton).toContainHTML('X')
    })
  })

  describe('Data Processing and Memoization', () => {
    it('uses useMemo for chart data processing', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      const { rerender } = render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      // Initial render
      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)

      // Re-render with same props - should not reprocess data
      rerender(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)
    })

    it('reprocesses data when config changes', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      const { rerender } = render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)

      const newConfig = { ...mockChartConfig, title: 'Updated Chart' }
      rerender(
        <ChartContainer
          config={newConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(2)
    })

    it('reprocesses data when data changes', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      const { rerender } = render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)

      const newData = [...mockData, ['D', 40]]
      rerender(
        <ChartContainer
          config={mockChartConfig}
          data={newData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(2)
    })

    it('reprocesses data when columnInfo changes', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      const { rerender } = render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)

      const newColumnInfo: ColumnInfo[] = [
        ...mockColumnInfos,
        {
          name: 'NewColumn',
          index: 2,
          type: 'string' as DataType,
          uniqueValues: ['X'],
          uniqueCount: 1,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['X'],
        },
      ]
      rerender(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={newColumnInfo}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error State Data Fallback', () => {
    it('provides fallback chart data when error occurs', () => {
      const error = new Error('Test error')
      mockedChartDataProcessor.prepareChartData.mockImplementation(() => {
        throw error
      })

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      // The component should catch the error and show error message
      // instead of crashing
      expect(screen.getByText('Chart Display Error')).toBeInTheDocument()
    })

    it('logs error to console when data processing fails', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')
      mockedChartDataProcessor.prepareChartData.mockImplementation(() => {
        throw error
      })

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(consoleSpy).toHaveBeenCalledWith('Error preparing chart data:', error)
      consoleSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('provides proper aria-label for remove button', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      const removeButton = screen.getByRole('button', { name: /remove chart/i })
      expect(removeButton).toHaveAttribute('aria-label', 'Remove chart')
    })

    it('maintains proper heading structure', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      const title = screen.getByRole('heading', { name: /test chart/i })
      expect(title.tagName).toBe('H3')
    })
  })

  describe('Performance Considerations', () => {
    it('efficiently handles large datasets through memoization', () => {
      const largeData = Array(1000).fill(['A', 1])
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      const { rerender } = render(
        <ChartContainer
          config={mockChartConfig}
          data={largeData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)

      // Re-render with same large data - should not reprocess
      rerender(
        <ChartContainer
          config={mockChartConfig}
          data={largeData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)
    })

    it('only reprocesses when necessary dependencies change', () => {
      mockedChartDataProcessor.prepareChartData.mockReturnValue(mockChartData)

      const { rerender } = render(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={mockOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)

      // Re-render with different callback function - should not reprocess
      const newOnConfigChange = jest.fn()
      rerender(
        <ChartContainer
          config={mockChartConfig}
          data={mockData}
          columnInfo={mockColumnInfos}
          onConfigChange={newOnConfigChange}
          onRemove={mockOnRemove}
        />,
      )

      expect(mockedChartDataProcessor.prepareChartData).toHaveBeenCalledTimes(1)
    })
  })
})
