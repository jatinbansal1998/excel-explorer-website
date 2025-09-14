import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTableView } from '@/components/presentational/data/DataTableView'

describe('DataTableView (presentational)', () => {
  const headers = ['A', 'B']
  const rows = [
    [1, '2024-01-01T12:00:00'],
    [2, '2024-01-02T12:00:00'],
  ]
  const columnTypes: ('number' | 'date')[] = ['number', 'date']
  const dateColumnHasTime = [false, true]
  const fileMeta = { fileName: 'file.xlsx', activeSheet: 'Sheet1' }

  function setup(extra?: Partial<React.ComponentProps<typeof DataTableView>>) {
    const onSort = jest.fn()
    const onDeleteColumn = jest.fn()
    const onToggleDataTypes = jest.fn()
    const formatCell = jest.fn().mockImplementation((v: unknown) => `formatted:${String(v ?? '')}`)

    render(
      <DataTableView
        headers={headers}
        rows={rows}
        totalRowCount={999}
        columnTypes={columnTypes}
        dateColumnHasTime={dateColumnHasTime}
        useVirtualScrolling={true}
        fileMeta={fileMeta}
        showDataTypes={false}
        sortColumn={extra?.sortColumn}
        sortDirection={extra?.sortDirection}
        onSort={onSort}
        onDeleteColumn={onDeleteColumn}
        onToggleDataTypes={onToggleDataTypes}
        formatCell={formatCell}
        {...extra}
      />,
    )

    return { onSort, onDeleteColumn, onToggleDataTypes, formatCell }
  }

  it('renders headers, file metadata and virtualization note', () => {
    setup()
    expect(screen.getByRole('heading', { name: /data table/i })).toBeInTheDocument()
    expect(screen.getByText('file.xlsx')).toBeInTheDocument()
    expect(screen.getByText(/Sheet: Sheet1/)).toBeInTheDocument()
    const footer = screen
      .getAllByRole('paragraph')
      .find((el) => el.textContent?.includes('Showing first 200 rows of 999 total rows'))
    expect(footer).toBeTruthy()
    // clsx conditional class applied when sort/delete handlers provided
    const firstHeader = screen.getAllByRole('columnheader')[0]
    expect(firstHeader).toHaveClass('hover:bg-gray-100')
  })

  it('renders formatted cell values', () => {
    const { formatCell } = setup()
    expect(formatCell).toHaveBeenCalled()
    expect(screen.getAllByText(/formatted:/).length).toBeGreaterThan(0)
  })

  it('triggers onSort with toggled direction', () => {
    const { onSort } = setup()
    // Click first header button by its accessible name (header title)
    const firstHeaderBtn = screen.getAllByRole('button', { name: 'A' }).slice(-1)[0]
    fireEvent.click(firstHeaderBtn)
    expect(onSort).toHaveBeenCalledWith('A', 'asc')

    // Rerender with asc selected and click again -> desc
    const { onSort: onSort2 } = setup({ sortColumn: 'A', sortDirection: 'asc' })
    const firstHeaderBtn2 = screen.getAllByRole('button', { name: 'A' }).slice(-1)[0]
    fireEvent.click(firstHeaderBtn2)
    expect(onSort2).toHaveBeenCalledWith('A', 'desc')
  })

  it('triggers onDeleteColumn with index', () => {
    const { onDeleteColumn } = setup()
    const deleteButtons = screen.getAllByRole('button', { name: /delete column/i })
    fireEvent.click(deleteButtons[1])
    expect(onDeleteColumn).toHaveBeenCalledWith(1)
  })

  it('toggles data types checkbox', () => {
    const { onToggleDataTypes } = setup({ showDataTypes: false })
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(onToggleDataTypes).toHaveBeenCalledWith(true)
  })
})
