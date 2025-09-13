import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {ChartCreationModalView} from '@/components/presentational/charts/ChartCreationModalView'
import {chartTypeConfigs} from '@/utils/chartConfig'
import {AggregationType} from '@/types/chart'
import {ColumnInfo} from '@/types/excel'

describe('ChartCreationModalView (presentational)', () => {
  const cols: ColumnInfo[] = [
    {
      name: 'price',
      type: 'number',
      index: 0,
      uniqueCount: 3,
      uniqueValues: [100, 200, 300],
      hasNulls: false,
      nullCount: 0,
      sampleValues: [100, 200, 300],
    },
    {
      name: 'category',
      type: 'string',
      index: 1,
      uniqueCount: 2,
      uniqueValues: ['A', 'B'],
      hasNulls: false,
      nullCount: 0,
      sampleValues: ['A', 'B'],
    },
  ]

  const aggOptions: {type: AggregationType; label: string}[] = [
    {type: 'count', label: 'Count'},
    {type: 'sum', label: 'Sum'},
  ]

  const baseProps = {
    isOpen: true,
    onClose: jest.fn(),
    selectedType: 'pie' as const,
    onChangeType: jest.fn(),
    availableChartTypes: chartTypeConfigs,
    dataColumn: '',
    onChangeDataColumn: jest.fn(),
    dataColumnSearch: '',
    onChangeDataColumnSearch: jest.fn(),
    compatibleDataColumns: jest.fn(() => cols),
    labelColumn: '',
    onChangeLabelColumn: jest.fn(),
    aggregation: 'count' as const,
    onChangeAggregation: jest.fn(),
    availableAggregations: aggOptions,
    maxSegments: 10,
    onChangeMaxSegments: jest.fn(),
    shouldShowRangeEditor: false,
    numericRanges: [],
    onChangeNumericRanges: jest.fn(),
    sampleValues: [],
    title: '',
    onChangeTitle: jest.fn(),
    defaultTitle: 'Pie Chart - Column',
    canSubmit: false,
    onSubmit: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())

  it('renders sections and controls', () => {
    render(<ChartCreationModalView {...baseProps} />)

    expect(screen.getByRole('heading', {name: 'Create Chart'})).toBeInTheDocument()
    expect(screen.getByText('Chart Type')).toBeInTheDocument()
    expect(screen.getByText('Aggregation')).toBeInTheDocument()
    expect(screen.getByText('Maximum Segments')).toBeInTheDocument()
    expect(screen.getByText('Chart Title (optional)')).toBeInTheDocument()
  })

  it('disables submit when canSubmit is false and enables when true', () => {
    const {rerender} = render(<ChartCreationModalView {...baseProps} canSubmit={false} />)
    expect(screen.getByRole('button', {name: 'Create Chart'})).toBeDisabled()

    rerender(<ChartCreationModalView {...baseProps} canSubmit={true} />)
    expect(screen.getByRole('button', {name: 'Create Chart'})).not.toBeDisabled()
  })

  it('calls callbacks on interactions', () => {
    render(<ChartCreationModalView {...baseProps} canSubmit={true} />)

    // Change type by clicking Pie Chart tile (already selected) -> call anyway
    fireEvent.click(screen.getByText('Pie Chart'))
    expect(baseProps.onChangeType).toHaveBeenCalled()

    // Search input updates (prefer role over placeholder to satisfy RTL config)
    const textboxes = screen.getAllByRole('textbox') as HTMLInputElement[]
    const searchInput = textboxes.find((el) => el.getAttribute('placeholder') === 'Type to search columns...')!
    fireEvent.change(searchInput, {target: {value: 'pri'}})
    expect(baseProps.onChangeDataColumnSearch).toHaveBeenCalledWith('pri')

    // Select a data column from list
    fireEvent.click(screen.getByText('price'))
    expect(baseProps.onChangeDataColumn).toHaveBeenCalledWith('price')

    // Aggregation select
    const aggregationSelect = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(aggregationSelect, {target: {value: 'sum'}})
    expect(baseProps.onChangeAggregation).toHaveBeenCalledWith('sum')

    // Title input
    const titleInput = textboxes.find((el) => el.getAttribute('placeholder') === 'Pie Chart - Column')!
    fireEvent.change(titleInput, {target: {value: 'My Chart'}})
    expect(baseProps.onChangeTitle).toHaveBeenCalledWith('My Chart')

    // Submit
    fireEvent.click(screen.getByRole('button', {name: 'Create Chart'}))
    expect(baseProps.onSubmit).toHaveBeenCalled()

    // Cancel
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}))
    expect(baseProps.onClose).toHaveBeenCalled()
  })

  it('renders label column select for 2-variable charts and calls onChange', () => {
    const props = {
      ...baseProps,
      selectedType: 'scatter' as const,
      // ensure scatter config (2 variables) is available
      availableChartTypes: chartTypeConfigs,
    }
    render(<ChartCreationModalView {...props} />)

    // Label select present
    expect(screen.getByText('Label Column (X-axis)')).toBeInTheDocument()

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    const labelSelect = selects[0]
    fireEvent.change(labelSelect, {target: {value: 'category'}})
    expect(baseProps.onChangeLabelColumn).toHaveBeenCalledWith('category')
  })
})
