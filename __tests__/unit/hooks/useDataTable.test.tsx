import React from 'react'
import { render, screen } from '@testing-library/react'
import { useDataTable } from '@/hooks/useDataTable'
import { ExcelData } from '@/types/excel'

function HookProbe({ data }: { data: ExcelData }) {
  const { headers, rows, totalRowCount, columnTypes, dateColumnHasTime, useVirtualScrolling } =
    useDataTable(data, undefined, 100)
  return (
    <div>
      <div>{headers.join(',')}</div>
      <div>rows:{rows.length}</div>
      <div>total:{totalRowCount}</div>
      <div>virt:{useVirtualScrolling ? 'y' : 'n'}</div>
      <div>{columnTypes.join(',')}</div>
      <div>{dateColumnHasTime.join(',')}</div>
    </div>
  )
}

describe('useDataTable', () => {
  it('derives headers, types, date-time flags and virtualization', () => {
    const data: ExcelData = {
      headers: ['A', 'B', 'C'],
      rows: Array.from({ length: 300 }).map((_, i) => [
        i,
        `2024-01-01T12:00:${(i % 60).toString().padStart(2, '0')}`,
        `str-${i}`,
      ]),
      metadata: {
        fileName: 'test.xlsx',
        sheetNames: ['Sheet1'],
        activeSheet: 'Sheet1',
        totalRows: 300,
        totalColumns: 3,
        fileSize: 1234,
        lastModified: new Date(),
        columns: [
          {
            name: 'A',
            index: 0,
            type: 'number',
            uniqueValues: [],
            uniqueCount: 0,
            hasNulls: false,
            nullCount: 0,
            sampleValues: [1, 2, 3],
          },
          {
            name: 'B',
            index: 1,
            type: 'date',
            uniqueValues: [],
            uniqueCount: 0,
            hasNulls: false,
            nullCount: 0,
            sampleValues: ['2024-01-01T12:00:00'],
          },
          {
            name: 'C',
            index: 2,
            type: 'string',
            uniqueValues: [],
            uniqueCount: 0,
            hasNulls: false,
            nullCount: 0,
            sampleValues: ['a', 'b'],
          },
        ],
      },
    }

    render(<HookProbe data={data} />)

    expect(screen.getByText('A,B,C')).toBeInTheDocument()
    expect(screen.getByText('number,date,string')).toBeInTheDocument()
    expect(screen.getByText('false,true,false')).toBeInTheDocument()
    // Virtualization kicks in for > 100 rows, sliced to 200
    expect(screen.getByText('virt:y')).toBeInTheDocument()
    expect(screen.getByText('rows:200')).toBeInTheDocument()
    expect(screen.getByText('total:300')).toBeInTheDocument()
  })
})
