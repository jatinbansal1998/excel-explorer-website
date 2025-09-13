import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectFilterView from '@/components/presentational/filters/SelectFilterView'
import type { FilterConfig } from '@/types/filter'

function makeFilter(): FilterConfig {
  return {
    id: 'f1',
    displayName: 'Select Filter',
    column: 'c',
    columnIndex: 0,
    active: false,
    operator: 'equals',
    values: [
      { value: 'A', selected: false, count: 1 },
      { value: 'B', selected: false, count: 2 },
    ],
    type: 'select',
  }
}

describe('SelectFilterView', () => {
  const user = userEvent.setup()

  it('filters options by search and toggles selection', async () => {
    const onChange = jest.fn()
    render(<SelectFilterView filter={makeFilter()} onChange={onChange} />)

    const search = screen.getByRole('textbox')
    await user.type(search, 'A')
    // Only option A visible
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.queryByText('B')).not.toBeInTheDocument()

    // Toggle selection
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.pop()?.[0]
    expect(last).toHaveProperty('active', true)
    expect(Array.isArray((last.values as any))).toBe(true)
  })
})
