import {
  createLargeDateDataset,
  createMockExcelData,
  createMockExcelDataWithDateEdgeCases,
  createMockExcelDataWithDateFormats,
} from '../../fixtures/test-data/mock-excel-data'
import {
  generateDateParseTestCases,
  getDateColumns,
  getDateStatistics,
  getDateValues,
  isValidDate,
  normalizeDateString,
} from '../../utils/date-utils'

describe('Date Parsing Utilities', () => {
  describe('getDateColumns', () => {
    it('should extract date columns from Excel data', () => {
      const mockData = createMockExcelData()
      const dateColumns = getDateColumns(mockData)

      expect(dateColumns).toContain('Join Date')
      expect(dateColumns).toContain('Last Login')
      expect(dateColumns).toContain('Birth Date')
      expect(dateColumns).toContain('Meeting Time')
      expect(dateColumns).toContain('Created At')
      expect(dateColumns).toContain('Updated At')
      expect(dateColumns).not.toContain('Name')
      expect(dateColumns).not.toContain('Age')
    })

    it('should handle data with no date columns', () => {
      const mockData = createMockExcelData()
      // Remove date columns
      mockData.metadata.columns = mockData.metadata.columns.filter((col) => col.type !== 'date')

      const dateColumns = getDateColumns(mockData)
      expect(dateColumns).toEqual([])
    })
  })

  describe('getDateValues', () => {
    it('should extract date values from a specific column', () => {
      const mockData = createMockExcelData()
      const joinDates = getDateValues(mockData, 'Join Date')

      expect(joinDates).toHaveLength(mockData.rows.length)
      expect(joinDates).toContain('2023-01-15')
      expect(joinDates).toContain('2022-03-22')
      expect(joinDates).toContain('2021-07-10')
    })

    it('should return empty array for non-existent column', () => {
      const mockData = createMockExcelData()
      const values = getDateValues(mockData, 'NonExistentColumn')
      expect(values).toEqual([])
    })
  })

  describe('isValidDate', () => {
    it('should validate different date formats correctly', () => {
      expect(isValidDate('2023-01-15')).toBe(true)
      expect(isValidDate('01/15/2023')).toBe(true)
      expect(isValidDate('15-01-2023')).toBe(true)
      expect(isValidDate('2023-01-15 14:30:00')).toBe(true)
      expect(isValidDate('01/15/2023 2:30 PM')).toBe(true)
      expect(isValidDate('2023-01-15T14:30:00Z')).toBe(true)
    })

    it('should reject invalid dates', () => {
      expect(isValidDate('')).toBe(false)
      expect(isValidDate('Invalid Date')).toBe(false)
      expect(isValidDate('2023-02-30')).toBe(false)
      expect(isValidDate('2023-13-01')).toBe(false)
      expect(isValidDate('2023-01-32')).toBe(false)
      expect(isValidDate('0000-00-00')).toBe(false)
    })
  })

  describe('normalizeDateString', () => {
    it('should normalize different date formats to ISO format', () => {
      expect(normalizeDateString('2023-01-15')).toBe('2023-01-15')
      expect(normalizeDateString('01/15/2023')).toBe('2023-01-15')
      expect(normalizeDateString('15-01-2023')).toBe('2023-01-15')
      expect(normalizeDateString('2023-01-15 14:30:00')).toBe('2023-01-15')
    })

    it('should return original string for invalid dates', () => {
      expect(normalizeDateString('Invalid Date')).toBe('Invalid Date')
      expect(normalizeDateString('2023-02-30')).toBe('2023-02-30')
    })

    it('should handle empty string', () => {
      expect(normalizeDateString('')).toBe('')
    })
  })

  describe('getDateStatistics', () => {
    it('should calculate date statistics correctly', () => {
      const mockData = createMockExcelData()
      const stats = getDateStatistics(mockData, 'Join Date')

      expect(stats.count).toBe(5)
      expect(stats.nullCount).toBe(0)
      expect(stats.uniqueCount).toBe(5)
      expect(stats.min).toBe('2020-04-18')
      expect(stats.max).toBe('2023-01-15')
    })

    it('should handle column with no valid dates', () => {
      const mockData = createMockExcelDataWithDateEdgeCases()
      const stats = getDateStatistics(mockData, 'Edge Case Dates')

      expect(stats.count).toBe(0)
      expect(stats.nullCount).toBe(11)
      expect(stats.uniqueCount).toBe(0)
      expect(stats.min).toBe(null)
      expect(stats.max).toBe(null)
    })
  })

  describe('generateDateParseTestCases', () => {
    it('should generate comprehensive test cases for date parsing', () => {
      const testCases = generateDateParseTestCases()

      expect(testCases).toHaveLength(13)

      // Check valid date cases
      const validCases = testCases.filter((tc) => tc.expected !== null)
      expect(validCases).toHaveLength(6)

      // Check invalid date cases
      const invalidCases = testCases.filter((tc) => tc.expected === null)
      expect(invalidCases).toHaveLength(7)

      // Check specific cases
      const isoDateCase = testCases.find((tc) => tc.description === 'ISO date format')
      expect(isoDateCase?.input).toBe('2023-01-15')
      expect(isoDateCase?.expected).toBe('2023-01-15')

      const invalidDateCase = testCases.find((tc) => tc.description === 'Invalid date string')
      expect(invalidDateCase?.input).toBe('Invalid Date')
      expect(invalidDateCase?.expected).toBe(null)
    })
  })
})

describe('Mock Data with Date Fields', () => {
  describe('createMockExcelData', () => {
    it('should create mock data with date columns', () => {
      const mockData = createMockExcelData()
      const dateColumns = getDateColumns(mockData)

      expect(dateColumns.length).toBeGreaterThan(0)
      expect(mockData.rows.length).toBe(5)

      // Check that date columns have proper values
      const joinDates = getDateValues(mockData, 'Join Date')
      joinDates.forEach((date) => {
        expect(isValidDate(date!)).toBe(true)
      })
    })
  })

  describe('createMockExcelDataWithDateFormats', () => {
    it('should create mock data with various date formats', () => {
      const mockData = createMockExcelDataWithDateFormats()
      const dateColumns = getDateColumns(mockData)

      expect(dateColumns).toContain('Various Date Formats')
      expect(dateColumns).toContain('Various DateTime Formats')

      // Check that we have different date formats
      const dateValues = getDateValues(mockData, 'Various Date Formats')
      const uniqueFormats = new Set(dateValues)
      expect(uniqueFormats.size).toBeGreaterThan(1)
    })
  })

  describe('createMockExcelDataWithDateEdgeCases', () => {
    it('should create mock data with edge case dates', () => {
      const mockData = createMockExcelDataWithDateEdgeCases()
      const edgeCaseValues = getDateValues(mockData, 'Edge Case Dates')

      // Should have empty values
      expect(edgeCaseValues.some((val) => val === '')).toBe(true)

      // Should have invalid date strings
      const invalidDates = edgeCaseValues.filter((val) => val && !isValidDate(val))
      expect(invalidDates.length).toBeGreaterThan(0)
    })
  })

  describe('createLargeDateDataset', () => {
    it('should create a large dataset with date fields', () => {
      const largeData = createLargeDateDataset(100)
      const dateColumns = getDateColumns(largeData)

      expect(largeData.rows.length).toBe(100)
      expect(dateColumns.length).toBeGreaterThan(0)

      // Check that all date values are valid
      const joinDates = getDateValues(largeData, 'Join Date')
      joinDates.forEach((date) => {
        expect(date).toBeDefined()
        expect(isValidDate(date!)).toBe(true)
      })
    })
  })
})
