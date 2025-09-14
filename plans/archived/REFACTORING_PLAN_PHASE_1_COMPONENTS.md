# Implementation Plan: Phase 1 - Component Decomposition & Architecture

## Overview

Break down large, monolithic components into smaller, focused components following the Container/Presentational pattern
to improve maintainability, reduce prop drilling, and establish a clear separation of concerns while strictly preserving
all existing functionality.

## Current State Analysis

- **page.tsx**: 200+ lines handling file upload, data display, charts, and analytics in a single component
- **AnalyticsPanel.tsx**: 150+ lines managing LLM analytics, suggestions, and prompt handling
- **DataTable.tsx**: 200+ lines handling data display, formatting, sorting, and virtual scrolling
- **FilterPanel.tsx**: 200+ lines managing filter state, UI rendering, and filter type handling
- **Global state management**: Using window object and globalProperties for cross-component communication
- **Mixed responsibilities**: Components handling UI, state management, and business logic together

## Core Principles

1. **NO NEW FEATURES**: Only refactor existing code, do not add new functionality
2. **PRESERVE BEHAVIOR**: All existing features must work exactly as before
3. **INCREMENTAL CHANGES**: Implement one component at a time to minimize risks
4. **MAINTAIN COMPATIBILITY**: Keep existing APIs unchanged where possible

## Types

Core type definitions for component interfaces and state management.

### Component Interface Types

```typescript
// Core component prop interfaces
interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

interface ContainerComponentProps<T> extends BaseComponentProps {
  data: T
  loading?: boolean
  error?: string | null
  onAction?: (action: string, payload?: any) => void
}

interface PresentationalComponentProps extends BaseComponentProps {
  // UI-only props, no business logic
  variant?: 'default' | 'compact' | 'expanded'
  theme?: 'light' | 'dark'
}

// Context types
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  selectors: AppSelectors
}

interface ComponentContextType<T> {
  data: T
  actions: ComponentActions<T>
  loading: boolean
  error: string | null
}
```

### State Management Types

```typescript
// Action types for state management
type AppAction =
  | { type: 'SET_EXCEL_DATA'; payload: ExcelData }
  | { type: 'SET_FILTERS'; payload: FilterConfig[] }
  | { type: 'SET_CHARTS'; payload: ChartConfig[] }
  | { type: 'SET_LOADING'; payload: { key: string; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: string; error: string | null } }
  | { type: 'UPDATE_FILTER'; payload: { filterId: string; updates: Partial<FilterConfig> } }
  | { type: 'RESET_FILTERS' }
  | { type: 'ADD_CHART'; payload: ChartConfig }
  | { type: 'REMOVE_CHART'; payload: string }
  | { type: 'SET_SESSION'; payload: SessionState }

// State structure
interface AppState {
  excelData: ExcelData | null
  filters: FilterConfig[]
  charts: ChartConfig[]
  loading: Record<string, boolean>
  errors: Record<string, string | null>
  session: SessionState
  ui: UIState
}

interface UIState {
  sidebarOpen: boolean
  activeTab: 'data' | 'charts' | 'analytics'
  showDataTypes: boolean
  sortConfig: { column: string; direction: 'asc' | 'desc' } | null
}

interface SessionState {
  isActive: boolean
  showRestoreBanner: boolean
  lastSessionSummary: PersistedSession['summary'] | null
}

// Selectors for derived state
interface AppSelectors {
  getFilteredData: (state: AppState) => any[][]
  getActiveFilters: (state: AppState) => FilterConfig[]
  getChartsByType: (state: AppState, type: ChartType) => ChartConfig[]
  isLoading: (state: AppState, key?: string) => boolean
  getError: (state: AppState, key?: string) => string | null
}
```

## Files

New files to be created and existing files to be modified for component refactoring.

### New Files to Create

#### Core Architecture Files

```
src/
├── context/
│   ├── AppContext.tsx           # Main application context with state and actions
│   ├── DataContext.tsx          # Context for data-related operations
│   ├── FilterContext.tsx        # Context for filter operations
│   ├── ChartContext.tsx         # Context for chart operations
│   └── UIContext.tsx            # Context for UI state management
├── hooks/
│   ├── useAppContext.ts         # Hook for accessing app context
│   ├── useDataContext.ts        # Hook for data operations
│   ├── useFilterContext.ts      # Hook for filter operations
│   ├── useChartContext.ts       # Hook for chart operations
│   └── useUIContext.ts          # Hook for UI state
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx        # Main layout component
│   │   ├── Sidebar.tsx          # Sidebar component
│   │   ├── MainContent.tsx      # Main content area
│   │   └── Header.tsx           # Header component
│   ├── containers/
│   │   ├── data/
│   │   │   ├── DataContainer.tsx    # Container for data operations
│   │   │   ├── UploadContainer.tsx  # Container for file upload
│   │   │   └── TableContainer.tsx   # Container for table operations
│   │   ├── filters/
│   │   │   ├── FilterContainer.tsx   # Container for filter operations
│   │   │   └── FilterListContainer.tsx # Container for filter list
│   │   ├── charts/
│   │   │   ├── ChartContainer.tsx    # Container for chart operations
│   │   │   └── ChartListContainer.tsx # Container for chart list
│   │   └── analytics/
│   │       ├── AnalyticsContainer.tsx # Container for analytics operations
│   │       └── SuggestionsContainer.tsx # Container for suggestions
│   ├── presentational/
│   │   ├── data/
│   │   │   ├── DataTable.tsx        # Presentational table component
│   │   │   ├── TableHeader.tsx      # Table header component
│   │   │   ├── TableBody.tsx        # Table body component
│   │   │   ├── TableRow.tsx         # Table row component
│   │   │   └── TableCell.tsx        # Table cell component
│   │   ├── filters/
│   │   │   ├── FilterPanel.tsx      # Presentational filter panel
│   │   │   ├── FilterItem.tsx       # Individual filter item
│   │   │   ├── FilterControls.tsx   # Filter controls component
│   │   │   └── FilterSearch.tsx    # Filter search component
│   │   ├── charts/
│   │   │   ├── ChartView.tsx        # Presentational chart view
│   │   │   ├── ChartGrid.tsx        # Chart grid layout
│   │   │   ├── ChartCard.tsx        # Individual chart card
│   │   │   └── ChartControls.tsx    # Chart controls
│   │   ├── analytics/
│   │   │   ├── AnalyticsPanel.tsx   # Presentational analytics panel
│   │   │   ├── SuggestionsList.tsx  # Suggestions list component
│   │   │   ├── PromptInput.tsx      # Prompt input component
│   │   │   └── InsightsList.tsx     # Insights list component
│   │   └── common/
│   │       ├── LoadingState.tsx     # Loading state component
│   │       ├── ErrorState.tsx       # Error state component
│   │       ├── EmptyState.tsx       # Empty state component
│   │       └── ActionButton.tsx     # Reusable action button
│   └── ui/
│       ├── enhanced/
│       │   ├── EnhancedModal.tsx   # Enhanced modal component
│       │   ├── EnhancedButton.tsx   # Enhanced button component
│       │   ├── EnhancedInput.tsx    # Enhanced input component
│       │   └── EnhancedSelect.tsx   # Enhanced select component
│       └── layout/
│           ├── Grid.tsx            # Grid layout component
│           ├── Flex.tsx            # Flex layout component
│           └── Container.tsx       # Container component
└── utils/
    ├── component-utils.ts        # Component utility functions
    ├── prop-utils.ts             # Prop validation utilities
    └── composition-utils.ts       # Component composition utilities
```

### Existing Files to Modify

#### src/app/page.tsx

**Changes**:

- Reduce from 200+ lines to ~50 lines
- Remove direct state management and business logic
- Use AppLayout and container components
- Remove direct hook calls, use context instead

**New structure**:

```typescript
export default function HomePage() {
    return (
        <AppContextProvider>
            <AppLayout>
                <DataContainer / >
        <FilterContainer / >
        <ChartContainer / >
        <AnalyticsContainer / >
        </AppLayout>
        < /AppContextProvider>
    );
}
```

#### src/components/DataTable.tsx

**Changes**:

- Split into multiple presentational components
- Move sorting logic to TableContainer
- Move virtual scrolling optimization to separate hook
- Remove direct data processing, receive props only

**New structure**:

```typescript
// Presentational component - only rendering
export function DataTable({
                              headers,
                              rows,
                              onSort,
                              sortConfig,
                              loading,
                              error
                          }: DataTableProps) {
    // Only UI rendering logic, no business logic
    return (
        <div className = "data-table" >
        <TableHeader headers = {headers}
    onSort = {onSort}
    sortConfig = {sortConfig}
    />
    < TableBody
    rows = {rows}
    loading = {loading}
    error = {error}
    />
    < /div>
)
    ;
}
```

#### src/components/FilterPanel.tsx

**Changes**:

- Split into FilterContainer and presentational components
- Move filter state management to context
- Extract individual filter types to separate components
- Remove direct data access, use context instead

#### src/components/analytics/AnalyticsPanel.tsx

**Changes**:

- Split into AnalyticsContainer and presentational components
- Move LLM integration logic to container
- Extract suggestions and prompt handling to separate components
- Remove direct OpenRouter access, use context instead

#### src/types/global.ts

**Changes**:

- Remove globalProperties usage
- Add context provider types
- Update to use new state management system

### Files to Delete or Move

- **Move**: src/components/Header.tsx → src/components/layout/Header.tsx
- **Delete**: Global window object usage (replace with context)

### Configuration Files to Update

#### tsconfig.json

**Changes**:

- Add path aliases for new folder structure
- Enable strict mode for component types

**New paths**:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/context/*": ["./src/context/*"],
      "@/components/*": ["./src/components/*"],
      "@/containers/*": ["./src/components/containers/*"],
      "@/presentational/*": ["./src/components/presentational/*"]
    }
  }
}
```

## Functions

Key functions to be created, modified, or removed during component refactoring.

### New Functions to Create

#### Context Provider Functions

```typescript
// src/context/AppContext.tsx
export function AppContextProvider({ children }: { children: React.ReactNode }): JSX.Element

export function useAppContext(): AppContextType

// src/context/DataContext.tsx
export function DataContextProvider({ children }: { children: React.ReactNode }): JSX.Element

export function useDataContext(): DataContextType

// src/context/FilterContext.tsx
export function FilterContextProvider({ children }: { children: React.ReactNode }): JSX.Element

export function useFilterContext(): FilterContextType

// src/context/ChartContext.tsx
export function ChartContextProvider({ children }: { children: React.ReactNode }): JSX.Element

export function useChartContext(): ChartContextType

// src/context/UIContext.tsx
export function UIContextProvider({ children }: { children: React.ReactNode }): JSX.Element

export function useUIContext(): UIContextType
```

#### Container Component Functions

```typescript
// src/components/containers/data/DataContainer.tsx
export function DataContainer(): JSX.Element

export function UploadContainer(): JSX.Element

export function TableContainer(): JSX.Element

// src/components/containers/filters/FilterContainer.tsx
export function FilterContainer(): JSX.Element

export function FilterListContainer(): JSX.Element

// src/components/containers/charts/ChartContainer.tsx
export function ChartContainer(): JSX.Element

export function ChartListContainer(): JSX.Element

// src/components/containers/analytics/AnalyticsContainer.tsx
export function AnalyticsContainer(): JSX.Element

export function SuggestionsContainer(): JSX.Element
```

#### Presentational Component Functions

```typescript
// src/components/presentational/data/DataTable.tsx
export function DataTable(props: DataTableProps): JSX.Element

export function TableHeader(props: TableHeaderProps): JSX.Element

export function TableBody(props: TableBodyProps): JSX.Element

export function TableRow(props: TableRowProps): JSX.Element

export function TableCell(props: TableCellProps): JSX.Element

// src/components/presentational/filters/FilterPanel.tsx
export function FilterPanel(props: FilterPanelProps): JSX.Element

export function FilterItem(props: FilterItemProps): JSX.Element

export function FilterControls(props: FilterControlsProps): JSX.Element

// src/components/presentational/charts/ChartView.tsx
export function ChartView(props: ChartViewProps): JSX.Element

export function ChartGrid(props: ChartGridProps): JSX.Element

export function ChartCard(props: ChartCardProps): JSX.Element

// src/components/presentational/analytics/AnalyticsPanel.tsx
export function AnalyticsPanel(props: AnalyticsPanelProps): JSX.Element

export function SuggestionsList(props: SuggestionsListProps): JSX.Element

export function PromptInput(props: PromptInputProps): JSX.Element

export function InsightsList(props: InsightsListProps): JSX.Element
```

#### Custom Hooks

```typescript
// src/hooks/useAppContext.ts
export function useAppContext(): AppContextType

// src/hooks/useDataContext.ts
export function useDataContext(): DataContextType

// src/hooks/useFilterContext.ts
export function useFilterContext(): FilterContextType

// src/hooks/useChartContext.ts
export function useChartContext(): ChartContextType

// src/hooks/useUIContext.ts
export function useUIContext(): UIContextType

// src/hooks/useVirtualScroll.ts (new)
export function useVirtualScroll(options: VirtualScrollOptions): VirtualScrollResult

// src/hooks/useComponentState.ts (new)
export function useComponentState<T>(initialState: T): ComponentStateResult<T>
```

#### Utility Functions

```typescript
// src/utils/component-utils.ts
export function composeComponents<T>(
  ...components: React.ComponentType<T>[]
): React.ComponentType<T>

export function withLoading<P>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType,
): React.ComponentType<P>

export function withError<P>(
  Component: React.ComponentType<P>,
  ErrorComponent: React.ComponentType,
): React.ComponentType<P>

// src/utils/prop-utils.ts
export function validateProps(props: any, schema: PropSchema): ValidationResult

export function getDefaultProps<Props>(defaultProps: Partial<Props>, props: Props): Props

// src/utils/composition-utils.ts
export function createContainer<P, S>(
  Component: React.ComponentType<P>,
  mapStateToProps: (state: S) => P,
): React.ComponentType<Omit<P, keyof S>>

export function withContext<T>(
  Component: React.ComponentType<T>,
  Context: React.Context<T>,
): React.ComponentType<Omit<T, keyof T>>
```

### Modified Functions

#### src/components/DataTable.tsx - formatCellValue

**Current file**: src/components/DataTable.tsx
**Required changes**:

- Move to utility function
- Make it pure function without side effects
- Add type safety and validation

**New signature**:

```typescript
// src/utils/data-formatting.ts
export function formatCellValue(
  value: any,
  type: DataType,
  options: FormatOptions = {},
): FormattedValue
```

#### src/components/FilterPanel.tsx - FilterComponent

**Current file**: src/components/FilterPanel.tsx
**Required changes**:

- Split into separate filter type components
- Move to presentational layer
- Remove direct state mutations

**New components**:

```typescript
// src/components/presentational/filters/SelectFilter.tsx
export function SelectFilter(props: SelectFilterProps): JSX.Element

// src/components/presentational/filters/RangeFilter.tsx
export function RangeFilter(props: RangeFilterProps): JSX.Element

// src/components/presentational/filters/SearchFilter.tsx
export function SearchFilter(props: SearchFilterProps): JSX.Element
```

#### src/components/analytics/AnalyticsPanel.tsx - renderFriendlyOpenRouterError

**Current file**: src/components/analytics/AnalyticsPanel.tsx
**Required changes**:

- Move to utility function
- Make it reusable across components
- Add better error handling

**New signature**:

```typescript
// src/utils/error-handling.ts
export function renderFriendlyOpenRouterError(message: string): React.ReactNode

export function renderFriendlyError(error: Error, context?: string): React.ReactNode
```

### Removed Functions

#### src/types/global.ts - GlobalPropertyManager methods

**Current file**: src/types/global.ts
**Reason**: Replaced with React Context
**Migration strategy**:

- Replace globalProperties.get() with useContext hooks
- Replace globalProperties.set() with context dispatch actions
- Remove window object pollution

**Functions to remove**:

- `getXLSXUtils()`
- `setXLSXUtils()`
- `getApplyChartFromAI()`
- `setApplyChartFromAI()`
- `getImportFiltersFromAI()`
- `setImportFiltersFromAI()`

#### src/app/page.tsx - Direct hook calls

**Current file**: src/app/page.tsx
**Reason**: Business logic moved to container components
**Migration strategy**:

- Move hook calls to appropriate container components
- Use context providers for shared state
- Simplify page component to layout only

**Functions to remove/move**:

- `handleFileSelect()` → Move to UploadContainer
- `handleRestoreSession()` → Move to DataContainer
- Direct hook usage → Replace with context consumers

## Classes

Key classes to be created, modified, or removed during component refactoring.

### New Classes to Create

#### Context Provider Classes

```typescript
// src/context/AppContext.tsx
export class AppContextProvider extends React.Component<AppContextProviderProps, AppState> {
  private reducer: React.Reducer<AppState, AppAction>
  private initialState: AppState

  constructor(props: AppContextProviderProps) {
    super(props)
    this.initialState = createInitialState()
    this.reducer = createAppReducer()
    this.state = this.initialState
  }

  render(): React.ReactNode

  private dispatch: React.Dispatch<AppAction>

  private getState(): AppState

  private getSelectors(): AppSelectors
}

// src/context/DataContext.tsx
export class DataContextProvider extends React.Component<DataContextProviderProps, DataState> {
  private dataService: DataService

  constructor(props: DataContextProviderProps) {
    super(props)
    this.dataService = new DataService()
  }

  render(): React.ReactNode

  private loadData(file: File): Promise<void>

  private processData(data: ExcelData): void

  private clearData(): void
}
```

#### Container Component Classes

```typescript
// src/components/containers/data/DataContainer.tsx
export class DataContainer extends React.Component {
  private dataContext: DataContextType
  private uiContext: UIContextType

  componentDidMount(): void

  componentWillUnmount(): void

  private handleFileSelect(file: File): Promise<void>

  private handleDataUpdate(data: ExcelData): void

  private handleDataError(error: Error): void

  render(): React.ReactNode
}

// src/components/containers/filters/FilterContainer.tsx
export class FilterContainer extends React.Component {
  private filterContext: FilterContextType
  private dataContext: DataContextType

  componentDidMount(): void

  componentDidUpdate(prevProps: FilterContainerProps): void

  private handleFilterChange(filterId: string, updates: Partial<FilterConfig>): void

  private handleFilterReset(filterId: string): void

  private handleResetAllFilters(): void

  render(): React.ReactNode
}
```

#### Service Classes

```typescript
// src/services/ComponentService.ts
export class ComponentService {
  static getInstance(): ComponentService

  registerComponent(id: string, component: React.ComponentType): void

  unregisterComponent(id: string): void

  getComponent(id: string): React.ComponentType | undefined

  listComponents(): string[]

  private components: Map<string, React.ComponentType>
}

// src/services/StateManagementService.ts
export class StateManagementService {
  static getInstance(): StateManagementService

  createContext<T>(initialState: T, reducer: React.Reducer<T, any>): React.Context<T>

  createProvider<T>(
    context: React.Context<T>,
    initialState: T,
    reducer: React.Reducer<T, any>,
  ): React.ComponentType

  createSelector<T, R>(selector: (state: T) => R): () => R

  private contexts: Map<string, React.Context<any>>
  private providers: Map<string, React.ComponentType>
}
```

#### Utility Classes

```typescript
// src/utils/ComponentRegistry.ts
export class ComponentRegistry {
  private static instance: ComponentRegistry
  private registry: Map<string, ComponentRegistration>

  static getInstance(): ComponentRegistry

  register(registration: ComponentRegistration): void

  unregister(id: string): void

  get(id: string): ComponentRegistration | undefined

  list(): ComponentRegistration[]

  findByCategory(category: string): ComponentRegistration[]

  private validateRegistration(registration: ComponentRegistration): boolean
}

interface ComponentRegistration {
  id: string
  name: string
  component: React.ComponentType
  category: string
  props: ComponentPropsSchema
  dependencies?: string[]
}
```

### Modified Classes

#### src/types/global.ts - GlobalPropertyManager

**Current file**: src/types/global.ts
**Specific modifications**:

- Remove all property management methods
- Replace with context-based approach
- Deprecate window object usage

**New approach**:

```typescript
// Replace with context providers
export const AppContext = React.createContext<AppContextType | undefined>(undefined)
export const DataContext = React.createContext<DataContextType | undefined>(undefined)
export const FilterContext = React.createContext<FilterContextType | undefined>(undefined)
export const ChartContext = React.createContext<ChartContextType | undefined>(undefined)
```

#### src/services/excelParser.ts - ExcelParser

**Current file**: src/services/excelParser.ts
**Specific modifications**:

- Add component-specific parsing options
- Support progressive loading for UI components
- Add error handling for component integration

**Enhanced methods**:

```typescript
export class ExcelParser {
  // Existing methods...

  parseForComponent(
    file: File,
    componentId: string,
    options: ComponentParseOptions,
  ): Promise<ComponentData>

  parseProgressive(file: File, onProgress: (progress: ParseProgress) => void): Promise<ExcelData>

  getComponentSchema(componentId: string): ComponentSchema | undefined

  private componentConfigs: Map<string, ComponentConfig>
}
```

### Removed Classes

#### src/types/global.ts - GlobalPropertyManager

**Current file**: src/types/global.ts
**Replacement strategy**: Replace with React Context providers

- Use AppContextProvider for global state
- Use DataContextProvider for data operations
- Use FilterContextProvider for filter operations
- Use ChartContextProvider for chart operations

**Migration path**:

```typescript
// Before
const applyChart = globalProperties.getApplyChartFromAI()

// After
const { applyChart } = useChartContext()
```

## Dependencies

Required dependencies for component refactoring.

### New Dependencies to Install

```json
{
  "dependencies": {
    "react-use": "^17.4.0",
    "use-context-selector": "^1.4.1",
    "react-window": "^1.8.8",
    "@types/react-window": "^1.8.8"
  }
}
```

### Integration Requirements

#### React Context Integration

- Replace global state with context providers
- Implement context selectors for basic optimization
- Ensure proper context provider hierarchy

#### Component Library Integration

- Integrate react-window for virtual scrolling
- Add component composition utilities

## UI Component Migration Plan

Migrate one UI component at a time, test it thoroughly, then proceed to the next component.

### Prerequisites (Complete Once Before Starting)

1. **Setup Context System Foundation**:
   - Create basic context providers (AppContext, DataContext, FilterContext, ChartContext)
   - Create custom hooks for each context
   - Update TypeScript configuration with path aliases
   - Ensure context system preserves all existing state management behavior

### UI Component 1: DataTable Migration

**Current File**: `src/components/DataTable.tsx` (200+ lines)
**Target Files**:

```
src/components/containers/data/TableContainer.tsx
src/components/presentational/data/DataTable.tsx
src/components/presentational/data/TableHeader.tsx
src/components/presentational/data/TableBody.tsx
src/components/presentational/data/TableRow.tsx
src/components/presentational/data/TableCell.tsx
```

**Migration Steps**:

1. Create `TableContainer.tsx`:
   - Move all sorting logic from DataTable
   - Move data processing logic
   - Move virtual scrolling implementation
   - Connect to DataContext and UIContext
   - Pass props to presentational components

2. Create presentational components:
   - `DataTable.tsx`: Only renders layout, receives all data via props
   - `TableHeader.tsx`: Renders header with sort controls
   - `TableBody.tsx`: Renders table body with rows
   - `TableRow.tsx`: Renders individual row
   - `TableCell.tsx`: Renders individual cell with formatting

3. Update `page.tsx` to use `TableContainer` instead of `DataTable`

4. **Validation**:
   - Test data display matches original exactly
   - Test sorting functionality works as before
   - Test virtual scrolling with large datasets
   - Test cell formatting and styling
   - Verify no performance degradation

### UI Component 2: FilterPanel Migration

**Current File**: `src/components/FilterPanel.tsx` (200+ lines)
**Target Files**:

```
src/components/containers/filters/FilterContainer.tsx
src/components/presentational/filters/FilterPanel.tsx
src/components/presentational/filters/FilterItem.tsx
src/components/presentational/filters/FilterControls.tsx
```

**Migration Steps**:

1. Create `FilterContainer.tsx`:
   - Move all filter state management logic
   - Move filter type handling logic
   - Connect to FilterContext and DataContext
   - Handle filter application and reset operations

2. Create presentational components:
   - `FilterPanel.tsx`: Renders filter panel layout
   - `FilterItem.tsx`: Renders individual filter with controls
   - `FilterControls.tsx`: Renders filter control buttons

3. Update `page.tsx` to use `FilterContainer` instead of `FilterPanel`

4. **Validation**:
   - Test all filter types work as before
   - Test filter application and data filtering
   - Test filter reset functionality
   - Test filter state persistence
   - Verify UI responsiveness and interactions

### UI Component 3: AnalyticsPanel Migration

**Current File**: `src/components/analytics/AnalyticsPanel.tsx` (150+ lines)
**Target Files**:

```
src/components/containers/analytics/AnalyticsContainer.tsx
src/components/presentational/analytics/AnalyticsPanel.tsx
src/components/presentational/analytics/SuggestionsList.tsx
src/components/presentational/analytics/PromptInput.tsx
```

**Migration Steps**:

1. Create `AnalyticsContainer.tsx`:
   - Move all LLM integration logic
   - Move analytics processing logic
   - Move suggestion generation logic
   - Connect to DataContext and OpenRouter services
   - Handle prompt processing and response display

2. Create presentational components:
   - `AnalyticsPanel.tsx`: Renders analytics panel layout
   - `SuggestionsList.tsx`: Renders list of AI suggestions
   - `PromptInput.tsx`: Renders prompt input interface

3. Update `page.tsx` to use `AnalyticsContainer` instead of `AnalyticsPanel`

4. **Validation**:
   - Test AI suggestions generation and display
   - Test prompt input and processing
   - Test analytics data display
   - Test error handling for API failures
   - Verify all LLM integrations work as before

### UI Component 4: ChartView Migration

**Current File**: `src/components/ChartView.tsx`
**Target Files**:

```
src/components/containers/charts/ChartContainer.tsx
src/components/presentational/charts/ChartView.tsx
src/components/presentational/charts/ChartGrid.tsx
src/components/presentational/charts/ChartCard.tsx
```

**Migration Steps**:

1. Create `ChartContainer.tsx`:
   - Move all chart creation logic
   - Move chart data processing
   - Move chart configuration logic
   - Connect to ChartContext and DataContext
   - Handle chart CRUD operations

2. Create presentational components:
   - `ChartView.tsx`: Renders chart view layout
   - `ChartGrid.tsx`: Renders grid of charts
   - `ChartCard.tsx`: Renders individual chart card

3. Update `page.tsx` to use `ChartContainer` instead of `ChartView`

4. **Validation**:
   - Test chart creation and display
   - Test chart configuration options
   - Test chart data updates
   - Test chart deletion and editing
   - Verify all chart types work as before

### UI Component 5: Header Migration

**Current File**: `src/components/Header.tsx`
**Target Files**:

```
src/components/layout/Header.tsx
src/components/containers/layout/HeaderContainer.tsx
```

**Migration Steps**:

1. Create `HeaderContainer.tsx`:
   - Move all header state management
   - Move navigation logic
   - Connect to UIContext and AppContext
   - Handle menu interactions and state

2. Create presentational component:
   - `Header.tsx`: Renders header with navigation and controls

3. Update `page.tsx` to use `HeaderContainer` instead of `Header`

4. **Validation**:
   - Test all navigation functionality
   - Test menu interactions and state
   - Test responsive behavior
   - Test all header controls and buttons
   - Verify header matches original behavior exactly

### UI Component 6: FileUploader Migration

**Current File**: `src/components/FileUploader.tsx`
**Target Files**:

```
src/components/containers/data/UploadContainer.tsx
src/components/presentational/data/FileUploader.tsx
```

**Migration Steps**:

1. Create `UploadContainer.tsx`:
   - Move all file upload logic
   - Move file processing logic
   - Connect to DataContext and UIContext
   - Handle file validation and error states

2. Create presentational component:
   - `FileUploader.tsx`: Renders file upload interface

3. Update `page.tsx` to use `UploadContainer` instead of `FileUploader`

4. **Validation**:
   - Test file upload functionality
   - Test file validation and error handling
   - Test file processing and data extraction
   - Test drag-and-drop functionality
   - Verify upload process matches original exactly

### UI Component 7: Modal Components Migration

**Current Files**: Various modal components
**Target Files**:

```
src/components/containers/modals/
src/components/presentational/modals/
```

**Migration Steps**:

1. Create container components for each modal:
   - `ChartConfigModalContainer.tsx`
   - `ChartCreationModalContainer.tsx`
   - `OpenRouterSettingsModalContainer.tsx`
   - `SessionManagerModalContainer.tsx`

2. Create presentational components for each modal:
   - Move all UI rendering logic to presentational layer
   - Keep only business logic in containers

3. Update parent components to use new container components

4. **Validation**:
   - Test each modal's functionality
   - Test modal open/close behavior
   - Test form submissions and data handling
   - Test modal state management
   - Verify all modals work exactly as before

### UI Component 8: Final Page Integration

**Current File**: `src/app/page.tsx` (200+ lines)
**Target File**: `src/app/page.tsx` (simplified to ~50 lines)

**Migration Steps**:

1. Simplify `page.tsx`:
   - Remove all direct state management
   - Remove all business logic
   - Use only layout and container components
   - Wrap with context providers

2. Final structure:

   ```typescript
   export default function HomePage() {
       return (
           <AppContextProvider>
               <DataContextProvider>
                   <FilterContextProvider>
                       <ChartContextProvider>
                           <AppLayout>
                               <HeaderContainer />
                               <UploadContainer />
                               <TableContainer />
                               <FilterContainer />
                               <ChartContainer />
                               <AnalyticsContainer />
                           </AppLayout>
                       </ChartContextProvider>
                   </FilterContextProvider>
               </DataContextProvider>
           </AppContextProvider>
       );
   }
   ```

3. **Validation**:
   - Test complete application functionality
   - Test all user workflows
   - Test data flow between components
   - Test state management across contexts
   - Verify entire application works exactly as before

## Migration Process

### For Each UI Component:

1. **Analyze Current Component**:
   - Document all existing functionality
   - Identify all state management needs
   - Map all external dependencies
   - List all user interactions

2. **Create Container Component**:
   - Move all business logic to container
   - Connect to appropriate contexts
   - Handle all state management
   - Pass props to presentational component

3. **Create Presentational Component**:
   - Only render UI based on props
   - Handle user interactions via callbacks
   - No business logic or state management
   - Pure UI component

4. **Update Parent Component**:
   - Replace original component with new container
   - Ensure proper data flow
   - Maintain all existing functionality

5. **Test Thoroughly**:
   - Test all existing features work exactly as before
   - Test all user interactions
   - Test edge cases and error states
   - Verify no regressions introduced

6. **Proceed to Next Component**:
   - Only move to next component when current is fully validated
   - Keep application functional after each migration
   - Maintain backward compatibility

## Success Criteria

### For Each Component Migration:

- [ ] All existing functionality preserved exactly
- [ ] Component follows Container/Presentational pattern
- [ ] No regressions introduced
- [ ] Performance maintained or improved
- [ ] Code is more maintainable and modular

### Overall Project:

- [ ] All UI components successfully migrated
- [ ] Application works exactly as before
- [ ] Code architecture is clean and maintainable
- [ ] Global state replaced with context system
- [ ] All existing APIs preserved
