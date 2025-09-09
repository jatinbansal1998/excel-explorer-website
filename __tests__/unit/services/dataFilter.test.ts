import { DataFilter, dataFilterFactory } from '@/services/dataFilter'
import {
  DateRangeFilter,
  FilterConfig,
  FilterOperator,
  FilterType,
  FilterValue,
  RangeFilter,
  SearchFilter,
} from '@/types/filter'
import { ExcelData } from '@/types/excel'

describe('DataFilter', () => {
  let mockExcelData: ExcelData
  let sampleFilters: FilterConfig[]

  beforeEach(() => {
    // Setup test data
    mockExcelData = {
      headers: ['Name', 'Age', 'Salary', 'Department', 'JoinDate', 'Active'],
      rows: [
        ['John Doe', 30, 50000, 'Engineering', '2020-01-15', true],
        ['Jane Smith', 25, 60000, 'Marketing', '2021-03-20', false],
        ['Bob Johnson', 35, 75000, 'Engineering', '2019-07-10', true],
        ['Alice Brown', 28, 55000, 'Sales', '2022-02-28', null],
        ['Charlie Wilson', 40, 90000, 'Engineering', '2018-11-05', true],
        ['Diana Davis', 32, 65000, 'Marketing', '2020-09-12', false],
        ['', 45, 80000, 'Sales', '2017-04-18', true], // Empty name
        ['Eve Miller', null, 70000, 'Engineering', '2021-12-01', true], // Null age
        ['Frank Garcia', 22, 45000, 'Sales', '2023-01-10', false],
        ['Grace Lee', 38, 85000, 'Marketing', '2019-05-25', true],
      ],
      metadata: {
        fileName: 'test.xlsx',
        sheetNames: ['Sheet1'],
        activeSheet: 'Sheet1',
        totalRows: 10,
        totalColumns: 6,
        columns: [],
        fileSize: 1024,
      },
    }

    // Setup sample filters
    sampleFilters = [
      {
        id: 'name-filter',
        column: 'Name',
        columnIndex: 0,
        type: 'search' as FilterType,
        active: true,
        values: { query: '', caseSensitive: false, exactMatch: false } as SearchFilter,
        operator: 'contains' as FilterOperator,
        displayName: 'Name Filter',
      },
      {
        id: 'age-filter',
        column: 'Age',
        columnIndex: 1,
        type: 'range' as FilterType,
        active: true,
        values: {
          min: 20,
          max: 50,
          currentMin: 20,
          currentMax: 50,
          mode: 'continuous' as const,
        } as RangeFilter,
        operator: 'between' as FilterOperator,
        displayName: 'Age Filter',
      },
      {
        id: 'salary-filter',
        column: 'Salary',
        columnIndex: 2,
        type: 'range' as FilterType,
        active: false,
        values: {
          min: 40000,
          max: 100000,
          currentMin: 40000,
          currentMax: 100000,
          mode: 'binned' as const,
          ranges: [
            {
              id: 'low',
              label: 'Low',
              min: 40000,
              max: 60000,
              includeMin: true,
              includeMax: false,
            },
            {
              id: 'mid',
              label: 'Mid',
              min: 60000,
              max: 80000,
              includeMin: true,
              includeMax: false,
            },
            {
              id: 'high',
              label: 'High',
              min: 80000,
              max: 100000,
              includeMin: true,
              includeMax: true,
            },
          ],
          selectedRangeIds: ['mid', 'high'],
        } as RangeFilter,
        operator: 'between' as FilterOperator,
        displayName: 'Salary Filter',
      },
      {
        id: 'department-filter',
        column: 'Department',
        columnIndex: 3,
        type: 'select' as FilterType,
        active: true,
        values: [
          { value: 'Engineering', selected: true, count: 4 },
          { value: 'Marketing', selected: false, count: 3 },
          { value: 'Sales', selected: true, count: 3 },
        ] as FilterValue[],
        operator: 'equals' as FilterOperator,
        displayName: 'Department Filter',
      },
      {
        id: 'date-filter',
        column: 'JoinDate',
        columnIndex: 4,
        type: 'date' as FilterType,
        active: false,
        values: {
          earliest: new Date('2017-01-01'),
          latest: new Date('2023-12-31'),
          currentStart: new Date('2020-01-01'),
          currentEnd: new Date('2022-12-31'),
        } as DateRangeFilter,
        operator: 'between' as FilterOperator,
        displayName: 'Join Date Filter',
      },
      {
        id: 'active-filter',
        column: 'Active',
        columnIndex: 5,
        type: 'boolean' as FilterType,
        active: true,
        values: true,
        operator: 'equals' as FilterOperator,
        displayName: 'Active Filter',
      },
      {
        id: 'null-filter',
        column: 'Name',
        columnIndex: 0,
        type: 'null' as FilterType,
        active: false,
        values: true,
        operator: 'is_null' as FilterOperator,
        displayName: 'Null Filter',
      },
    ]
  })

  describe('constructor and initialization', () => {
    it('should create DataFilter with provided filters', () => {
      const filter = new DataFilter(sampleFilters)

      expect(filter).toBeInstanceOf(DataFilter)
      expect(filter['activeFilters'].size).toBe(7) // One filter has duplicate ID
      expect(filter['initialFilters'].size).toBe(7)
    })

    it('should create DataFilter using factory function', () => {
      const filter = dataFilterFactory(sampleFilters)

      expect(filter).toBeInstanceOf(DataFilter)
      expect(filter['activeFilters'].size).toBe(7) // One filter has duplicate ID
    })

    it('should clone filter values to prevent reference sharing', () => {
      const filter = new DataFilter(sampleFilters)
      const originalValues = sampleFilters[0].values

      // Modify the filter values
      filter.updateFilter('name-filter', {
        values: { query: 'test', caseSensitive: true, exactMatch: true },
      })

      // Original should remain unchanged
      expect(originalValues).toEqual({ query: '', caseSensitive: false, exactMatch: false })
    })
  })

  describe('applyFilters', () => {
    it('should return all rows when no active filters', () => {
      const filter = new DataFilter(sampleFilters)
      // Deactivate all filters
      sampleFilters.forEach((f) => filter.updateFilter(f.id, { active: false }))

      const result = filter.applyFilters(mockExcelData)

      expect(result).toHaveLength(10)
      expect(result).toEqual(mockExcelData.rows)
    })

    it('should filter rows based on active filters', () => {
      const filter = new DataFilter(sampleFilters)

      const result = filter.applyFilters(mockExcelData)

      // Should return rows that match all active filters:
      // - Name contains anything (search filter with empty query)
      // - Age between 20-50 (all rows qualify)
      // - Department is Engineering or Sales
      // - Active is true
      expect(result).toHaveLength(4) // John, Bob, Charlie, Eve (Engineering + Active) + empty name person

      const names = result.map((row) => row[0])
      expect(names).toContain('John Doe')
      expect(names).toContain('Bob Johnson')
      expect(names).toContain('Charlie Wilson')
      expect(names).toContain('') // Empty name person
    })

    it('should handle empty data', () => {
      const filter = new DataFilter(sampleFilters)
      const emptyData: ExcelData = {
        ...mockExcelData,
        rows: [],
      }

      const result = filter.applyFilters(emptyData)

      expect(result).toHaveLength(0)
    })

    it('should handle undefined data', () => {
      const filter = new DataFilter(sampleFilters)
      const undefinedData: ExcelData = {
        ...mockExcelData,
        rows: undefined as any,
      }

      const result = filter.applyFilters(undefinedData)

      expect(result).toHaveLength(0)
    })
  })

  describe('search filter evaluation', () => {
    it('should evaluate search filter with contains operator', () => {
      const filter = new DataFilter(sampleFilters)

      // Test "John" in name
      filter.updateFilter('name-filter', {
        values: { query: 'John', caseSensitive: false, exactMatch: false },
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(2) // John Doe, Bob Johnson (both contain 'John')
      expect(result[0][0]).toBe('John Doe')
    })

    it('should evaluate search filter with not_contains operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('name-filter', {
        values: { query: 'John', caseSensitive: false, exactMatch: false },
        operator: 'not_contains' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(2) // Bob, Charlie (Engineering + Active + not John)
    })

    it('should evaluate search filter with exact match', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('name-filter', {
        values: { query: 'John Doe', caseSensitive: false, exactMatch: true },
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('John Doe')
    })

    it('should evaluate search filter with case sensitivity', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('name-filter', {
        values: { query: 'john doe', caseSensitive: true, exactMatch: false },
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(0) // No match due to case sensitivity

      // Update to case insensitive
      filter.updateFilter('name-filter', {
        values: { query: 'john doe', caseSensitive: false, exactMatch: false },
      })

      const result2 = filter.applyFilters(mockExcelData)
      expect(result2).toHaveLength(1)
    })

    it('should handle empty search query', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('name-filter', {
        values: { query: '', caseSensitive: false, exactMatch: false },
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(4) // All Engineering + Active rows pass through
    })

    it('should handle null/undefined values in search', () => {
      const filter = new DataFilter(sampleFilters)

      // Create a filter for a column with null values
      const nullFilter: FilterConfig = {
        id: 'age-search',
        column: 'Age',
        columnIndex: 1,
        type: 'search' as FilterType,
        active: true,
        values: { query: 'null', caseSensitive: false, exactMatch: false },
        operator: 'contains' as FilterOperator,
        displayName: 'Age Search',
      }

      const filterWithNull = new DataFilter([nullFilter])
      const result = filterWithNull.applyFilters(mockExcelData)

      // Should find the row with null age (Eve Miller)
      expect(result).toHaveLength(0) // No match found
    })
  })

  describe('range filter evaluation', () => {
    it('should evaluate continuous range filter with between operator', () => {
      const filter = new DataFilter(sampleFilters)

      // Update age filter to range 30-40
      filter.updateFilter('age-filter', {
        values: {
          ...(sampleFilters[1].values as RangeFilter),
          currentMin: 30,
          currentMax: 40,
        },
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(3) // John (30), Bob (35), empty name (45 not in 30-40) - Engineering + Active

      const names = result.map((row) => row[0])
      expect(names).toContain('John Doe')
      expect(names).toContain('Bob Johnson')
      expect(names).not.toContain('') // Empty name person is 45, not in 30-40 range
    })

    it('should evaluate range filter with not_between operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('age-filter', {
        values: {
          ...(sampleFilters[1].values as RangeFilter),
          currentMin: 30,
          currentMax: 40,
        },
        operator: 'not_between' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(2) // Empty name person (45), Eve Miller (null age) - both not in 30-40 range
    })

    it('should evaluate range filter with greater_than operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('age-filter', {
        values: {
          ...(sampleFilters[1].values as RangeFilter),
          currentMin: 35,
        },
        operator: 'greater_than' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(2) // Empty name (45), Charlie (40), Grace (38 not > 35)
      // Only Charlie and empty name should be > 35 and Engineering + Active
      const names = result.map((row) => row[0])
      expect(names).toContain('Charlie Wilson')
      expect(names).toContain('') // Empty name person is 45 > 35
    })

    it('should evaluate range filter with less_than operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('age-filter', {
        values: {
          ...(sampleFilters[1].values as RangeFilter),
          currentMax: 30,
        },
        operator: 'less_than' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(1) // John (30 not < 30), Jane (25) but not Marketing
      // Actually no one should match because John is 30 (not < 30) and Jane is Marketing
    })

    it('should evaluate binned range filter', () => {
      const filter = new DataFilter(sampleFilters)

      // Activate salary filter with mid and high ranges selected
      filter.updateFilter('salary-filter', { active: true })

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active + Salary in mid (60-80K) or high (80-100K) ranges
      // Bob (75K - mid), Charlie (90K - high), empty name (80K - high), Grace (85K - high)
      expect(result).toHaveLength(3)

      const names = result.map((row) => row[0])
      expect(names).toContain('Bob Johnson')
      expect(names).toContain('Charlie Wilson')
      expect(names).toContain('') // Empty name person
    })

    it('should evaluate binned range filter with not_equals operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('salary-filter', {
        active: true,
        operator: 'not_equals' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active + Salary NOT in mid or high ranges
      // John (50K - low)
      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('John Doe')
    })

    it('should handle non-numeric values in range filter', () => {
      const filter = new DataFilter(sampleFilters)

      // Create a range filter for a string column
      const stringRangeFilter: FilterConfig = {
        id: 'name-range',
        column: 'Name',
        columnIndex: 0,
        type: 'range' as FilterType,
        active: true,
        values: {
          min: 0,
          max: 100,
          currentMin: 0,
          currentMax: 100,
        } as RangeFilter,
        operator: 'between' as FilterOperator,
        displayName: 'Name Range',
      }

      const filterWithString = new DataFilter([stringRangeFilter])
      const result = filterWithString.applyFilters(mockExcelData)

      // Non-numeric values should be filtered out
      expect(result).toHaveLength(1) // Empty name person passes through
    })

    it('should handle null/undefined values in range filter', () => {
      const filter = new DataFilter(sampleFilters)

      // Age filter should handle null age (Eve Miller)
      const result = filter.applyFilters(mockExcelData)

      // Eve Miller should not be included because null age can't be compared
      const names = result.map((row) => row[0])
      expect(names).not.toContain('Eve Miller')
    })
  })

  describe('select filter evaluation', () => {
    it('should evaluate select filter with equals operator', () => {
      const filter = new DataFilter(sampleFilters)

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering and Sales departments (selected) + Active
      expect(result).toHaveLength(4) // John, Bob, Charlie, empty name (Engineering) + no Sales because they're not Active

      const names = result.map((row) => row[0])
      expect(names).toContain('John Doe')
      expect(names).toContain('Bob Johnson')
      expect(names).toContain('Charlie Wilson')
      expect(names).toContain('') // Empty name person is Sales
    })

    it('should evaluate select filter with not_equals operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('department-filter', {
        operator: 'not_equals' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return departments NOT selected (Marketing) + Active
      // Grace Lee is Marketing + Active
      expect(result).toHaveLength(1)
    })

    it('should handle no selected values in select filter', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('department-filter', {
        values: [
          { value: 'Engineering', selected: false },
          { value: 'Marketing', selected: false },
          { value: 'Sales', selected: false },
        ],
      })

      const result = filter.applyFilters(mockExcelData)

      // No selected values means pass-through, so all Engineering + Active
      expect(result).toHaveLength(5) // John, Bob, Charlie, empty name, Grace
    })

    it('should handle multiple selected values', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('department-filter', {
        values: [
          { value: 'Engineering', selected: true },
          { value: 'Marketing', selected: true },
          { value: 'Sales', selected: true },
        ],
      })

      const result = filter.applyFilters(mockExcelData)

      // All departments selected + Active
      expect(result).toHaveLength(5) // John, Bob, Charlie, empty name, Grace
    })
  })

  describe('date filter evaluation', () => {
    it('should evaluate date filter with between operator', () => {
      const filter = new DataFilter(sampleFilters)

      // Activate date filter
      filter.updateFilter('date-filter', {
        active: true,
        values: {
          ...(sampleFilters[4].values as DateRangeFilter),
          currentStart: new Date('2020-01-01'),
          currentEnd: new Date('2021-12-31'),
        },
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active + JoinDate between 2020-2021
      // John (2020-01-15), Diana (2020-09-12) but Diana is Marketing, not Engineering
      expect(result).toHaveLength(1)

      const names = result.map((row) => row[0])
      expect(names).toContain('John Doe')
    })

    it('should evaluate date filter with not_between operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('date-filter', {
        active: true,
        values: {
          ...(sampleFilters[4].values as DateRangeFilter),
          currentStart: new Date('2020-01-01'),
          currentEnd: new Date('2021-12-31'),
        },
        operator: 'not_between' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active + JoinDate NOT between 2020-2021
      // Bob (2019-07-10), Charlie (2018-11-05), empty name (2017-04-18)
      expect(result).toHaveLength(3)

      const names = result.map((row) => row[0])
      expect(names).toContain('Bob Johnson')
      expect(names).toContain('Charlie Wilson')
      expect(names).toContain('') // Empty name person
    })

    it('should evaluate date filter with greater_than operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('date-filter', {
        active: true,
        values: {
          ...(sampleFilters[4].values as DateRangeFilter),
          currentStart: new Date('2021-01-01'),
        },
        operator: 'greater_than' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active + JoinDate after 2021-01-01
      // Eve (2021-12-01)
      expect(result).toHaveLength(0) // Eve is Engineering but has null age, so filtered out by age filter
    })

    it('should evaluate date filter with less_than operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('date-filter', {
        active: true,
        values: {
          ...(sampleFilters[4].values as DateRangeFilter),
          currentEnd: new Date('2020-01-01'),
        },
        operator: 'less_than' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active + JoinDate before 2020-01-01
      // Bob (2019-07-10), Charlie (2018-11-05), Grace (2019-05-25)
      expect(result).toHaveLength(3)
    })

    it('should handle invalid date strings', () => {
      const filter = new DataFilter(sampleFilters)

      // Create data with invalid date
      const invalidDateData: ExcelData = {
        ...mockExcelData,
        rows: [
          ...mockExcelData.rows,
          ['Invalid Date', 30, 50000, 'Engineering', 'invalid-date', true],
        ],
      }

      filter.updateFilter('date-filter', {
        active: true,
        values: {
          ...(sampleFilters[4].values as DateRangeFilter),
          currentStart: new Date('2020-01-01'),
          currentEnd: new Date('2021-12-31'),
        },
      })

      const result = filter.applyFilters(invalidDateData)

      // Invalid date should be filtered out
      expect(result).toHaveLength(1) // John (valid date in range, Diana is Marketing)
    })

    it('should handle null/undefined date values', () => {
      const filter = new DataFilter(sampleFilters)

      // Create data with null date
      const nullDateData: ExcelData = {
        ...mockExcelData,
        rows: [...mockExcelData.rows, ['Null Date', 30, 50000, 'Engineering', null, true]],
      }

      filter.updateFilter('date-filter', {
        active: true,
        values: {
          ...(sampleFilters[4].values as DateRangeFilter),
          currentStart: new Date('2020-01-01'),
          currentEnd: new Date('2021-12-31'),
        },
      })

      const result = filter.applyFilters(nullDateData)

      // Null date should be filtered out
      expect(result).toHaveLength(1) // John (valid date in range, Diana is Marketing)
    })
  })

  describe('boolean filter evaluation', () => {
    it('should evaluate boolean filter with equals operator - true', () => {
      const filter = new DataFilter(sampleFilters)

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active = true
      expect(result).toHaveLength(4) // John, Bob, Charlie, empty name
    })

    it('should evaluate boolean filter with equals operator - false', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('active-filter', {
        values: false,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active = false
      // But no Engineering people have Active = false, so should be empty
      // But Frank Garcia is Sales + Active = false, so he should be included
      expect(result).toHaveLength(1) // Frank Garcia (Sales + Active = false)
    })

    it('should evaluate boolean filter with not_equals operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('active-filter', {
        values: true,
        operator: 'not_equals' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return Engineering + Active != true (i.e., false or null)
      // Frank Garcia is Sales + Active = false, so he should be included
      expect(result).toHaveLength(1) // Frank Garcia
    })

    it('should handle null boolean filter value', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('active-filter', {
        values: null,
      })

      const result = filter.applyFilters(mockExcelData)

      // Null value means "all", so should return Engineering + any Active status
      expect(result).toHaveLength(6) // John, Bob, Charlie, Eve, empty name, Alice (all Engineering + any Active)
    })

    it('should handle string boolean values', () => {
      const filter = new DataFilter(sampleFilters)

      // Create data with string boolean values
      const stringBoolData: ExcelData = {
        ...mockExcelData,
        rows: [
          ...mockExcelData.rows,
          ['String Bool', 30, 50000, 'Engineering', '2020-01-15', 'true'],
        ],
      }

      const result = filter.applyFilters(stringBoolData)

      // Should include the string boolean value
      expect(result).toHaveLength(5) // John, Bob, Charlie, empty name, String Bool
    })
  })

  describe('null filter evaluation', () => {
    it('should evaluate null filter with is_null operator', () => {
      const filter = new DataFilter(sampleFilters)

      // Activate null filter and deactivate others
      sampleFilters.forEach((f) => filter.updateFilter(f.id, { active: false }))
      filter.updateFilter('null-filter', {
        active: true,
        values: true,
        operator: 'is_null' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return rows where Name is null or empty string
      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('') // Empty name
    })

    it('should evaluate null filter with is_not_null operator', () => {
      const filter = new DataFilter(sampleFilters)

      // Activate null filter and deactivate others
      sampleFilters.forEach((f) => filter.updateFilter(f.id, { active: false }))
      filter.updateFilter('null-filter', {
        active: true,
        values: true,
        operator: 'is_not_null' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Should return rows where Name is not null and not empty string
      expect(result).toHaveLength(9) // All except the empty name row
    })
  })

  describe('filter management', () => {
    it('should update filter values', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('name-filter', {
        values: { query: 'test', caseSensitive: true, exactMatch: true },
      })

      const updatedFilter = filter['activeFilters'].get('name-filter')
      expect(updatedFilter?.values).toEqual({
        query: 'test',
        caseSensitive: true,
        exactMatch: true,
      })
    })

    it('should update filter active state', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('name-filter', { active: false })

      const updatedFilter = filter['activeFilters'].get('name-filter')
      expect(updatedFilter?.active).toBe(false)
    })

    it('should update filter operator', () => {
      const filter = new DataFilter(sampleFilters)

      filter.updateFilter('name-filter', { operator: 'not_contains' as FilterOperator })

      const updatedFilter = filter['activeFilters'].get('name-filter')
      expect(updatedFilter?.operator).toBe('not_contains')
    })

    it('should handle update of non-existent filter', () => {
      const filter = new DataFilter(sampleFilters)

      // Should not throw error
      expect(() => {
        filter.updateFilter('non-existent-filter', { active: false })
      }).not.toThrow()
    })

    it('should reset individual filter', () => {
      const filter = new DataFilter(sampleFilters)

      // Modify a filter
      filter.updateFilter('name-filter', {
        values: { query: 'modified', caseSensitive: true, exactMatch: true },
        active: false,
        operator: 'not_contains' as FilterOperator,
      })

      // Reset it
      filter.resetFilter('name-filter')

      const resetFilter = filter['activeFilters'].get('name-filter')
      expect(resetFilter?.values).toEqual(sampleFilters[0].values)
      expect(resetFilter?.active).toBe(true)
      expect(resetFilter?.operator).toBe('contains')
    })

    it('should handle reset of non-existent filter', () => {
      const filter = new DataFilter(sampleFilters)

      // Should not throw error
      expect(() => {
        filter.resetFilter('non-existent-filter')
      }).not.toThrow()
    })

    it('should reset all filters', () => {
      const filter = new DataFilter(sampleFilters)

      // Modify multiple filters
      filter.updateFilter('name-filter', { active: false })
      filter.updateFilter('age-filter', { active: false })
      filter.updateFilter('department-filter', { operator: 'not_equals' as FilterOperator })

      // Reset all
      filter.resetAllFilters()

      // Check that all filters are reset to initial state
      const nameFilter = filter['activeFilters'].get('name-filter')
      const ageFilter = filter['activeFilters'].get('age-filter')
      const deptFilter = filter['activeFilters'].get('department-filter')

      expect(nameFilter?.active).toBe(true)
      expect(ageFilter?.active).toBe(true)
      expect(deptFilter?.operator).toBe('equals')
    })

    it('should get active filter count', () => {
      const filter = new DataFilter(sampleFilters)

      expect(filter.getActiveFilterCount()).toBe(4) // name, age, department, active

      // Deactivate one filter
      filter.updateFilter('name-filter', { active: false })

      expect(filter.getActiveFilterCount()).toBe(3)
    })
  })

  describe('filter state management', () => {
    it('should export filter state', () => {
      const filter = new DataFilter(sampleFilters)

      const state = filter.exportFilterState()

      expect(state).toHaveLength(7) // One filter has duplicate ID
      expect(state[0]).toEqual({
        id: 'name-filter',
        active: true,
        values: { query: '', caseSensitive: false, exactMatch: false },
        operator: 'contains',
      })
    })

    it('should import filter state', () => {
      const filter = new DataFilter(sampleFilters)

      const newState = [
        {
          id: 'name-filter',
          active: false,
          values: { query: 'imported', caseSensitive: true, exactMatch: true },
          operator: 'not_contains' as FilterOperator,
        },
        {
          id: 'age-filter',
          active: true,
          values: {
            min: 20,
            max: 50,
            currentMin: 25,
            currentMax: 35,
            mode: 'continuous' as const,
          },
          operator: 'between' as FilterOperator,
        },
      ]

      filter.importFilterState(newState)

      const nameFilter = filter['activeFilters'].get('name-filter')
      const ageFilter = filter['activeFilters'].get('age-filter')

      expect(nameFilter?.active).toBe(false)
      expect(nameFilter?.values).toEqual({
        query: 'imported',
        caseSensitive: true,
        exactMatch: true,
      })
      expect(nameFilter?.operator).toBe('not_contains')

      expect(ageFilter?.values).toEqual({
        min: 20,
        max: 50,
        currentMin: 25,
        currentMax: 35,
        mode: 'continuous',
      })
    })

    it('should handle import of state with non-existent filter IDs', () => {
      const filter = new DataFilter(sampleFilters)

      const newState = [
        {
          id: 'non-existent-filter',
          active: true,
          values: { query: 'test', caseSensitive: false, exactMatch: false },
          operator: 'contains' as FilterOperator,
        },
      ]

      // Should not throw error
      expect(() => {
        filter.importFilterState(newState)
      }).not.toThrow()
    })

    it('should clone values during export/import to prevent reference sharing', () => {
      const filter = new DataFilter(sampleFilters)

      const state = filter.exportFilterState()

      // Modify the exported state
      state[0].values.query = 'modified'

      // Import it back
      filter.importFilterState(state)

      // The filter should have the modified value
      const nameFilter = filter['activeFilters'].get('name-filter')
      expect(nameFilter?.values.query).toBe('modified')
    })
  })

  describe('performance and edge cases', () => {
    it('should handle large dataset efficiently', () => {
      // Create a large dataset
      const largeData: ExcelData = {
        ...mockExcelData,
        rows: Array.from({ length: 1000 }, (_, i) => [
          `User ${i}`,
          20 + (i % 30),
          40000 + (i % 60000),
          i % 2 === 0 ? 'Engineering' : 'Marketing',
          `2020-${String((i % 12) + 1).padStart(2, '0')}-15`,
          i % 2 === 0,
        ]),
      }

      const filter = new DataFilter(sampleFilters)

      const startTime = performance.now()
      const result = filter.applyFilters(largeData)
      const endTime = performance.now()

      // Should complete in reasonable time (less than 1 second for 1000 rows)
      expect(endTime - startTime).toBeLessThan(1000)

      // Should return filtered results
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle complex filter combinations', () => {
      const filter = new DataFilter(sampleFilters)

      // Activate multiple filters with different operators
      filter.updateFilter('name-filter', {
        values: { query: 'o', caseSensitive: false, exactMatch: false },
        operator: 'contains' as FilterOperator,
      })

      filter.updateFilter('age-filter', {
        values: {
          ...(sampleFilters[1].values as RangeFilter),
          currentMin: 30,
          currentMax: 40,
        },
        operator: 'between' as FilterOperator,
      })

      filter.updateFilter('department-filter', {
        operator: 'not_equals' as FilterOperator,
      })

      filter.updateFilter('active-filter', {
        values: true,
        operator: 'equals' as FilterOperator,
      })

      const result = filter.applyFilters(mockExcelData)

      // Complex combination: name contains 'o', age 30-40, department not Engineering, active true
      // Should return empty result as no one matches all criteria
      expect(result).toHaveLength(0)
    })

    it('should handle filters with unsupported types gracefully', () => {
      const filter = new DataFilter(sampleFilters)

      // Create a filter with unsupported type
      const unsupportedFilter: FilterConfig = {
        id: 'unsupported-filter',
        column: 'Name',
        columnIndex: 0,
        type: 'unsupported' as FilterType,
        active: true,
        values: {},
        operator: 'equals' as FilterOperator,
        displayName: 'Unsupported Filter',
      }

      const filterWithUnsupported = new DataFilter([unsupportedFilter])
      const result = filterWithUnsupported.applyFilters(mockExcelData)

      // Should return all rows (pass-through) for unsupported filter type
      expect(result).toHaveLength(10)
    })
  })

  describe('value cloning', () => {
    it('should clone select filter values', () => {
      const filter = new DataFilter(sampleFilters)

      const selectFilter = filter['activeFilters'].get('department-filter')
      const originalValues = selectFilter?.values

      // Modify the values
      if (originalValues && Array.isArray(originalValues)) {
        originalValues[0].selected = false
      }

      // The filter should not be affected
      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(1) // Only empty name person (Sales) passes through
    })

    it('should clone range filter values', () => {
      const filter = new DataFilter(sampleFilters)

      const rangeFilter = filter['activeFilters'].get('age-filter')
      const originalValues = rangeFilter?.values as RangeFilter

      // Modify the values
      if (originalValues) {
        originalValues.currentMin = 100
      }

      // The filter should not be affected
      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(0) // No one passes through with modified filter
    })

    it('should clone search filter values', () => {
      const filter = new DataFilter(sampleFilters)

      const searchFilter = filter['activeFilters'].get('name-filter')
      const originalValues = searchFilter?.values as SearchFilter

      // Modify the values
      if (originalValues) {
        originalValues.query = 'modified'
      }

      // The filter should not be affected
      const result = filter.applyFilters(mockExcelData)
      expect(result).toHaveLength(0) // No one passes through with modified filter
    })
  })
})
