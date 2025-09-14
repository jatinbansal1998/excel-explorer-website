import { FilterGenerator } from '@/services/filterGenerator'
import { ColumnInfo, DataType } from '@/types/excel'
import {
  DateRangeFilter,
  FilterConfig,
  FilterValue,
  RangeFilter,
  SearchFilter,
} from '@/types/filter'
import { numericRangeGenerator } from '@/services/numericRangeGenerator'

// Mock the numericRangeGenerator
jest.mock('@/services/numericRangeGenerator', () => ({
  numericRangeGenerator: {
    generateDefaultRanges: jest.fn(),
  },
}))

describe('FilterGenerator', () => {
  let filterGenerator: FilterGenerator

  beforeEach(() => {
    filterGenerator = new FilterGenerator()
    jest.clearAllMocks()
  })

  describe('generateFilters', () => {
    it('should generate filters for all columns', () => {
      const columns: ColumnInfo[] = [
        createMockColumn('stringCol', 0, 'string'),
        createMockColumn('numberCol', 1, 'number'),
        createMockColumn('dateCol', 2, 'date'),
        createMockColumn('booleanCol', 3, 'boolean'),
      ]

      const filters = filterGenerator.generateFilters(columns)

      expect(filters).toHaveLength(4) // One filter per column
      expect(filters.every((f) => f.column && f.columnIndex !== undefined)).toBe(true)
    })

    it('should generate null filters for columns with nulls', () => {
      const columns: ColumnInfo[] = [
        createMockColumn('colWithNulls', 0, 'string', { hasNulls: true }),
      ]

      const filters = filterGenerator.generateFilters(columns)

      expect(filters).toHaveLength(2) // Main filter + null filter
      expect(filters.some((f) => f.type === 'null')).toBe(true)
      expect(filters.some((f) => f.type === 'search')).toBe(true)
    })

    it('should not generate null filters for columns without nulls', () => {
      const columns: ColumnInfo[] = [
        createMockColumn('colWithoutNulls', 0, 'string', { hasNulls: false }),
      ]

      const filters = filterGenerator.generateFilters(columns)

      expect(filters).toHaveLength(1) // Only main filter
      expect(filters.some((f) => f.type === 'null')).toBe(false)
    })
  })

  describe('generateStringFilter', () => {
    it('should generate select filter for low cardinality string columns', () => {
      const column = createMockColumn('lowCardinality', 0, 'string', {
        uniqueCount: 50,
        uniqueValues: ['value1', 'value2', 'value3'],
      })

      const filter = filterGenerator['generateStringFilter'](column) as FilterConfig

      expect(filter.type).toBe('select')
      expect(filter.operator).toBe('equals')
      expect(Array.isArray(filter.values)).toBe(true)
      expect((filter.values as FilterValue[]).length).toBe(3)
      expect(
        (filter.values as FilterValue[]).every(
          (v) => v.hasOwnProperty('value') && v.hasOwnProperty('selected'),
        ),
      ).toBe(true)
    })

    it('should generate search filter for high cardinality string columns', () => {
      const column = createMockColumn('highCardinality', 0, 'string', {
        uniqueCount: 1500,
        uniqueValues: Array.from({ length: 1500 }, (_, i) => `value${i}`),
      })

      const filter = filterGenerator['generateStringFilter'](column) as FilterConfig

      expect(filter.type).toBe('search')
      expect(filter.operator).toBe('contains')
      expect(typeof filter.values).toBe('object')
      expect((filter.values as SearchFilter).query).toBe('')
      expect((filter.values as SearchFilter).caseSensitive).toBe(false)
      expect((filter.values as SearchFilter).exactMatch).toBe(false)
    })

    it('should generate search filter for string columns without unique values', () => {
      const column = createMockColumn('noUniqueValues', 0, 'string', {
        uniqueCount: 0,
        uniqueValues: [],
      })

      const filter = filterGenerator['generateStringFilter'](column) as FilterConfig

      expect(filter.type).toBe('search')
      expect(filter.operator).toBe('contains')
    })

    it('should limit select filter values to 1000', () => {
      const column = createMockColumn('limitedSelect', 0, 'string', {
        uniqueCount: 1000, // Should be <= 1000 to trigger select filter
        uniqueValues: Array.from({ length: 1500 }, (_, i) => `value${i}`),
      })

      const filter = filterGenerator['generateStringFilter'](column) as FilterConfig

      expect(filter.type).toBe('select')
      expect((filter.values as FilterValue[]).length).toBe(1000)
    })
  })

  describe('generateNumericFilter', () => {
    beforeEach(() => {
      // Mock the numericRangeGenerator to return predefined ranges
      ;(numericRangeGenerator.generateDefaultRanges as jest.Mock).mockReturnValue([
        {
          id: 'range1',
          label: '0-10',
          min: 0,
          max: 10,
          includeMin: true,
          includeMax: true,
        },
        {
          id: 'range2',
          label: '10-20',
          min: 10,
          max: 20,
          includeMin: true,
          includeMax: true,
        },
      ])
    })

    it('should generate range filter with statistics', () => {
      const column = createMockColumn('numericCol', 0, 'number', {
        statistics: { min: 0, max: 100, average: 50 },
        sampleValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      })

      const filter = filterGenerator['generateNumericFilter'](column) as FilterConfig

      expect(filter.type).toBe('range')
      expect(filter.operator).toBe('between')
      expect(typeof filter.values).toBe('object')

      const rangeValues = filter.values as RangeFilter
      expect(rangeValues.min).toBe(0)
      expect(rangeValues.max).toBe(100)
      expect(rangeValues.currentMin).toBe(0)
      expect(rangeValues.currentMax).toBe(100)
      expect(rangeValues.mode).toBe('continuous')
      expect(rangeValues.ranges).toHaveLength(2)
      expect(rangeValues.selectedRangeIds).toEqual(['range1', 'range2'])
    })

    it('should generate range filter without statistics', () => {
      const column = createMockColumn('numericColNoStats', 0, 'number', {
        statistics: undefined,
      })

      const filter = filterGenerator['generateNumericFilter'](column) as FilterConfig

      expect(filter.type).toBe('range')

      const rangeValues = filter.values as RangeFilter
      expect(rangeValues.min).toBe(0)
      expect(rangeValues.max).toBe(0)
      expect(rangeValues.currentMin).toBe(0)
      expect(rangeValues.currentMax).toBe(0)
    })

    it('should not add ranges when insufficient sample values', () => {
      const column = createMockColumn('numericColFewSamples', 0, 'number', {
        statistics: { min: 0, max: 100 },
        sampleValues: [1, 2, 3], // Less than 5 samples
      })

      const filter = filterGenerator['generateNumericFilter'](column) as FilterConfig

      const rangeValues = filter.values as RangeFilter
      expect(rangeValues.ranges).toBeUndefined()
      expect(rangeValues.selectedRangeIds).toBeUndefined()
    })

    it('should not add ranges when no valid numeric samples', () => {
      const column = createMockColumn('numericColInvalidSamples', 0, 'number', {
        statistics: { min: 0, max: 100 },
        sampleValues: [null, undefined, 'invalid', NaN, Infinity],
      })

      const filter = filterGenerator['generateNumericFilter'](column) as FilterConfig

      const rangeValues = filter.values as RangeFilter
      expect(rangeValues.ranges).toBeUndefined()
      expect(rangeValues.selectedRangeIds).toBeUndefined()
    })

    it('should not call numericRangeGenerator when ranges are not needed', () => {
      const column = createMockColumn('numericColFewSamples', 0, 'number', {
        statistics: { min: 0, max: 100 },
        sampleValues: [1, 2, 3], // Less than 5 samples
      })

      filterGenerator['generateNumericFilter'](column)

      expect(numericRangeGenerator.generateDefaultRanges).not.toHaveBeenCalled()
    })
  })

  describe('generateDateFilter', () => {
    it('should generate date filter with Date statistics', () => {
      const minDate = new Date('2023-01-01')
      const maxDate = new Date('2023-12-31')

      const column = createMockColumn('dateCol', 0, 'date', {
        statistics: { min: minDate, max: maxDate },
      })

      const filter = filterGenerator['generateDateFilter'](column) as FilterConfig

      expect(filter.type).toBe('date')
      expect(filter.operator).toBe('between')
      expect(typeof filter.values).toBe('object')

      const dateValues = filter.values as DateRangeFilter
      expect(dateValues.earliest).toEqual(minDate)
      expect(dateValues.latest).toEqual(maxDate)
      expect(dateValues.currentStart).toEqual(minDate)
      expect(dateValues.currentEnd).toEqual(maxDate)
    })

    it('should generate date filter with string statistics', () => {
      const column = createMockColumn('dateColStringStats', 0, 'date', {
        statistics: { min: '2023-01-01' as any, max: '2023-12-31' as any },
      })

      const filter = filterGenerator['generateDateFilter'](column) as FilterConfig

      const dateValues = filter.values as DateRangeFilter
      expect(dateValues.earliest).toEqual(new Date('2023-01-01'))
      expect(dateValues.latest).toEqual(new Date('2023-12-31'))
    })

    it('should generate date filter without statistics', () => {
      const column = createMockColumn('dateColNoStats', 0, 'date', {
        statistics: undefined,
      })

      const filter = filterGenerator['generateDateFilter'](column) as FilterConfig

      const dateValues = filter.values as DateRangeFilter
      expect(dateValues.earliest).toEqual(new Date(0))
      expect(dateValues.latest).toBeInstanceOf(Date)
      expect(dateValues.currentStart).toEqual(new Date(0))
      expect(dateValues.currentEnd).toBeInstanceOf(Date)
    })
  })

  describe('generateBooleanFilter', () => {
    it('should generate boolean filter', () => {
      const column = createMockColumn('booleanCol', 0, 'boolean')

      const filter = filterGenerator['generateBooleanFilter'](column) as FilterConfig

      expect(filter.type).toBe('boolean')
      expect(filter.operator).toBe('equals')
      expect(filter.values).toBe(null)
    })
  })

  describe('generateGenericFilter', () => {
    it('should generate search filter for generic types', () => {
      const column = createMockColumn('genericCol', 0, 'mixed')

      const filter = filterGenerator['generateGenericFilter'](column) as FilterConfig

      expect(filter.type).toBe('search')
      expect(filter.operator).toBe('contains')
    })
  })

  describe('generateNullFilter', () => {
    it('should generate null filter', () => {
      const column = createMockColumn('colWithNulls', 0, 'string')

      const filter = filterGenerator['generateNullFilter'](column) as FilterConfig

      expect(filter.type).toBe('null')
      expect(filter.operator).toBe('is_null')
      expect(filter.values).toBe(true)
      expect(filter.displayName).toBe('colWithNulls (Nulls)')
      expect(filter.id).toContain('null')
    })
  })

  describe('extractUniqueValues', () => {
    it('should extract unique values with counts', () => {
      const data = [
        ['apple', 'banana'],
        ['apple', 'orange'],
        ['banana', 'orange'],
        ['apple', 'banana'],
        [null, 'orange'],
        [undefined, 'banana'],
      ]

      const values = filterGenerator.extractUniqueValues(data, 0, 10)

      expect(values).toHaveLength(3) // apple, banana, null (undefined normalized to null)
      expect(values.find((v) => v.value === 'apple')?.count).toBe(3)
      expect(values.find((v) => v.value === 'banana')?.count).toBe(1)
      expect(values.find((v) => v.value === null)?.count).toBe(2) // null + undefined
      expect(values.every((v) => v.selected === false)).toBe(true)
    })

    it('should respect maxValues limit', () => {
      const data = Array.from({ length: 1500 }, (_, i) => [`value${i}`])

      const values = filterGenerator.extractUniqueValues(data, 0, 1000)

      expect(values).toHaveLength(1000)
    })

    it('should handle empty data', () => {
      const values = filterGenerator.extractUniqueValues([], 0)

      expect(values).toHaveLength(0)
    })
  })

  describe('calculateValueCounts', () => {
    it('should count values correctly', () => {
      const data = [
        ['apple', 'banana'],
        ['apple', 'orange'],
        ['banana', 'orange'],
        ['apple', 'banana'],
        [null, 'orange'],
        [undefined, 'banana'],
      ]

      const counts = filterGenerator.calculateValueCounts(data, 0)

      expect(counts.get('apple')).toBe(3)
      expect(counts.get('banana')).toBe(1)
      expect(counts.get(null)).toBe(2) // null + undefined normalized to null
    })

    it('should handle empty data', () => {
      const counts = filterGenerator.calculateValueCounts([], 0)

      expect(counts.size).toBe(0)
    })

    it('should handle single column data', () => {
      const data = [['value1'], ['value2'], ['value1'], [null]]

      const counts = filterGenerator.calculateValueCounts(data, 0)

      expect(counts.get('value1')).toBe(2)
      expect(counts.get('value2')).toBe(1)
      expect(counts.get(null)).toBe(1)
    })
  })

  describe('toId', () => {
    it('should generate correct ID without suffix', () => {
      // Since toId is a private function, we test it through the generated filter IDs
      const column = createMockColumn('testColumn', 5, 'string')
      const filter = filterGenerator['generateStringFilter'](column) as FilterConfig
      expect(filter.id).toBe('filter-5')
    })

    it('should generate correct ID with suffix', () => {
      // Since toId is a private function, we test it through the generated null filter IDs
      const column = createMockColumn('testColumn', 5, 'string', { hasNulls: true })
      const filters = filterGenerator.generateFilters([column])
      const nullFilter = filters.find((f) => f.type === 'null')
      expect(nullFilter?.id).toBe('filter-5-null')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      const filters = filterGenerator.generateFilters([])
      expect(filters).toHaveLength(0)
    })

    it('should handle column with negative unique count', () => {
      const column = createMockColumn('negativeCount', 0, 'string', {
        uniqueCount: -1,
        uniqueValues: [],
      })

      const filter = filterGenerator['generateStringFilter'](column) as FilterConfig

      expect(filter.type).toBe('search') // Should fallback to search
    })

    it('should handle numeric column with Infinity values', () => {
      const column = createMockColumn('infinityCol', 0, 'number', {
        statistics: { min: Infinity, max: -Infinity },
        sampleValues: [Infinity, -Infinity, 1, 2, 3],
      })

      const filter = filterGenerator['generateNumericFilter'](column) as FilterConfig

      const rangeValues = filter.values as RangeFilter
      expect(rangeValues.min).toBe(Infinity) // Service preserves Infinity values
      expect(rangeValues.max).toBe(-Infinity) // Service preserves -Infinity values
    })

    it('should handle date column with invalid date strings', () => {
      const column = createMockColumn('invalidDateCol', 0, 'date', {
        statistics: { min: 'invalid-date' as any, max: 'also-invalid' as any },
      })

      const filter = filterGenerator['generateDateFilter'](column) as FilterConfig

      const dateValues = filter.values as DateRangeFilter
      expect(dateValues.earliest).toBeInstanceOf(Date)
      expect(dateValues.latest).toBeInstanceOf(Date)
    })

    it('should handle column with undefined type', () => {
      const column = createMockColumn('undefinedType', 0, undefined as any)

      const filter = filterGenerator['generateFilters']([column])[0] as FilterConfig

      expect(filter.type).toBe('search') // Should fallback to generic -> search
    })
  })

  describe('Filter Configuration Validation', () => {
    it('should generate filters with correct structure', () => {
      const columns: ColumnInfo[] = [createMockColumn('testCol', 0, 'string')]

      const filters = filterGenerator.generateFilters(columns)

      filters.forEach((filter) => {
        expect(filter).toHaveProperty('id')
        expect(filter).toHaveProperty('column')
        expect(filter).toHaveProperty('columnIndex')
        expect(filter).toHaveProperty('type')
        expect(filter).toHaveProperty('active')
        expect(filter).toHaveProperty('values')
        expect(filter).toHaveProperty('operator')
        expect(filter).toHaveProperty('displayName')
        expect(typeof filter.id).toBe('string')
        expect(typeof filter.column).toBe('string')
        expect(typeof filter.columnIndex).toBe('number')
        expect(typeof filter.active).toBe('boolean')
        expect(typeof filter.operator).toBe('string')
        expect(typeof filter.displayName).toBe('string')
      })
    })

    it('should generate unique IDs for different columns', () => {
      const columns: ColumnInfo[] = [
        createMockColumn('col1', 0, 'string'),
        createMockColumn('col2', 1, 'string'),
      ]

      const filters = filterGenerator.generateFilters(columns)

      expect(filters[0].id).not.toBe(filters[1].id)
    })

    it('should generate correct display names', () => {
      const columns: ColumnInfo[] = [
        createMockColumn('Test Column', 0, 'string', { hasNulls: true }),
      ]

      const filters = filterGenerator.generateFilters(columns)

      expect(filters[0].displayName).toBe('Test Column')
      expect(filters[1].displayName).toBe('Test Column (Nulls)')
    })
  })

  describe('Performance Considerations', () => {
    it('should handle large number of unique values efficiently', () => {
      const largeUniqueValues = Array.from({ length: 50000 }, (_, i) => `value${i}`)
      const column = createMockColumn('largeColumn', 0, 'string', {
        uniqueCount: 50000,
        uniqueValues: largeUniqueValues,
      })

      const startTime = performance.now()
      const filter = filterGenerator['generateStringFilter'](column) as FilterConfig
      const endTime = performance.now()

      expect(filter.type).toBe('search') // Should choose search for high cardinality
      expect(endTime - startTime).toBeLessThan(100) // Should complete in reasonable time
    })

    it('should handle large dataset in extractUniqueValues', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => [`value${i % 100}`]) // 100 unique values

      const startTime = performance.now()
      const values = filterGenerator.extractUniqueValues(largeData, 0)
      const endTime = performance.now()

      expect(values).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(100) // Should complete in reasonable time
    })
  })
})

// Helper function to create mock ColumnInfo objects
function createMockColumn(
  name: string,
  index: number,
  type: DataType,
  overrides: Partial<ColumnInfo> = {},
): ColumnInfo {
  return {
    name,
    index,
    type,
    uniqueValues: [],
    uniqueCount: 0,
    hasNulls: false,
    nullCount: 0,
    sampleValues: [],
    ...overrides,
  }
}
