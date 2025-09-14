import React from 'react'
import { render, screen } from '@testing-library/react'
import { NumericRangeEditor } from '@/components/charts/NumericRangeEditor'
import { NumericRange } from '@/types/chart'

// Mock dependencies
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))

jest.mock('@heroicons/react/24/outline', () => ({
  PlusIcon: () => <svg data-testid="plus-icon" />,
  XMarkIcon: () => <svg data-testid="xmark-icon" />,
}))

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}))

jest.mock('@/services/numericRangeGenerator', () => ({
  numericRangeGenerator: {
    generateDefaultRanges: jest.fn(),
    validateRanges: jest.fn(),
  },
}))

describe('NumericRangeEditor', () => {
  const mockOnRangesChange = jest.fn()
  const sampleValues = [1, 5, 10, 15, 20]
  const columnName = 'testColumn'

  const defaultProps = {
    ranges: [] as NumericRange[],
    onRangesChange: mockOnRangesChange,
    columnName,
    sampleValues,
    className: 'test-class',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders with empty ranges', () => {
    render(<NumericRangeEditor {...defaultProps} />)

    expect(screen.getByRole('heading', { name: /numeric ranges/i })).toBeInTheDocument()
    expect(screen.getByText(/No ranges defined/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /auto-generate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add range/i })).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(<NumericRangeEditor {...defaultProps} />)
    expect(container.firstChild).toHaveClass('test-class')
  })
})
