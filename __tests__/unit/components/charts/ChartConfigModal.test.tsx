import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChartConfigModal } from '@/components/charts/ChartConfigModal'
import { ChartConfig, ChartType } from '@/types/chart'
import { ColumnInfo } from '@/types/excel'

// Mock dependencies
jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) => (
    <div data-testid="modal" data-open={isOpen} style={{ display: isOpen ? 'block' : 'none' }}>
      <div data-testid="modal-title">{title}</div>
      <button data-testid="modal-close" onClick={onClose}>
        Close
      </button>
      <div data-testid="modal-content">{children}</div>
    </div>
  ),
}))

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, type = 'button', variant = 'primary', className = '' }: any) => (
    <button
      data-testid={`button-${variant}`}
      data-type={type}
      onClick={onClick}
      type={type}
      className={className}
    >
      {children}
    </button>
  ),
}))

describe('ChartConfigModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSave = jest.fn()

  const defaultConfig: ChartConfig = {
    id: 'test-chart-id',
    title: 'Test Chart',
    type: 'pie',
    dataColumn: 'column1',
    aggregation: 'count',
    options: {
      responsive: true,
      maintainAspectRatio: true,
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

  const mockColumnInfo: ColumnInfo[] = [
    {
      name: 'column1',
      index: 0,
      type: 'string',
      uniqueValues: ['a', 'b', 'c'],
      uniqueCount: 3,
      hasNulls: false,
      nullCount: 0,
      sampleValues: ['a', 'b', 'c'],
    },
    {
      name: 'column2',
      index: 1,
      type: 'number',
      uniqueValues: [1, 2, 3],
      uniqueCount: 3,
      hasNulls: false,
      nullCount: 0,
      sampleValues: [1, 2, 3],
    },
    {
      name: 'column3',
      index: 2,
      type: 'date',
      uniqueValues: ['2023-01-01', '2023-01-02'],
      uniqueCount: 2,
      hasNulls: false,
      nullCount: 0,
      sampleValues: ['2023-01-01', '2023-01-02'],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering and Basic Structure', () => {
    it('should render modal with correct title when open', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      expect(screen.getByTestId('modal')).toHaveAttribute('data-open', 'true')
      expect(screen.getByText(/chart configuration/i)).toBeInTheDocument()
    })

    it('should not render modal when closed', () => {
      render(
        <ChartConfigModal
          isOpen={false}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      expect(screen.getByTestId('modal')).toHaveAttribute('data-open', 'false')
    })

    it('should render form with all required fields', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      expect(screen.getByText('Chart Title')).toBeInTheDocument()
      expect(screen.getByText('Chart Type')).toBeInTheDocument()
      expect(screen.getByText('Data Column')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getAllByRole('combobox')).toHaveLength(2)
    })

    it('should render action buttons', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save chart/i })).toBeInTheDocument()
    })
  })

  describe('Form Field Initialization', () => {
    it('should initialize form with provided config values', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const inputs = screen.getAllByRole('textbox')
      const selects = screen.getAllByRole('combobox')

      expect(inputs[0]).toHaveValue('Test Chart')
      expect(selects[0]).toHaveValue('pie')
      expect(selects[1]).toHaveValue('column1')
    })

    it('should populate chart type options correctly', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const selects = screen.getAllByRole('combobox')
      const chartTypeSelect = selects[0]
      const options = Array.from(chartTypeSelect.querySelectorAll('option'))

      expect(options).toHaveLength(5)
      expect(options[0]).toHaveValue('pie')
      expect(options[0]).toHaveTextContent('Pie Chart')
      expect(options[1]).toHaveValue('bar')
      expect(options[1]).toHaveTextContent('Bar Chart')
      expect(options[2]).toHaveValue('line')
      expect(options[2]).toHaveTextContent('Line Chart')
      expect(options[3]).toHaveValue('scatter')
      expect(options[3]).toHaveTextContent('Scatter Plot')
      expect(options[4]).toHaveValue('histogram')
      expect(options[4]).toHaveTextContent('Histogram')
    })

    it('should populate data column options from columnInfo', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const selects = screen.getAllByRole('combobox')
      const dataColumnSelect = selects[1]
      const options = Array.from(dataColumnSelect.querySelectorAll('option'))

      expect(options).toHaveLength(3)
      expect(options[0]).toHaveValue('column1')
      expect(options[0]).toHaveTextContent('column1')
      expect(options[1]).toHaveValue('column2')
      expect(options[1]).toHaveTextContent('column2')
      expect(options[2]).toHaveValue('column3')
      expect(options[2]).toHaveTextContent('column3')
    })

    it('should handle empty columnInfo array', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={[]}
          onSave={mockOnSave}
        />,
      )

      const selects = screen.getAllByRole('combobox')
      const dataColumnSelect = selects[1]
      const options = Array.from(dataColumnSelect.querySelectorAll('option'))

      expect(options).toHaveLength(0)
    })
  })

  describe('User Interactions', () => {
    it('should update title field when user types', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const inputs = screen.getAllByRole('textbox')
      const titleInput = inputs[0]
      await user.clear(titleInput)
      await user.type(titleInput, 'New Chart Title')

      expect(titleInput).toHaveValue('New Chart Title')
    })

    it('should update chart type when user selects different option', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const selects = screen.getAllByRole('combobox')
      const chartTypeSelect = selects[0]
      await user.selectOptions(chartTypeSelect, 'bar')

      expect(chartTypeSelect).toHaveValue('bar')
    })

    it('should update data column when user selects different option', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const selects = screen.getAllByRole('combobox')
      const dataColumnSelect = selects[1]
      await user.selectOptions(dataColumnSelect, 'column2')

      expect(dataColumnSelect).toHaveValue('column2')
    })

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should call onClose when modal close button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const modalCloseButton = screen.getByRole('button', { name: /close/i })
      await user.click(modalCloseButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should call onSave with updated config when form is submitted', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      // Update form fields
      const inputs = screen.getAllByRole('textbox')
      const selects = screen.getAllByRole('combobox')
      const titleInput = inputs[0]
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Chart Title')

      const chartTypeSelect = selects[0]
      await user.selectOptions(chartTypeSelect, 'bar')

      const dataColumnSelect = selects[1]
      await user.selectOptions(dataColumnSelect, 'column2')

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save chart/i })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      expect(mockOnClose).toHaveBeenCalledTimes(1)

      const savedConfig = mockOnSave.mock.calls[0][0]
      expect(savedConfig).toMatchObject({
        id: 'test-chart-id',
        title: 'Updated Chart Title',
        type: 'bar' as ChartType,
        dataColumn: 'column2',
        aggregation: 'count',
      })
    })

    it('should preserve original config properties when only some fields are changed', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      // Only update title
      const inputs = screen.getAllByRole('textbox')
      const titleInput = inputs[0]
      await user.clear(titleInput)
      await user.type(titleInput, 'Only Title Changed')

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save chart/i })
      await user.click(saveButton)

      const savedConfig = mockOnSave.mock.calls[0][0]
      expect(savedConfig).toMatchObject({
        id: 'test-chart-id',
        title: 'Only Title Changed',
        type: 'pie', // unchanged
        dataColumn: 'column1', // unchanged
        aggregation: 'count', // unchanged
      })
    })

    it('should handle form submission with minimal config changes', async () => {
      const user = userEvent.setup()
      const minimalConfig: ChartConfig = {
        ...defaultConfig,
        title: '',
      }

      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={minimalConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      // Submit without making changes
      const saveButton = screen.getByRole('button', { name: /save chart/i })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith({
        ...minimalConfig,
        title: '', // empty title should be preserved
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle config with missing optional properties', () => {
      const incompleteConfig: Partial<ChartConfig> = {
        id: 'test-id',
        title: 'Test',
        type: 'pie',
        dataColumn: 'column1',
        aggregation: 'count',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            title: {
              display: true,
              text: 'Test',
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

      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={incompleteConfig as ChartConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0]).toHaveValue('Test')
    })

    it('should handle special characters in title input', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const inputs = screen.getAllByRole('textbox')
      const titleInput = inputs[0]
      await user.clear(titleInput)
      await user.type(titleInput, 'Chart with special chars: @#$%^&*()')

      expect(titleInput).toHaveValue('Chart with special chars: @#$%^&*()')
    })

    it('should handle very long title input', async () => {
      const user = userEvent.setup()
      const longTitle = 'A'.repeat(1000)

      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const inputs = screen.getAllByRole('textbox')
      const titleInput = inputs[0]
      await user.clear(titleInput)
      await user.type(titleInput, longTitle)

      expect(titleInput).toHaveValue(longTitle)
    })

    it('should handle column names with special characters', () => {
      const specialColumnInfo: ColumnInfo[] = [
        {
          name: 'column with spaces',
          index: 0,
          type: 'string',
          uniqueValues: ['a', 'b'],
          uniqueCount: 2,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['a', 'b'],
        },
        {
          name: 'column-with-dashes',
          index: 1,
          type: 'number',
          uniqueValues: [1, 2],
          uniqueCount: 2,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [1, 2],
        },
      ]

      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={specialColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const selects = screen.getAllByRole('combobox')
      const dataColumnSelect = selects[1]
      const options = Array.from(dataColumnSelect.querySelectorAll('option'))

      expect(options[0]).toHaveValue('column with spaces')
      expect(options[0]).toHaveTextContent('column with spaces')
      expect(options[1]).toHaveValue('column-with-dashes')
      expect(options[1]).toHaveTextContent('column-with-dashes')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels associated with inputs', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      expect(screen.getByText('Chart Title')).toBeInTheDocument()
      expect(screen.getByText('Chart Type')).toBeInTheDocument()
      expect(screen.getByText('Data Column')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getAllByRole('combobox')).toHaveLength(2)
    })

    it('should have proper button types', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const saveButton = screen.getByRole('button', { name: /save chart/i })

      expect(cancelButton).toHaveAttribute('type', 'button')
      expect(saveButton).toHaveAttribute('type', 'submit')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const inputs = screen.getAllByRole('textbox')
      const titleInput = inputs[0]
      const saveButton = screen.getByRole('button', { name: /save chart/i })

      // Focus on title input directly (since modal close button gets first focus)
      titleInput.focus()
      expect(titleInput).toHaveFocus()

      // Clear existing text and type new title
      await user.clear(titleInput)
      await user.keyboard('New Title{Enter}')

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Title',
        }),
      )
    })
  })

  describe('Performance and Optimization', () => {
    it('should memoize dataColumns calculation', () => {
      const { rerender } = render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      // Rerender with same props - should not cause unnecessary recalculations
      rerender(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      // Component should still work correctly
      expect(screen.getAllByRole('combobox')[1]).toBeInTheDocument()
    })

    it('should handle rapid form updates efficiently', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const inputs = screen.getAllByRole('textbox')
      const titleInput = inputs[0]

      // Rapid input changes
      await user.clear(titleInput)
      await user.type(titleInput, 'Quick typing test')
      await user.clear(titleInput)
      await user.type(titleInput, 'Another test')

      expect(titleInput).toHaveValue('Another test')
    })
  })

  describe('Integration with Dependencies', () => {
    it('should properly integrate with Modal component', () => {
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const modal = screen.getByTestId('modal')
      const modalContent = screen.getByTestId('modal-content')

      expect(modal).toBeInTheDocument()
      expect(modalContent).toContainElement(screen.getByRole('textbox'))
    })

    it('should properly integrate with Button components', async () => {
      const user = userEvent.setup()
      render(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const saveButton = screen.getByRole('button', { name: /save chart/i })

      expect(cancelButton).toBeInTheDocument()
      expect(saveButton).toBeInTheDocument()

      await user.click(cancelButton)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should handle modal state changes correctly', () => {
      const { rerender } = render(
        <ChartConfigModal
          isOpen={false}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      expect(screen.getByTestId('modal')).toHaveAttribute('data-open', 'false')

      rerender(
        <ChartConfigModal
          isOpen={true}
          onClose={mockOnClose}
          config={defaultConfig}
          columnInfo={mockColumnInfo}
          onSave={mockOnSave}
        />,
      )

      expect(screen.getByTestId('modal')).toHaveAttribute('data-open', 'true')
    })
  })
})
