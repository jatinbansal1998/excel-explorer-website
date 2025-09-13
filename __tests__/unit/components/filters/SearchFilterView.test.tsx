import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchFilterView from '@/components/presentational/filters/SearchFilterView'
import type { FilterConfig } from '@/types/filter'

function makeFilter(): FilterConfig {
  return {
    id: 'f1',
    displayName: 'Search Filter',
    column: 'col',
    columnIndex: 0,
    active: false,
    operator: 'contains',
    values: { query: '', caseSensitive: false, exactMatch: false },
    type: 'search',
  }
}

describe('SearchFilterView', () => {
  const user = userEvent.setup()

  it('updates query and toggles options with correct operator', async () => {
    const onChange = jest.fn()
    render(<SearchFilterView filter={makeFilter()} onChange={onChange} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'abc')
    expect(onChange).toHaveBeenCalled()

    await user.click(screen.getByText(/exact match/i))
    const last = onChange.mock.calls.pop()?.[0]
    expect(last).toHaveProperty('operator', 'equals')
    expect((last.values as any).exactMatch).toBe(true)
  })
})
