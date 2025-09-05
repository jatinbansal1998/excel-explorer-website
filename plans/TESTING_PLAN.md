# Excel Explorer - Testing Plan

## Testing Strategy Overview

### Testing Framework Stack
- **Unit Testing**: Jest + React Testing Library
- **Component Testing**: React Testing Library with @testing-library/jest-dom
- **Integration Testing**: Jest with mock file API
- **End-to-End Testing**: Playwright or Cypress (optional)
- **Performance Testing**: Custom utilities with performance monitoring

## Test Structure

```
src/
├── __tests__/
│   ├── components/
│   │   ├── FileUploader.test.tsx
│   │   ├── DataTable.test.tsx
│   │   ├── FilterPanel.test.tsx
│   │   └── ChartView.test.tsx
│   ├── services/
│   │   ├── excelParser.test.ts
│   │   ├── dataFilter.test.ts
│   │   └── chartService.test.ts
│   ├── hooks/
│   │   ├── useExcelData.test.ts
│   │   └── useFilters.test.ts
│   └── utils/
│       ├── dataTypes.test.ts
│       └── fileValidation.test.ts
├── __mocks__/
│   ├── fileMock.js
│   └── testData/
│       ├── sample.xlsx
│       ├── large-dataset.xlsx
│       └── malformed.xlsx
└── test-utils/
    ├── renderWithProviders.tsx
    └── mockFileAPI.ts
```

## Test Categories

### 1. Unit Tests

#### Excel Parser Service (`src/services/excelParser.test.ts`)
```typescript
describe('ExcelParser', () => {
  test('should parse valid Excel file correctly')
  test('should extract headers from first row')
  test('should detect column data types')
  test('should handle empty cells')
  test('should parse multiple sheets')
  test('should reject invalid file formats')
  test('should handle large files without memory overflow')
})
```

#### Data Type Detection (`src/utils/dataTypes.test.ts`)
```typescript
describe('DataTypes', () => {
  test('should detect numeric columns')
  test('should detect date columns')
  test('should detect boolean columns')
  test('should detect string columns')
  test('should handle mixed data types')
  test('should identify null values')
})
```

#### File Validation (`src/utils/fileValidation.test.ts`)
```typescript
describe('FileValidation', () => {
  test('should accept valid Excel extensions')
  test('should reject invalid file types')
  test('should validate file size limits')
  test('should detect corrupted files')
})
```

### 2. Component Tests

#### File Uploader (`src/components/__tests__/FileUploader.test.tsx`)
```typescript
describe('FileUploader', () => {
  test('should render drag & drop area')
  test('should handle file selection via input')
  test('should handle drag & drop events')
  test('should show loading state during upload')
  test('should display error for invalid files')
  test('should call onFileUpload callback with parsed data')
})
```

#### Data Table (`src/components/__tests__/DataTable.test.tsx`)
```typescript
describe('DataTable', () => {
  test('should render table with headers and data')
  test('should handle sorting by column')
  test('should implement virtual scrolling for large datasets')
  test('should apply filters correctly')
  test('should handle empty data state')
  test('should format cells based on data type')
})
```

#### Filter Panel (`src/components/__tests__/FilterPanel.test.tsx`)
```typescript
describe('FilterPanel', () => {
  test('should generate appropriate filters for each column type')
  test('should render multi-select for categorical data')
  test('should render range inputs for numeric data')
  test('should render date pickers for date columns')
  test('should apply filters when values change')
  test('should clear all filters')
})
```

### 3. Integration Tests

#### Complete Data Flow (`src/__tests__/integration/dataFlow.test.ts`)
```typescript
describe('Data Flow Integration', () => {
  test('should process Excel file from upload to table display')
  test('should apply filters and update table data')
  test('should generate charts from filtered data')
  test('should export filtered data correctly')
})
```

#### Filter System (`src/__tests__/integration/filtering.test.ts`)
```typescript
describe('Filtering System', () => {
  test('should filter data across multiple columns')
  test('should handle complex filter combinations')
  test('should update charts when filters change')
  test('should maintain filter state on data refresh')
})
```

### 4. Performance Tests

#### Large Dataset Handling (`src/__tests__/performance/largeData.test.ts`)
```typescript
describe('Performance Tests', () => {
  test('should process 10k+ rows without blocking UI', { timeout: 10000 })
  test('should handle virtual scrolling efficiently')
  test('should debounce filter updates')
  test('should not cause memory leaks with large files')
})
```

### 5. Error Handling Tests

#### Error Scenarios (`src/__tests__/errorHandling.test.ts`)
```typescript
describe('Error Handling', () => {
  test('should handle corrupted Excel files gracefully')
  test('should show user-friendly error messages')
  test('should recover from parser errors')
  test('should handle browser memory limitations')
  test('should validate file before processing')
})
```

## Mock Data & Test Utilities

### Test Data Files
- `sample.xlsx`: Small valid Excel file with mixed data types
- `large-dataset.xlsx`: 50k+ rows for performance testing
- `malformed.xlsx`: Corrupted file for error testing
- `multi-sheet.xlsx`: Multiple worksheets
- `empty.xlsx`: Empty file
- `text-only.csv`: CSV alternative format

### Mock Implementations

#### File API Mock (`src/test-utils/mockFileAPI.ts`)
```typescript
export const mockFile = (content: string, name: string, type: string): File => {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

export const mockFileReader = () => {
  // Mock FileReader implementation
}
```

#### Custom Render Utility (`src/test-utils/renderWithProviders.tsx`)
```typescript
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  // Render with any context providers
}
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Test Setup (`src/test-setup.ts`)
```typescript
import '@testing-library/jest-dom'
import 'jest-canvas-mock'

// Mock File API
global.File = class MockFile {
  constructor(parts, name, options) {
    this.name = name
    this.type = options?.type || ''
    this.size = parts.reduce((acc, part) => acc + part.length, 0)
  }
}

// Mock FileReader
global.FileReader = class MockFileReader {
  readAsArrayBuffer = jest.fn()
  result = null
  onload = null
  onerror = null
}
```

## Testing Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:performance": "jest --testNamePattern='Performance'",
    "test:integration": "jest --testPathPattern='integration'",
    "test:e2e": "playwright test"
  }
}
```

## Continuous Testing

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:ci"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

### GitHub Actions CI/CD
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - run: npm run build
```

## Test Coverage Goals

### Coverage Targets
- **Overall Coverage**: 85%+
- **Critical Components**: 90%+ (FileUploader, DataTable, ExcelParser)
- **Utility Functions**: 95%+
- **Error Handling Paths**: 80%+

### Coverage Reporting
- Generate HTML coverage reports
- Track coverage trends over time
- Fail builds if coverage drops below threshold

## Manual Testing Checklist

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### File Format Support
- [ ] .xlsx files
- [ ] .xls files  
- [ ] .csv files
- [ ] Large files (>10MB)
- [ ] Files with special characters
- [ ] Empty files
- [ ] Password-protected files (should fail gracefully)

### User Experience
- [ ] Drag & drop functionality
- [ ] Loading states
- [ ] Error messages
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

This comprehensive testing plan ensures robust validation of all Excel Explorer functionality while maintaining high code quality and user experience standards.