# Plan 04: Dynamic Filtering System

## Engineer Assignment

**Primary Engineer**: Full-Stack/Logic Engineer
**Dependencies**: Plan 02 (Data Processing) must be completed first
**Estimated Time**: 2-3 days
**Can work in parallel with**: Plans 03, 05 after Plan 02

## Overview

Implement intelligent, dynamic filtering system that automatically generates appropriate filter controls based on column data types and provides real-time data filtering capabilities.

## Deliverables

### 1. Filter Generation Engine

- [ ] Auto-generate filters based on column types
- [ ] Handle different data types with appropriate controls
- [ ] Extract unique values efficiently for select filters
- [ ] Generate range controls for numeric data

### 2. Filter UI Components

- [ ] Multi-select dropdown for categorical data
- [ ] Range slider and input controls for numbers
- [ ] Date range picker for date columns
- [ ] Text search with fuzzy matching
- [ ] Null value inclusion toggles

### 3. Filter Application System

- [ ] Real-time filter application
- [ ] Optimized filtering algorithms
- [ ] Filter combination logic (AND/OR)
- [ ] Filter state management
- [ ] Filter persistence and reset

## Core Interfaces

### Filter Configuration (src/types/filter.ts)

```typescript
export interface FilterConfig {
  id: string
  column: string
  columnIndex: number
  type: FilterType
  active: boolean
  values: any[]
  operator: FilterOperator
  displayName: string
}

export type FilterType =
  | 'select' // Multi-select dropdown
  | 'range' // Min/max numeric range
  | 'search' // Text search
  | 'date' // Date range picker
  | 'boolean' // True/false toggle
  | 'null' // Include/exclude nulls

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'not_between'
  | 'is_null'
  | 'is_not_null'

export interface FilterValue {
  value: any
  selected: boolean
  count?: number // How many rows have this value
}

export interface RangeFilter {
  min: number
  max: number
  currentMin: number
  currentMax: number
}

export interface DateRangeFilter {
  earliest: Date
  latest: Date
  currentStart: Date
  currentEnd: Date
}

export interface SearchFilter {
  query: string
  caseSensitive: boolean
  exactMatch: boolean
}
```

## Services to Implement

### 1. Filter Generator (src/services/filterGenerator.ts)

```typescript
export class FilterGenerator {
  generateFilters(columns: ColumnInfo[]): FilterConfig[] {
    return columns.map((column) => {
      switch (column.type) {
        case 'string':
          return this.generateStringFilter(column)
        case 'number':
          return this.generateNumericFilter(column)
        case 'date':
          return this.generateDateFilter(column)
        case 'boolean':
          return this.generateBooleanFilter(column)
        default:
          return this.generateGenericFilter(column)
      }
    })
  }

  private generateStringFilter(column: ColumnInfo): FilterConfig
  private generateNumericFilter(column: ColumnInfo): FilterConfig
  private generateDateFilter(column: ColumnInfo): FilterConfig
  private generateBooleanFilter(column: ColumnInfo): FilterConfig
  private generateGenericFilter(column: ColumnInfo): FilterConfig

  // Optimize for performance
  extractUniqueValues(data: any[][], columnIndex: number, maxValues?: number): FilterValue[]

  calculateValueCounts(data: any[][], columnIndex: number): Map<any, number>
}
```

### 2. Filter Engine (src/services/dataFilter.ts)

```typescript
export class DataFilter {
  private activeFilters: Map<string, FilterConfig>

  constructor(filters: FilterConfig[]) {
    this.activeFilters = new Map(filters.map((f) => [f.id, f]))
  }

  applyFilters(data: ExcelData): any[][] {
    return data.rows.filter((row) => {
      return Array.from(this.activeFilters.values())
        .filter((f) => f.active)
        .every((filter) => this.evaluateFilter(row, filter))
    })
  }

  private evaluateFilter(row: any[], filter: FilterConfig): boolean {
    const cellValue = row[filter.columnIndex]

    switch (filter.type) {
      case 'select':
        return this.evaluateSelectFilter(cellValue, filter)
      case 'range':
        return this.evaluateRangeFilter(cellValue, filter)
      case 'search':
        return this.evaluateSearchFilter(cellValue, filter)
      case 'date':
        return this.evaluateDateFilter(cellValue, filter)
      case 'boolean':
        return this.evaluateBooleanFilter(cellValue, filter)
      case 'null':
        return this.evaluateNullFilter(cellValue, filter)
      default:
        return true
    }
  }

  updateFilter(filterId: string, updates: Partial<FilterConfig>): void
  resetFilter(filterId: string): void
  resetAllFilters(): void
  getActiveFilterCount(): number
  exportFilterState(): FilterState
  importFilterState(state: FilterState): void
}
```

## Filter UI Components

### 1. Filter Panel (src/components/FilterPanel.tsx)

```typescript
interface FilterPanelProps {
  filters: FilterConfig[];
  onFilterChange: (filterId: string, updates: Partial<FilterConfig>) => void;
  onFilterReset: (filterId: string) => void;
  onResetAll: () => void;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onFilterReset,
  onResetAll
}: FilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetAll}
        >
          Reset All
        </Button>
      </div>

      {filters.map(filter => (
        <FilterComponent
          key={filter.id}
          filter={filter}
          onChange={(updates) => onFilterChange(filter.id, updates)}
          onReset={() => onFilterReset(filter.id)}
        />
      ))}
    </div>
  );
}
```

### 2. Individual Filter Components

#### Select Filter (src/components/filters/SelectFilter.tsx)

```typescript
interface SelectFilterProps {
  filter: FilterConfig
  onChange: (values: any[]) => void
  maxDisplayValues?: number
}

// Multi-select dropdown with search
// Checkbox list for small sets
// Virtualized list for large sets
// Value count display
```

#### Range Filter (src/components/filters/RangeFilter.tsx)

```typescript
interface RangeFilterProps {
  filter: FilterConfig
  onChange: (min: number, max: number) => void
}

// Dual-handle range slider
// Min/max input boxes
// Histogram visualization optional
```

#### Search Filter (src/components/filters/SearchFilter.tsx)

```typescript
interface SearchFilterProps {
  filter: FilterConfig
  onChange: (query: string, options: SearchOptions) => void
}

// Text input with debouncing
// Case sensitivity toggle
// Exact match toggle
// Match count display
```

#### Date Range Filter (src/components/filters/DateRangeFilter.tsx)

```typescript
interface DateRangeFilterProps {
  filter: FilterConfig
  onChange: (startDate: Date, endDate: Date) => void
}

// Date picker component
// Preset ranges (Last 30 days, etc.)
// Calendar visualization
```

## State Management

### Filter Hook (src/hooks/useFilters.ts)

```typescript
export function useFilters(excelData: ExcelData | null) {
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const [filteredData, setFilteredData] = useState<any[][]>([])
  const [isFiltering, setIsFiltering] = useState(false)

  // Generate filters when data changes
  useEffect(() => {
    if (excelData) {
      const generatedFilters = filterGenerator.generateFilters(excelData.metadata.columns)
      setFilters(generatedFilters)
    }
  }, [excelData])

  // Apply filters when filters or data change
  useEffect(() => {
    if (excelData && filters.length > 0) {
      setIsFiltering(true)
      const filtered = dataFilter.applyFilters(excelData)
      setFilteredData(filtered)
      setIsFiltering(false)
    }
  }, [excelData, filters])

  return {
    filters,
    filteredData,
    isFiltering,
    updateFilter,
    resetFilter,
    resetAllFilters,
    getFilterSummary: () => ({
      totalFilters: filters.length,
      activeFilters: filters.filter((f) => f.active).length,
      filteredRows: filteredData.length,
      totalRows: excelData?.metadata.totalRows || 0,
    }),
  }
}
```

## Performance Optimizations

### 1. Efficient Filtering Algorithms

```typescript
// Use Map/Set for O(1) lookups
// Implement early termination
// Cache filter results
// Debounce filter updates
```

### 2. Large Dataset Handling

```typescript
// Virtual scrolling integration
// Progressive filtering
// Web Worker offloading
// Memory management
```

### 3. Smart Value Extraction

```typescript
// Limit unique value extraction (max 1000)
// Sample-based statistics for large datasets
// Lazy loading of filter options
// Cached results with invalidation
```

## Integration Points

### With Data Processing (Plan 02)

```typescript
// Receives: ExcelData with ColumnInfo
// Uses: Column types and statistics
// Accesses: Row data for filtering
```

### With UI Components (Plan 03)

```typescript
// Integrates into: FilterPanel component slot
// Provides: Filter controls and state
// Receives: User interactions and updates
```

### With Charts (Plan 05)

```typescript
// Provides: Filtered dataset
// Triggers: Chart updates on filter changes
// Coordinates: Real-time updates
```

## Testing Strategy

- [ ] Unit tests for filter generation logic
- [ ] Performance tests with large datasets
- [ ] Filter combination accuracy tests
- [ ] Edge case handling (empty data, single values)
- [ ] User interaction testing

## Files to Create

- [ ] `src/services/filterGenerator.ts`
- [ ] `src/services/dataFilter.ts`
- [ ] `src/components/FilterPanel.tsx`
- [ ] `src/components/filters/SelectFilter.tsx`
- [ ] `src/components/filters/RangeFilter.tsx`
- [ ] `src/components/filters/SearchFilter.tsx`
- [ ] `src/components/filters/DateRangeFilter.tsx`
- [ ] `src/hooks/useFilters.ts`
- [ ] `src/types/filter.ts`

## Validation Criteria

- [ ] Filters generate correctly for all data types
- [ ] Real-time filtering performs smoothly (<100ms)
- [ ] Handles datasets up to 100k rows efficiently
- [ ] Filter combinations work logically
- [ ] UI responds correctly to all filter interactions
- [ ] Filter state can be reset and persisted

## Notes for Integration Teams

- **Data Team**: Your ColumnInfo interface drives filter generation
- **UI Team**: FilterPanel component integrates into your layout
- **Chart Team**: Subscribe to filteredData changes for real-time updates
- **Utils Team**: Performance monitoring needed for large dataset filtering
