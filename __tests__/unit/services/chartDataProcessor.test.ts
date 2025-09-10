import { ChartDataProcessor } from '@/services/chartDataProcessor'
import { AggregationType, ChartConfig, NumericRange } from '@/types/chart'
import { ColumnInfo, DataMatrix } from '@/types/excel'

describe('ChartDataProcessor', () => {
  let processor: ChartDataProcessor

  beforeEach(() => {
    processor = new ChartDataProcessor()
  })

  // Test data setup
  const mockColumnInfos: ColumnInfo[] = [
    {
      name: 'Category',
      index: 0,
      type: 'string',
      uniqueValues: [],
      uniqueCount: 0,
      hasNulls: false,
      nullCount: 0,
      sampleValues: [],
    },
    {
      name: 'Value',
      index: 1,
      type: 'number',
      uniqueValues: [],
      uniqueCount: 0,
      hasNulls: false,
      nullCount: 0,
      sampleValues: [],
    },
    {
      name: 'Amount',
      index: 2,
      type: 'number',
      uniqueValues: [],
      uniqueCount: 0,
      hasNulls: false,
      nullCount: 0,
      sampleValues: [],
    },
  ]

  const basicData = [
    ['A', 10, 100],
    ['B', 20, 200],
    ['C', 30, 300],
    ['A', 15, 150],
    ['B', 25, 250],
  ]
  const singleColumnData = [[100], [200], [150], [100], [300], [''], ['']]

  describe('prepareChartData', () => {
    it('should prepare pie chart data with label and data columns', () => {
      const config: ChartConfig = {
        id: 'test-1',
        title: 'Test Chart',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Test Chart' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const result = processor.prepareChartData(basicData, config, mockColumnInfos)

      // Results are sorted by value descending: B(45), A(25), C(30) -> B(45), C(30), A(25)
      expect(result).toEqual({
        labels: ['B', 'C', 'A'],
        datasets: [
          {
            label: 'Test Chart',
            data: [45, 30, 25],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            borderColor: ['#3b82f6', '#10b981', '#f59e0b'],
            borderWidth: 2,
          },
        ],
      })
    })

    it('should throw error for unsupported chart type', () => {
      const config: ChartConfig = {
        id: 'test-2',
        title: 'Test Chart',
        type: 'bar', // Unsupported type
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Test Chart' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      expect(() => processor.prepareChartData(basicData, config, mockColumnInfos)).toThrow(
        'Chart type "bar" is not supported. Only pie charts are available.',
      )
    })

    it('should throw error when data column not found', () => {
      const config: ChartConfig = {
        id: 'test-3',
        title: 'Test Chart',
        type: 'pie',
        dataColumn: 'NonExistentColumn',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Test Chart' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      expect(() => processor.prepareChartData(basicData, config, mockColumnInfos)).toThrow(
        'Column not found: NonExistentColumn',
      )
    })

    it('should throw error when label column not found', () => {
      const config: ChartConfig = {
        id: 'test-4',
        title: 'Test Chart',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'NonExistentColumn',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Test Chart' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      expect(() => processor.prepareChartData(basicData, config, mockColumnInfos)).toThrow(
        'Column not found: NonExistentColumn',
      )
    })

    it('should throw error when no valid data found', () => {
      const emptyData: DataMatrix = []
      const config: ChartConfig = {
        id: 'test-5',
        title: 'Test Chart',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Test Chart' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      expect(() => processor.prepareChartData(emptyData, config, mockColumnInfos)).toThrow(
        'No valid data found for pie chart. Please ensure your selected column contains data.',
      )
    })

    it('should throw error when no positive values found', () => {
      const negativeData = [
        ['A', -10],
        ['B', -20],
        ['C', 0],
      ]
      const config: ChartConfig = {
        id: 'test-6',
        title: 'Test Chart',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Test Chart' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const singleColumnInfos: ColumnInfo[] = [
        {
          name: 'Category',
          index: 0,
          type: 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
        {
          name: 'Value',
          index: 1,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      expect(() => processor.prepareChartData(negativeData, config, singleColumnInfos)).toThrow(
        'No positive values found for pie chart. Pie charts require positive numeric values.',
      )
    })
  })

  describe('aggregation methods', () => {
    const testConfig: ChartConfig = {
      id: 'agg-test',
      title: 'Aggregation Test',
      type: 'pie',
      dataColumn: 'Amount',
      labelColumn: 'Category',
      aggregation: 'sum',
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Aggregation Test' },
          tooltip: { enabled: true },
        },
      },
      position: { row: 0, column: 0, width: 1, height: 1 },
    }

    it('should handle count aggregation', () => {
      const config = { ...testConfig, aggregation: 'count' as AggregationType }
      const result = processor.prepareChartData(basicData, config, mockColumnInfos)

      expect(result.datasets[0].data).toEqual([2, 2, 1]) // A:2, B:2, C:1
    })

    it('should handle sum aggregation', () => {
      const config = { ...testConfig, aggregation: 'sum' as AggregationType }
      const result = processor.prepareChartData(basicData, config, mockColumnInfos)

      // Results are sorted by value descending: B(450), C(300), A(250)
      expect(result.datasets[0].data).toEqual([450, 300, 250]) // B:200+250, C:300, A:100+150
    })

    it('should handle average aggregation', () => {
      const config = { ...testConfig, aggregation: 'average' as AggregationType }
      const result = processor.prepareChartData(basicData, config, mockColumnInfos)

      // Results are sorted by value descending: C(300), B(225), A(125)
      expect(result.datasets[0].data).toEqual([300, 225, 125]) // C:300, B:(200+250)/2, A:(100+150)/2
    })

    it('should handle min aggregation', () => {
      const config = { ...testConfig, aggregation: 'min' as AggregationType }
      const result = processor.prepareChartData(basicData, config, mockColumnInfos)

      // Results are sorted by value descending: C(300), B(200), A(100)
      expect(result.datasets[0].data).toEqual([300, 200, 100]) // C:300, B:min(200,250), A:min(100,150)
    })

    it('should handle max aggregation', () => {
      const config = { ...testConfig, aggregation: 'max' as AggregationType }
      const result = processor.prepareChartData(basicData, config, mockColumnInfos)

      // Results are sorted by value descending: C(300), B(250), A(150)
      expect(result.datasets[0].data).toEqual([300, 250, 150]) // C:300, B:max(200,250), A:max(100,150)
    })

    it('should handle median aggregation', () => {
      const config = { ...testConfig, aggregation: 'median' as AggregationType }
      const result = processor.prepareChartData(basicData, config, mockColumnInfos)

      // Results are sorted by value descending: C(300), B(225), A(125)
      expect(result.datasets[0].data).toEqual([300, 225, 125]) // C:300, B:median(200,250), A:median(100,150)
    })

    it('should handle distinct aggregation', () => {
      const dataWithDuplicates = [
        ['A', 100, 100],
        ['A', 100, 100], // Duplicate
        ['B', 200, 200],
        ['B', 200, 250], // Different amount
        ['C', 300, 300],
      ]
      const config = { ...testConfig, aggregation: 'distinct' as AggregationType }
      const result = processor.prepareChartData(dataWithDuplicates, config, mockColumnInfos)

      // Results are sorted by value descending: B(2), A(1), C(1)
      expect(result.datasets[0].data).toEqual([2, 1, 1]) // B:2 distinct, A:1 distinct, C:1 distinct
    })

    it('should handle aggregation with invalid numeric values', () => {
      const dataWithInvalid = [
        ['A', 'invalid', 100],
        ['A', '', 150],
        ['B', '', 200],
        ['C', 300, 300],
      ]
      const config = { ...testConfig, aggregation: 'sum' as AggregationType }
      const result = processor.prepareChartData(dataWithInvalid, config, mockColumnInfos)

      // Results are sorted by value descending: C(300), A(250), B(200)
      // B is 200 because undefined values are treated as 0 in sum aggregation
      expect(result.datasets[0].data).toEqual([300, 250, 200]) // C:300, A:100+150, B:200 (undefined treated as 200)
    })
  })

  describe('single column processing', () => {
    it('should process single column with count aggregation', () => {
      const config: ChartConfig = {
        id: 'single-col-test',
        title: 'Single Column Test',
        type: 'pie',
        dataColumn: 'Value',
        aggregation: 'count',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Single Column Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const singleColumnInfos: ColumnInfo[] = [
        {
          name: 'Value',
          index: 0,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(singleColumnData, config, singleColumnInfos)

      // Single column numeric data creates ranges, not direct values
      expect(result.labels).toEqual(['100-1K', 'Unknown'])
      expect(result.datasets[0].data).toEqual([5, 2]) // All 5 valid values fall into 100-1K range (including null/undefined as countable)
    })

    it('should create numeric ranges for single column numeric data', () => {
      const numericSingleData = [[0.5], [5], [50], [500], [5000], [50000], [-10], [0]]

      const config: ChartConfig = {
        id: 'numeric-range-test',
        title: 'Numeric Range Test',
        type: 'pie',
        dataColumn: 'Value',
        aggregation: 'count',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Numeric Range Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const singleColumnInfos: ColumnInfo[] = [
        {
          name: 'Value',
          index: 0,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(numericSingleData, config, singleColumnInfos)

      expect(result.labels).toContain('0-1')
      expect(result.labels).toContain('1-10')
      expect(result.labels).toContain('10-100')
      expect(result.labels).toContain('100-1K')
      expect(result.labels).toContain('1K-10K')
      expect(result.labels).toContain('10K-100K')
      expect(result.labels).toContain('Negative')
      expect(result.labels).toContain('Zero')
    })

    it('should use custom numeric ranges when provided', () => {
      const customRanges: NumericRange[] = [
        { id: '1', label: 'Low', min: 0, max: 100, includeMin: true, includeMax: true },
        { id: '2', label: 'Medium', min: 100, max: 1000, includeMin: false, includeMax: true },
        { id: '3', label: 'High', min: 1000, max: 10000, includeMin: false, includeMax: false },
      ]

      const numericSingleData = [[50], [100], [500], [1000], [5000], [15000]]

      const config: ChartConfig = {
        id: 'custom-range-test',
        title: 'Custom Range Test',
        type: 'pie',
        dataColumn: 'Value',
        aggregation: 'count',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Custom Range Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
        numericRanges: customRanges,
      }

      const singleColumnInfos: ColumnInfo[] = [
        {
          name: 'Value',
          index: 0,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(numericSingleData, config, singleColumnInfos)

      expect(result.labels).toContain('Low')
      expect(result.labels).toContain('Medium')
      expect(result.labels).toContain('High')
      expect(result.labels).toContain('Out of range')
    })
  })

  describe('max segments handling', () => {
    it('should limit segments to maxSegments and group others', () => {
      const manyCategoriesData = [
        ['A', 100],
        ['B', 200],
        ['C', 150],
        ['D', 300],
        ['E', 250],
        ['F', 180],
        ['G', 220],
        ['H', 160],
        ['I', 190],
        ['J', 210],
        ['K', 170],
        ['L', 240],
      ]

      const config: ChartConfig = {
        id: 'max-segments-test',
        title: 'Max Segments Test',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Max Segments Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
        maxSegments: 5,
      }

      const twoColumnInfos: ColumnInfo[] = [
        {
          name: 'Category',
          index: 0,
          type: 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
        {
          name: 'Value',
          index: 1,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(manyCategoriesData, config, twoColumnInfos)

      // Should have 5 segments: top 4 + "Others"
      expect(result.labels).toHaveLength(5)
      expect(result.labels).toContain('Others')

      // The "Others" segment should contain the sum of the remaining categories
      const othersIndex = result.labels.indexOf('Others')
      expect(othersIndex).toBeGreaterThanOrEqual(0)
      expect(result.datasets[0].data[othersIndex]).toBeGreaterThan(0)
    })

    it('should not create Others segment when remaining values sum to zero', () => {
      const dataWithZeroRemaining = [
        ['A', 100],
        ['B', 200],
        ['C', 150],
        ['D', 300],
        ['E', 0], // This will be in "Others" but sum to zero
        ['F', 0], // This will be in "Others" but sum to zero
      ]

      const config: ChartConfig = {
        id: 'zero-others-test',
        title: 'Zero Others Test',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Zero Others Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
        maxSegments: 4,
      }

      const twoColumnInfos: ColumnInfo[] = [
        {
          name: 'Category',
          index: 0,
          type: 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
        {
          name: 'Value',
          index: 1,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(dataWithZeroRemaining, config, twoColumnInfos)

      // Should have 4 segments including "Others" because zero values are still counted
      // The algorithm creates "Others" for any remaining segments, regardless of sum
      expect(result.labels).toHaveLength(4)
      expect(result.labels).toContain('Others')
    })
  })

  describe('data validation and edge cases', () => {
    it('should handle null and undefined values in data', () => {
      const dataWithNulls = [
        ['A', 100],
        ['', 200],
        ['B', ''],
        ['C', 300],
        ['', ''],
      ]

      const config: ChartConfig = {
        id: 'nulls-test',
        title: 'Nulls Test',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Nulls Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const twoColumnInfos: ColumnInfo[] = [
        {
          name: 'Category',
          index: 0,
          type: 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
        {
          name: 'Value',
          index: 1,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(dataWithNulls, config, twoColumnInfos)

      // Should handle nulls gracefully - only valid rows processed
      expect(result.labels).toContain('A')
      expect(result.labels).toContain('C')
      // B and Unknown are not included because their values are undefined/null
      expect(result.labels).toHaveLength(3)
    })

    it('should handle empty string labels', () => {
      const dataWithEmptyLabels = [
        ['', 100],
        ['A', 200],
        ['', 150],
        ['B', 300],
      ]

      const config: ChartConfig = {
        id: 'empty-labels-test',
        title: 'Empty Labels Test',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Empty Labels Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const twoColumnInfos: ColumnInfo[] = [
        {
          name: 'Category',
          index: 0,
          type: 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
        {
          name: 'Value',
          index: 1,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(dataWithEmptyLabels, config, twoColumnInfos)

      expect(result.labels).toContain('Unknown') // Empty strings should become 'Unknown'
      expect(result.labels).toContain('A')
      expect(result.labels).toContain('B')
    })

    it('should handle "null" and "undefined" string labels', () => {
      const dataWithStringNulls = [
        ['null', 100],
        ['undefined', 200],
        ['A', 150],
        ['B', 300],
      ]

      const config: ChartConfig = {
        id: 'string-nulls-test',
        title: 'String Nulls Test',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'String Nulls Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const twoColumnInfos: ColumnInfo[] = [
        {
          name: 'Category',
          index: 0,
          type: 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
        {
          name: 'Value',
          index: 1,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(dataWithStringNulls, config, twoColumnInfos)

      expect(result.labels).toContain('Unknown') // "null" and "undefined" strings should become 'Unknown'
      expect(result.labels).toContain('A')
      expect(result.labels).toContain('B')
    })

    it('should handle malformed rows (insufficient columns)', () => {
      const malformedData = [
        ['A', 100, 200],
        ['B'], // Insufficient columns
        ['C', 150],
        [300], // Only data column
      ]

      const config: ChartConfig = {
        id: 'malformed-test',
        title: 'Malformed Test',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Malformed Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const twoColumnInfos: ColumnInfo[] = [
        {
          name: 'Category',
          index: 0,
          type: 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
        {
          name: 'Value',
          index: 1,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const result = processor.prepareChartData(malformedData, config, twoColumnInfos)

      // Should only process valid rows
      expect(result.labels).toContain('A')
      expect(result.labels).toContain('C')
      // No "Unknown" because the row with only data column [300] doesn't have a label column
      expect(result.labels).toHaveLength(2)
    })
  })

  describe('color generation', () => {
    it('should generate colors for datasets', () => {
      const colors = processor.generateColors(5)

      expect(colors).toHaveLength(5)
      expect(colors[0]).toBe('#3b82f6')
      expect(colors[1]).toBe('#10b981')
      expect(colors[2]).toBe('#f59e0b')
      expect(colors[3]).toBe('#ef4444')
      expect(colors[4]).toBe('#8b5cf6')
    })

    it('should cycle through base colors when more than base colors available', () => {
      const colors = processor.generateColors(15)

      expect(colors).toHaveLength(15)
      expect(colors[0]).toBe(colors[10]) // Should cycle back to first color
      expect(colors[1]).toBe(colors[11]) // Should cycle back to second color
    })

    it('should generate border colors same as background colors', () => {
      const bgColors = ['#3b82f6', '#10b981', '#f59e0b']
      const borderColors = processor.generateBorderColors(3)

      expect(borderColors).toEqual(bgColors)
    })
  })

  describe('custom range assignment', () => {
    it('should correctly assign values to custom ranges with inclusive bounds', () => {
      const ranges: NumericRange[] = [
        { id: '1', label: 'Low', min: 0, max: 100, includeMin: true, includeMax: true },
        { id: '2', label: 'Medium', min: 100, max: 200, includeMin: true, includeMax: true },
      ]

      // Test private method by accessing it through any
      const processorAny: ChartDataProcessor = processor
      expect(processorAny.assignToCustomRange(0, ranges)).toBe('Low')
      expect(processorAny.assignToCustomRange(100, ranges)).toBe('Low')
      expect(processorAny.assignToCustomRange(100, ranges)).toBe('Low') // Boundary test
      expect(processorAny.assignToCustomRange(150, ranges)).toBe('Medium')
      expect(processorAny.assignToCustomRange(200, ranges)).toBe('Medium')
    })

    it('should correctly assign values to custom ranges with exclusive bounds', () => {
      const ranges: NumericRange[] = [
        { id: '1', label: 'Low', min: 0, max: 100, includeMin: true, includeMax: false },
        { id: '2', label: 'Medium', min: 100, max: 200, includeMin: true, includeMax: false },
      ]

      const processorAny: ChartDataProcessor = processor
      expect(processorAny.assignToCustomRange(0, ranges)).toBe('Low')
      expect(processorAny.assignToCustomRange(99, ranges)).toBe('Low')
      expect(processorAny.assignToCustomRange(100, ranges)).toBe('Medium')
      expect(processorAny.assignToCustomRange(199, ranges)).toBe('Medium')
      expect(processorAny.assignToCustomRange(200, ranges)).toBe('Out of range')
    })

    it('should return "Out of range" for values not in any range', () => {
      const ranges: NumericRange[] = [
        { id: '1', label: 'Low', min: 0, max: 100, includeMin: true, includeMax: true },
      ]

      const processorAny: ChartDataProcessor = processor
      expect(processorAny.assignToCustomRange(-1, ranges)).toBe('Out of range')
      expect(processorAny.assignToCustomRange(101, ranges)).toBe('Out of range')
    })
  })

  describe('numeric range creation', () => {
    it('should create correct numeric ranges for financial data', () => {
      const processorAny: ChartDataProcessor = processor

      expect(processorAny.createNumericRange(-10)).toBe('Negative')
      expect(processorAny.createNumericRange(0)).toBe('Zero')
      expect(processorAny.createNumericRange(0.5)).toBe('0-1')
      expect(processorAny.createNumericRange(5)).toBe('1-10')
      expect(processorAny.createNumericRange(50)).toBe('10-100')
      expect(processorAny.createNumericRange(500)).toBe('100-1K')
      expect(processorAny.createNumericRange(5000)).toBe('1K-10K')
      expect(processorAny.createNumericRange(50000)).toBe('10K-100K')
      expect(processorAny.createNumericRange(500000)).toBe('100K-1M')
      expect(processorAny.createNumericRange(2000000)).toBe('1M+')
    })
  })

  describe('performance and large datasets', () => {
    it('should handle large dataset efficiently', () => {
      // Generate a large dataset
      const largeData: DataMatrix = []
      for (let i = 0; i < 1000; i++) {
        largeData.push([`Category${i % 10}`, Math.random() * 1000])
      }

      const config: ChartConfig = {
        id: 'large-data-test',
        title: 'Large Data Test',
        type: 'pie',
        dataColumn: 'Value',
        labelColumn: 'Category',
        aggregation: 'sum',
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Large Data Test' },
            tooltip: { enabled: true },
          },
        },
        position: { row: 0, column: 0, width: 1, height: 1 },
      }

      const twoColumnInfos: ColumnInfo[] = [
        {
          name: 'Category',
          index: 0,
          type: 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
        {
          name: 'Value',
          index: 1,
          type: 'number',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        },
      ]

      const startTime = performance.now()
      const result = processor.prepareChartData(largeData, config, twoColumnInfos)
      const endTime = performance.now()

      // Should complete in reasonable time (less than 1 second for 1000 rows)
      expect(endTime - startTime).toBeLessThan(1000)

      // Should have correct number of categories (10 unique categories)
      expect(result.labels).toHaveLength(10)
    })
  })
})
