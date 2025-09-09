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
4. **TEST THOROUGHLY**: Validate each change before proceeding to the next
5. **MAINTAIN COMPATIBILITY**: Keep existing APIs unchanged where possible

## Types

Single sentence describing the type system changes.

Detailed type definitions, interfaces, enums, or data structures with complete specifications. Include field names,
types, validation rules, and relationships.

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

// Data flow interfaces
interface DataProviderProps<T> {
  children: React.ReactNode
  fetchData: () => Promise<T>
  onUpdate?: (data: T) => void
}

interface ActionDispatcherProps {
  children: React.ReactNode
  dispatch: (action: AppAction) => void
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

Single sentence describing file modifications.

Detailed breakdown:

- New files to be created (with full paths and purpose)
- Existing files to be modified (with specific changes)
- Files to be deleted or moved
- Configuration file updates

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
- Add component testing configuration

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

Single sentence describing function modifications.

Detailed breakdown:

- New functions (name, signature, file path, purpose)
- Modified functions (exact name, current file path, required changes)
- Removed functions (name, file path, reason, migration strategy)

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

Single sentence describing class modifications.

Detailed breakdown:

- New classes (name, file path, key methods, inheritance)
- Modified classes (exact name, file path, specific modifications)
- Removed classes (name, file path, replacement strategy)

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

Single sentence describing dependency modifications.

Details of new packages, version changes, and integration requirements.

### New Dependencies to Install

```json
{
  "dependencies": {
    "react-use": "^17.4.0",
    "use-context-selector": "^1.4.1",
    "react-spring": "^9.7.0",
    "framer-motion": "^10.16.4",
    "react-window": "^1.8.8",
    "react-virtualized": "^9.22.5",
    "@types/react-window": "^1.8.8",
    "@types/react-virtualized": "^9.21.23"
  },
  "devDependencies": {
    "@testing-library/react-hooks": "^8.0.1",
    "@storybook/react": "^7.5.3",
    "storybook-addon-react-context": "^1.0.1"
  }
}
```

### Existing Dependencies to Update

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15"
  }
}
```

### Integration Requirements

#### React Context Integration

- Replace global state with context providers
- Implement context selectors for performance optimization
- Add context devtools for debugging
- Ensure proper context provider hierarchy

#### Component Library Integration

- Integrate react-window for virtual scrolling
- Add framer-motion for animations
- Implement react-spring for smooth transitions
- Add component composition utilities

#### Performance Optimization

- Implement React.memo for presentational components
- Add useMemo and useCallback hooks
- Implement virtual scrolling for large lists
- Add component-level error boundaries

## Testing

Single sentence describing testing approach.

Test file requirements, existing test modifications, and validation strategies.

### New Test Files to Create

#### Unit Tests

```
src/__tests__/
├── context/
│   ├── AppContext.test.tsx
│   ├── DataContext.test.tsx
│   ├── FilterContext.test.tsx
│   └── ChartContext.test.tsx
├── components/
│   ├── containers/
│   │   ├── DataContainer.test.tsx
│   │   ├── FilterContainer.test.tsx
│   │   ├── ChartContainer.test.tsx
│   │   └── AnalyticsContainer.test.tsx
│   ├── presentational/
│   │   ├── data/
│   │   │   ├── DataTable.test.tsx
│   │   │   ├── TableHeader.test.tsx
│   │   │   └── TableBody.test.tsx
│   │   ├── filters/
│   │   │   ├── FilterPanel.test.tsx
│   │   │   └── FilterItem.test.tsx
│   │   └── analytics/
│   │       ├── AnalyticsPanel.test.tsx
│   │       └── SuggestionsList.test.tsx
│   └── layout/
│       ├── AppLayout.test.tsx
│       └── Sidebar.test.tsx
├── hooks/
│   ├── useAppContext.test.ts
│   ├── useDataContext.test.ts
│   ├── useFilterContext.test.ts
│   ├── useChartContext.test.ts
│   └── useVirtualScroll.test.ts
└── utils/
    ├── component-utils.test.ts
    ├── prop-utils.test.ts
    └── composition-utils.test.ts
```

#### Integration Tests

```
src/__tests__/integration/
├── context-integration.test.tsx
├── container-integration.test.tsx
├── data-flow.test.tsx
└── state-management.test.tsx
```

#### Component Tests with Storybook

```
src/.storybook/
├── stories/
│   ├── containers/
│   │   ├── DataContainer.stories.tsx
│   │   ├── FilterContainer.stories.tsx
│   │   └── ChartContainer.stories.tsx
│   ├── presentational/
│   │   ├── data/
│   │   │   ├── DataTable.stories.tsx
│   │   │   ├── TableHeader.stories.tsx
│   │   │   └── TableBody.stories.tsx
│   │   ├── filters/
│   │   │   ├── FilterPanel.stories.tsx
│   │   │   └── FilterItem.stories.tsx
│   │   └── analytics/
│   │       ├── AnalyticsPanel.stories.tsx
│   │       └── SuggestionsList.stories.tsx
│   └── layout/
│       ├── AppLayout.stories.tsx
│       └── Sidebar.stories.tsx
└── main.ts
```

### Existing Test Modifications

#### Update Existing Component Tests

- **src/**tests**/components/DataTable.test.tsx**: Update to test presentational component only
- **src/**tests**/components/FilterPanel.test.tsx**: Split into container and presentational tests
- **src/**tests**/components/analytics/AnalyticsPanel.test.tsx**: Update to test new structure

### Test Strategies

#### Unit Testing Strategy

- **Context Providers**: Test state management, action dispatch, and selector functions
- **Container Components**: Test business logic, data flow, and context integration
- **Presentational Components**: Test rendering, props handling, and user interactions
- **Custom Hooks**: Test state management, side effects, and return values

#### Integration Testing Strategy

- **Context Integration**: Test multiple contexts working together
- **Data Flow**: Test data flow from containers to presentational components
- **State Management**: Test global state changes and component reactions
- **User Interactions**: Test complete user workflows across components

#### Performance Testing Strategy

- **Virtual Scrolling**: Test performance with large datasets
- **Context Optimization**: Test context selector performance
- **Component Re-rendering**: Test unnecessary re-renders and optimization
- **Memory Usage**: Test memory leaks and cleanup

### Validation Criteria

#### Component Validation

- [ ] All presentational components render correctly with different props
- [ ] Container components manage state and business logic correctly
- [ ] Context providers provide expected state and actions
- [ ] Custom hooks return expected values and handle side effects

#### Architecture Validation

- [ ] Component hierarchy follows Container/Presentational pattern
- [ ] No prop drilling beyond one level
- [ ] Global state managed through context only
- [ ] Business logic separated from UI logic

#### Performance Validation

- [ ] Virtual scrolling handles 100,000+ rows smoothly
- [ ] Context selectors prevent unnecessary re-renders
- [ ] Component memoization works correctly
- [ ] Memory usage remains within acceptable limits

#### Integration Validation

- [ ] All existing functionality works with new architecture
- [ ] Data flows correctly between components
- [ ] State changes propagate correctly through context
- [ ] User interactions work as expected

## Implementation Order

Focus on modularizing existing components while strictly preserving all functionality. Implement changes incrementally
to minimize risks.

### Phase 1: Context System Setup (Days 1-2)

1. **Document existing functionality**:
   - Create comprehensive inventory of all existing features in each component
   - Map all existing state management and data flow
   - Document all existing APIs and external dependencies

2. **Create minimal context structure** with EXISTING functionality only:
   - **AppContext**: Map existing globalProperties to context actions, preserve all existing state structure
   - **DataContext**: Preserve all existing Excel data operations and processing logic
   - **FilterContext**: Preserve all existing filter types and application logic
   - **ChartContext**: Preserve all existing chart creation and display logic

3. **Implement basic context providers**:
   - Ensure all existing state transitions work exactly as before
   - Create custom hooks (useAppContext, useDataContext, etc.) with existing functionality only
   - Update TypeScript configuration with path aliases for new structure

4. **Test context system**:
   - Verify all existing functionality works with new context
   - Ensure no behavior changes introduced
   - Test all state management scenarios

### Phase 2: Component Modularization (Days 2-4)

1. **Split DataTable component** with EXISTING functionality only:
   - **TableContainer**: Preserve all existing sorting logic, data processing, and virtual scrolling behavior
   - **Presentational components**: TableHeader, TableBody, TableRow, TableCell with existing UI and interactions only
   - **Validation**: Ensure DataTable EXACTLY matches previous behavior

2. **Split FilterPanel component** with EXISTING functionality only:
   - **FilterContainer**: Preserve all existing filter state management and application logic
   - **Presentational components**: FilterItem, FilterControls with existing UI and interactions only
   - **Validation**: Ensure FilterPanel EXACTLY matches previous behavior

3. **Split AnalyticsPanel component** with EXISTING functionality only:
   - **AnalyticsContainer**: Preserve all existing LLM integration, analytics processing, and suggestion generation
   - **Presentational components**: SuggestionsList, PromptInput with existing UI and interactions only
   - **Validation**: Ensure AnalyticsPanel EXACTLY matches previous behavior

4. **Split ChartView components** with EXISTING functionality only:
   - **ChartContainer**: Preserve all existing chart creation logic and data processing
   - **Presentational components**: ChartGrid, ChartCard with existing UI and interactions only
   - **Validation**: Ensure ChartView EXACTLY matches previous behavior

### Phase 3: Layout and Integration (Days 4-5)

1. **Create layout components** with EXISTING functionality only:
   - **AppLayout**: Preserve all existing layout structure and responsive behavior
   - **Header**: Move to layout components with all existing features and interactions preserved

2. **Update page.tsx** with modular structure:
   - Preserve all existing page features and behavior
   - Use context providers instead of global state
   - Ensure page EXACTLY matches previous behavior

3. **Migrate existing components**:
   - Update components to use new modular structure
   - Ensure all existing APIs work unchanged
   - Test all functionality after each migration

### Phase 4: Testing and Validation (Days 5-6)

1. **Comprehensive testing**:
   - **Unit tests**: Test all existing functionality in each new component
   - **Integration tests**: Test all component interactions and data flow
   - **Regression tests**: Verify no existing functionality was lost

2. **Performance testing**:
   - Compare performance with original implementation using same datasets
   - Verify no performance degradation in rendering and virtual scrolling
   - Ensure memory usage is same or better

3. **User acceptance testing**:
   - Test all existing user workflows manually
   - Verify all UI interactions work as before
   - Test in all supported browsers

### Phase 5: Optimization and Cleanup (Days 6-7)

1. **Performance optimization** (only after functionality is preserved):
   - Add React.memo to presentational components
   - Implement context selectors for optimization
   - Fine-tune virtual scrolling performance

2. **Error handling**:
   - Add error boundaries without changing existing behavior
   - Preserve all existing error handling and messages
   - Ensure error recovery works as before

3. **Documentation updates**:
   - Update component documentation with new modular structure
   - Preserve all existing behavior documentation
   - Ensure backward compatibility is documented

## Validation Criteria

### Functionality Preservation

- [ ] All existing features work exactly as before
- [ ] No new features or functionality added
- [ ] All user workflows unchanged
- [ ] All data displays and processes correctly

### Code Quality

- [ ] Components follow Container/Presentational pattern
- [ ] Clear separation of concerns achieved
- [ ] Code is more maintainable and modular
- [ ] All existing APIs preserved

### Performance

- [ ] No performance degradation
- [ ] Memory usage same or better
- [ ] Rendering performance maintained
- [ ] Virtual scrolling works correctly

### Testing

- [ ] All existing functionality tested
- [ ] No regressions found
- [ ] Performance validated
- [ ] User acceptance confirmed

This implementation plan provides a comprehensive approach to refactoring the component architecture, ensuring better
maintainability, performance, and developer experience while preserving all existing functionality.
