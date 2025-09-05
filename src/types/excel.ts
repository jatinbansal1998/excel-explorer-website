export interface ExcelData {
  headers: string[];
  rows: any[][];
  metadata: ExcelMetadata;
}

export interface ExcelMetadata {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  totalRows: number;
  totalColumns: number;
  columns: ColumnInfo[];
  fileSize: number;
  lastModified?: Date;
}

export interface ColumnInfo {
  name: string;
  index: number;
  type: DataType;
  uniqueValues: any[];
  uniqueCount: number;
  hasNulls: boolean;
  nullCount: number;
  sampleValues: any[];
  statistics?: ColumnStatistics;
}

export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'mixed';

export interface ColumnStatistics {
  min?: number | Date;
  max?: number | Date;
  average?: number;
  median?: number;
  mode?: any;
}

export interface ValidationResult {
  path: string; // e.g., column name or general
  level: 'info' | 'warning' | 'error';
  message: string;
}
