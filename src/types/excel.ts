// Canonical cell/row types used across the app
export type CellValue = string | number | boolean | Date
export type NullableCellValue = CellValue | null
export type DataRow = CellValue[]
export type NullableDataRow = NullableCellValue[]
export type DataMatrix = DataRow[]
export type NullableDataMatrix = NullableDataRow[]

export interface ExcelData {
  headers: string[]
  rows: DataMatrix
  metadata: ExcelMetadata
}

export interface ExcelMetadata {
  fileName: string
  sheetNames: string[]
  activeSheet: string
  totalRows: number
  totalColumns: number
  columns: ColumnInfo[]
  fileSize: number
  lastModified?: Date
}

export interface ColumnInfo {
  name: string
  index: number
  type: DataType
  uniqueValues: unknown[]
  uniqueCount: number
  hasNulls: boolean
  nullCount: number
  sampleValues: unknown[]
  statistics?: ColumnStatistics
}

export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'mixed'

export interface ColumnStatistics {
  min?: number | Date
  max?: number | Date
  average?: number
  median?: number
  mode?: unknown
}

export interface ValidationResult {
  path: string // e.g., column name or general
  level: 'info' | 'warning' | 'error'
  message: string
}

// Parsing progress reporting
export type ParseProgressStage =
  | 'validating'
  | 'reading'
  | 'parsing_workbook'
  | 'extracting_headers'
  | 'building_rows'
  | 'analyzing_columns'
  | 'complete'

export interface ParseProgressEvent {
  stage: ParseProgressStage
  loaded?: number
  total?: number
  percent?: number
  message?: string
  sheetName?: string
}

export interface ParseOptions {
  sheetName?: string
  // If false, skip computing column statistics during initial parse for speed
  computeStatistics?: boolean
  // Caps to control memory/CPU usage during metadata extraction
  uniqueValuesTrackingCap?: number // how many unique values to track internally per column
  uniqueValuesReturnLimit?: number // how many unique values to return in metadata per column
  sampleValuesCount?: number // how many sample values to store per column
  // Progress callback invoked during parsing
  progress?: (event: ParseProgressEvent) => void
}
