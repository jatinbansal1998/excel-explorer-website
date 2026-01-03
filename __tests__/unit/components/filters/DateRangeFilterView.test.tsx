import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import DateRangeFilterView from '@/components/presentational/filters/DateRangeFilterView'
import type { FilterConfig } from '@/types/filter'

function makeFilter(): FilterConfig {
  const start = new Date('2024-01-01')
  const end = new Date('2024-01-31')
  return {
    id: 'f1',
    displayName: 'Date Filter',
    column: 'dateCol',
    columnIndex: 0,
    active: false,
    operator: 'between',
    values: { earliest: start, latest: end, currentStart: start, currentEnd: end },
    type: 'date',
  }
}

describe('DateRangeFilterView', () => {
  it('updates date values and calls onChange with operator between', async () => {
    const onChange = jest.fn()
    render(<DateRangeFilterView filter={makeFilter()} onChange={onChange} />)

    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
    const startInput = dateInputs[0] as HTMLInputElement

    // Simulate change directly to avoid jsdom date input quirks
    fireEvent.change(startInput, { target: { value: '2024-02-01' } })

    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.pop()?.[0]
    expect(last).toHaveProperty('operator', 'between')
  })
})
