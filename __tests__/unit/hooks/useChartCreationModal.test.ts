import {act, renderHook} from '@testing-library/react'
import {useChartCreationModal} from '@/hooks/useChartCreationModal'
import {ColumnInfo, ExcelData} from '@/types/excel'

describe('useChartCreationModal', () => {
  const columnInfo: ColumnInfo[] = [
    {
      name: 'price',
      index: 0,
      type: 'number',
      uniqueValues: [100, 200, 300],
      uniqueCount: 3,
      hasNulls: false,
      nullCount: 0,
      sampleValues: [100, 200, 300],
    },
    {
      name: 'category',
      index: 1,
      type: 'string',
      uniqueValues: ['A', 'B'],
      uniqueCount: 2,
      hasNulls: false,
      nullCount: 0,
      sampleValues: ['A', 'B'],
    },
  ]

  const filteredData: ExcelData['rows'] = [
    [100, 'A'],
    [200, 'B'],
    [300, 'A'],
  ]

  it('provides available chart types filtered by columns', () => {
    const {result} = renderHook(() => useChartCreationModal({columnInfo, filteredData}))
    // Should include pie, bar, doughnut, line (has number), but not scatter (needs 2 numbers)
    const types = result.current.availableChartTypes.map((c) => c.type)
    expect(types).toEqual(expect.arrayContaining(['pie', 'bar', 'doughnut', 'line']))
    expect(types).not.toContain('scatter')
  })

  it('derives available aggregations per type', () => {
    const {result} = renderHook(() => useChartCreationModal({columnInfo, filteredData}))
    // default is pie
    const aggs = result.current.availableAggregations.map((a) => a.type)
    expect(aggs).toEqual(['count', 'sum', 'average'])
  })

  it('computes shouldShowRangeEditor and defaultTitle correctly', () => {
    const {result} = renderHook(() => useChartCreationModal({columnInfo, filteredData}))
    act(() => {
      result.current.onChangeType('pie')
      result.current.setDataColumn('price')
      result.current.setAggregation('count')
    })
    expect(result.current.shouldShowRangeEditor).toBe(true)
    expect(result.current.defaultTitle).toContain('Pie Chart - price')
  })

  it('computes and memoizes sampleValues only when needed', () => {
    const {result} = renderHook(() => useChartCreationModal({columnInfo, filteredData}))
    act(() => {
      result.current.onChangeType('pie')
      result.current.setDataColumn('price')
      result.current.setAggregation('count')
    })
    const first = result.current.sampleValues
    expect(first).toEqual([100, 200, 300])

    // unrelated change should not change reference
    act(() => result.current.setTitle('x'))
    const second = result.current.sampleValues
    expect(second).toBe(first)

    // changing dataColumn toggles dependency -> recompute
    act(() => result.current.setDataColumn(''))
    const third = result.current.sampleValues
    expect(third).not.toBe(first)
    expect(third).toEqual([])
  })

  it('builds payload and resets form', () => {
    const {result} = renderHook(() => useChartCreationModal({columnInfo, filteredData}))
    act(() => {
      result.current.onChangeType('pie')
      result.current.setDataColumn('category')
      result.current.setAggregation('count')
    })

    const payload = result.current.buildPayload()
    expect(payload).toMatchObject({
      type: 'pie',
      dataColumn: 'category',
      aggregation: 'count',
      title: expect.any(String),
    })

    act(() => result.current.resetForm())
    expect(result.current.dataColumn).toBe('')
    expect(result.current.title).toBe('')
  })
})

