// Global type definitions for AI integration and utilities
export interface GlobalWindow extends Window {
  // Excel parser utilities
  __XLSX_UTILS?: unknown

  // AI integration functions
  __applyChartFromAI?: (config: unknown) => void
  __importFiltersFromAI?: (state: unknown) => void

  // Performance monitoring
  __EXCEL_EXPLORER_PERFORMANCE?: {
    metrics: Record<string, number>
    marks: Record<string, number>
  }
}

declare global {
  interface Window {
    __XLSX_UTILS?: unknown
    __applyChartFromAI?: (config: unknown) => void
    __importFiltersFromAI?: (state: unknown) => void
    __EXCEL_EXPLORER_PERFORMANCE?: {
      metrics: Record<string, number>
      marks: Record<string, number>
    }
  }
}

// Safe global property management
export class GlobalPropertyManager {
  private static instance: GlobalPropertyManager
  private properties = new Map<string, unknown>()

  static getInstance(): GlobalPropertyManager {
    if (!GlobalPropertyManager.instance) {
      GlobalPropertyManager.instance = new GlobalPropertyManager()
    }
    return GlobalPropertyManager.instance
  }

  // Safely get a global property
  get<T = unknown>(key: string): T | undefined {
    return this.properties.get(key) as T
  }

  // Safely set a global property
  set<T = unknown>(key: string, value: T): void {
    this.properties.set(key, value)

    // Also set on window for backward compatibility
    if (typeof window !== 'undefined') {
      ;(window as Record<string, unknown>)[key] = value
    }
  }

  // Safely remove a global property
  remove(key: string): void {
    this.properties.delete(key)

    // Also remove from window
    if (typeof window !== 'undefined') {
      delete (window as Record<string, unknown>)[key]
    }
  }

  // Check if a property exists
  has(key: string): boolean {
    return this.properties.has(key)
  }

  // Get all properties
  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.properties)
  }

  // Clear all properties
  clear(): void {
    const keys = Array.from(this.properties.keys())
    keys.forEach((key) => this.remove(key))
  }

  // Excel parser utilities
  getXLSXUtils(): unknown {
    return this.get('__XLSX_UTILS')
  }

  setXLSXUtils(utils: unknown): void {
    this.set('__XLSX_UTILS', utils)
  }

  // AI integration functions
  getApplyChartFromAI(): ((config: unknown) => void) | undefined {
    return this.get('__applyChartFromAI')
  }

  setApplyChartFromAI(fn: (config: unknown) => void): void {
    this.set('__applyChartFromAI', fn)
  }

  getImportFiltersFromAI(): ((state: unknown) => void) | undefined {
    return this.get('__importFiltersFromAI')
  }

  setImportFiltersFromAI(fn: (state: unknown) => void): void {
    this.set('__importFiltersFromAI', fn)
  }

  // Performance monitoring
  getPerformanceMetrics(): Record<string, number> {
    return this.get('__EXCEL_EXPLORER_PERFORMANCE')?.metrics || {}
  }

  setPerformanceMetric(name: string, value: number): void {
    const perf = this.get('__EXCEL_EXPLORER_PERFORMANCE') as {
      metrics: Record<string, number>;
      marks: Record<string, number>
    } || {metrics: {}, marks: {}}
    perf.metrics[name] = value
    this.set('__EXCEL_EXPLORER_PERFORMANCE', perf)
  }

  getPerformanceMarks(): Record<string, number> {
    return this.get('__EXCEL_EXPLORER_PERFORMANCE')?.marks || {}
  }

  setPerformanceMark(name: string, timestamp: number): void {
    const perf = this.get('__EXCEL_EXPLORER_PERFORMANCE') as {
      metrics: Record<string, number>;
      marks: Record<string, number>
    } || {metrics: {}, marks: {}}
    perf.marks[name] = timestamp
    this.set('__EXCEL_EXPLORER_PERFORMANCE', perf)
  }
}

// Export singleton instance
export const globalProperties = GlobalPropertyManager.getInstance()
