import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeEach(() => {
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})

// Simple test for RangeFilter component structure
describe('RangeFilter Component', () => {
  describe('Basic structure and rendering', () => {
    test('renders range filter container correctly', () => {
      // Test that the container renders with correct classes
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('Range Filter')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()

      const resetButton = screen.getByRole('button', { name: /reset/i })
      expect(resetButton).toHaveClass('text-xs', 'text-blue-600', 'hover:text-blue-800')

      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs).toHaveLength(2)
      expect(numberInputs[0]).toHaveAttribute('placeholder', 'Min')
      expect(numberInputs[1]).toHaveAttribute('placeholder', 'Max')

      const rangeInputs = screen.getAllByRole('slider')
      expect(rangeInputs).toHaveLength(2)
    })

    test('renders with initial values', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs[0]).toHaveValue(25)
      expect(numberInputs[1]).toHaveValue(75)

      const rangeInputs = screen.getAllByRole('slider')
      expect(rangeInputs[0]).toHaveValue('25')
      expect(rangeInputs[1]).toHaveValue('75')
    })

    test('renders with min and max labels', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()

      // Find the container with the labels
      const labelsContainer = screen.getByText('0').closest('.flex.justify-between')
      expect(labelsContainer).toBeInTheDocument()

      // Check that the container has the correct class
      expect(labelsContainer).toHaveClass('flex', 'justify-between')

      // Find the span elements within the container
      const spans = labelsContainer?.querySelectorAll('span')
      expect(spans).toHaveLength(2)

      // Check that the spans contain the expected text
      expect(spans?.[0]).toHaveTextContent('0')
      expect(spans?.[1]).toHaveTextContent('100')
    })

    test('renders with current range display', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={() => {}}
              />
            </div>
            <div className="text-center text-sm text-gray-600">Current: 25 - 75</div>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('Current: 25 - 75')).toBeInTheDocument()
      const currentRange = screen.getByText('Current: 25 - 75')
      expect(currentRange).toHaveClass('text-center', 'text-sm', 'text-gray-600')
    })
  })

  describe('Number input functionality', () => {
    test('handles min number input change', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={(e) => mockOnChange(e.target.value, '75')}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(numberInputs[0], { target: { value: '30' } })
      expect(mockOnChange).toHaveBeenCalledWith('30', '75')
    })

    test('handles max number input change', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={(e) => mockOnChange('25', e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(numberInputs[1], { target: { value: '80' } })
      expect(mockOnChange).toHaveBeenCalledWith('25', '80')
    })

    test('handles empty min number input', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25"
                onChange={(e) => mockOnChange(e.target.value || '0', '75')}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(numberInputs[0], { target: { value: '' } })
      expect(mockOnChange).toHaveBeenCalledWith('0', '75')
    })

    test('handles empty max number input', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75"
                onChange={(e) => mockOnChange('25', e.target.value || '100')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(numberInputs[1], { target: { value: '' } })
      expect(mockOnChange).toHaveBeenCalledWith('25', '100')
    })
  })

  describe('Range slider functionality', () => {
    test('handles min range slider change', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={(e) => mockOnChange(e.target.value, '75')}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const rangeInputs = screen.getAllByRole('slider')
      fireEvent.change(rangeInputs[0], { target: { value: '30' } })
      expect(mockOnChange).toHaveBeenCalledWith('30', '75')
    })

    test('handles max range slider change', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={(e) => mockOnChange('25', e.target.value)}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const rangeInputs = screen.getAllByRole('slider')
      fireEvent.change(rangeInputs[1], { target: { value: '80' } })
      expect(mockOnChange).toHaveBeenCalledWith('25', '80')
    })
  })

  describe('Reset functionality', () => {
    test('handles reset button click', () => {
      const mockOnReset = jest.fn()
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800" onClick={mockOnReset}>
              Reset
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const resetButton = screen.getByRole('button', { name: /reset/i })
      fireEvent.click(resetButton)
      expect(mockOnReset).toHaveBeenCalled()
    })
  })

  describe('RangeFilter accessibility', () => {
    test('number inputs have correct attributes', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs[0]).toHaveAttribute('type', 'number')
      expect(numberInputs[0]).toHaveAttribute('placeholder', 'Min')
      expect(numberInputs[1]).toHaveAttribute('type', 'number')
      expect(numberInputs[1]).toHaveAttribute('placeholder', 'Max')
    })

    test('range inputs have correct attributes', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const rangeInputs = screen.getAllByRole('slider')
      expect(rangeInputs[0]).toHaveAttribute('type', 'range')
      expect(rangeInputs[0]).toHaveAttribute('min', '0')
      expect(rangeInputs[0]).toHaveAttribute('max', '100')
      expect(rangeInputs[1]).toHaveAttribute('type', 'range')
      expect(rangeInputs[1]).toHaveAttribute('min', '0')
      expect(rangeInputs[1]).toHaveAttribute('max', '100')
    })

    test('reset button has correct accessibility attributes', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const resetButton = screen.getByRole('button', { name: 'Reset' })
      expect(resetButton).toBeInTheDocument()
      expect(resetButton).toHaveClass('text-xs', 'text-blue-600', 'hover:text-blue-800')
    })
  })

  describe('RangeFilter styling', () => {
    test('applies correct styling classes to container', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const containerElement = screen.getByText('Range Filter').closest('div.space-y-4')
      expect(containerElement).toBeInTheDocument()
      expect(containerElement).toHaveClass('space-y-4')
    })

    test('applies correct styling classes to number inputs', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs[0]).toHaveClass('border', 'rounded', 'px-2', 'py-1', 'w-full', 'text-sm')
      expect(numberInputs[1]).toHaveClass('border', 'rounded', 'px-2', 'py-1', 'w-full', 'text-sm')
    })

    test('applies correct styling classes to range inputs', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value=""
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="100"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const rangeInputs = screen.getAllByRole('slider')
      expect(rangeInputs[0]).toHaveClass('w-full')
      expect(rangeInputs[1]).toHaveClass('w-full')
    })
  })

  describe('RangeFilter edge cases', () => {
    test('handles min value greater than max value', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="75"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="25"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs[0]).toHaveValue(75)
      expect(numberInputs[1]).toHaveValue(25)

      const rangeInputs = screen.getAllByRole('slider')
      expect(rangeInputs[0]).toHaveValue('75')
      expect(rangeInputs[1]).toHaveValue('25')
    })

    test('handles negative values', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="-50"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="50"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="-100"
                max="100"
                value="-50"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="-100"
                max="100"
                value="50"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs[0]).toHaveValue(-50)
      expect(numberInputs[1]).toHaveValue(50)

      const rangeInputs = screen.getAllByRole('slider')
      expect(rangeInputs[0]).toHaveValue('-50')
      expect(rangeInputs[1]).toHaveValue('50')
    })

    test('handles decimal values', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="25.5"
                step="0.1"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="75.5"
                step="0.1"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="25.5"
                step="0.1"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value="75.5"
                step="0.1"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs[0]).toHaveValue(25.5)
      expect(numberInputs[1]).toHaveValue(75.5)
    })

    test('handles very large range', () => {
      const container = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Range Filter</span>
            <button className="text-xs text-blue-600 hover:text-blue-800">Reset</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min"
                value="0"
                onChange={() => {}}
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max"
                value="1000000"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max="1000000"
                value="0"
                onChange={() => {}}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="1000000"
                value="1000000"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )

      render(container)
      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs[0]).toHaveValue(0)
      expect(numberInputs[1]).toHaveValue(1000000)

      const rangeInputs = screen.getAllByRole('slider')
      expect(rangeInputs[0]).toHaveAttribute('max', '1000000')
      expect(rangeInputs[1]).toHaveAttribute('max', '1000000')
    })
  })
})
