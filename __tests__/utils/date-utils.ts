import { ExcelData } from '../../src/types/excel'

// Helper function to get date columns from Excel data
export function getDateColumns(data: ExcelData): string[] {
  return data.metadata.columns.filter((col) => col.type === 'date').map((col) => col.name)
}

// Helper function to get date values from a specific column
export function getDateValues(data: ExcelData, columnName: string): (string | null)[] {
  const columnIndex = data.headers.indexOf(columnName)
  if (columnIndex === -1) return []

  return data.rows.map((row) => {
    const value = row[columnIndex]
    return value === null || value === undefined || value === '' ? null : String(value)
  })
}

// Helper function to check if a string is a valid date
export function isValidDate(dateString: string): boolean {
  if (!dateString || dateString.trim() === '') return false

  // Try different date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // YYYY-MM-DD HH:MM:SS
    /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/, // MM/DD/YYYY HH:MM:SS
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, // ISO format
  ]

  return formats.some((format) => format.test(dateString))
}

// Helper function to normalize date string for testing
export function normalizeDateString(dateString: string): string {
  if (!dateString) return ''

  // Convert different formats to ISO format for consistent testing
  const date = new Date(dateString)

  // Check if the date is valid
  if (isNaN(date.getTime())) return dateString

  // Return ISO format
  return date.toISOString().split('T')[0]
}

// Helper function to get date statistics
export function getDateStatistics(
  data: ExcelData,
  columnName: string,
): {
  min: string | null
  max: string | null
  count: number
  nullCount: number
  uniqueCount: number
} {
  const values = getDateValues(data, columnName)
  const validDates = values.filter((val) => val && isValidDate(val))

  if (validDates.length === 0) {
    return {
      min: null,
      max: null,
      count: 0,
      nullCount: values.length - validDates.length,
      uniqueCount: 0,
    }
  }

  const dateObjects = validDates
    .map((val) => new Date(val!))
    .filter((date) => !isNaN(date.getTime()))

  const sortedDates = dateObjects.sort((a, b) => a.getTime() - b.getTime())

  return {
    min: sortedDates[0]?.toISOString().split('T')[0] || null,
    max: sortedDates[sortedDates.length - 1]?.toISOString().split('T')[0] || null,
    count: validDates.length,
    nullCount: values.length - validDates.length,
    uniqueCount: new Set(validDates).size,
  }
}

// Helper function to generate test cases for date parsing
export function generateDateParseTestCases(): Array<{
  input: string | null
  expected: string | null
  description: string
}> {
  return [
    // Valid dates
    { input: '2023-01-15', expected: '2023-01-15', description: 'ISO date format' },
    { input: '01/15/2023', expected: '2023-01-15', description: 'US date format' },
    { input: '15-01-2023', expected: '2023-01-15', description: 'European date format' },
    { input: '2023-01-15 14:30:00', expected: '2023-01-15', description: 'ISO datetime format' },
    { input: '01/15/2023 2:30 PM', expected: '2023-01-15', description: 'US datetime with AM/PM' },
    {
      input: '2023-01-15T14:30:00Z',
      expected: '2023-01-15',
      description: 'ISO datetime with timezone',
    },

    // Invalid dates
    { input: '', expected: null, description: 'Empty string' },
    { input: null, expected: null, description: 'Null value' },
    { input: 'Invalid Date', expected: null, description: 'Invalid date string' },
    { input: '2023-02-30', expected: null, description: 'Invalid date (February 30th)' },
    { input: '2023-13-01', expected: null, description: 'Invalid month' },
    { input: '2023-01-32', expected: null, description: 'Invalid day' },
    { input: '0000-00-00', expected: null, description: 'Zero date' },
  ]
}
