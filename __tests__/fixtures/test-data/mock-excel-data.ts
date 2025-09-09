import { ExcelData } from '@/types/excel'
import { FilterConfig } from '@/types/filter'
import { ChartConfig } from '@/types/chart'

// Helper function to generate random dates
function generateRandomDate(startYear: number, endYear: number): string {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
  const month = Math.floor(Math.random() * 12)
  const day = Math.floor(Math.random() * 28) + 1 // Avoid February 29th for simplicity
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Helper function to generate random datetime
function generateRandomDateTime(startYear: number, endYear: number): string {
  const date = generateRandomDate(startYear, endYear)
  const hours = Math.floor(Math.random() * 24)
  const minutes = Math.floor(Math.random() * 60)
  const seconds = Math.floor(Math.random() * 60)
  return `${date} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Helper function to generate random timestamps
function generateRandomTimestamp(startYear: number, endYear: number): number {
  const start = new Date(startYear, 0, 1).getTime()
  const end = new Date(endYear, 11, 31).getTime()
  return Math.floor(Math.random() * (end - start + 1)) + start
}

export function createMockExcelData(overrides?: Partial<ExcelData>): ExcelData {
  const defaultData: ExcelData = {
    headers: [
      'Name',
      'Age',
      'City',
      'Salary',
      'Join Date',
      'Last Login',
      'Birth Date',
      'Meeting Time',
      'Created At',
      'Updated At',
    ],
    rows: [
      [
        'John Doe',
        30,
        'New York',
        50000,
        '2023-01-15',
        '2023-06-15 14:30:00',
        '1993-05-20',
        '2023-06-15 10:00:00',
        '2023-01-15T09:00:00Z',
        '2023-06-15T15:30:00Z',
      ],
      [
        'Jane Smith',
        25,
        'Los Angeles',
        60000,
        '2022-03-22',
        '2023-06-14 09:15:00',
        '1998-08-10',
        '2023-06-14 14:30:00',
        '2022-03-22T11:00:00Z',
        '2023-06-14T16:45:00Z',
      ],
      [
        'Bob Johnson',
        35,
        'Chicago',
        70000,
        '2021-07-10',
        '2023-06-13 16:45:00',
        '1988-12-05',
        '2023-06-13 11:30:00',
        '2021-07-10T13:00:00Z',
        '2023-06-13T17:20:00Z',
      ],
      [
        'Alice Brown',
        28,
        'Houston',
        55000,
        '2022-11-05',
        '2023-06-12 08:30:00',
        '1995-02-28',
        '2023-06-12 15:00:00',
        '2022-11-05T10:00:00Z',
        '2023-06-12T18:15:00Z',
      ],
      [
        'Charlie Wilson',
        42,
        'Phoenix',
        80000,
        '2020-04-18',
        '2023-06-11 12:00:00',
        '1981-09-15',
        '2023-06-11 09:30:00',
        '2020-04-18T14:00:00Z',
        '2023-06-11T19:45:00Z',
      ],
    ],
    metadata: {
      fileName: 'test-data-with-dates.xlsx',
      sheetNames: ['Sheet1'],
      activeSheet: 'Sheet1',
      totalRows: 5,
      totalColumns: 10,
      columns: [
        {
          name: 'Name',
          index: 0,
          type: 'string',
          uniqueValues: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['John Doe'],
        },
        {
          name: 'Age',
          index: 1,
          type: 'number',
          uniqueValues: [30, 25, 35, 28, 42],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [30],
        },
        {
          name: 'City',
          index: 2,
          type: 'string',
          uniqueValues: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['New York'],
        },
        {
          name: 'Salary',
          index: 3,
          type: 'number',
          uniqueValues: [50000, 60000, 70000, 55000, 80000],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [50000],
        },
        {
          name: 'Join Date',
          index: 4,
          type: 'date',
          uniqueValues: ['2023-01-15', '2022-03-22', '2021-07-10', '2022-11-05', '2020-04-18'],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['2023-01-15'],
        },
        {
          name: 'Last Login',
          index: 5,
          type: 'date',
          uniqueValues: [
            '2023-06-15 14:30:00',
            '2023-06-14 09:15:00',
            '2023-06-13 16:45:00',
            '2023-06-12 08:30:00',
            '2023-06-11 12:00:00',
          ],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['2023-06-15 14:30:00'],
        },
        {
          name: 'Birth Date',
          index: 6,
          type: 'date',
          uniqueValues: ['1993-05-20', '1998-08-10', '1988-12-05', '1995-02-28', '1981-09-15'],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['1993-05-20'],
        },
        {
          name: 'Meeting Time',
          index: 7,
          type: 'date',
          uniqueValues: [
            '2023-06-15 10:00:00',
            '2023-06-14 14:30:00',
            '2023-06-13 11:30:00',
            '2023-06-12 15:00:00',
            '2023-06-11 09:30:00',
          ],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['2023-06-15 10:00:00'],
        },
        {
          name: 'Created At',
          index: 8,
          type: 'date',
          uniqueValues: [
            '2023-01-15T09:00:00Z',
            '2022-03-22T11:00:00Z',
            '2021-07-10T13:00:00Z',
            '2022-11-05T10:00:00Z',
            '2020-04-18T14:00:00Z',
          ],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['2023-01-15T09:00:00Z'],
        },
        {
          name: 'Updated At',
          index: 9,
          type: 'date',
          uniqueValues: [
            '2023-06-15T15:30:00Z',
            '2023-06-14T16:45:00Z',
            '2023-06-13T17:20:00Z',
            '2023-06-12T18:15:00Z',
            '2023-06-11T19:45:00Z',
          ],
          uniqueCount: 5,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['2023-06-15T15:30:00Z'],
        },
      ],
      fileSize: 2048,
    },
  }

  return { ...defaultData, ...overrides }
}

// Function to create mock data with various date formats for testing
export function createMockExcelDataWithDateFormats(overrides?: Partial<ExcelData>): ExcelData {
  const dateFormats = [
    '2023-01-15', // ISO format
    '01/15/2023', // US format
    '15-Jan-2023', // Abbreviated month
    'January 15, 2023', // Full month
    '20230115', // Compact format
    '15-01-2023', // European format
    '01/15/23', // Short year
    'Jan 15, 2023', // Month abbreviation with comma
  ]

  const datetimeFormats = [
    '2023-01-15 14:30:00', // ISO datetime
    '01/15/2023 2:30 PM', // US datetime with AM/PM
    '15-Jan-2023 14:30', // Abbreviated month with time
    'January 15, 2023 14:30:00', // Full month with time
    '2023-01-15T14:30:00Z', // ISO format with timezone
    '01/15/23 14:30', // Short year with time
  ]

  const rows = dateFormats.map((date, index) => [
    `User ${index + 1}`,
    25 + index,
    `City ${index + 1}`,
    50000 + index * 10000,
    date,
    datetimeFormats[index % datetimeFormats.length],
    generateRandomDate(1990, 2000),
    generateRandomDateTime(2023, 2023),
    new Date().toISOString(),
    new Date().toISOString(),
  ])

  return createMockExcelData({
    headers: [
      'Name',
      'Age',
      'City',
      'Salary',
      'Various Date Formats',
      'Various DateTime Formats',
      'Birth Date',
      'Meeting Time',
      'Created At',
      'Updated At',
    ],
    rows,
    metadata: {
      fileName: 'test-data-with-date-formats.xlsx',
      sheetNames: ['Sheet1'],
      activeSheet: 'Sheet1',
      totalRows: rows.length,
      totalColumns: 10,
      columns: [
        {
          name: 'Name',
          index: 0,
          type: 'string',
          uniqueValues: rows.map((row) => row[0]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][0]],
        },
        {
          name: 'Age',
          index: 1,
          type: 'number',
          uniqueValues: rows.map((row) => row[1]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][1]],
        },
        {
          name: 'City',
          index: 2,
          type: 'string',
          uniqueValues: rows.map((row) => row[2]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][2]],
        },
        {
          name: 'Salary',
          index: 3,
          type: 'number',
          uniqueValues: rows.map((row) => row[3]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][3]],
        },
        {
          name: 'Various Date Formats',
          index: 4,
          type: 'date',
          uniqueValues: dateFormats,
          uniqueCount: dateFormats.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [dateFormats[0]],
        },
        {
          name: 'Various DateTime Formats',
          index: 5,
          type: 'date',
          uniqueValues: datetimeFormats,
          uniqueCount: datetimeFormats.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [datetimeFormats[0]],
        },
        {
          name: 'Birth Date',
          index: 6,
          type: 'date',
          uniqueValues: rows.map((row) => row[7]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][7]],
        },
        {
          name: 'Meeting Time',
          index: 7,
          type: 'date',
          uniqueValues: rows.map((row) => row[8]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][8]],
        },
        {
          name: 'Created At',
          index: 8,
          type: 'date',
          uniqueValues: rows.map((row) => row[9]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][9]],
        },
        {
          name: 'Updated At',
          index: 9,
          type: 'date',
          uniqueValues: rows.map((row) => row[10]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][10]],
        },
      ],
      fileSize: 2048,
    },
    ...overrides,
  })
}

// Function to create mock data with edge cases for date parsing
export function createMockExcelDataWithDateEdgeCases(overrides?: Partial<ExcelData>): ExcelData {
  const edgeCaseDates = [
    '', // Empty string
    null, // Null value
    'N/A', // Not available
    'Invalid Date', // Invalid date string
    '2023-02-30', // Invalid date (February 30th)
    '2023-13-01', // Invalid month
    '2023-01-32', // Invalid day
    '0000-00-00', // Zero date
    '2023-99-99', // Invalid month and day
    'Not-A-Date', // Clearly invalid
    '999999-99-99', // Extremely invalid
  ]

  const rows = edgeCaseDates.map((date, index) => [
    `Edge Case ${index + 1}`,
    25 + index,
    `City ${index + 1}`,
    50000 + index * 10000,
    date === '' ? '' : date, // Ensure empty string stays empty string
    date && date !== '' ? `${date} 14:30:00` : null,
    generateRandomDate(1990, 2000),
    generateRandomDateTime(2023, 2023),
    new Date().toISOString(),
    new Date().toISOString(),
  ])

  return createMockExcelData({
    headers: [
      'Name',
      'Age',
      'City',
      'Salary',
      'Edge Case Dates',
      'Edge Case Datetimes',
      'Birth Date',
      'Meeting Time',
      'Created At',
      'Updated At',
    ],
    rows,
    metadata: {
      fileName: 'test-data-with-date-edge-cases.xlsx',
      sheetNames: ['Sheet1'],
      activeSheet: 'Sheet1',
      totalRows: rows.length,
      totalColumns: 10,
      columns: [
        {
          name: 'Name',
          index: 0,
          type: 'string',
          uniqueValues: rows.map((row) => row[0]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][0]],
        },
        {
          name: 'Age',
          index: 1,
          type: 'number',
          uniqueValues: rows.map((row) => row[1]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][1]],
        },
        {
          name: 'City',
          index: 2,
          type: 'string',
          uniqueValues: rows.map((row) => row[2]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][2]],
        },
        {
          name: 'Salary',
          index: 3,
          type: 'number',
          uniqueValues: rows.map((row) => row[3]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][3]],
        },
        {
          name: 'Edge Case Dates',
          index: 4,
          type: 'date',
          uniqueValues: edgeCaseDates.filter((d) => d !== null && d !== ''),
          uniqueCount: edgeCaseDates.filter((d) => d !== null && d !== '').length,
          hasNulls: true,
          nullCount: edgeCaseDates.filter((d) => d === null || d === '').length,
          sampleValues: [edgeCaseDates[0]],
        },
        {
          name: 'Edge Case Datetimes',
          index: 5,
          type: 'date',
          uniqueValues: edgeCaseDates
            .filter((d) => d !== null && d !== '')
            .map((d) => `${d} 14:30:00`),
          uniqueCount: edgeCaseDates.filter((d) => d !== null && d !== '').length,
          hasNulls: true,
          nullCount: edgeCaseDates.filter((d) => d === null).length,
          sampleValues: [edgeCaseDates[0] ? `${edgeCaseDates[0]} 14:30:00` : null],
        },
        {
          name: 'Birth Date',
          index: 6,
          type: 'date',
          uniqueValues: rows.map((row) => row[7]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][7]],
        },
        {
          name: 'Meeting Time',
          index: 7,
          type: 'date',
          uniqueValues: rows.map((row) => row[8]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][8]],
        },
        {
          name: 'Created At',
          index: 8,
          type: 'date',
          uniqueValues: rows.map((row) => row[9]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][9]],
        },
        {
          name: 'Updated At',
          index: 9,
          type: 'date',
          uniqueValues: rows.map((row) => row[10]),
          uniqueCount: rows.length,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [rows[0][10]],
        },
      ],
      fileSize: 2048,
    },
    ...overrides,
  })
}

// Function to create a large dataset with date fields for performance testing
export function createLargeDateDataset(size: number = 1000): ExcelData {
  const headers = [
    'ID',
    'Name',
    'Join Date',
    'Last Login',
    'Birth Date',
    'Meeting Time',
    'Created At',
    'Updated At',
  ]

  const rows = []

  for (let i = 1; i <= size; i++) {
    rows.push([
      i,
      `User ${i}`,
      generateRandomDate(2020, 2023),
      generateRandomDateTime(2023, 2023),
      generateRandomDate(1980, 2000),
      generateRandomDateTime(2023, 2023),
      new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString(),
    ])
  }

  return createMockExcelData({
    headers,
    rows,
    metadata: {
      fileName: 'large-date-dataset.xlsx',
      sheetNames: ['Sheet1'],
      activeSheet: 'Sheet1',
      totalRows: size,
      totalColumns: headers.length,
      columns: headers.map((header, index) => ({
        name: header,
        index,
        type: index === 0 ? 'number' : 'date',
        uniqueValues: [],
        uniqueCount: 0,
        hasNulls: false,
        nullCount: 0,
        sampleValues: [],
      })),
      fileSize: size * 100,
    },
  })
}

// Function to create mock filter configurations
export function createMockFilter(overrides?: Partial<FilterConfig>): FilterConfig {
  const defaultFilter: FilterConfig = {
    id: 'test-filter-1',
    displayName: 'Test Filter',
    column: 'Name',
    columnIndex: 0,
    type: 'select',
    active: true,
    operator: 'equals',
    values: [
      { value: 'John Doe', selected: true, count: 1 },
      { value: 'Jane Smith', selected: false, count: 1 },
      { value: 'Bob Johnson', selected: false, count: 1 },
    ],
  }

  return { ...defaultFilter, ...overrides }
}

// Function to create mock chart configurations
export function createMockChart(overrides?: Partial<ChartConfig>): ChartConfig {
  const defaultChart: ChartConfig = {
    id: 'test-chart-1',
    type: 'pie',
    title: 'Test Chart',
    dataColumn: 'City',
    labelColumn: 'Name',
    aggregation: 'sum',
    position: 'top' as any, // Using type assertion for now
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
        title: {
          display: false,
          text: '',
        },
        tooltip: {
          enabled: true,
        },
      },
    },
  }

  return { ...defaultChart, ...overrides }
}
