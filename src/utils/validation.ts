import {DataType} from '@/types/excel'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class FileValidator {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  private static readonly ALLOWED_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ]

  static validateFile(file: File): ValidationResult {
    const errors: string[] = []

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(
        `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.MAX_FILE_SIZE)})`,
      )
    }

    // Check file type
    if (!this.isValidFileType(file)) {
      errors.push(
        `File type "${file.type}" is not supported. Please use .xlsx, .xls, or .csv files.`,
      )
    }

    // Check file extension as fallback
    if (!this.isValidFileExtension(file.name)) {
      errors.push(
        `File extension is not supported. Please use files with .xlsx, .xls, or .csv extensions.`,
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.getWarnings(file),
    }
  }

  static validateFileSize(file: File, maxSizeMB: number = 100): ValidationResult {
    const maxSize = maxSizeMB * 1024 * 1024
    const errors: string[] = []

    if (file.size > maxSize) {
      errors.push(
        `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`,
      )
    }

    if (file.size === 0) {
      errors.push('File appears to be empty')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    }
  }

  static validateFileName(fileName: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for invalid characters
    const invalidChars = /[<>:"|?*]/
    if (invalidChars.test(fileName)) {
      errors.push('File name contains invalid characters')
    }

    // Check length
    if (fileName.length > 255) {
      errors.push('File name is too long (maximum 255 characters)')
    }

    // Check for reserved names (Windows)
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ]
    const nameWithoutExtension = fileName.split('.')[0].toUpperCase()
    if (reservedNames.includes(nameWithoutExtension)) {
      errors.push('File name uses a reserved system name')
    }

    // Warnings for non-ASCII characters
    if (!/^[\x00-\x7F]*$/.test(fileName)) {
      warnings.push('File name contains non-ASCII characters which may cause compatibility issues')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private static isValidFileType(file: File): boolean {
    return this.ALLOWED_TYPES.includes(file.type)
  }

  private static isValidFileExtension(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop()
    return ['xlsx', 'xls', 'csv'].includes(extension || '')
  }

  private static getWarnings(file: File): string[] {
    const warnings: string[] = []

    // Large file warning
    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      warnings.push('Large file detected. Processing may take longer than usual.')
    }

    // Old Excel format warning
    if (file.name.toLowerCase().endsWith('.xls')) {
      warnings.push('Old Excel format detected. Consider using .xlsx for better compatibility.')
    }

    // Empty type warning
    if (!file.type) {
      warnings.push('File type could not be determined. Relying on file extension.')
    }

    return warnings
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export class DataValidator {
  static validateColumnData(data: unknown[], columnType: DataType): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    let validCount = 0
    let nullCount = 0

    data.forEach((value, _index) => {
      if (value === null || value === undefined || value === '') {
        nullCount++
        return
      }

      if (this.isValidForType(value, columnType)) {
        validCount++
      } else {
        if (errors.length < 5) {
          // Limit error messages
          errors.push(`Invalid ${columnType} value at row ${_index + 1}: ${value}`)
        }
      }
    })

    // Add warnings for data quality issues
    if (nullCount > data.length * 0.5) {
      warnings.push(
        `Column has ${nullCount} null values (${Math.round((nullCount / data.length) * 100)}% of data)`,
      )
    }

    if (validCount < data.length * 0.8) {
      warnings.push(
        `Column has low data quality: only ${Math.round((validCount / data.length) * 100)}% of values match expected type`,
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateDataRange(data: unknown[][], expectedColumns?: number): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (data.length === 0) {
      errors.push('Data is empty')
      return { isValid: false, errors, warnings }
    }

    // Check for consistent column count
    const firstRowLength = data[0].length
    const inconsistentRows: number[] = []

    data.forEach((row, index) => {
      if (row.length !== firstRowLength) {
        inconsistentRows.push(index + 1)
      }
    })

    if (inconsistentRows.length > 0) {
      if (inconsistentRows.length < 10) {
        errors.push(`Inconsistent column count in rows: ${inconsistentRows.join(', ')}`)
      } else {
        errors.push(`${inconsistentRows.length} rows have inconsistent column counts`)
      }
    }

    // Check expected columns
    if (expectedColumns && firstRowLength !== expectedColumns) {
      warnings.push(`Expected ${expectedColumns} columns, but found ${firstRowLength}`)
    }

    // Check for completely empty rows
    const emptyRows = data.filter((row, _index) =>
      row.every((cell) => cell === null || cell === undefined || cell === ''),
    ).length

    if (emptyRows > 0) {
      warnings.push(`Found ${emptyRows} completely empty rows`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateNumericColumn(data: unknown[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const numericValues: number[] = []

    data.forEach((value, _index) => {
      if (value === null || value === undefined || value === '') {
        return // Skip null values
      }

      const numValue = Number(value)
      if (isNaN(numValue)) {
        if (errors.length < 5) {
          errors.push(`Non-numeric value at row ${_index + 1}: ${value}`)
        }
      } else {
        numericValues.push(numValue)
      }
    })

    // Statistical warnings
    if (numericValues.length > 0) {
      const min = Math.min(...numericValues)
      const max = Math.max(...numericValues)
      const range = max - min

      if (range === 0) {
        warnings.push('All numeric values are identical')
      }

      // Check for potential outliers (simple method)
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
      const outliers = numericValues.filter((v) => Math.abs(v - mean) > range * 2)

      if (outliers.length > 0) {
        warnings.push(`Potential outliers detected: ${outliers.length} values`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateDateColumn(data: unknown[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const dateValues: Date[] = []

    data.forEach((value, _index) => {
      if (value === null || value === undefined || value === '') {
        return // Skip null values
      }

      const dateValue = new Date(value)
      if (isNaN(dateValue.getTime())) {
        if (errors.length < 5) {
          errors.push(`Invalid date value at row ${_index + 1}: ${value}`)
        }
      } else {
        dateValues.push(dateValue)
      }
    })

    // Date range warnings
    if (dateValues.length > 0) {
      const _minDate = new Date(Math.min(...dateValues.map((d) => d.getTime())))
      const _maxDate = new Date(Math.max(...dateValues.map((d) => d.getTime())))

      // Check for future dates
      const now = new Date()
      const futureDates = dateValues.filter((d) => d > now)
      if (futureDates.length > 0) {
        warnings.push(`${futureDates.length} dates are in the future`)
      }

      // Check for very old dates
      const oldThreshold = new Date('1900-01-01')
      const oldDates = dateValues.filter((d) => d < oldThreshold)
      if (oldDates.length > 0) {
        warnings.push(`${oldDates.length} dates are before 1900`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private static isValidForType(value: unknown, type: DataType): boolean {
    switch (type) {
      case 'number':
        return !isNaN(Number(value))
      case 'date':
        return !isNaN(Date.parse(value as string))
      case 'boolean':
        return (
          typeof value === 'boolean' ||
          ['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase())
        )
      case 'string':
        return typeof value === 'string' || value != null
      default:
        return true
    }
  }
}

// Additional utility validators
export class SchemaValidator {
  static validateHeaders(headers: string[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for empty headers
    const emptyHeaders = headers
      .map((h, i) => ({ header: h, index: i }))
      .filter(({ header }) => !header || header.trim() === '')

    if (emptyHeaders.length > 0) {
      errors.push(
        `Empty headers found at columns: ${emptyHeaders.map((h) => h.index + 1).join(', ')}`,
      )
    }

    // Check for duplicate headers
    const duplicates = headers.filter(
      (header, index) => headers.indexOf(header) !== index && header.trim() !== '',
    )

    if (duplicates.length > 0) {
      warnings.push(`Duplicate headers found: ${[...new Set(duplicates)].join(', ')}`)
    }

    // Check for very long headers
    const longHeaders = headers.filter((h) => h && h.length > 100)
    if (longHeaders.length > 0) {
      warnings.push(`${longHeaders.length} headers are very long (>100 characters)`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
