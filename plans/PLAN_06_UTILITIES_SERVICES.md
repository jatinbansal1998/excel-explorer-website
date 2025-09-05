# Plan 06: Utilities & Supporting Services

## Engineer Assignment
**Primary Engineer**: Full-Stack/Utils Engineer  
**Dependencies**: Can work in parallel with all other plans after Plan 01
**Estimated Time**: 2-3 days
**Integration Point**: All other plans depend on these utilities

## Overview
Implement supporting utilities, error handling, performance monitoring, data export functionality, and cross-cutting concerns that enhance the overall application experience.

## Deliverables

### 1. Error Handling System
- [ ] Global error boundary implementation
- [ ] User-friendly error messages
- [ ] Error logging and reporting
- [ ] Retry mechanisms for recoverable errors

### 2. Export & Import System
- [ ] Filtered data export to CSV/Excel
- [ ] Chart export to PNG/SVG
- [ ] Configuration import/export
- [ ] Data sharing utilities

### 3. Performance Monitoring
- [ ] File processing performance tracking
- [ ] Memory usage monitoring
- [ ] User interaction analytics
- [ ] Performance optimization utilities

### 4. Utility Functions
- [ ] Data formatting and validation
- [ ] File size and type validation
- [ ] Browser compatibility detection
- [ ] Local storage management

## Dependencies to Install
```json
{
  "file-saver": "^2.0.5",
  "@types/file-saver": "^2.0.5",
  "lodash.debounce": "^4.0.8",
  "@types/lodash.debounce": "^4.0.9",
  "uuid": "^9.0.1",
  "@types/uuid": "^9.0.7"
}
```

## Core Utilities

### 1. Error Handling (src/utils/errorHandling.ts)
```typescript
export enum ErrorType {
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_SIZE_ERROR = 'FILE_SIZE_ERROR',
  FILE_TYPE_ERROR = 'FILE_TYPE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  BROWSER_ERROR = 'BROWSER_ERROR',
  FILTER_ERROR = 'FILTER_ERROR',
  CHART_ERROR = 'CHART_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  timestamp: Date;
  context?: Record<string, any>;
  recoverable: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!this.instance) {
      this.instance = new ErrorHandler();
    }
    return this.instance;
  }

  createError(
    type: ErrorType, 
    message: string, 
    originalError?: Error,
    context?: Record<string, any>
  ): AppError {
    const error: AppError = {
      type,
      message,
      originalError,
      timestamp: new Date(),
      context,
      recoverable: this.isRecoverable(type)
    };
    
    this.logError(error);
    this.errors.push(error);
    
    return error;
  }

  getErrorMessage(error: AppError): string {
    const userMessages = {
      [ErrorType.FILE_READ_ERROR]: 'Unable to read the selected file. Please try again.',
      [ErrorType.FILE_SIZE_ERROR]: 'File is too large. Please select a smaller file.',
      [ErrorType.FILE_TYPE_ERROR]: 'Unsupported file type. Please select an Excel or CSV file.',
      [ErrorType.PARSE_ERROR]: 'Unable to parse the file. Please check if it\'s a valid Excel file.',
      [ErrorType.MEMORY_ERROR]: 'Not enough memory to process this file. Try a smaller file.',
      [ErrorType.BROWSER_ERROR]: 'Browser compatibility issue detected.',
      [ErrorType.FILTER_ERROR]: 'Error applying filters. Filters have been reset.',
      [ErrorType.CHART_ERROR]: 'Unable to generate chart with current data.'
    };
    
    return userMessages[error.type] || 'An unexpected error occurred.';
  }

  private isRecoverable(type: ErrorType): boolean {
    return [
      ErrorType.FILTER_ERROR,
      ErrorType.CHART_ERROR
    ].includes(type);
  }

  private logError(error: AppError): void {
    console.error(`[${error.type}] ${error.message}`, error.originalError);
    
    // In production, send to error reporting service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${error.type}: ${error.message}`,
        fatal: !error.recoverable
      });
    }
  }

  getRecentErrors(): AppError[] {
    return this.errors.slice(-10);
  }

  clearErrors(): void {
    this.errors = [];
  }
}
```

### 2. Export Service (src/utils/exportUtils.ts)
```typescript
export class ExportService {
  exportToCSV(
    data: any[][], 
    headers: string[], 
    filename: string
  ): void {
    try {
      const csvContent = this.convertToCSV(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    } catch (error) {
      throw ErrorHandler.getInstance().createError(
        ErrorType.FILE_READ_ERROR,
        'Failed to export CSV file',
        error as Error
      );
    }
  }

  exportToExcel(
    data: any[][], 
    headers: string[], 
    filename: string,
    sheetName: string = 'Sheet1'
  ): void {
    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      // Style the header row
      const headerRange = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: headers.length - 1, r: 0 }
      });
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      });
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, `${filename}.xlsx`);
    } catch (error) {
      throw ErrorHandler.getInstance().createError(
        ErrorType.FILE_READ_ERROR,
        'Failed to export Excel file',
        error as Error
      );
    }
  }

  exportFilterConfig(filters: FilterConfig[], filename: string): void {
    try {
      const config = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        filters: filters.map(f => ({
          column: f.column,
          type: f.type,
          values: f.values,
          active: f.active
        }))
      };
      
      const json = JSON.stringify(config, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      saveAs(blob, `${filename}-filters.json`);
    } catch (error) {
      throw ErrorHandler.getInstance().createError(
        ErrorType.FILE_READ_ERROR,
        'Failed to export filter configuration',
        error as Error
      );
    }
  }

  private convertToCSV(data: any[][], headers: string[]): string {
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerRow = headers.map(escapeCSV).join(',');
    const dataRows = data.map(row => 
      row.map(escapeCSV).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n');
  }
}
```

### 3. Performance Monitor (src/utils/performanceMonitor.ts)
```typescript
export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  startTiming(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    this.metrics.set(name, metric);
  }

  endTiming(name: string): PerformanceMetric | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No timing started for: ${name}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    this.completedMetrics.push(metric);
    this.metrics.delete(name);
    
    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
    }
    
    return metric;
  }

  measureAsync<T>(
    name: string, 
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startTiming(name, metadata);
      try {
        const result = await operation();
        this.endTiming(name);
        resolve(result);
      } catch (error) {
        this.endTiming(name);
        reject(error);
      }
    });
  }

  getMetrics(): PerformanceMetric[] {
    return this.completedMetrics.slice();
  }

  getAverageTime(operationName: string): number {
    const operations = this.completedMetrics.filter(m => m.name === operationName);
    if (operations.length === 0) return 0;
    
    const totalTime = operations.reduce((sum, op) => sum + (op.duration || 0), 0);
    return totalTime / operations.length;
  }

  clearMetrics(): void {
    this.completedMetrics = [];
  }

  // Memory monitoring
  getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  logMemoryUsage(context: string): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(`Memory usage (${context}):`, {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      });
    }
  }
}
```

### 4. Validation Utilities (src/utils/validation.ts)
```typescript
export class FileValidator {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly ALLOWED_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  static validateFile(file: File): ValidationResult {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.MAX_FILE_SIZE)})`);
    }
    
    // Check file type
    if (!this.isValidFileType(file)) {
      errors.push(`File type "${file.type}" is not supported. Please use .xlsx, .xls, or .csv files.`);
    }
    
    // Check file extension as fallback
    if (!this.isValidFileExtension(file.name)) {
      errors.push(`File extension is not supported. Please use files with .xlsx, .xls, or .csv extensions.`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.getWarnings(file)
    };
  }

  private static isValidFileType(file: File): boolean {
    return this.ALLOWED_TYPES.includes(file.type);
  }

  private static isValidFileExtension(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return ['xlsx', 'xls', 'csv'].includes(extension || '');
  }

  private static getWarnings(file: File): string[] {
    const warnings: string[] = [];
    
    // Large file warning
    if (file.size > 50 * 1024 * 1024) { // 50MB
      warnings.push('Large file detected. Processing may take longer than usual.');
    }
    
    // Old Excel format warning
    if (file.name.toLowerCase().endsWith('.xls')) {
      warnings.push('Old Excel format detected. Consider using .xlsx for better compatibility.');
    }
    
    return warnings;
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DataValidator {
  static validateColumnData(data: any[], columnType: DataType): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    let validCount = 0;
    let nullCount = 0;
    
    data.forEach((value, index) => {
      if (value === null || value === undefined || value === '') {
        nullCount++;
        return;
      }
      
      if (this.isValidForType(value, columnType)) {
        validCount++;
      } else {
        if (errors.length < 5) { // Limit error messages
          errors.push(`Invalid ${columnType} value at row ${index + 1}: ${value}`);
        }
      }
    });
    
    // Add warnings for data quality issues
    if (nullCount > data.length * 0.5) {
      warnings.push(`Column has ${nullCount} null values (${Math.round(nullCount / data.length * 100)}% of data)`);
    }
    
    if (validCount < data.length * 0.8) {
      warnings.push(`Column has low data quality: only ${Math.round(validCount / data.length * 100)}% of values match expected type`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static isValidForType(value: any, type: DataType): boolean {
    switch (type) {
      case 'number':
        return !isNaN(Number(value));
      case 'date':
        return !isNaN(Date.parse(value));
      case 'boolean':
        return typeof value === 'boolean' || 
               ['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase());
      case 'string':
        return typeof value === 'string' || value != null;
      default:
        return true;
    }
  }
}
```

### 5. Browser Compatibility (src/utils/browserCompatibility.ts)
```typescript
export class BrowserCompatibility {
  static checkCompatibility(): CompatibilityReport {
    const features = {
      fileAPI: this.checkFileAPI(),
      webWorkers: this.checkWebWorkers(),
      canvas: this.checkCanvas(),
      localStorage: this.checkLocalStorage(),
      modern: this.checkModernFeatures()
    };
    
    const isCompatible = Object.values(features).every(Boolean);
    const warnings = this.getWarnings(features);
    
    return {
      isCompatible,
      features,
      warnings,
      recommendations: this.getRecommendations(features)
    };
  }

  private static checkFileAPI(): boolean {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
  }

  private static checkWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
  }

  private static checkCanvas(): boolean {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  }

  private static checkLocalStorage(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static checkModernFeatures(): boolean {
    return !!(
      Promise &&
      Array.prototype.includes &&
      Object.assign &&
      window.fetch
    );
  }

  private static getWarnings(features: Record<string, boolean>): string[] {
    const warnings: string[] = [];
    
    if (!features.fileAPI) {
      warnings.push('File API not supported. File upload may not work properly.');
    }
    
    if (!features.webWorkers) {
      warnings.push('Web Workers not supported. Large file processing may block the UI.');
    }
    
    if (!features.canvas) {
      warnings.push('Canvas not supported. Charts may not display properly.');
    }
    
    if (!features.localStorage) {
      warnings.push('Local Storage not supported. Settings cannot be saved.');
    }
    
    return warnings;
  }

  private static getRecommendations(features: Record<string, boolean>): string[] {
    const recommendations: string[] = [];
    
    if (!features.modern) {
      recommendations.push('Please update to a modern browser for the best experience.');
    }
    
    if (Object.values(features).some(f => !f)) {
      recommendations.push('Some features may be limited in your browser. Consider updating or switching browsers.');
    }
    
    return recommendations;
  }
}

interface CompatibilityReport {
  isCompatible: boolean;
  features: Record<string, boolean>;
  warnings: string[];
  recommendations: string[];
}
```

### 6. Local Storage Manager (src/utils/localStorage.ts)
```typescript
export class LocalStorageManager {
  private static readonly PREFIX = 'excel-explorer-';
  private static readonly KEYS = {
    RECENT_FILES: 'recent-files',
    USER_PREFERENCES: 'user-preferences',
    FILTER_PRESETS: 'filter-presets',
    CHART_CONFIGS: 'chart-configs'
  };

  static save<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now()
      });
      localStorage.setItem(this.PREFIX + key, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  static load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      return parsed.data;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  static remove(key: string): boolean {
    try {
      localStorage.removeItem(this.PREFIX + key);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  }

  static clear(): boolean {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX))
        .forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  // Specific data managers
  static saveRecentFile(fileInfo: RecentFileInfo): void {
    const recent = this.load<RecentFileInfo[]>(this.KEYS.RECENT_FILES) || [];
    const updated = [fileInfo, ...recent.filter(f => f.name !== fileInfo.name)].slice(0, 5);
    this.save(this.KEYS.RECENT_FILES, updated);
  }

  static getRecentFiles(): RecentFileInfo[] {
    return this.load<RecentFileInfo[]>(this.KEYS.RECENT_FILES) || [];
  }

  static saveUserPreferences(preferences: UserPreferences): void {
    this.save(this.KEYS.USER_PREFERENCES, preferences);
  }

  static getUserPreferences(): UserPreferences {
    return this.load<UserPreferences>(this.KEYS.USER_PREFERENCES) || {
      theme: 'light',
      defaultChartType: 'pie',
      autoGenerateCharts: true,
      maxRowsToDisplay: 1000
    };
  }
}

interface RecentFileInfo {
  name: string;
  size: number;
  lastOpened: Date;
  rowCount: number;
  columnCount: number;
}

interface UserPreferences {
  theme: 'light' | 'dark';
  defaultChartType: ChartType;
  autoGenerateCharts: boolean;
  maxRowsToDisplay: number;
}
```

## React Error Boundary

### Error Boundary Component (src/components/ErrorBoundary.tsx)
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error
    ErrorHandler.getInstance().createError(
      ErrorType.BROWSER_ERROR,
      'React Error Boundary caught an error',
      error,
      { errorInfo }
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-center text-gray-900">
              Something went wrong
            </h2>
            
            <p className="mt-2 text-sm text-gray-600 text-center">
              An unexpected error occurred. Please refresh the page and try again.
            </p>
            
            <div className="mt-6 flex flex-col gap-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Refresh Page
              </Button>
              
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Files to Create
- [ ] `src/utils/errorHandling.ts`
- [ ] `src/utils/exportUtils.ts`
- [ ] `src/utils/performanceMonitor.ts`
- [ ] `src/utils/validation.ts`
- [ ] `src/utils/browserCompatibility.ts`
- [ ] `src/utils/localStorage.ts`
- [ ] `src/components/ErrorBoundary.tsx`
- [ ] `src/hooks/useErrorHandler.ts`
- [ ] `src/hooks/usePerformance.ts`

## Integration Hooks

### Error Handling Hook (src/hooks/useErrorHandler.ts)
```typescript
export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null);
  
  const handleError = useCallback((error: Error, type: ErrorType, context?: Record<string, any>) => {
    const appError = ErrorHandler.getInstance().createError(type, error.message, error, context);
    setError(appError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}
```

## Testing Strategy
- [ ] Unit tests for all utility functions
- [ ] Error boundary testing
- [ ] Performance monitoring accuracy
- [ ] Local storage reliability
- [ ] Cross-browser compatibility testing

## Validation Criteria
- [ ] Error handling catches and displays all error types
- [ ] Export functionality works for all supported formats
- [ ] Performance monitoring provides accurate metrics
- [ ] Browser compatibility detection is accurate
- [ ] Local storage persists data correctly
- [ ] All utilities integrate seamlessly with other components

## Notes for Integration Teams
- **All Teams**: Use ErrorHandler for consistent error reporting
- **Data Team**: Use PerformanceMonitor for file processing metrics
- **Filter Team**: Use debouncing utilities for smooth interactions
- **Chart Team**: Use export utilities for chart saving
- **UI Team**: Wrap components with ErrorBoundary for crash protection