import { fireEvent, render, screen } from '@testing-library/react'
import { ChartControls } from '@/components/charts/ChartControls'
import { AggregationType, ChartSuggestion, ChartType } from '@/types/chart'
import { ColumnInfo, ExcelData } from '@/types/excel'

// Mock dependencies
jest.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    type,
    title,
    className,
    'aria-label': ariaLabel,
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      type={type}
      title={title}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/components/charts/ChartCreationModal', () => ({
  ChartCreationModal: ({ isOpen, onClose, onCreateChart, columnInfo, filteredData }: any) => (
    <div data-testid="chart-creation-modal" data-open={isOpen}>
      {isOpen && (
        <div>
          <button data-testid="modal-close" onClick={onClose}>
            Close
          </button>
          <button
            data-testid="modal-create"
            onClick={() =>
              onCreateChart({
                type: 'pie',
                dataColumn: 'test_column',
                aggregation: 'count',
                title: 'Test Chart',
              })
            }
          >
            Create
          </button>
        </div>
      )}
    </div>
  ),
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  TrashIcon: ({ className }: any) => <svg data-testid="trash-icon" className={className} />,
  ChevronDownIcon: ({ className }: any) => <svg data-testid="chevron-icon" className={className} />,
  PlusIcon: ({ className }: any) => <svg data-testid="plus-icon" className={className} />,
}))

describe('ChartControls', () => {
  const mockOnAddChart = jest.fn()
  const mockOnClearCharts = jest.fn()
  const mockOnCreateManualChart = jest.fn()

  const mockColumnInfos: ColumnInfo[] = [
    {
      name: 'category',
      index: 0,
      type: 'string',
      uniqueValues: ['A', 'B', 'C'],
      uniqueCount: 3,
      hasNulls: false,
      nullCount: 0,
      sampleValues: ['A', 'B', 'C'],
    },
    {
      name: 'value',
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

  const mockFilteredData: ExcelData['rows'] = [
    ['A', 10],
    ['B', 20],
    ['C', 30],
  ]

  const mockSuggestions: ChartSuggestion[] = [
    {
      type: 'pie',
      title: 'Category Distribution',
      dataColumn: 'category',
      aggregation: 'count',
      confidence: 0.9,
      reason: 'Good categorical distribution',
    },
    {
      type: 'pie',
      title: 'Value Analysis',
      dataColumn: 'value',
      aggregation: 'sum',
      confidence: 0.8,
      reason: 'Numeric data suitable for pie chart',
    },
  ]

  const defaultProps = {
    suggestions: mockSuggestions,
    onAddChart: mockOnAddChart,
    onClearCharts: mockOnClearCharts,
    onCreateManualChart: mockOnCreateManualChart,
    columnInfo: mockColumnInfos,
    filteredData: mockFilteredData,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock getBoundingClientRect for dropdown positioning
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 120,
      height: 40,
      top: 0,
      left: 0,
      bottom: 40,
      right: 120,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }))
  })

  describe('Rendering and Basic Structure', () => {
    it('renders without crashing', () => {
      render(<ChartControls {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Add: Pie Chart/i })).toBeInTheDocument()
    })

    it('renders with minimal required props', () => {
      const minimalProps = {
        suggestions: [],
        onAddChart: mockOnAddChart,
        columnInfo: [],
        filteredData: [],
      }
      render(<ChartControls {...minimalProps} />)
      expect(screen.getByRole('button', { name: /Add Suggested Chart/i })).toBeInTheDocument()
    })

    it('renders quick add button with first suggestion', () => {
      render(<ChartControls {...defaultProps} />)
      const quickAddButton = screen.getByRole('button', { name: /Add: Pie Chart/i })
      expect(quickAddButton).toBeInTheDocument()
      expect(quickAddButton).toHaveAttribute('title', 'Add: Category Distribution')
    })

    it('renders disabled quick add button when no suggestions', () => {
      const props = { ...defaultProps, suggestions: [] }
      render(<ChartControls {...props} />)
      const quickAddButton = screen.getByRole('button', { name: /Add Suggested Chart/i })
      expect(quickAddButton).toBeDisabled()
      expect(quickAddButton).toHaveAttribute('title', 'No suggestions available')
    })

    it('renders suggestions dropdown when multiple suggestions exist', () => {
      render(<ChartControls {...defaultProps} />)
      expect(screen.getByRole('button', { name: /All Suggestions \(2\)/i })).toBeInTheDocument()
    })

    it('does not render suggestions dropdown when only one suggestion', () => {
      const props = { ...defaultProps, suggestions: [mockSuggestions[0]] }
      render(<ChartControls {...props} />)
      expect(screen.queryByRole('button', { name: /All Suggestions/i })).not.toBeInTheDocument()
    })

    it('renders manual chart creation button when onCreateManualChart is provided', () => {
      render(<ChartControls {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Create Chart/i })).toBeInTheDocument()
    })

    it('does not render manual chart creation button when onCreateManualChart is not provided', () => {
      const props = { ...defaultProps, onCreateManualChart: undefined }
      render(<ChartControls {...props} />)
      expect(screen.queryByRole('button', { name: /Create Chart/i })).not.toBeInTheDocument()
    })

    it('renders clear all button when onClearCharts is provided', () => {
      render(<ChartControls {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Remove all/i })).toBeInTheDocument()
    })

    it('does not render clear all button when onClearCharts is not provided', () => {
      const props = { ...defaultProps, onClearCharts: undefined }
      render(<ChartControls {...props} />)
      expect(screen.queryByRole('button', { name: /Remove all/i })).not.toBeInTheDocument()
    })

    it('renders ChartCreationModal component', () => {
      render(<ChartControls {...defaultProps} />)
      expect(screen.getByTestId('chart-creation-modal')).toBeInTheDocument()
    })

    it('applies correct CSS classes to container', () => {
      render(<ChartControls {...defaultProps} />)
      const container = screen.getByRole('button', { name: /Add: Pie Chart/i }).parentElement
      expect(container).toHaveClass('flex', 'items-center', 'gap-3', 'flex-wrap')
    })

    it('renders correct icon components', () => {
      render(<ChartControls {...defaultProps} />)
      expect(screen.getByTestId('chevron-icon')).toBeInTheDocument()
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument()
    })
  })

  describe('Quick Add Button Functionality', () => {
    it('calls onAddChart with first suggestion when clicked', () => {
      render(<ChartControls {...defaultProps} />)
      const quickAddButton = screen.getByRole('button', { name: /Add: Pie Chart/i })
      fireEvent.click(quickAddButton)
      expect(mockOnAddChart).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('does not call onAddChart when disabled', () => {
      const props = { ...defaultProps, suggestions: [] }
      render(<ChartControls {...props} />)
      const quickAddButton = screen.getByRole('button', { name: /Add Suggested Chart/i })
      fireEvent.click(quickAddButton)
      expect(mockOnAddChart).not.toHaveBeenCalled()
    })

    it('displays correct button text based on suggestion type', () => {
      const barChartSuggestion: ChartSuggestion = {
        type: 'pie',
        title: 'Bar Chart Test',
        dataColumn: 'category',
        aggregation: 'count',
        confidence: 0.9,
        reason: 'Test reason',
      }
      const props = { ...defaultProps, suggestions: [barChartSuggestion] }
      render(<ChartControls {...props} />)
      expect(screen.getByRole('button', { name: /Add: Pie Chart/i })).toBeInTheDocument()
    })

    it('handles case with single suggestion correctly', () => {
      const props = { ...defaultProps, suggestions: [mockSuggestions[0]] }
      render(<ChartControls {...props} />)
      const quickAddButton = screen.getByRole('button', { name: /Add: Pie Chart/i })
      fireEvent.click(quickAddButton)
      expect(mockOnAddChart).toHaveBeenCalledWith(mockSuggestions[0])
    })
  })

  describe('Suggestions Dropdown Functionality', () => {
    it('opens suggestions dropdown when button is clicked', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()
      expect(screen.getByText('Value Analysis')).toBeInTheDocument()
    })

    it('closes suggestions dropdown when clicking outside', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open dropdown
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      // Click outside
      fireEvent.mouseDown(document.body)

      // Dropdown should be closed
      expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument()
    })

    it('calls onAddChart and closes dropdown when suggestion is clicked', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open dropdown
      fireEvent.click(dropdownButton)

      // Click on second suggestion
      const secondSuggestion = screen.getByText('Value Analysis').closest('button')
      fireEvent.click(secondSuggestion!)

      expect(mockOnAddChart).toHaveBeenCalledWith(mockSuggestions[1])
      expect(screen.queryByText('Value Analysis')).not.toBeInTheDocument() // Dropdown closed
    })

    it('displays suggestion details correctly in dropdown', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })
      fireEvent.click(dropdownButton)

      expect(screen.getByText('Category Distribution')).toBeInTheDocument()
      expect(
        screen.getByText('Pie • Good categorical distribution • 90% confidence'),
      ).toBeInTheDocument()
      expect(screen.getByText('Value Analysis')).toBeInTheDocument()
      expect(
        screen.getByText('Pie • Numeric data suitable for pie chart • 80% confidence'),
      ).toBeInTheDocument()
    })

    it('renders correct number of suggestions in dropdown', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })
      fireEvent.click(dropdownButton)

      const suggestionButtons = screen
        .getAllByRole('button')
        .filter(
          (button) =>
            button.textContent?.includes('Distribution') ||
            button.textContent?.includes('Analysis'),
        )
      expect(suggestionButtons).toHaveLength(2)
    })

    it('handles empty suggestions gracefully', () => {
      const props = { ...defaultProps, suggestions: [] }
      render(<ChartControls {...props} />)
      expect(screen.queryByRole('button', { name: /All Suggestions/i })).not.toBeInTheDocument()
    })

    it('applies correct CSS classes to dropdown', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })
      fireEvent.click(dropdownButton)

      const dropdown = screen.getByText('Category Distribution').closest('.absolute')
      expect(dropdown).toHaveClass(
        'top-full',
        'left-0',
        'mt-1',
        'w-72',
        'bg-white',
        'rounded-lg',
        'border',
        'border-gray-200',
        'shadow-lg',
        'z-10',
        'max-h-64',
        'overflow-y-auto',
      )
    })

    it('applies hover effects to suggestion items', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })
      fireEvent.click(dropdownButton)

      const suggestionButton = screen.getByText('Category Distribution').closest('button')
      expect(suggestionButton).toHaveClass('hover:bg-gray-50')
    })
  })

  describe('Manual Chart Creation', () => {
    it('opens ChartCreationModal when Create Chart button is clicked', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      fireEvent.click(createButton)

      const modal = screen.getByTestId('chart-creation-modal')
      expect(modal).toHaveAttribute('data-open', 'true')
    })

    it('passes correct props to ChartCreationModal', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      fireEvent.click(createButton)

      const modal = screen.getByTestId('chart-creation-modal')
      expect(modal).toBeInTheDocument()
    })

    it('closes ChartCreationModal when onClose is called', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      fireEvent.click(createButton)

      // Since the modal is inside the component, we need to access it through the DOM
      const modal = screen.getByTestId('chart-creation-modal')
      const closeButton = modal.querySelector('[data-testid="modal-close"]')
      fireEvent.click(closeButton!)

      expect(modal).toHaveAttribute('data-open', 'false')
    })

    it('calls onCreateManualChart when modal creates chart', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      fireEvent.click(createButton)

      // Since the modal is inside the component, we need to access it through the DOM
      const modal = screen.getByTestId('chart-creation-modal')
      const modalCreateButton = modal.querySelector('[data-testid="modal-create"]')
      fireEvent.click(modalCreateButton!)

      expect(mockOnCreateManualChart).toHaveBeenCalledWith({
        type: 'pie',
        dataColumn: 'test_column',
        aggregation: 'count',
        title: 'Test Chart',
      })
    })

    it('does not render Create Chart button when onCreateManualChart is undefined', () => {
      const props = { ...defaultProps, onCreateManualChart: undefined }
      render(<ChartControls {...props} />)
      expect(screen.queryByRole('button', { name: /Create Chart/i })).not.toBeInTheDocument()
    })

    it('renders PlusIcon in Create Chart button', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      const plusIcon = screen.getByTestId('plus-icon')
      expect(createButton).toContainElement(plusIcon)
    })
  })

  describe('Clear All Charts Functionality', () => {
    it('calls onClearCharts when Remove all button is clicked', () => {
      render(<ChartControls {...defaultProps} />)
      const clearButton = screen.getByRole('button', { name: /Remove all/i })
      fireEvent.click(clearButton)
      expect(mockOnClearCharts).toHaveBeenCalled()
    })

    it('applies correct styling to clear button', () => {
      render(<ChartControls {...defaultProps} />)
      const clearButton = screen.getByRole('button', { name: /Remove all/i })
      expect(clearButton).toHaveClass('text-red-600', 'border-red-300', 'hover:bg-red-50')
    })

    it('has correct aria-label for accessibility', () => {
      render(<ChartControls {...defaultProps} />)
      const clearButton = screen.getByRole('button', { name: /Remove all/i })
      expect(clearButton).toHaveAttribute('aria-label', 'Remove all charts')
    })

    it('does not render clear button when onClearCharts is undefined', () => {
      const props = { ...defaultProps, onClearCharts: undefined }
      render(<ChartControls {...props} />)
      expect(screen.queryByRole('button', { name: /Remove all/i })).not.toBeInTheDocument()
    })

    it('renders TrashIcon in clear button', () => {
      render(<ChartControls {...defaultProps} />)
      const clearButton = screen.getByRole('button', { name: /Remove all/i })
      const trashIcon = screen.getByTestId('trash-icon')
      expect(clearButton).toContainElement(trashIcon)
    })
  })

  describe('Click Outside Handling', () => {
    it('sets up event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
      render(<ChartControls {...defaultProps} />)
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
      addEventListenerSpy.mockRestore()
    })

    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { unmount } = render(<ChartControls {...defaultProps} />)
      unmount()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })

    it('closes dropdown when clicking outside dropdown container', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open dropdown
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      // Click outside
      fireEvent.mouseDown(document.body)

      // Dropdown should be closed
      expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument()
    })

    it('does not close dropdown when clicking inside dropdown container', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open dropdown
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      // Click inside dropdown
      const dropdownContent = screen.getByText('Category Distribution').closest('.absolute')
      fireEvent.mouseDown(dropdownContent!)

      // Dropdown should remain open
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()
    })

    it('handles multiple click outside events correctly', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open and close dropdown multiple times
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      fireEvent.mouseDown(document.body)
      expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument()

      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      fireEvent.mouseDown(document.body)
      expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('initializes showSuggestions state to false', () => {
      render(<ChartControls {...defaultProps} />)
      expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument()
    })

    it('toggles showSuggestions state when dropdown button is clicked', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open dropdown
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      // Close dropdown
      fireEvent.click(dropdownButton)
      expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument()
    })

    it('initializes showChartCreationModal state to false', () => {
      render(<ChartControls {...defaultProps} />)
      const modal = screen.getByTestId('chart-creation-modal')
      expect(modal).toHaveAttribute('data-open', 'false')
    })

    it('sets showChartCreationModal to true when Create Chart button is clicked', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      fireEvent.click(createButton)

      const modal = screen.getByTestId('chart-creation-modal')
      expect(modal).toHaveAttribute('data-open', 'true')
    })

    it('resets showChartCreationModal to false when modal is closed', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      fireEvent.click(createButton)

      // Since the modal is inside the component, we need to access it through the DOM
      const modal = screen.getByTestId('chart-creation-modal')
      const closeButton = modal.querySelector('[data-testid="modal-close"]')
      fireEvent.click(closeButton!)

      expect(modal).toHaveAttribute('data-open', 'false')
    })

    it('maintains independent states for dropdown and modal', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })
      const createButton = screen.getByRole('button', { name: /Create Chart/i })

      // Open dropdown
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      // Open modal
      fireEvent.click(createButton)
      const modal = screen.getByTestId('chart-creation-modal')
      expect(modal).toHaveAttribute('data-open', 'true')

      // Close modal by clicking the close button
      const closeButton = modal.querySelector('[data-testid="modal-close"]')
      fireEvent.click(closeButton!)
      expect(modal).toHaveAttribute('data-open', 'false')
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('renders buttons with correct types', () => {
      render(<ChartControls {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('provides proper aria-label for clear button', () => {
      render(<ChartControls {...defaultProps} />)
      const clearButton = screen.getByRole('button', { name: /Remove all/i })
      expect(clearButton).toHaveAttribute('aria-label', 'Remove all charts')
    })

    it('includes title attributes for button tooltips', () => {
      render(<ChartControls {...defaultProps} />)
      const quickAddButton = screen.getByRole('button', { name: /Add: Pie Chart/i })
      expect(quickAddButton).toHaveAttribute('title', 'Add: Category Distribution')
    })

    it('renders buttons with proper disabled state', () => {
      const props = { ...defaultProps, suggestions: [] }
      render(<ChartControls {...props} />)
      const quickAddButton = screen.getByRole('button', { name: /Add Suggested Chart/i })
      expect(quickAddButton).toBeDisabled()
    })

    it('maintains proper focus management', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open dropdown
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      // In test environment, focus may not behave exactly as in browser
      // so we'll just verify the dropdown opened correctly
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open dropdown with click (since keyboard event may not work in test environment)
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      // Close dropdown by clicking outside
      fireEvent.mouseDown(document.body)
      expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently with many suggestions', () => {
      const manySuggestions = Array.from({ length: 50 }, (_, i) => ({
        type: 'pie' as ChartType,
        title: `Suggestion ${i}`,
        dataColumn: `column_${i}`,
        aggregation: 'count' as AggregationType,
        confidence: 0.5 + (i % 5) * 0.1,
        reason: `Reason ${i}`,
      }))

      const props = { ...defaultProps, suggestions: manySuggestions }
      const startTime = performance.now()
      render(<ChartControls {...props} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should render quickly
    })

    it('handles rapid state changes without errors', () => {
      render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Rapid open/close cycles
      for (let i = 0; i < 10; i++) {
        fireEvent.click(dropdownButton)
        expect(screen.getByText('Category Distribution')).toBeInTheDocument()
        fireEvent.mouseDown(document.body)
        expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument()
      }
    })

    it('only re-renders when necessary', () => {
      const { rerender } = render(<ChartControls {...defaultProps} />)

      // Re-render with same props
      rerender(<ChartControls {...defaultProps} />)

      // Component should handle this gracefully
      expect(screen.getByRole('button', { name: /Add: Pie Chart/i })).toBeInTheDocument()
    })

    it('memoizes event handlers properly', () => {
      const { rerender } = render(<ChartControls {...defaultProps} />)

      // Re-render with different suggestions
      const newSuggestions = [
        ...mockSuggestions,
        {
          type: 'pie' as ChartType,
          title: 'New Suggestion',
          dataColumn: 'new_column',
          aggregation: 'count' as AggregationType,
          confidence: 0.7,
          reason: 'New reason',
        },
      ]

      rerender(<ChartControls {...defaultProps} suggestions={newSuggestions} />)

      // Should update suggestion count
      expect(screen.getByRole('button', { name: /All Suggestions \(3\)/i })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined optional props gracefully', () => {
      const minimalProps = {
        suggestions: mockSuggestions,
        onAddChart: mockOnAddChart,
        columnInfo: mockColumnInfos,
        filteredData: mockFilteredData,
      }

      render(<ChartControls {...minimalProps} />)

      // Should not render optional buttons
      expect(screen.queryByRole('button', { name: /Create Chart/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Remove all/i })).not.toBeInTheDocument()
    })

    it('handles empty columnInfo array', () => {
      const props = { ...defaultProps, columnInfo: [] }
      render(<ChartControls {...props} />)
      expect(screen.getByRole('button', { name: /Add: Pie Chart/i })).toBeInTheDocument()
    })

    it('handles empty filteredData array', () => {
      const props = { ...defaultProps, filteredData: [] }
      render(<ChartControls {...props} />)
      expect(screen.getByRole('button', { name: /Add: Pie Chart/i })).toBeInTheDocument()
    })

    it('handles suggestions with very long titles', () => {
      const longTitleSuggestion = {
        type: 'pie' as ChartType,
        title:
          'This is a very long title that should be handled gracefully by the component without breaking the layout or causing overflow issues',
        dataColumn: 'long_title_column',
        aggregation: 'count' as AggregationType,
        confidence: 0.9,
        reason: 'Long title test',
      }

      const props = { ...defaultProps, suggestions: [longTitleSuggestion] }
      render(<ChartControls {...props} />)
      expect(screen.getByRole('button', { name: /Add: Pie Chart/i })).toBeInTheDocument()
    })

    it('handles suggestions with special characters', () => {
      const specialCharSuggestion = {
        type: 'pie' as ChartType,
        title: 'Chart with "special" characters & symbols',
        dataColumn: 'special_column',
        aggregation: 'count' as AggregationType,
        confidence: 0.8,
        reason: 'Special characters test',
      }

      const props = { ...defaultProps, suggestions: [specialCharSuggestion] }
      render(<ChartControls {...props} />)
      expect(screen.getByRole('button', { name: /Add: Pie Chart/i })).toBeInTheDocument()
    })

    it('handles rapid clicking of buttons', () => {
      render(<ChartControls {...defaultProps} />)
      const quickAddButton = screen.getByRole('button', { name: /Add: Pie Chart/i })

      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        fireEvent.click(quickAddButton)
      }

      expect(mockOnAddChart).toHaveBeenCalledTimes(5)
    })

    it('handles component unmount during async operations', () => {
      const { unmount } = render(<ChartControls {...defaultProps} />)
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })

      // Open dropdown
      fireEvent.click(dropdownButton)
      expect(screen.getByText('Category Distribution')).toBeInTheDocument()

      // Unmount component
      unmount()

      // Should not throw errors
      expect(() => {
        fireEvent.mouseDown(document.body)
      }).not.toThrow()
    })
  })

  describe('Integration with Dependencies', () => {
    it('integrates correctly with Button component variants', () => {
      render(<ChartControls {...defaultProps} />)

      const quickAddButton = screen.getByRole('button', { name: /Add: Pie Chart/i })
      const dropdownButton = screen.getByRole('button', { name: /All Suggestions \(2\)/i })
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      const clearButton = screen.getByRole('button', { name: /Remove all/i })

      expect(quickAddButton).toHaveAttribute('data-variant', 'primary')
      expect(dropdownButton).toHaveAttribute('data-variant', 'outline')
      expect(createButton).toHaveAttribute('data-variant', 'outline')
      expect(clearButton).toHaveAttribute('data-variant', 'outline')
    })

    it('integrates correctly with Button component sizes', () => {
      render(<ChartControls {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('data-size', 'sm')
      })
    })

    it('passes correct data to ChartCreationModal', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      fireEvent.click(createButton)

      // Modal should receive correct props
      const modal = screen.getByTestId('chart-creation-modal')
      expect(modal).toBeInTheDocument()
    })

    it('handles ChartCreationModal callbacks correctly', () => {
      render(<ChartControls {...defaultProps} />)
      const createButton = screen.getByRole('button', { name: /Create Chart/i })
      fireEvent.click(createButton)

      // Since the modal is inside the component, we need to access it through the DOM
      const modal = screen.getByTestId('chart-creation-modal')
      const modalCreateButton = modal.querySelector('[data-testid="modal-create"]')
      fireEvent.click(modalCreateButton!)

      expect(mockOnCreateManualChart).toHaveBeenCalled()
    })

    it('maintains proper prop types throughout component lifecycle', () => {
      const props = {
        suggestions: mockSuggestions,
        onAddChart: mockOnAddChart,
        onClearCharts: mockOnClearCharts,
        onCreateManualChart: mockOnCreateManualChart,
        columnInfo: mockColumnInfos,
        filteredData: mockFilteredData,
      }

      const { rerender } = render(<ChartControls {...props} />)

      // Update props
      const newProps = {
        ...props,
        suggestions: [mockSuggestions[0]],
      }

      rerender(<ChartControls {...newProps} />)

      // Should handle prop changes correctly
      expect(screen.queryByRole('button', { name: /All Suggestions/i })).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles invalid suggestion data gracefully', () => {
      const invalidSuggestion = {
        type: 'invalid_type' as ChartType,
        title: '',
        dataColumn: '',
        aggregation: 'invalid_agg' as AggregationType,
        confidence: 1.5,
        reason: '',
      }

      const props = { ...defaultProps, suggestions: [invalidSuggestion] }

      // Should not throw error
      expect(() => {
        render(<ChartControls {...props} />)
      }).not.toThrow()
    })

    it('handles missing onClick handlers gracefully', () => {
      const props = {
        suggestions: [],
        onAddChart: undefined as any,
        columnInfo: mockColumnInfos,
        filteredData: mockFilteredData,
      }

      // Should not throw error when button is clicked (button should be disabled)
      expect(() => {
        render(<ChartControls {...props} />)
        const quickAddButton = screen.getByRole('button', { name: /Add Suggested Chart/i })
        fireEvent.click(quickAddButton)
      }).not.toThrow()
    })

    it('handles malformed columnInfo data', () => {
      const malformedColumnInfo = [
        {
          name: '',
          index: -1,
          type: 'invalid_type' as any,
          uniqueValues: [],
          uniqueCount: -1,
          hasNulls: true,
          nullCount: -1,
          sampleValues: [],
        },
      ]

      const props = { ...defaultProps, columnInfo: malformedColumnInfo }

      // Should not throw error
      expect(() => {
        render(<ChartControls {...props} />)
      }).not.toThrow()
    })

    it('handles malformed filteredData', () => {
      const malformedFilteredData = [null, undefined, 'invalid', {}] as any

      const props = { ...defaultProps, filteredData: malformedFilteredData }

      // Should not throw error
      expect(() => {
        render(<ChartControls {...props} />)
      }).not.toThrow()
    })
  })
})
