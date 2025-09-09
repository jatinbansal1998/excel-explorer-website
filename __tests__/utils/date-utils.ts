import { ExcelData } from '@/types/excel'

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
    if (value === null || value === undefined) return null
    if (value === '') return '' // Preserve empty strings
    return String(value)
  })
}

// Helper function to check if a string is a valid date
export function isValidDate(dateString: string): boolean {
  if (!dateString || dateString.trim() === '') return false

  // Additional validation for specific formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // YYYY-MM-DD HH:MM:SS
    /^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} [AP]M$/, // MM/DD/YYYY HH:MM AM/PM
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, // ISO format
  ]

  // Check if it matches one of our expected formats
  const matchesFormat = formats.some((format) => format.test(dateString))
  if (!matchesFormat) return false

  // For specific formats, extract components manually to avoid Date parsing issues
  let year, month, day

  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // YYYY-MM-DD format
    const parts = dateString.split('-')
    year = parseInt(parts[0])
    month = parseInt(parts[1])
    day = parseInt(parts[2])
  } else if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    // MM/DD/YYYY format
    const parts = dateString.split('/')
    year = parseInt(parts[2])
    month = parseInt(parts[0])
    day = parseInt(parts[1])
  } else if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    // DD-MM-YYYY format
    const parts = dateString.split('-')
    year = parseInt(parts[2])
    month = parseInt(parts[1])
    day = parseInt(parts[0])
  } else {
    // For datetime formats, use Date object
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return false
    year = date.getFullYear()
    month = date.getMonth() + 1
    day = date.getDate()
  }

  // Validate ranges
  if (year < 1000 || year > 9999) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  // Check for specific invalid dates
  if (month === 2 && day > 29) return false // February can't have more than 29 days
  if (month === 2 && day === 29 && !isLeapYear(year)) return false // February 29th only on leap years
  if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) return false // 30-day months

  return true
}

// Helper function to check leap year
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

// Helper function to normalize date string for testing
export function normalizeDateString(dateString: string): string {
  if (!dateString) return ''

  // First check if it's a valid date using our stricter validation
  if (!isValidDate(dateString)) return dateString

  // Parse the date manually to avoid timezone issues
  let year, month, day

  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // YYYY-MM-DD format
    const parts = dateString.split('-')
    year = parseInt(parts[0])
    month = parseInt(parts[1])
    day = parseInt(parts[2])
  } else if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    // MM/DD/YYYY format
    const parts = dateString.split('/')
    year = parseInt(parts[2])
    month = parseInt(parts[0])
    day = parseInt(parts[1])
  } else if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    // DD-MM-YYYY format
    const parts = dateString.split('-')
    year = parseInt(parts[2])
    month = parseInt(parts[1])
    day = parseInt(parts[0])
  } else {
    // For other formats, use Date object but adjust for timezone
    const date = new Date(dateString)
    year = date.getFullYear()
    month = date.getMonth() + 1
    day = date.getDate()
  }

  // Format as YYYY-MM-DD
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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
