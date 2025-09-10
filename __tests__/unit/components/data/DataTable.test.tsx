import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '@/components/DataTable'
import { CellValue, ColumnInfo, DataRow, DataType, ExcelData, ExcelMetadata } from '@/types/excel'
import { parseDateFlexible } from '@/utils/dataTypes'

// Mock the LoadingSpinner component
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" className={size} />
  ),
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChevronDownIcon: ({ className }: { className: string }) => (
    <svg data-testid="chevron-down-icon" className={className} />
  ),
  ChevronUpIcon: ({ className }: { className: string }) => (
    <svg data-testid="chevron-up-icon" className={className} />
  ),
  TrashIcon: ({ className }: { className: string }) => (
    <svg data-testid="trash-icon" className={className} />
  ),
}))

// Mock clsx properly - this needs to be done before importing the component
jest.mock('clsx', () => {
  const mockClsx = jest.fn((...args: DataRow) => {
    return args.filter(Boolean).join(' ')
  })
  return {
    __esModule: true,
    default: mockClsx,
    clsx: mockClsx,
  }
})

// Mock parseDateFlexible
jest.mock('@/utils/dataTypes', () => ({
  parseDateFlexible: jest.fn(),
}))

describe('DataTable', () => {
  const mockOnSort = jest.fn()
  const mockOnDeleteColumn = jest.fn()
  const mockOnToggleDataTypes = jest.fn()

  const createColumnInfo = (
    name: string,
    type: DataType,
    sampleValues: CellValue[],
  ): ColumnInfo => ({
    name,
    index: 0,
    type,
    uniqueValues: [...new Set(sampleValues)],
    uniqueCount: new Set(sampleValues).size,
    hasNulls: sampleValues.some((v) => v === null || v === undefined),
    nullCount: sampleValues.filter((v) => v === null || v === undefined).length,
    sampleValues,
  })

  const createExcelMetadata = (fileName: string, columns: ColumnInfo[]): ExcelMetadata => ({
    fileName,
    sheetNames: ['Sheet1'],
    activeSheet: 'Sheet1',
    totalRows: 3,
    totalColumns: columns.length,
    columns,
    fileSize: 1024,
  })

  const sampleData: ExcelData = {
    headers: ['Name', 'Age', 'Date', 'Active'],
    rows: [
      ['John Doe', 30, '2023-01-15', true],
      ['Jane Smith', 25, '2023-02-20', false],
      ['Bob Johnson', 35, '2023-03-10', true],
    ],
    metadata: createExcelMetadata('test.xlsx', [
      createColumnInfo('Name', 'string', ['John Doe', 'Jane Smith', 'Bob Johnson']),
      createColumnInfo('Age', 'number', [30, 25, 35]),
      createColumnInfo('Date', 'date', ['2023-01-15', '2023-02-20', '2023-03-10']),
      createColumnInfo('Active', 'boolean', [true, false, true]),
    ]),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(parseDateFlexible as jest.Mock).mockImplementation((value: string) => {
      if (typeof value === 'string' && value.includes('2023')) {
        // Return dates at midnight to ensure they're treated as date-only
        const dateStr = value.includes('T') ? value.split('T')[0] : value
        return new Date(`${dateStr}T00:00:00.000Z`)
      }
      return null
    })
  })

  describe('Basic Rendering and Functionality', () => {
    test('renders loading state when isLoading is true', () => {
      render(<DataTable data={sampleData} isLoading={true} />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByRole('paragraph')).toHaveTextContent('Loading data...')
    })

    test('renders empty state when no data is provided', () => {
      render(<DataTable data={null} />)

      expect(screen.getByRole('heading', { name: /no data to display/i })).toBeInTheDocument()
      expect(screen.getByRole('paragraph')).toHaveTextContent(
        'Upload an Excel or CSV file to get started',
      )
    })

    test('renders table with data correctly', () => {
      render(<DataTable data={sampleData} />)

      // Check that the component renders
      expect(screen.getByRole('heading', { name: /data table/i })).toBeInTheDocument()

      // Check that we have the expected number of headers and rows
      const headers = screen.getAllByRole('columnheader')
      expect(headers.length).toBe(4)

      // Check that we have data rows
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBe(4) // Header + 3 data rows

      // Check specific content exists
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    test('displays file metadata when available', () => {
      render(<DataTable data={sampleData} />)

      // Check that file name is displayed
      expect(screen.getByText('test.xlsx')).toBeInTheDocument()

      // Check that sheet information is displayed
      const sheetInfo = screen.getByText(/Sheet:/)
      expect(sheetInfo).toBeInTheDocument()
    })

    test('handles filtered rows correctly', () => {
      const filteredRows = [['John Doe', 30, '2023-01-15', true]]

      render(<DataTable data={sampleData} filteredRows={filteredRows} />)

      // Check that filtered data is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument()

      // Check that other data is not displayed
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })

  describe('Sorting Functionality', () => {
    test('renders sort indicators when onSort is provided', () => {
      render(
        <DataTable data={sampleData} onSort={mockOnSort} sortColumn="Name" sortDirection="asc" />,
      )

      const nameHeader = screen.getByText('Name').closest('th')
      const chevronUp = nameHeader?.querySelector('[data-testid="chevron-up-icon"]')
      const chevronDown = nameHeader?.querySelector('[data-testid="chevron-down-icon"]')

      expect(chevronUp).toHaveClass('text-primary-600')
      expect(chevronDown).toHaveClass('text-gray-300')
    })

    test('calls onSort when header is clicked', async () => {
      render(<DataTable data={sampleData} onSort={mockOnSort} />)

      const nameHeader = screen.getByText('Name')
      await userEvent.click(nameHeader)

      expect(mockOnSort).toHaveBeenCalledWith('Name', 'asc')
    })

    test('toggles sort direction when same column is clicked', async () => {
      render(
        <DataTable data={sampleData} onSort={mockOnSort} sortColumn="Name" sortDirection="asc" />,
      )

      const nameHeader = screen.getByText('Name')
      await userEvent.click(nameHeader)

      expect(mockOnSort).toHaveBeenCalledWith('Name', 'desc')
    })

    test('does not call onSort when onSort is not provided', async () => {
      render(<DataTable data={sampleData} />)

      const nameHeader = screen.getByText('Name')
      await userEvent.click(nameHeader)

      expect(mockOnSort).not.toHaveBeenCalled()
    })
  })

  describe('Column Deletion', () => {
    test('renders delete buttons when onDeleteColumn is provided', () => {
      render(<DataTable data={sampleData} onDeleteColumn={mockOnDeleteColumn} />)

      const deleteButtons = screen.getAllByTestId('trash-icon')
      expect(deleteButtons).toHaveLength(4) // One for each column
    })

    test('calls onDeleteColumn when delete button is clicked', async () => {
      render(<DataTable data={sampleData} onDeleteColumn={mockOnDeleteColumn} />)

      const deleteButtons = screen.getAllByTestId('trash-icon')
      await userEvent.click(deleteButtons[1]) // Delete second column

      expect(mockOnDeleteColumn).toHaveBeenCalledWith(1)
    })

    test('does not render delete buttons when onDeleteColumn is not provided', () => {
      render(<DataTable data={sampleData} />)

      const deleteButtons = screen.queryAllByTestId('trash-icon')
      expect(deleteButtons).toHaveLength(0)
    })
  })

  describe('Data Types Display', () => {
    test('renders data types when showDataTypes is true', () => {
      render(
        <DataTable
          data={sampleData}
          showDataTypes={true}
          onToggleDataTypes={mockOnToggleDataTypes}
        />,
      )

      expect(screen.getByText('string')).toBeInTheDocument()
      expect(screen.getByText('number')).toBeInTheDocument()
      expect(screen.getByText('date')).toBeInTheDocument()
      expect(screen.getByText('boolean')).toBeInTheDocument()
    })

    test('does not render data types when showDataTypes is false', () => {
      render(
        <DataTable
          data={sampleData}
          showDataTypes={false}
          onToggleDataTypes={mockOnToggleDataTypes}
        />,
      )

      expect(screen.queryByText('string')).not.toBeInTheDocument()
      expect(screen.queryByText('number')).not.toBeInTheDocument()
    })

    test('calls onToggleDataTypes when checkbox is clicked', async () => {
      render(
        <DataTable
          data={sampleData}
          showDataTypes={false}
          onToggleDataTypes={mockOnToggleDataTypes}
        />,
      )

      const checkbox = screen.getByRole('checkbox')
      await userEvent.click(checkbox)

      expect(mockOnToggleDataTypes).toHaveBeenCalledWith(true)
    })

    test('does not render data types checkbox when onToggleDataTypes is not provided', () => {
      render(<DataTable data={sampleData} showDataTypes={true} />)

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })

  describe('Cell Value Formatting', () => {
    test('formats string values correctly', () => {
      render(<DataTable data={sampleData} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    test('formats number values with locale', () => {
      render(<DataTable data={sampleData} />)

      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    test('formats boolean values correctly', () => {
      render(<DataTable data={sampleData} />)

      const trueValues = screen.getAllByText('true')
      const falseValues = screen.getAllByText('false')
      expect(trueValues.length).toBeGreaterThan(0)
      expect(falseValues.length).toBeGreaterThan(0)
    })

    test('formats date values correctly', () => {
      render(<DataTable data={sampleData} />)

      // Look for any date format that contains 2023, 01, and 15 in some order
      // This handles different locale formats like DD/MM/YYYY vs MM/DD/YYYY
      expect(screen.getByText(/2023.*01.*15|15.*01.*2023/)).toBeInTheDocument()
    })

    test('handles empty/null values correctly', () => {
      const dataWithEmpty: ExcelData = {
        ...sampleData,
        rows: [['', '', '', 'valid']],
      }

      render(<DataTable data={dataWithEmpty} />)

      const cells = screen.getAllByRole('cell')
      expect(cells[0]).toHaveTextContent('')
    })

    test('truncates long cell values with tooltip', () => {
      const longTextData: ExcelData = {
        headers: ['LongText'],
        rows: [['This is a very long text that should be truncated in the display']],
        metadata: createExcelMetadata('long.xlsx', [
          createColumnInfo('LongText', 'string', ['This is a very long text']),
        ]),
      }

      render(<DataTable data={longTextData} />)

      const cell = screen.getByText(/This is a very long text/)
      expect(cell).toHaveClass('truncate')
      expect(cell).toHaveAttribute(
        'title',
        'This is a very long text that should be truncated in the display',
      )
    })
  })

  describe('Virtual Scrolling', () => {
    const largeData: ExcelData = {
      headers: ['Column1', 'Column2', 'Column3'],
      rows: Array.from({ length: 300 }, (_, i) => [`Row${i + 1}`, i + 1, `Value${i + 1}`]),
      metadata: createExcelMetadata('large.xlsx', [
        createColumnInfo('Column1', 'string', ['Row1', 'Row2', 'Row3']),
        createColumnInfo('Column2', 'number', [1, 2, 3]),
        createColumnInfo('Column3', 'string', ['Value1', 'Value2', 'Value3']),
      ]),
    }

    test('enables virtual scrolling for large datasets', () => {
      render(<DataTable data={largeData} />)

      // Check that virtual scrolling is enabled by verifying row limitation
      // This test works in conjunction with the other virtual scrolling tests
      const rows = screen.getAllByRole('row')
      // Should have header + limited rows (not all 300)
      expect(rows.length).toBeLessThan(250) // Much less than total 300 + header
      expect(rows.length).toBeGreaterThan(1) // But more than just header
    })

    test('does not enable virtual scrolling for small datasets', () => {
      render(<DataTable data={sampleData} />)

      expect(screen.queryByText(/Showing first 200 rows/)).not.toBeInTheDocument()
    })

    test('renders only first 200 rows when virtual scrolling is enabled', () => {
      render(<DataTable data={largeData} />)

      const rows = screen.getAllByRole('row')
      // Header row + 200 data rows
      expect(rows.length).toBe(201)
    })

    test('renders all rows when virtual scrolling is not needed', () => {
      render(<DataTable data={sampleData} />)

      const rows = screen.getAllByRole('row')
      // Header row + 3 data rows
      expect(rows.length).toBe(4)
    })
  })

  describe('Accessibility', () => {
    test('table has proper structure with thead and tbody', () => {
      render(<DataTable data={sampleData} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0)
      expect(screen.getAllByRole('cell').length).toBeGreaterThan(0)
    })

    test('sort buttons are accessible', () => {
      render(<DataTable data={sampleData} onSort={mockOnSort} />)

      const nameHeader = screen.getByText('Name').closest('button')
      expect(nameHeader).toBeInTheDocument()
    })

    test('delete buttons have proper aria labels', () => {
      render(<DataTable data={sampleData} onDeleteColumn={mockOnDeleteColumn} />)

      const deleteButtons = screen.getAllByTestId('trash-icon')
      expect(deleteButtons.length).toBeGreaterThan(0)

      // Check that the parent button has proper aria label
      deleteButtons.forEach((button) => {
        const parentButton = button.closest('button')
        expect(parentButton).toHaveAttribute('aria-label', 'Delete column')
      })
    })

    test('data types checkbox has proper label', () => {
      render(
        <DataTable
          data={sampleData}
          showDataTypes={false}
          onToggleDataTypes={mockOnToggleDataTypes}
        />,
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      // The label should be associated with the checkbox
      expect(checkbox).toHaveAccessibleName('Show data types')
    })
  })

  describe('Integration with External Dependencies', () => {
    test('correctly uses parseDateFlexible for date parsing', () => {
      const mockDate = new Date('2023-01-15T14:30:00')
      ;(parseDateFlexible as jest.Mock).mockReturnValue(mockDate)

      render(<DataTable data={sampleData} />)

      expect(parseDateFlexible).toHaveBeenCalledWith('2023-01-15')
      // Look for any date format that contains the year 2023 and time components
      const dateCells = screen.getAllByText(/2023.*02:30|14:30/)
      expect(dateCells.length).toBeGreaterThan(0)
    })

    test('handles parseDateFlexible errors gracefully', () => {
      // Mock to return null (simulating parse failure) instead of throwing error
      ;(parseDateFlexible as jest.Mock).mockReturnValue(null)

      render(<DataTable data={sampleData} />)

      expect(screen.getByText('2023-01-15')).toBeInTheDocument()
    })

    test('uses clsx for conditional class names', () => {
      const { clsx: mockClsx } = jest.requireActual('clsx')

      render(<DataTable data={sampleData} onSort={mockOnSort} />)

      expect(mockClsx).toHaveBeenCalled()
    })
  })
})
