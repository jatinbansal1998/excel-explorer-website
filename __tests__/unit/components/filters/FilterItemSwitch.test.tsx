import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterItemSwitch from '@/components/presentational/filters/FilterItemSwitch'
import type { FilterConfig } from '@/types/filter'
import type { ColumnInfo } from '@/types/excel'

function makeBase(filter: Partial<FilterConfig>): FilterConfig {
  return {
    id: 'f1',
    displayName: 'Test Filter',
    column: 'col',
    columnIndex: 0,
    active: false,
    operator: 'contains',
    values: {},
    type: 'search',
    ...filter,
  }
}

const columnInfo: ColumnInfo[] = [
  {
    name: 'col',
    index: 0,
    type: 'number',
    uniqueValues: [],
    uniqueCount: 0,
    hasNulls: false,
    nullCount: 0,
    sampleValues: [],
  },
]
const filteredData: (string | number | boolean | Date)[][] = []

describe('FilterItemSwitch', () => {
  const user = userEvent.setup()

  it('renders Search view for type "search" and reset works', async () => {
    const onChange = jest.fn()
    const onReset = jest.fn()
    render(
      <FilterItemSwitch
        filter={makeBase({ type: 'search', values: { query: '', caseSensitive: false, exactMatch: false } })}
        onChange={onChange}
        onReset={onReset}
        columnInfo={columnInfo}
        filteredData={filteredData}
      />,
    )
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /reset filter/i }))
    expect(onReset).toHaveBeenCalled()
  })

  it('renders Select view for type "select"', () => {
    const onChange = jest.fn()
    const onReset = jest.fn()
    render(
      <FilterItemSwitch
        filter={makeBase({ type: 'select', values: [{ value: 'A', selected: false }] })}
        onChange={onChange}
        onReset={onReset}
        columnInfo={columnInfo}
        filteredData={filteredData}
      />,
    )
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders Range view for type "range" (continuous inputs visible)', () => {
    const onChange = jest.fn()
    const onReset = jest.fn()
    render(
      <FilterItemSwitch
        filter={makeBase({ type: 'range', values: { min: 0, max: 100, currentMin: 0, currentMax: 100, mode: 'continuous' } })}
        onChange={onChange}
        onReset={onReset}
        columnInfo={columnInfo}
        filteredData={filteredData}
      />,
    )
    const inputs = screen.getAllByRole('spinbutton') // numeric inputs
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('renders Date view for type "date"', () => {
    const onChange = jest.fn()
    const onReset = jest.fn()
    const today = new Date('2024-01-01')
    render(
      <FilterItemSwitch
        filter={makeBase({ type: 'date', values: { earliest: today, latest: today, currentStart: today, currentEnd: today } })}
        onChange={onChange}
        onReset={onReset}
        columnInfo={columnInfo}
        filteredData={filteredData}
      />,
    )
    // Date inputs may not have accessible role beyond textbox across environments; query generically
    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
  })

  it('renders Boolean view for type "boolean"', () => {
    const onChange = jest.fn()
    const onReset = jest.fn()
    render(
      <FilterItemSwitch
        filter={makeBase({ type: 'boolean', values: null })}
        onChange={onChange}
        onReset={onReset}
        columnInfo={columnInfo}
        filteredData={filteredData}
      />,
    )
    expect(screen.getByText(/true/i)).toBeInTheDocument()
    expect(screen.getByText(/false/i)).toBeInTheDocument()
  })

  it('renders Null view for type "null"', () => {
    const onChange = jest.fn()
    const onReset = jest.fn()
    render(
      <FilterItemSwitch
        filter={makeBase({ type: 'null', values: false, operator: 'is_not_null' })}
        onChange={onChange}
        onReset={onReset}
        columnInfo={columnInfo}
        filteredData={filteredData}
      />,
    )
    expect(screen.getByText(/include only nulls/i)).toBeInTheDocument()
  })
})
