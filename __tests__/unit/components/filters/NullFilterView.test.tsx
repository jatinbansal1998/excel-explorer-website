import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NullFilterView from '@/components/presentational/filters/NullFilterView'
import type { FilterConfig } from '@/types/filter'

function makeFilter(operator: 'is_null' | 'is_not_null'): FilterConfig {
  return {
    id: 'f1',
    displayName: 'Null Filter',
    column: 'n',
    columnIndex: 0,
    active: false,
    operator,
    values: false,
    type: 'null',
  }
}

describe('NullFilterView', () => {
  const user = userEvent.setup()

  it('toggles include nulls checkbox and updates operator', async () => {
    const onChange = jest.fn()
    render(<NullFilterView filter={makeFilter('is_not_null')} onChange={onChange} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.pop()?.[0]
    expect(last).toHaveProperty('operator', 'is_null')
  })
})

