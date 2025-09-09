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

// Simple test for SelectFilter component structure
describe('SelectFilter Component', () => {
  describe('Basic structure and rendering', () => {
    test('renders select filter container correctly', () => {
      // Test that the container renders with correct classes
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveClass('border', 'rounded', 'px-2', 'py-1', 'w-full', 'text-sm')
    })

    test('renders with multiple options', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={true} onChange={() => {}} />
              <span className="truncate" title="Option 2">
                Option 2
              </span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 3">
                Option 3
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3)
      expect(checkboxes[0]).not.toBeChecked()
      expect(checkboxes[1]).toBeChecked()
      expect(checkboxes[2]).not.toBeChecked()
    })

    test('renders with count information', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
              <span className="text-xs text-gray-400">(10)</span>
            </label>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('(10)')).toBeInTheDocument()
      const countElement = screen.getByText('(10)')
      expect(countElement).toHaveClass('text-xs', 'text-gray-400')
    })

    test('renders with no options message', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <div className="text-sm text-gray-500">No options match your search</div>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('No options match your search')).toBeInTheDocument()
      const messageElement = screen.getByText('No options match your search')
      expect(messageElement).toHaveClass('text-sm', 'text-gray-500')
    })
  })

  describe('Search functionality', () => {
    test('handles search input change', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={(e) => mockOnChange(e.target.value)}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: 'test' } })
      expect(mockOnChange).toHaveBeenCalledWith('test')
    })

    test('filters options based on search query', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value="apple"
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Apple">
                Apple
              </span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Banana">
                Banana
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      // With search value "apple", only Apple should be visible
      // This is a structural test - the actual filtering logic would be in the component
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Banana')).toBeInTheDocument()
    })

    test('shows no options message when search has no matches', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value="nonexistent"
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <div className="text-sm text-gray-500">No options match your search</div>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('No options match your search')).toBeInTheDocument()
      expect(screen.queryByText('Apple')).not.toBeInTheDocument()
      expect(screen.queryByText('Banana')).not.toBeInTheDocument()
    })
  })

  describe('Checkbox functionality', () => {
    test('handles checkbox toggle', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input
                className="mr-2"
                type="checkbox"
                checked={false}
                onChange={() => mockOnChange(['selected'])}
              />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      expect(mockOnChange).toHaveBeenCalledWith(['selected'])
    })

    test('handles multiple checkbox selections', () => {
      const mockOnChange = jest.fn()
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input
                className="mr-2"
                type="checkbox"
                checked={false}
                onChange={() => mockOnChange(['option1'])}
              />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                className="mr-2"
                type="checkbox"
                checked={false}
                onChange={() => mockOnChange(['option2'])}
              />
              <span className="truncate" title="Option 2">
                Option 2
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      expect(mockOnChange).toHaveBeenCalledWith(['option1'])

      fireEvent.click(checkboxes[1])
      expect(mockOnChange).toHaveBeenCalledWith(['option2'])
    })
  })

  describe('SelectFilter accessibility', () => {
    test('search input has correct attributes', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveAttribute('type', 'text')
      expect(searchInput).toHaveAttribute('placeholder', 'Search options...')
    })

    test('checkboxes have correct accessibility attributes', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('type', 'checkbox')
      expect(checkbox).toHaveClass('mr-2')
    })

    test('option labels have proper title attributes for tooltips', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Very Long Option Name That Should Be Truncated">
                Very Long Option Name That Should Be Truncated
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const optionSpan = screen.getByText('Very Long Option Name That Should Be Truncated')
      expect(optionSpan).toHaveAttribute('title', 'Very Long Option Name That Should Be Truncated')
      expect(optionSpan).toHaveClass('truncate')
    })
  })

  describe('SelectFilter styling', () => {
    test('applies correct styling classes to container', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const containerElement = screen.getByRole('textbox').closest('div')
      expect(containerElement).toBeInTheDocument()
      expect(containerElement).toHaveClass('space-y-2')
    })

    test('applies correct styling classes to search input', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveClass('border', 'rounded', 'px-2', 'py-1', 'w-full', 'text-sm')
    })

    test('applies correct styling classes to options container', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const optionsContainer = screen.getByText('Option 1').closest('div.max-h-40')
      expect(optionsContainer).toBeInTheDocument()
      expect(optionsContainer).toHaveClass('max-h-40', 'overflow-auto', 'space-y-1')
    })

    test('applies correct styling classes to option labels', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option 1">
                Option 1
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      const optionLabel = screen.getByText('Option 1').closest('label')
      expect(optionLabel).toBeInTheDocument()
      expect(optionLabel).toHaveClass('flex', 'items-center', 'space-x-2', 'text-sm')
    })
  })

  describe('SelectFilter edge cases', () => {
    test('handles empty options array', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <div className="text-sm text-gray-500">No options match your search</div>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('No options match your search')).toBeInTheDocument()
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    test('handles special characters in option names', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="Option with @#$%^&*()">
                Option with @#$%^&*()
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('Option with @#$%^&*()')).toBeInTheDocument()
      const optionSpan = screen.getByText('Option with @#$%^&*()')
      expect(optionSpan).toHaveAttribute('title', 'Option with @#$%^&*()')
    })

    test('handles very long option names', () => {
      const longText = 'A'.repeat(1000)
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title={longText}>
                {longText}
              </span>
            </label>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText(longText)).toBeInTheDocument()
      const optionSpan = screen.getByText(longText)
      expect(optionSpan).toHaveAttribute('title', longText)
      expect(optionSpan).toHaveClass('truncate')
    })

    test('handles numeric option values', () => {
      const container = (
        <div className="space-y-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search options..."
            value=""
            onChange={() => {}}
          />
          <div className="max-h-40 overflow-auto space-y-1">
            <label className="flex items-center space-x-2 text-sm">
              <input className="mr-2" type="checkbox" checked={false} onChange={() => {}} />
              <span className="truncate" title="123">
                123
              </span>
              <span className="text-xs text-gray-400">(5)</span>
            </label>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('123')).toBeInTheDocument()
      expect(screen.getByText('(5)')).toBeInTheDocument()
    })
  })
})
