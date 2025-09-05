# Plan 02: File Processing & Data Handling

## Engineer Assignment
**Primary Engineer**: Backend/Data Engineer
**Dependencies**: Plan 01 (Infrastructure) must be completed first
**Estimated Time**: 2-3 days

## Overview
Implement Excel file parsing, data type detection, and core data structures. This plan focuses on the data pipeline that powers the entire application.

## Deliverables

### 1. Excel File Processing Engine
- [ ] Install and configure SheetJS (xlsx) library
- [ ] Create ExcelParser service class
- [ ] Handle multiple sheet processing
- [ ] Implement error handling for corrupted files
- [ ] Support for .xlsx, .xls, and .csv formats

### 2. Data Type Detection System
- [ ] Implement automatic column type detection
- [ ] Handle mixed data types gracefully
- [ ] Detect date formats and parse correctly
- [ ] Identify numeric vs text columns
- [ ] Handle null/empty value patterns

### 3. Core Data Structures
- [ ] Define TypeScript interfaces for all data types
- [ ] Implement data transformation utilities
- [ ] Create column metadata extraction
- [ ] Build data validation functions

## Dependencies to Install
```json
{
  "xlsx": "^0.18.5",
  "@types/file-saver": "^2.0.5",
  "file-saver": "^2.0.5"
}
```

## Core Interfaces to Implement

### Data Types (src/types/excel.ts)
```typescript
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
```

### Services to Implement (src/services/excelParser.ts)
```typescript
export class ExcelParser {
  async parseFile(file: File): Promise<ExcelData>;
  parseWorkbook(workbook: any, sheetName?: string): ExcelData;
  detectColumnTypes(data: any[][]): ColumnInfo[];
  calculateStatistics(column: any[], type: DataType): ColumnStatistics;
  extractHeaders(firstRow: any[]): string[];
  validateData(data: ExcelData): ValidationResult[];
}
```

## Implementation Tasks

### 1. Excel Parser Service
```typescript
// Core parsing functionality
- File reading with FileReader API
- Workbook parsing with SheetJS
- Sheet selection and data extraction
- Memory optimization for large files
- Progress tracking for UI feedback
```

### 2. Data Type Detection (src/utils/dataTypes.ts)
```typescript
// Smart type detection
- Number pattern recognition
- Date format detection (multiple formats)
- Boolean value identification
- Mixed type handling strategies
- Null/undefined handling
```

### 3. Column Analysis
```typescript
// Statistical analysis
- Unique value extraction and counting
- Basic statistics calculation
- Sample data for UI previews
- Memory-efficient processing for large datasets
```

## Error Handling Requirements
- [ ] File format validation
- [ ] File size limits and warnings
- [ ] Corrupted file detection
- [ ] Memory usage monitoring
- [ ] Graceful degradation for unsupported features

## Performance Considerations
- [ ] Web Worker integration for large file processing
- [ ] Streaming data processing where possible
- [ ] Memory cleanup after processing
- [ ] Progress callbacks for UI updates
- [ ] Lazy loading of column statistics

## Testing Requirements
- [ ] Unit tests for type detection algorithms
- [ ] Test files with various Excel formats
- [ ] Edge case handling (empty files, single cell, etc.)
- [ ] Performance benchmarks with large datasets
- [ ] Memory usage testing

## Handoff Specifications

### Data Format Contract
The parsed data must conform to the ExcelData interface and be ready for:
- Filter operations (Plan 04)
- Table rendering (Plan 03)
- Chart generation (Plan 05)
- Export functionality (Plan 06)

### Integration Points
```typescript
// Hook interface for other teams
export function useExcelData() {
  return {
    parseFile: (file: File) => Promise<ExcelData>,
    currentData: ExcelData | null,
    isLoading: boolean,
    error: string | null,
    reset: () => void
  };
}
```

## Files to Create
- [ ] `src/services/excelParser.ts` - Main parsing logic
- [ ] `src/utils/dataTypes.ts` - Type detection utilities
- [ ] `src/hooks/useExcelData.ts` - React hook for data management
- [ ] `src/types/excel.ts` - All TypeScript interfaces
- [ ] `src/utils/fileValidation.ts` - File validation utilities

## Validation Criteria
- [ ] Successfully parses sample Excel files
- [ ] Correctly identifies column types
- [ ] Handles edge cases without crashing
- [ ] Memory usage stays reasonable (<500MB for 100k rows)
- [ ] Processing time acceptable (<10s for typical files)

## Notes for Other Teams
- **UI Team**: useExcelData hook will provide loading states and error handling
- **Filter Team**: ColumnInfo interface contains everything needed for filter generation
- **Chart Team**: Statistical data and type information available in metadata
- **Export Team**: Original data format preserved for re-export