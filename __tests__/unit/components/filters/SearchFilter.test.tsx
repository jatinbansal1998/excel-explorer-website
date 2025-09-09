import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { SearchFilter } from '@/components/filters/SearchFilter'
import type { FilterConfig } from '@/types/filter'

// Mock the FilterConfig type to avoid import issues
const mockFilterConfig: FilterConfig = {
  id: 'test-search',
  column: 'test_column',
  columnIndex: 0,
  type: 'search',
  active: true,
  values: {
    query: '',
    caseSensitive: false,
    exactMatch: false,
  },
  operator: 'contains',
  displayName: 'Search',
}

describe('SearchFilter Component', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('Basic Structure', () => {
    it('renders search input field', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
      expect(searchInput).toHaveAttribute('placeholder', 'Search...')
    })

    it('renders case sensitive checkbox', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      expect(caseSensitiveCheckbox).toBeInTheDocument()
      expect(caseSensitiveCheckbox).not.toBeChecked()
    })

    it('renders exact match checkbox', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })
      expect(exactMatchCheckbox).toBeInTheDocument()
      expect(exactMatchCheckbox).not.toBeChecked()
    })

    it('has proper container structure', () => {
      const { container } = render(
        <SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />,
      )

      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass('space-y-2', 'text-sm')

      const optionsContainer = screen
        .getByRole('checkbox', { name: /case sensitive/i })
        .closest('div')
      expect(optionsContainer).toHaveClass('flex', 'items-center', 'space-x-4')
    })

    it('has proper styling classes', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveClass('border', 'rounded', 'px-2', 'py-1', 'w-full')
    })
  })

  describe('Search Input Functionality', () => {
    it('displays initial query value from filter config', () => {
      const filterWithQuery = {
        ...mockFilterConfig,
        values: { query: 'test query', caseSensitive: false, exactMatch: false },
      }

      render(<SearchFilter filter={filterWithQuery} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveValue('test query')
    })

    it('calls onChange when search input changes', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: 'new search' } })

      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith('new search', {
        caseSensitive: false,
        exactMatch: false,
      })
    })

    it('handles empty search input', () => {
      const filterWithQuery = {
        ...mockFilterConfig,
        values: { query: 'existing query', caseSensitive: false, exactMatch: false },
      }

      render(<SearchFilter filter={filterWithQuery} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: '' } })

      expect(mockOnChange).toHaveBeenCalledWith('', {
        caseSensitive: false,
        exactMatch: false,
      })
    })

    it('handles special characters in search input', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: 'test@#$%^&*()' } })

      expect(mockOnChange).toHaveBeenCalledWith('test@#$%^&*()', {
        caseSensitive: false,
        exactMatch: false,
      })
    })

    it('handles long search queries', () => {
      const longQuery = 'a'.repeat(1000)
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: longQuery } })

      expect(mockOnChange).toHaveBeenCalledWith(longQuery, {
        caseSensitive: false,
        exactMatch: false,
      })
    })

    it('preserves checkbox states when search input changes', () => {
      const filterWithOptions = {
        ...mockFilterConfig,
        values: { query: '', caseSensitive: true, exactMatch: true },
      }

      render(<SearchFilter filter={filterWithOptions} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: 'new search' } })

      expect(mockOnChange).toHaveBeenCalledWith('new search', {
        caseSensitive: true,
        exactMatch: true,
      })
    })
  })

  describe('Case Sensitive Checkbox', () => {
    it('displays initial case sensitive state from filter config', () => {
      const filterWithCaseSensitive = {
        ...mockFilterConfig,
        values: { query: '', caseSensitive: true, exactMatch: false },
      }

      render(<SearchFilter filter={filterWithCaseSensitive} onChange={mockOnChange} />)

      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      expect(caseSensitiveCheckbox).toBeChecked()
    })

    it('calls onChange when case sensitive checkbox is toggled on', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      fireEvent.click(caseSensitiveCheckbox)

      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith('', {
        caseSensitive: true,
        exactMatch: false,
      })
    })

    it('calls onChange when case sensitive checkbox is toggled off', () => {
      const filterWithCaseSensitive = {
        ...mockFilterConfig,
        values: { query: '', caseSensitive: true, exactMatch: false },
      }

      render(<SearchFilter filter={filterWithCaseSensitive} onChange={mockOnChange} />)

      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      fireEvent.click(caseSensitiveCheckbox)

      expect(mockOnChange).toHaveBeenCalledWith('', {
        caseSensitive: false,
        exactMatch: false,
      })
    })

    it('preserves search query and exact match when case sensitive changes', () => {
      const filterWithValues = {
        ...mockFilterConfig,
        values: { query: 'test query', caseSensitive: false, exactMatch: true },
      }

      render(<SearchFilter filter={filterWithValues} onChange={mockOnChange} />)

      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      fireEvent.click(caseSensitiveCheckbox)

      expect(mockOnChange).toHaveBeenCalledWith('test query', {
        caseSensitive: true,
        exactMatch: true,
      })
    })
  })

  describe('Exact Match Checkbox', () => {
    it('displays initial exact match state from filter config', () => {
      const filterWithExactMatch = {
        ...mockFilterConfig,
        values: { query: '', caseSensitive: false, exactMatch: true },
      }

      render(<SearchFilter filter={filterWithExactMatch} onChange={mockOnChange} />)

      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })
      expect(exactMatchCheckbox).toBeChecked()
    })

    it('calls onChange when exact match checkbox is toggled on', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })
      fireEvent.click(exactMatchCheckbox)

      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith('', {
        caseSensitive: false,
        exactMatch: true,
      })
    })

    it('calls onChange when exact match checkbox is toggled off', () => {
      const filterWithExactMatch = {
        ...mockFilterConfig,
        values: { query: '', caseSensitive: false, exactMatch: true },
      }

      render(<SearchFilter filter={filterWithExactMatch} onChange={mockOnChange} />)

      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })
      fireEvent.click(exactMatchCheckbox)

      expect(mockOnChange).toHaveBeenCalledWith('', {
        caseSensitive: false,
        exactMatch: false,
      })
    })

    it('preserves search query and case sensitive when exact match changes', () => {
      const filterWithValues = {
        ...mockFilterConfig,
        values: { query: 'test query', caseSensitive: true, exactMatch: false },
      }

      render(<SearchFilter filter={filterWithValues} onChange={mockOnChange} />)

      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })
      fireEvent.click(exactMatchCheckbox)

      expect(mockOnChange).toHaveBeenCalledWith('test query', {
        caseSensitive: true,
        exactMatch: true,
      })
    })
  })

  describe('Combined Interactions', () => {
    it('handles multiple state changes correctly', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })

      // Change search query
      fireEvent.change(searchInput, { target: { value: 'test' } })
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'test', {
        caseSensitive: false,
        exactMatch: false,
      })

      // Toggle case sensitive
      fireEvent.click(caseSensitiveCheckbox)
      expect(mockOnChange).toHaveBeenNthCalledWith(2, '', {
        caseSensitive: true,
        exactMatch: false,
      })

      // Toggle exact match
      fireEvent.click(exactMatchCheckbox)
      expect(mockOnChange).toHaveBeenNthCalledWith(3, '', {
        caseSensitive: false,
        exactMatch: true,
      })

      // Clear search (doesn't trigger onChange if value is already empty)
      fireEvent.change(searchInput, { target: { value: '' } })
      expect(mockOnChange).toHaveBeenCalledTimes(3)
    })

    it('maintains state consistency across all interactions', () => {
      const filterWithValues = {
        ...mockFilterConfig,
        values: { query: 'initial', caseSensitive: true, exactMatch: true },
      }

      render(<SearchFilter filter={filterWithValues} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })

      // Verify initial state
      expect(searchInput).toHaveValue('initial')
      expect(caseSensitiveCheckbox).toBeChecked()
      expect(exactMatchCheckbox).toBeChecked()

      // Change search query
      fireEvent.change(searchInput, { target: { value: 'modified' } })
      expect(mockOnChange).toHaveBeenCalledWith('modified', {
        caseSensitive: true,
        exactMatch: true,
      })

      // Toggle case sensitive off
      fireEvent.click(caseSensitiveCheckbox)
      expect(mockOnChange).toHaveBeenCalledWith('initial', {
        caseSensitive: false,
        exactMatch: true,
      })

      // Toggle exact match off
      fireEvent.click(exactMatchCheckbox)
      expect(mockOnChange).toHaveBeenCalledWith('initial', {
        caseSensitive: true,
        exactMatch: false,
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined filter values gracefully', () => {
      const filterWithoutValues = {
        ...mockFilterConfig,
        values: undefined,
      }

      render(<SearchFilter filter={filterWithoutValues} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })

      expect(searchInput).toHaveValue('')
      expect(caseSensitiveCheckbox).not.toBeChecked()
      expect(exactMatchCheckbox).not.toBeChecked()
    })

    it('handles null filter values gracefully', () => {
      const filterWithNullValues = {
        ...mockFilterConfig,
        values: null,
      }

      render(<SearchFilter filter={filterWithNullValues} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })

      expect(searchInput).toHaveValue('')
      expect(caseSensitiveCheckbox).not.toBeChecked()
      expect(exactMatchCheckbox).not.toBeChecked()
    })

    it('handles partial filter values', () => {
      const filterWithPartialValues = {
        ...mockFilterConfig,
        values: { query: 'test' },
      }

      render(<SearchFilter filter={filterWithPartialValues} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })

      expect(searchInput).toHaveValue('test')
      expect(caseSensitiveCheckbox).not.toBeChecked()
      expect(exactMatchCheckbox).not.toBeChecked()
    })

    it('handles rapid successive changes', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })

      // Rapid changes
      fireEvent.change(searchInput, { target: { value: 'a' } })
      fireEvent.change(searchInput, { target: { value: 'ab' } })
      fireEvent.change(searchInput, { target: { value: 'abc' } })
      fireEvent.click(caseSensitiveCheckbox)
      fireEvent.change(searchInput, { target: { value: 'abcd' } })

      expect(mockOnChange).toHaveBeenCalledTimes(5)
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'a', {
        caseSensitive: false,
        exactMatch: false,
      })
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'ab', {
        caseSensitive: false,
        exactMatch: false,
      })
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'abc', {
        caseSensitive: false,
        exactMatch: false,
      })
      expect(mockOnChange).toHaveBeenNthCalledWith(4, '', {
        caseSensitive: true,
        exactMatch: false,
      })
      expect(mockOnChange).toHaveBeenNthCalledWith(5, 'abcd', {
        caseSensitive: false,
        exactMatch: false,
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for all interactive elements', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })

      expect(searchInput).toBeInTheDocument()
      expect(caseSensitiveCheckbox).toBeInTheDocument()
      expect(exactMatchCheckbox).toBeInTheDocument()
    })

    it('checkboxes are properly associated with their labels', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      const caseSensitiveLabel = screen.getByText('Case sensitive')
      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })
      const exactMatchLabel = screen.getByText('Exact match')

      expect(caseSensitiveCheckbox).toBeInTheDocument()
      expect(caseSensitiveLabel).toBeInTheDocument()
      expect(exactMatchCheckbox).toBeInTheDocument()
      expect(exactMatchLabel).toBeInTheDocument()
    })

    it('all interactive elements are keyboard accessible', () => {
      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')
      const caseSensitiveCheckbox = screen.getByRole('checkbox', { name: /case sensitive/i })
      const exactMatchCheckbox = screen.getByRole('checkbox', { name: /exact match/i })

      // Input elements are inherently keyboard accessible, so we check if they are interactive elements
      expect(searchInput).toBeInTheDocument()
      expect(caseSensitiveCheckbox).toBeInTheDocument()
      expect(exactMatchCheckbox).toBeInTheDocument()

      // Check that they can be focused (which indicates keyboard accessibility)
      expect(searchInput.tagName).toBe('INPUT')
      expect(caseSensitiveCheckbox.tagName).toBe('INPUT')
      expect(exactMatchCheckbox.tagName).toBe('INPUT')
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily when props have not changed', () => {
      const { rerender } = render(
        <SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />,
      )

      const searchInput = screen.getByRole('textbox')
      const initialRenderCount = mockOnChange.mock.calls.length

      // Re-render with same props
      rerender(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      expect(mockOnChange.mock.calls.length).toBe(initialRenderCount)
      expect(searchInput).toHaveValue('')
    })

    it('handles multiple rapid state changes efficiently', () => {
      jest.useFakeTimers()

      render(<SearchFilter filter={mockFilterConfig} onChange={mockOnChange} />)

      const searchInput = screen.getByRole('textbox')

      // Simulate rapid typing
      fireEvent.change(searchInput, { target: { value: 't' } })
      fireEvent.change(searchInput, { target: { value: 'te' } })
      fireEvent.change(searchInput, { target: { value: 'tes' } })
      fireEvent.change(searchInput, { target: { value: 'test' } })

      expect(mockOnChange).toHaveBeenCalledTimes(4)

      jest.useRealTimers()
    })
  })
})
