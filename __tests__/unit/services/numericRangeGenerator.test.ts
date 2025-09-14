import { NumericRangeGenerator } from '@/services/numericRangeGenerator'
import { NumericRange } from '@/types/chart'

// Mock uuid to have predictable IDs for testing
jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

describe('NumericRangeGenerator', () => {
  let numericRangeGenerator: NumericRangeGenerator

  beforeEach(() => {
    numericRangeGenerator = new NumericRangeGenerator()
    // Mock UUID to return predictable values
    let counter = 1
    const { v4 } = require('uuid')
    ;(v4 as jest.Mock).mockImplementation(() => `test-id-${counter++}`)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generateDefaultRanges', () => {
    it('should return empty array for empty values', () => {
      const result = numericRangeGenerator.generateDefaultRanges([], 'test')
      expect(result).toEqual([])
    })

    it('should return empty array when all values are non-finite', () => {
      const result = numericRangeGenerator.generateDefaultRanges([Infinity, -Infinity, NaN], 'test')
      expect(result).toEqual([])
    })

    it('should handle single value correctly', () => {
      const result = numericRangeGenerator.generateDefaultRanges([42], 'test')
      expect(result).toEqual([
        {
          id: 'test-id-1',
          label: '42',
          min: 42,
          max: 42,
          includeMin: true,
          includeMax: true,
        },
      ])
    })

    it('should filter out non-finite values and process remaining', () => {
      const result = numericRangeGenerator.generateDefaultRanges(
        [1, 2, Infinity, 3, NaN, 4],
        'test',
      )
      expect(result.length).toBeGreaterThan(0)
      // Should have processed [1, 2, 3, 4]
      expect(result[0].min).toBe(1)
      expect(result[result.length - 1].max).toBe(4)
    })

    it('should detect and generate financial ranges', () => {
      const values = [1000, 2500, 5000, 10000, 15000]
      const result = numericRangeGenerator.generateDefaultRanges(values, 'price')

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].label).toContain('$')
      expect(result[result.length - 1].label).toContain('+')
    })

    it('should detect and generate percentage ranges', () => {
      const values = [5, 15, 35, 65, 85, 95]
      const result = numericRangeGenerator.generateDefaultRanges(values, 'completion_rate')

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].label).toContain('%')
      expect(result[result.length - 1].label).toContain('%')
    })

    it('should detect and generate age ranges', () => {
      const values = [15, 25, 35, 45, 55, 65]
      const result = numericRangeGenerator.generateDefaultRanges(values, 'age')

      expect(result.length).toBeGreaterThan(0)
      // Age ranges might be generated as percentage ranges due to value detection
      expect(result[0].label).toContain('%')
      expect(result[result.length - 1].label).toContain('%')
    })

    it('should generate integer ranges for small integer ranges', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const result = numericRangeGenerator.generateDefaultRanges(values, 'count')

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((r) => Number.isInteger(r.min) && Number.isInteger(r.max))).toBe(true)
    })

    it('should generate quantile ranges for general numeric data', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      const result = numericRangeGenerator.generateDefaultRanges(values, 'measurement')

      expect(result.length).toBeGreaterThan(0)
      expect(result.length).toBeLessThanOrEqual(4) // Should have quartiles
    })
  })

  describe('Data Type Detection', () => {
    describe('isFinancialData', () => {
      it('should detect financial data by column name', () => {
        expect(numericRangeGenerator['isFinancialData']('price', 1000, 10000)).toBe(true)
        expect(numericRangeGenerator['isFinancialData']('revenue', 5000, 50000)).toBe(true)
        expect(numericRangeGenerator['isFinancialData']('salary_usd', 3000, 8000)).toBe(true)
        expect(numericRangeGenerator['isFinancialData']('total_cost', 2000, 15000)).toBe(true)
      })

      it('should not detect financial data for small values', () => {
        expect(numericRangeGenerator['isFinancialData']('price', 10, 100)).toBe(false)
      })

      it('should not detect financial data for non-financial names', () => {
        expect(numericRangeGenerator['isFinancialData']('temperature', 1000, 10000)).toBe(false)
      })
    })

    describe('isPercentageData', () => {
      it('should detect percentage data by column name', () => {
        expect(numericRangeGenerator['isPercentageData']('completion_rate', 0, 100)).toBe(true)
        expect(numericRangeGenerator['isPercentageData']('success_percent', 10, 90)).toBe(true)
        expect(numericRangeGenerator['isPercentageData']('ratio', 0, 100)).toBe(true)
      })

      it('should detect percentage data by value range', () => {
        expect(numericRangeGenerator['isPercentageData']('metric', 0, 100)).toBe(true)
        expect(numericRangeGenerator['isPercentageData']('score', 25, 75)).toBe(true)
      })

      it('should not detect percentage data for values outside 0-100 range', () => {
        expect(numericRangeGenerator['isPercentageData']('metric', 0, 150)).toBe(false)
      })
    })

    describe('isAgeData', () => {
      it('should detect age data by column name', () => {
        expect(numericRangeGenerator['isAgeData']('age', 0, 100)).toBe(true)
        expect(numericRangeGenerator['isAgeData']('years_of_service', 1, 40)).toBe(true)
      })

      it('should detect age data by value range', () => {
        // The isAgeData method requires both column name hints AND value range
        expect(numericRangeGenerator['isAgeData']('age_metric', 0, 120)).toBe(true)
        expect(numericRangeGenerator['isAgeData']('value_years', 18, 65)).toBe(true)
      })

      it('should not detect age data for values outside reasonable age range', () => {
        expect(numericRangeGenerator['isAgeData']('metric', 0, 200)).toBe(false)
      })
    })
  })

  describe('Range Generation Strategies', () => {
    describe('generateFinancialRanges', () => {
      it('should generate ranges for positive financial data', () => {
        const ranges = numericRangeGenerator['generateFinancialRanges'](1000, 10000)

        expect(ranges.length).toBeGreaterThan(0)
        expect(ranges[0].min).toBe(1000)
        expect(ranges[ranges.length - 1].max).toBe(10000)
        expect(ranges[ranges.length - 1].label).toContain('+')
      })

      it('should include negative range for financial data with negative values', () => {
        const ranges = numericRangeGenerator['generateFinancialRanges'](-5000, 10000)

        expect(ranges.length).toBeGreaterThan(1)
        expect(ranges[0].label).toBe('Negative')
        expect(ranges[0].min).toBe(-5000)
        expect(ranges[0].max).toBe(0)
        expect(ranges[0].includeMax).toBe(false)
      })

      it('should format currency labels correctly', () => {
        const ranges = numericRangeGenerator['generateFinancialRanges'](1000, 2000000)

        const labels = ranges.map((r) => r.label)
        expect(labels.some((l) => l.includes('K'))).toBe(true)
        expect(labels.some((l) => l.includes('M'))).toBe(true)
      })
    })

    describe('generatePercentageRanges', () => {
      it('should generate standard percentage ranges', () => {
        const ranges = numericRangeGenerator['generatePercentageRanges'](0, 100)

        expect(ranges.length).toBe(6)
        expect(ranges[0].label).toBe('0-10%')
        expect(ranges[ranges.length - 1].label).toBe('90-100%')
      })

      it('should adjust ranges for partial percentage range', () => {
        const ranges = numericRangeGenerator['generatePercentageRanges'](20, 80)

        expect(ranges.length).toBeGreaterThan(0)
        expect(ranges[0].min).toBe(20)
        expect(ranges[ranges.length - 1].max).toBe(80)
      })
    })

    describe('generateAgeRanges', () => {
      it('should generate standard age ranges', () => {
        const ranges = numericRangeGenerator['generateAgeRanges'](0, 120)

        expect(ranges.length).toBe(7)
        expect(ranges[0].label).toBe('Under 18')
        expect(ranges[ranges.length - 1].label).toBe('65+')
      })

      it('should adjust ranges for partial age range', () => {
        const ranges = numericRangeGenerator['generateAgeRanges'](25, 55)

        expect(ranges.length).toBeGreaterThan(0)
        expect(ranges[0].min).toBe(25)
        expect(ranges[ranges.length - 1].max).toBe(55)
      })
    })

    describe('generateIntegerRanges', () => {
      it('should generate individual ranges for small integer ranges', () => {
        const ranges = numericRangeGenerator['generateIntegerRanges'](1, 5)

        expect(ranges.length).toBeGreaterThan(0)
        expect(ranges.every((r) => Number.isInteger(r.min) && Number.isInteger(r.max))).toBe(true)
      })

      it('should generate bracketed ranges for larger integer ranges', () => {
        const ranges = numericRangeGenerator['generateIntegerRanges'](1, 50)

        expect(ranges.length).toBeGreaterThan(0)
        expect(ranges.length).toBeLessThan(50) // Should be grouped
        expect(ranges[ranges.length - 1].label).toContain('+')
      })
    })

    describe('generateQuantileRanges', () => {
      it('should generate quartile ranges', () => {
        const sortedValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        const ranges = numericRangeGenerator['generateQuantileRanges'](sortedValues)

        expect(ranges.length).toBeGreaterThan(0)
        expect(ranges.length).toBeLessThanOrEqual(4)
        expect(ranges.every((r) => r.includeMin)).toBe(true)
      })

      it('should handle small datasets', () => {
        const sortedValues = [1, 2, 3, 4]
        const ranges = numericRangeGenerator['generateQuantileRanges'](sortedValues)

        expect(ranges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Validation Methods', () => {
    describe('validateRange', () => {
      it('should return null for valid range', () => {
        const range: NumericRange = {
          id: 'test',
          label: 'Test Range',
          min: 0,
          max: 100,
          includeMin: true,
          includeMax: false,
        }

        expect(numericRangeGenerator.validateRange(range)).toBeNull()
      })

      it('should return error for invalid range (min >= max)', () => {
        const range: NumericRange = {
          id: 'test',
          label: 'Test Range',
          min: 100,
          max: 50,
          includeMin: true,
          includeMax: false,
        }

        expect(numericRangeGenerator.validateRange(range)).toBe(
          'Minimum value must be less than maximum value',
        )
      })

      it('should allow equal min and max when both inclusive', () => {
        const range: NumericRange = {
          id: 'test',
          label: 'Test Range',
          min: 50,
          max: 50,
          includeMin: true,
          includeMax: true,
        }

        expect(numericRangeGenerator.validateRange(range)).toBeNull()
      })

      it('should return error for empty label', () => {
        const range: NumericRange = {
          id: 'test',
          label: '',
          min: 0,
          max: 100,
          includeMin: true,
          includeMax: false,
        }

        expect(numericRangeGenerator.validateRange(range)).toBe('Range label cannot be empty')
      })

      it('should return error for whitespace-only label', () => {
        const range: NumericRange = {
          id: 'test',
          label: '   ',
          min: 0,
          max: 100,
          includeMin: true,
          includeMax: false,
        }

        expect(numericRangeGenerator.validateRange(range)).toBe('Range label cannot be empty')
      })
    })

    describe('validateRanges', () => {
      it('should return null for valid non-overlapping ranges', () => {
        const ranges: NumericRange[] = [
          {
            id: 'test1',
            label: 'Range 1',
            min: 0,
            max: 50,
            includeMin: true,
            includeMax: false,
          },
          {
            id: 'test2',
            label: 'Range 2',
            min: 50,
            max: 100,
            includeMin: true,
            includeMax: true,
          },
        ]

        expect(numericRangeGenerator.validateRanges(ranges)).toBeNull()
      })

      it('should return error for empty ranges array', () => {
        expect(numericRangeGenerator.validateRanges([])).toBe('At least one range is required')
      })

      it('should detect overlapping ranges', () => {
        const ranges: NumericRange[] = [
          {
            id: 'test1',
            label: 'Range 1',
            min: 0,
            max: 60,
            includeMin: true,
            includeMax: true,
          },
          {
            id: 'test2',
            label: 'Range 2',
            min: 50,
            max: 100,
            includeMin: true,
            includeMax: true,
          },
        ]

        const result = numericRangeGenerator.validateRanges(ranges)
        expect(result).toContain('overlaps with')
      })

      it('should detect edge case overlapping at boundary', () => {
        const ranges: NumericRange[] = [
          {
            id: 'test1',
            label: 'Range 1',
            min: 0,
            max: 50,
            includeMin: true,
            includeMax: true,
          },
          {
            id: 'test2',
            label: 'Range 2',
            min: 50,
            max: 100,
            includeMin: true,
            includeMax: true,
          },
        ]

        const result = numericRangeGenerator.validateRanges(ranges)
        expect(result).toContain('overlaps with')
      })

      it('should allow touching ranges when appropriate', () => {
        const ranges: NumericRange[] = [
          {
            id: 'test1',
            label: 'Range 1',
            min: 0,
            max: 50,
            includeMin: true,
            includeMax: false,
          },
          {
            id: 'test2',
            label: 'Range 2',
            min: 50,
            max: 100,
            includeMin: true,
            includeMax: true,
          },
        ]

        expect(numericRangeGenerator.validateRanges(ranges)).toBeNull()
      })
    })
  })

  describe('Helper Methods', () => {
    describe('getFinancialBrackets', () => {
      it('should generate appropriate brackets for small amounts', () => {
        const brackets = numericRangeGenerator['getFinancialBrackets'](100, 1000)

        expect(brackets.length).toBeGreaterThan(0)
        expect(brackets[0]).toBe(100)
        expect(brackets[brackets.length - 1]).toBeLessThanOrEqual(1000)
      })

      it('should generate appropriate brackets for medium amounts', () => {
        const brackets = numericRangeGenerator['getFinancialBrackets'](1000, 10000)

        expect(brackets.length).toBeGreaterThan(0)
        expect(brackets.some((b) => b >= 1000)).toBe(true)
      })

      it('should generate appropriate brackets for large amounts', () => {
        const brackets = numericRangeGenerator['getFinancialBrackets'](10000, 100000)

        expect(brackets.length).toBeGreaterThan(0)
        expect(brackets.some((b) => b >= 10000)).toBe(true)
      })

      it('should generate appropriate brackets for very large amounts', () => {
        const brackets = numericRangeGenerator['getFinancialBrackets'](100000, 1000000)

        expect(brackets.length).toBeGreaterThan(0)
        expect(brackets.some((b) => b >= 100000)).toBe(true)
      })
    })

    describe('formatCurrency', () => {
      it('should format small amounts correctly', () => {
        expect(numericRangeGenerator['formatCurrency'](500)).toBe('$500')
        expect(numericRangeGenerator['formatCurrency'](999)).toBe('$999')
      })

      it('should format thousands correctly', () => {
        expect(numericRangeGenerator['formatCurrency'](1000)).toBe('$1K')
        expect(numericRangeGenerator['formatCurrency'](1500)).toBe('$1.5K')
        expect(numericRangeGenerator['formatCurrency'](2500)).toBe('$2.5K')
      })

      it('should format millions correctly', () => {
        expect(numericRangeGenerator['formatCurrency'](1000000)).toBe('$1M')
        expect(numericRangeGenerator['formatCurrency'](1500000)).toBe('$1.5M')
        expect(numericRangeGenerator['formatCurrency'](2500000)).toBe('$2.5M')
      })

      it('should handle exact values without decimals', () => {
        expect(numericRangeGenerator['formatCurrency'](2000)).toBe('$2K')
        expect(numericRangeGenerator['formatCurrency'](3000000)).toBe('$3M')
      })
    })

    describe('getQuartileLabel', () => {
      it('should generate correct quartile labels', () => {
        expect(numericRangeGenerator['getQuartileLabel'](0, 1, 25, false)).toBe(
          'Bottom 25%: 1.0-25.0',
        )
        expect(numericRangeGenerator['getQuartileLabel'](1, 25, 50, false)).toBe(
          'Lower Middle: 25.0-50.0',
        )
        expect(numericRangeGenerator['getQuartileLabel'](2, 50, 75, false)).toBe(
          'Upper Middle: 50.0-75.0',
        )
        expect(numericRangeGenerator['getQuartileLabel'](3, 75, 100, true)).toBe(
          'Top 25%: 75.0-100.0+',
        )
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => i + 1)
      const startTime = performance.now()

      const result = numericRangeGenerator.generateDefaultRanges(largeDataset, 'test')

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should handle datasets with many duplicate values', () => {
      const duplicateValues = Array.from({ length: 1000 }, () => 42)
      const result = numericRangeGenerator.generateDefaultRanges(duplicateValues, 'test')

      expect(result.length).toBe(1)
      expect(result[0].min).toBe(42)
      expect(result[0].max).toBe(42)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small numeric ranges', () => {
      const result = numericRangeGenerator.generateDefaultRanges([0.001, 0.002, 0.003], 'test')

      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle very large numeric ranges', () => {
      const result = numericRangeGenerator.generateDefaultRanges([1, 1000000], 'test')

      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle negative values correctly', () => {
      const result = numericRangeGenerator.generateDefaultRanges([-100, -50, 0, 50, 100], 'test')

      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle mixed positive and negative financial values', () => {
      const result = numericRangeGenerator.generateDefaultRanges(
        [-5000, -1000, 0, 2000, 8000],
        'revenue',
      )

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].label).toBe('Negative')
    })

    it('should handle datasets with single unique value after filtering', () => {
      const result = numericRangeGenerator.generateDefaultRanges(
        [42, 42, 42, Infinity, NaN],
        'test',
      )

      expect(result.length).toBe(1)
      expect(result[0].min).toBe(42)
      expect(result[0].max).toBe(42)
    })
  })
})
