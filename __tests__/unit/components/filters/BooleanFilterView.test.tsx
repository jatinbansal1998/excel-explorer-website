import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BooleanFilterView from '@/components/presentational/filters/BooleanFilterView'
import type { FilterConfig } from '@/types/filter'

function makeFilter(): FilterConfig {
  return {
    id: 'f1',
    displayName: 'Boolean Filter',
    column: 'b',
    columnIndex: 0,
    active: false,
    operator: 'equals',
    values: null,
    type: 'boolean',
  }
}

describe('BooleanFilterView', () => {
  const user = userEvent.setup()

  it('selects True and calls onChange with equals', async () => {
    const onChange = jest.fn()
    render(<BooleanFilterView filter={makeFilter()} onChange={onChange} />)

    await user.click(screen.getByText(/true/i))
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.pop()?.[0]
    expect(last).toHaveProperty('operator', 'equals')
    expect((last.values as any)).toBe(true)
  })
})

