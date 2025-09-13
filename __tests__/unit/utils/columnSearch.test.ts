import {getCompatibleColumns, rankColumns, fuzzyMatch} from '@/utils/columnSearch'
import {ColumnInfo} from '@/types/excel'

describe('columnSearch utils', () => {
  const cols: ColumnInfo[] = [
    {name: 'price', index: 0, type: 'number', uniqueValues: [], uniqueCount: 0, hasNulls: false, nullCount: 0, sampleValues: []},
    {name: 'amount', index: 1, type: 'number', uniqueValues: [], uniqueCount: 0, hasNulls: false, nullCount: 0, sampleValues: []},
    {name: 'category', index: 2, type: 'string', uniqueValues: [], uniqueCount: 0, hasNulls: false, nullCount: 0, sampleValues: []},
    {name: 'product_title', index: 3, type: 'string', uniqueValues: [], uniqueCount: 0, hasNulls: false, nullCount: 0, sampleValues: []},
    {name: 'percent_off', index: 4, type: 'string', uniqueValues: [], uniqueCount: 0, hasNulls: false, nullCount: 0, sampleValues: []},
    {name: 'active', index: 5, type: 'boolean', uniqueValues: [], uniqueCount: 0, hasNulls: false, nullCount: 0, sampleValues: []},
    {name: 'created_at', index: 6, type: 'date', uniqueValues: [], uniqueCount: 0, hasNulls: false, nullCount: 0, sampleValues: []},
  ]

  it('getCompatibleColumns filters by chart type', () => {
    const forLine = getCompatibleColumns(cols, 'line')
    expect(forLine.map((c) => c.name)).toEqual(expect.arrayContaining(['price', 'amount', 'created_at']))
    expect(forLine.find((c) => c.name === 'category')).toBeUndefined()
  })

  it('rankColumns prioritizes exact and prefix matches', () => {
    const ranked = rankColumns(cols, 'price', 'pie')
    expect(ranked[0].name).toBe('price')

    const pref = rankColumns(cols, 'pro', 'pie')
    expect(pref[0].name).toBe('product_title')
  })

  it('rankColumns supports contains and fuzzy synonyms', () => {
    const contains = rankColumns(cols, 'gory', 'pie')
    expect(contains.find((c) => c.name === 'category')).toBeTruthy()

    // fuzzy: searching cost should match price
    const fuzzy = rankColumns(cols, 'cost', 'pie')
    expect(fuzzy.find((c) => c.name === 'price')).toBeTruthy()
    expect(fuzzyMatch('price', 'cost')).toBe(true)
  })

  it('numeric boost for pie when no search term', () => {
    const ranked = rankColumns(cols, '', 'pie')
    expect(ranked[0].type).toBe('number')
  })
})

