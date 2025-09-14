import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChartCreationModal } from '@/components/charts/ChartCreationModal'
import { ColumnInfo, ExcelData } from '@/types/excel'

// Mock dependencies
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))

jest.mock('@/components/charts/NumericRangeEditor', () => ({
  NumericRangeEditor: () => <div data-testid="numeric-range-editor">Mock Range Editor</div>,
}))

jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ onClick }: any) => <div onClick={onClick}>X</div>,
}))

describe('ChartCreationModal', () => {
  const mockOnClose = jest.fn()
  const mockOnCreateChart = jest.fn()

  const mockColumnInfo: ColumnInfo[] = [
    {
      name: 'price',
      type: 'number',
      index: 0,
      uniqueCount: 100,
      uniqueValues: [100, 200, 150],
      hasNulls: false,
      nullCount: 0,
      sampleValues: [100, 200, 150],
    },
    {
      name: 'category',
      type: 'string',
      index: 1,
      uniqueCount: 5,
      uniqueValues: ['Electronics', 'Books'],
      hasNulls: false,
      nullCount: 0,
      sampleValues: ['Electronics', 'Books'],
    },
  ]

  const mockFilteredData: ExcelData['rows'] = [
    [100, 'Electronics'],
    [200, 'Books'],
    [150, 'Clothing'],
  ]

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCreateChart: mockOnCreateChart,
    columnInfo: mockColumnInfo,
    filteredData: mockFilteredData,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should not render when isOpen is false', () => {
    const { container } = render(<ChartCreationModal {...defaultProps} isOpen={false} />)
    expect(container.firstChild).toBeNull()
  })

  test('should render modal when isOpen is true', () => {
    render(<ChartCreationModal {...defaultProps} />)

    expect(screen.getByRole('heading', { name: 'Create Chart' })).toBeInTheDocument()
    expect(screen.getByText('Pie Chart')).toBeInTheDocument()
    expect(screen.getByText('Chart Type')).toBeInTheDocument()
  })

  test('should call onClose when close button is clicked', () => {
    render(<ChartCreationModal {...defaultProps} />)

    fireEvent.click(screen.getByText('X'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  test('should call onClose when cancel button is clicked', () => {
    render(<ChartCreationModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockOnClose).toHaveBeenCalled()
  })

  // Container-specific behavior is covered here; presentational details are tested in ChartCreationModalView.test.tsx
})
