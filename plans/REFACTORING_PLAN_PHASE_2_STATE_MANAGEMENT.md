# Implementation Plan: Phase 2 - State Management Refactoring

## Overview

Replace the current global window-based state management with a robust, context-based state management system that
provides clear boundaries, better type safety, and improved performance for cross-component communication.

## Current State Analysis

- **Global State via Window**: Using `globalProperties` and window object for cross-component communication
- **Scattered State Logic**: State management spread across multiple hooks without clear boundaries
- **Session Persistence Complexity**: `useSessionPersistence` hook is overly complex with multiple responsibilities
- **Mixed Concerns**: Components directly accessing global state, creating tight coupling
- **Performance Issues**: Unnecessary re-renders due to lack of state normalization and selectors

## Types

Single sentence describing the type system changes.

Detailed type definitions, interfaces, enums, or data structures with complete specifications. Include field names,
types, validation rules, and relationships.

### Core State Types

```typescript
// Main state structure
interface AppState {
  version: string
  data: DataState
  filters: FilterState
  charts: ChartState
  analytics: AnalyticsState
  ui: UIState
  session: SessionState
  performance: PerformanceState
}

// Data-specific state
interface DataState {
  currentData: ExcelData | null
  isLoading: boolean
  error: string | null
  progress: ParseProgressEvent | null
  isRestoring: boolean
  restoreProgress: RestoreProgress | null
  metadata: DataMetadata
}

interface DataMetadata {
  lastUpdated: number
  fileSize: number
  processingTime: number
  columnStats: ColumnStats[]
}

interface ColumnStats {
  name: string
  type: DataType
  nullCount: number
  uniqueCount: number
  average?: number
  min?: number | Date
  max?: number | Date
}

// Filter state
interface FilterState {
  filters: FilterConfig[]
  activeFilters: Set<string>
  filterGeneration: {
    lastGenerated: number
    columnInfo: ColumnInfo[]
  }
  ui: FilterUIState
}

interface FilterUIState {
  searchQuery: string
  collapsed: boolean
  expandedFilters: Set<string>
}

// Chart state
interface ChartState {
  charts: ChartConfig[]
  activeCharts: Set<string>
  chartGeneration: {
    lastGenerated: number
    suggestions: ChartSuggestion[]
  }
  ui: ChartUIState
}

interface ChartUIState {
  selectedChart: string | null
  isConfigModalOpen: boolean
  configModalChart: ChartConfig | null
}

// Analytics state
interface AnalyticsState {
  suggestions: PromptSuggestion[]
  insights: InsightCard[]
  currentPrompt: string
  activeTab: 'suggestions' | 'prompt'
  isLoading: boolean
  error: string | null
  settings: AnalyticsSettings
}

interface AnalyticsSettings {
  sliceForPrompt: boolean
  useFilteredForLLM: boolean
  selectedModel: string | null
}

// UI state
interface UIState {
  sidebar: {
    open: boolean
    width: number
  }
  dataTable: {
    showDataTypes: boolean
    sortConfig: SortConfig | null
    virtualScroll: {
      enabled: boolean
      rowHeight: number
      overscan: number
    }
  }
  modals: {
    open: string[]
    data: Record<string, any>
  }
  notifications: Notification[]
  theme: 'light' | 'dark'
}

interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: number
}

// Session state
interface SessionState {
  isActive: boolean
  showRestoreBanner: boolean
  lastSessionSummary: PersistedSession['summary'] | null
  sessions: PersistedSession[]
  isRestoring: boolean
  restoreProgress: RestoreProgress | null
  settings: SessionSettings
}

interface SessionSettings {
  autoSave: boolean
  maxSessions: number
  compressionEnabled: boolean
}

interface RestoreProgress {
  stage:
    | 'validating'
    | 'loading-data'
    | 'loading-filters'
    | 'loading-charts'
    | 'applying'
    | 'complete'
  message: string
  progress: number
}

// Performance state
interface PerformanceState {
  metrics: PerformanceMetrics
  marks: Record<string, number>
  settings: PerformanceSettings
}

interface PerformanceMetrics {
  memory: {
    used: number
    total: number
    limit: number
  }
  timing: {
    fileProcessing: number
    filtering: number
    chartRendering: number
  }
  events: PerformanceEvent[]
}

interface PerformanceEvent {
  name: string
  timestamp: number
  duration: number
  metadata: Record<string, any>
}

interface PerformanceSettings {
  monitoringEnabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  sampleRate: number
}
```

### Action Types

```typescript
// Data actions
type DataAction =
  | { type: 'SET_EXCEL_DATA'; payload: ExcelData }
  | { type: 'SET_LOADING'; payload: { key: string; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: string; error: string | null } }
  | { type: 'SET_PROGRESS'; payload: ParseProgressEvent | null }
  | { type: 'SET_RESTORING'; payload: boolean }
  | { type: 'SET_RESTORE_PROGRESS'; payload: RestoreProgress | null }
  | { type: 'UPDATE_DATA_METADATA'; payload: Partial<DataMetadata> }
  | { type: 'CLEAR_DATA' }

// Filter actions
type FilterAction =
  | { type: 'SET_FILTERS'; payload: FilterConfig[] }
  | { type: 'UPDATE_FILTER'; payload: { filterId: string; updates: Partial<FilterConfig> } }
  | { type: 'RESET_FILTER'; payload: string }
  | { type: 'RESET_ALL_FILTERS' }
  | { type: 'SET_FILTER_GENERATION'; payload: { lastGenerated: number; columnInfo: ColumnInfo[] } }
  | { type: 'SET_FILTER_UI'; payload: Partial<FilterUIState> }
  | { type: 'TOGGLE_FILTER_EXPANDED'; payload: string }
  | { type: 'SET_FILTER_SEARCH'; payload: string }

// Chart actions
type ChartAction =
  | { type: 'SET_CHARTS'; payload: ChartConfig[] }
  | { type: 'ADD_CHART'; payload: ChartConfig }
  | { type: 'UPDATE_CHART'; payload: { chartId: string; updates: Partial<ChartConfig> } }
  | { type: 'REMOVE_CHART'; payload: string }
  | { type: 'SET_ACTIVE_CHARTS'; payload: Set<string> }
  | {
      type: 'SET_CHART_GENERATION'
      payload: { lastGenerated: number; suggestions: ChartSuggestion[] }
    }
  | { type: 'SET_CHART_UI'; payload: Partial<ChartUIState> }

// Analytics actions
type AnalyticsAction =
  | { type: 'SET_SUGGESTIONS'; payload: PromptSuggestion[] }
  | { type: 'SET_INSIGHTS'; payload: InsightCard[] }
  | { type: 'SET_CURRENT_PROMPT'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: 'suggestions' | 'prompt' }
  | { type: 'SET_ANALYTICS_LOADING'; payload: boolean }
  | { type: 'SET_ANALYTICS_ERROR'; payload: string | null }
  | { type: 'SET_ANALYTICS_SETTINGS'; payload: Partial<AnalyticsSettings> }

// UI actions
type UIAction =
  | { type: 'SET_SIDEBAR'; payload: { open: boolean; width: number } }
  | { type: 'SET_DATA_TABLE'; payload: Partial<UIState['dataTable']> }
  | { type: 'SET_SORT_CONFIG'; payload: SortConfig | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'OPEN_MODAL'; payload: { modalId: string; data?: any } }
  | { type: 'CLOSE_MODAL'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }

// Session actions
type SessionAction =
  | { type: 'SET_SESSION_ACTIVE'; payload: boolean }
  | { type: 'SET_RESTORE_BANNER'; payload: boolean }
  | { type: 'SET_LAST_SESSION_SUMMARY'; payload: PersistedSession['summary'] | null }
  | { type: 'SET_SESSIONS'; payload: PersistedSession[] }
  | { type: 'SET_SESSION_RESTORING'; payload: boolean }
  | { type: 'SET_SESSION_RESTORE_PROGRESS'; payload: RestoreProgress | null }
  | { type: 'SET_SESSION_SETTINGS'; payload: Partial<SessionSettings> }

// Performance actions
type PerformanceAction =
  | { type: 'SET_PERFORMANCE_METRICS'; payload: Partial<PerformanceMetrics> }
  | { type: 'SET_PERFORMANCE_MARK'; payload: { name: string; timestamp: number } }
  | { type: 'ADD_PERFORMANCE_EVENT'; payload: PerformanceEvent }
  | { type: 'SET_PERFORMANCE_SETTINGS'; payload: Partial<PerformanceSettings> }
  | { type: 'CLEAR_PERFORMANCE_EVENTS' }

// Combined action type
type AppAction =
  | DataAction
  | FilterAction
  | ChartAction
  | AnalyticsAction
  | UIAction
  | SessionAction
  | PerformanceAction
```

### Context Types

```typescript
// Main application context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  actions: AppActions
  selectors: AppSelectors
}

// Data context
interface DataContextType {
  state: DataState
  actions: DataActions
  selectors: DataSelectors
}

// Filter context
interface FilterContextType {
  state: FilterState
  actions: FilterActions
  selectors: FilterSelectors
}

// Chart context
interface ChartContextType {
  state: ChartState
  actions: ChartActions
  selectors: ChartSelectors
}

// Analytics context
interface AnalyticsContextType {
  state: AnalyticsState
  actions: AnalyticsActions
  selectors: AnalyticsSelectors
}

// UI context
interface UIContextType {
  state: UIState
  actions: UIActions
  selectors: UISelectors
}

// Session context
interface SessionContextType {
  state: SessionState
  actions: SessionActions
  selectors: SessionSelectors
}

// Performance context
interface PerformanceContextType {
  state: PerformanceState
  actions: PerformanceActions
  selectors: PerformanceSelectors
}
```

### Action Creators Types

```typescript
// Data action creators
interface DataActions {
  setExcelData: (data: ExcelData) => void
  setLoading: (key: string, value: boolean) => void
  setError: (key: string, error: string | null) => void
  setProgress: (progress: ParseProgressEvent | null) => void
  setRestoring: (restoring: boolean) => void
  setRestoreProgress: (progress: RestoreProgress | null) => void
  updateDataMetadata: (metadata: Partial<DataMetadata>) => void
  clearData: () => void
}

// Filter action creators
interface FilterActions {
  setFilters: (filters: FilterConfig[]) => void
  updateFilter: (filterId: string, updates: Partial<FilterConfig>) => void
  resetFilter: (filterId: string) => void
  resetAllFilters: () => void
  setFilterGeneration: (generation: { lastGenerated: number; columnInfo: ColumnInfo[] }) => void
  setFilterUI: (ui: Partial<FilterUIState>) => void
  toggleFilterExpanded: (filterId: string) => void
  setFilterSearch: (query: string) => void
}

// Chart action creators
interface ChartActions {
  setCharts: (charts: ChartConfig[]) => void
  addChart: (chart: ChartConfig) => void
  updateChart: (chartId: string, updates: Partial<ChartConfig>) => void
  removeChart: (chartId: string) => void
  setActiveCharts: (charts: Set<string>) => void
  setChartGeneration: (generation: {
    lastGenerated: number
    suggestions: ChartSuggestion[]
  }) => void
  setChartUI: (ui: Partial<ChartUIState>) => void
}

// Analytics action creators
interface AnalyticsActions {
  setSuggestions: (suggestions: PromptSuggestion[]) => void
  setInsights: (insights: InsightCard[]) => void
  setCurrentPrompt: (prompt: string) => void
  setActiveTab: (tab: 'suggestions' | 'prompt') => void
  setAnalyticsLoading: (loading: boolean) => void
  setAnalyticsError: (error: string | null) => void
  setAnalyticsSettings: (settings: Partial<AnalyticsSettings>) => void
}

// UI action creators
interface UIActions {
  setSidebar: (sidebar: { open: boolean; width: number }) => void
  setDataTable: (dataTable: Partial<UIState['dataTable']>) => void
  setSortConfig: (config: SortConfig | null) => void
  setTheme: (theme: 'light' | 'dark') => void
  openModal: (modalId: string, data?: any) => void
  closeModal: (modalId: string) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

// Session action creators
interface SessionActions {
  setSessionActive: (active: boolean) => void
  setRestoreBanner: (show: boolean) => void
  setLastSessionSummary: (summary: PersistedSession['summary'] | null) => void
  setSessions: (sessions: PersistedSession[]) => void
  setSessionRestoring: (restoring: boolean) => void
  setSessionRestoreProgress: (progress: RestoreProgress | null) => void
  setSessionSettings: (settings: Partial<SessionSettings>) => void
}

// Performance action creators
interface PerformanceActions {
  setPerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void
  setPerformanceMark: (name: string, timestamp: number) => void
  addPerformanceEvent: (event: PerformanceEvent) => void
  setPerformanceSettings: (settings: Partial<PerformanceSettings>) => void
  clearPerformanceEvents: () => void
}
```

### Selector Types

```typescript
// App selectors
interface AppSelectors {
  getFilteredData: () => any[][]
  getActiveFilters: () => FilterConfig[]
  getChartsByType: (type: ChartType) => ChartConfig[]
  isLoading: (key?: string) => boolean
  getError: (key?: string) => string | null
  getNotifications: () => Notification[]
  isModalOpen: (modalId: string) => boolean
  getModalData: (modalId: string) => any
}

// Data selectors
interface DataSelectors {
  getCurrentData: () => ExcelData | null
  getDataLoading: () => boolean
  getDataError: () => string | null
  getProgress: () => ParseProgressEvent | null
  getIsRestoring: () => boolean
  getRestoreProgress: () => RestoreProgress | null
  getDataMetadata: () => DataMetadata
  getColumnStats: (columnName: string) => ColumnStats | undefined
  hasData: () => boolean
}

// Filter selectors
interface FilterSelectors {
  getFilters: () => FilterConfig[]
  getActiveFilters: () => FilterConfig[]
  getFilterById: (id: string) => FilterConfig | undefined
  getFiltersByType: (type: FilterType) => FilterConfig[]
  getFilterSearch: () => string
  getFilterCollapsed: () => boolean
  getFilterExpanded: (id: string) => boolean
  getFilterGeneration: () => { lastGenerated: number; columnInfo: ColumnInfo[] }
}

// Chart selectors
interface ChartSelectors {
  getCharts: () => ChartConfig[]
  getActiveCharts: () => ChartConfig[]
  getChartById: (id: string) => ChartConfig | undefined
  getChartsByType: (type: ChartType) => ChartConfig[]
  getSelectedChart: () => ChartConfig | null
  getChartUI: () => ChartUIState
  getChartGeneration: () => { lastGenerated: number; suggestions: ChartSuggestion[] }
}

// Analytics selectors
interface AnalyticsSelectors {
  getSuggestions: () => PromptSuggestion[]
  getInsights: () => InsightCard[]
  getCurrentPrompt: () => string
  getActiveTab: () => 'suggestions' | 'prompt'
  getAnalyticsLoading: () => boolean
  getAnalyticsError: () => string | null
  getAnalyticsSettings: () => AnalyticsSettings
  hasSuggestions: () => boolean
  hasInsights: () => boolean
}

// UI selectors
interface UISelectors {
  getSidebar: () => { open: boolean; width: number }
  getDataTable: () => UIState['dataTable']
  getSortConfig: () => SortConfig | null
  getTheme: () => 'light' | 'dark'
  getOpenModals: () => string[]
  getModalData: (modalId: string) => any
  getNotifications: () => Notification[]
  getNotificationById: (id: string) => Notification | undefined
  isModalOpen: (modalId: string) => boolean
  getVirtualScrollConfig: () => UIState['dataTable']['virtualScroll']
}

// Session selectors
interface SessionSelectors {
  getSessionActive: () => boolean
  getRestoreBanner: () => boolean
  getLastSessionSummary: () => PersistedSession['summary'] | null
  getSessions: () => PersistedSession[]
  getSessionRestoring: () => boolean
  getSessionRestoreProgress: () => RestoreProgress | null
  getSessionSettings: () => SessionSettings
  shouldShowRestoreBanner: () => boolean
  getLastSession: () => PersistedSession | null
}

// Performance selectors
interface PerformanceSelectors {
  getPerformanceMetrics: () => PerformanceMetrics
  getPerformanceMarks: () => Record<string, number>
  getPerformanceEvents: () => PerformanceEvent[]
  getPerformanceSettings: () => PerformanceSettings
  getMemoryUsage: () => { used: number; total: number; limit: number }
  getTimingMetrics: () => PerformanceMetrics['timing']
  getEventByName: (name: string) => PerformanceEvent[]
  isMonitoringEnabled: () => boolean
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

#### Context Providers

```
src/
├── context/
│   ├── AppContext.tsx           # Main application context provider
│   ├── DataContext.tsx          # Data-specific context provider
│   ├── FilterContext.tsx        # Filter-specific context provider
│   ├── ChartContext.tsx         # Chart-specific context provider
│   ├── AnalyticsContext.tsx     # Analytics-specific context provider
│   ├── UIContext.tsx            # UI-specific context provider
│   ├── SessionContext.tsx       # Session-specific context provider
│   └── PerformanceContext.tsx   # Performance-specific context provider
├── hooks/
│   ├── useAppContext.ts         # Hook for accessing app context
│   ├── useDataContext.ts        # Hook for accessing data context
│   ├── useFilterContext.ts      # Hook for accessing filter context
│   ├── useChartContext.ts       # Hook for accessing chart context
│   ├── useAnalyticsContext.ts   # Hook for accessing analytics context
│   ├── useUIContext.ts          # Hook for accessing UI context
│   ├── useSessionContext.ts     # Hook for accessing session context
│   └── usePerformanceContext.ts # Hook for accessing performance context
├── reducers/
│   ├── appReducer.ts            # Main application reducer
│   ├── dataReducer.ts          # Data-specific reducer
│   ├── filterReducer.ts        # Filter-specific reducer
│   ├── chartReducer.ts         # Chart-specific reducer
│   ├── analyticsReducer.ts     # Analytics-specific reducer
│   ├── uiReducer.ts            # UI-specific reducer
│   ├── sessionReducer.ts       # Session-specific reducer
│   └── performanceReducer.ts   # Performance-specific reducer
├── actions/
│   ├── dataActions.ts           # Data action creators
│   ├── filterActions.ts         # Filter action creators
│   ├── chartActions.ts          # Chart action creators
│   ├── analyticsActions.ts      # Analytics action creators
│   ├── uiActions.ts             # UI action creators
│   ├── sessionActions.ts       # Session action creators
│   └── performanceActions.ts   # Performance action creators
├── selectors/
│   ├── appSelectors.ts         # App selector functions
│   ├── dataSelectors.ts        # Data selector functions
│   ├── filterSelectors.ts      # Filter selector functions
│   ├── chartSelectors.ts       # Chart selector functions
│   ├── analyticsSelectors.ts   # Analytics selector functions
│   ├── uiSelectors.ts          # UI selector functions
│   ├── sessionSelectors.ts     # Session selector functions
│   └── performanceSelectors.ts # Performance selector functions
└── utils/
    ├── state/
    │   ├── createState.ts       # Initial state creation utilities
    │   ├── combineReducers.ts   # Reducer combination utilities
    │   ├── createSelectors.ts   # Selector creation utilities
    │   └── middleware.ts        # State management middleware
    └── context/
        ├── createContext.ts     # Context creation utilities
        ├── createProvider.ts    # Provider creation utilities
        └── optimizeContext.ts    # Context optimization utilities
```

### Existing Files to Modify

#### src/types/global.ts

**Changes**:

- Remove GlobalPropertyManager class and all its methods
- Replace with context provider types and interfaces
- Remove window object pollution
- Add new state management type definitions

**New structure**:

```typescript
// Remove GlobalPropertyManager entirely
// Replace with context types
export interface GlobalStateTypes {
  AppState: AppState
  AppAction: AppAction
  AppContextType: AppContextType
  // ... other context types
}

// Export context providers
export const AppContext = React.createContext<AppContextType | undefined>(undefined)
export const DataContext = React.createContext<DataContextType | undefined>(undefined)
export const FilterContext = React.createContext<FilterContextType | undefined>(undefined)
export const ChartContext = React.createContext<ChartContextType | undefined>(undefined)
export const AnalyticsContext = React.createContext<AnalyticsContextType | undefined>(undefined)
export const UIContext = React.createContext<UIContextType | undefined>(undefined)
export const SessionContext = React.createContext<SessionContextType | undefined>(undefined)
export const PerformanceContext = React.createContext<PerformanceContextType | undefined>(undefined)
```

#### src/hooks/useSessionPersistence.ts

**Changes**:

- Split into multiple context-specific hooks
- Move session logic to SessionContext
- Remove direct global state access
- Simplify hook to focus on session-specific operations

**New approach**:

```typescript
// Move session logic to SessionContext
// Simplify hook to use context
export function useSessionPersistence() {
  const sessionContext = useSessionContext()
  const dataContext = useDataContext()

  return {
    // ... session-specific operations using context
    showRestoreBanner: sessionContext.state.showRestoreBanner,
    restoreLastSession: sessionContext.actions.restoreLastSession,
    // ... other session operations
  }
}
```

#### src/hooks/useExcelData.ts

**Changes**:

- Move data operations to DataContext
- Remove direct state management
- Use context actions and selectors
- Simplify hook interface

**New approach**:

```typescript
export function useExcelData() {
  const dataContext = useDataContext()
  const sessionContext = useSessionContext()

  return {
    parseFile: dataContext.actions.parseFile,
    currentData: dataContext.state.currentData,
    isLoading: dataContext.state.isLoading,
    // ... other data operations
  }
}
```

#### src/hooks/useFilters.ts

**Changes**:

- Move filter operations to FilterContext
- Remove direct state management
- Use context actions and selectors
- Improve performance with memoized selectors

**New approach**:

```typescript
export function useFilters(excelData: ExcelData | null) {
  const filterContext = useFilterContext()
  const dataContext = useDataContext()

  return {
    filters: filterContext.state.filters,
    filteredData: filterContext.selectors.getFilteredData(),
    updateFilter: filterContext.actions.updateFilter,
    // ... other filter operations
  }
}
```

#### src/hooks/useCharts.ts

**Changes**:

- Move chart operations to ChartContext
- Remove direct state management
- Use context actions and selectors
- Add performance optimizations

**New approach**:

```typescript
export function useCharts(filteredData: any[][], columnInfo: ColumnInfo[]) {
  const chartContext = useChartContext()
  const dataContext = useDataContext()

  return {
    charts: chartContext.state.charts,
    addChart: chartContext.actions.addChart,
    // ... other chart operations
  }
}
```

#### src/hooks/useLLMAnalytics.ts

**Changes**:

- Move analytics operations to AnalyticsContext
- Remove direct state management
- Use context actions and selectors
- Integrate with OpenRouter context

**New approach**:

```typescript
export function useLLMAnalytics(
  excelData: ExcelData | null,
  options?: { contextOverride?: string },
) {
  const analyticsContext = useAnalyticsContext()
  const openRouterContext = useOpenRouterContext()

  return {
    suggestions: analyticsContext.state.suggestions,
    analysis: analyticsContext.state.insights,
    runAnalysis: analyticsContext.actions.runAnalysis,
    // ... other analytics operations
  }
}
```

#### src/components/ErrorBoundary.tsx

**Changes**:

- Integrate with new context system
- Add error reporting to context
- Improve error recovery mechanisms
- Add performance monitoring

**New approach**:

```typescript
export class ErrorBoundary extends React.Component {
  private static contextType = AppContext

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { dispatch } = this.context

    // Report error to context
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: 'error',
        title: 'Component Error',
        message: error.message,
      },
    })

    // Log to performance context
    const performanceContext = usePerformanceContext()
    performanceContext.actions.addPerformanceEvent({
      name: 'component_error',
      timestamp: Date.now(),
      duration: 0,
      metadata: { error: error.message, componentStack: errorInfo.componentStack },
    })
  }
}
```

### Files to Delete or Move

- **Delete**: src/types/global.ts (GlobalPropertyManager)
- **Move**: Global state logic to appropriate context providers
- **Delete**: Direct window object access throughout codebase
- **Move**: State management utilities to new utils/state/ folder

### Configuration Files to Update

#### tsconfig.json

**Changes**:

- Add path aliases for new context and reducer folders
- Enable strict mode for state management types
- Add composite project configuration for better type checking

**New paths**:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/context/*": ["./src/context/*"],
      "@/reducers/*": ["./src/reducers/*"],
      "@/actions/*": ["./src/actions/*"],
      "@/selectors/*": ["./src/selectors/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/state/*": ["./src/utils/state/*"]
    },
    "composite": true,
    "strict": true
  }
}
```

#### package.json

**Changes**:

- Add new dependencies for state management
- Update existing dependencies
- Add development dependencies for testing

**New dependencies**:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "use-context-selector": "^1.4.1",
    "immer": "^10.0.2",
    "reselect": "^4.1.8",
    "redux": "^4.2.1",
    "@reduxjs/toolkit": "^1.9.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1"
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

// src/context/AnalyticsContext.tsx
export function AnalyticsContextProvider({ children }: { children: React.ReactNode }): JSX.Element
export function useAnalyticsContext(): AnalyticsContextType

// src/context/UIContext.tsx
export function UIContextProvider({ children }: { children: React.ReactNode }): JSX.Element
export function useUIContext(): UIContextType

// src/context/SessionContext.tsx
export function SessionContextProvider({ children }: { children: React.ReactNode }): JSX.Element
export function useSessionContext(): SessionContextType

// src/context/PerformanceContext.tsx
export function PerformanceContextProvider({ children }: { children: React.ReactNode }): JSX.Element
export function usePerformanceContext(): PerformanceContextType
```

#### Reducer Functions

```typescript
// src/reducers/appReducer.ts
export function appReducer(state: AppState, action: AppAction): AppState

// src/reducers/dataReducer.ts
export function dataReducer(state: DataState, action: DataAction): DataState

// src/reducers/filterReducer.ts
export function filterReducer(state: FilterState, action: FilterAction): FilterState

// src/reducers/chartReducer.ts
export function chartReducer(state: ChartState, action: ChartAction): ChartState

// src/reducers/analyticsReducer.ts
export function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState

// src/reducers/uiReducer.ts
export function uiReducer(state: UIState, action: UIAction): UIState

// src/reducers/sessionReducer.ts
export function sessionReducer(state: SessionState, action: SessionAction): SessionState

// src/reducers/performanceReducer.ts
export function performanceReducer(
  state: PerformanceState,
  action: PerformanceAction,
): PerformanceState
```

#### Action Creator Functions

```typescript
// src/actions/dataActions.ts
export function setExcelData(data: ExcelData): DataAction
export function setLoading(key: string, value: boolean): DataAction
export function setError(key: string, error: string | null): DataAction
export function setProgress(progress: ParseProgressEvent | null): DataAction
export function setRestoring(restoring: boolean): DataAction
export function setRestoreProgress(progress: RestoreProgress | null): DataAction
export function updateDataMetadata(metadata: Partial<DataMetadata>): DataAction
export function clearData(): DataAction

// src/actions/filterActions.ts
export function setFilters(filters: FilterConfig[]): FilterAction
export function updateFilter(filterId: string, updates: Partial<FilterConfig>): FilterAction
export function resetFilter(filterId: string): FilterAction
export function resetAllFilters(): FilterAction
export function setFilterGeneration(generation: {
  lastGenerated: number
  columnInfo: ColumnInfo[]
}): FilterAction
export function setFilterUI(ui: Partial<FilterUIState>): FilterAction
export function toggleFilterExpanded(filterId: string): FilterAction
export function setFilterSearch(query: string): FilterAction

// src/actions/chartActions.ts
export function setCharts(charts: ChartConfig[]): ChartAction
export function addChart(chart: ChartConfig): ChartAction
export function updateChart(chartId: string, updates: Partial<ChartConfig>): ChartAction
export function removeChart(chartId: string): ChartAction
export function setActiveCharts(charts: Set<string>): ChartAction
export function setChartGeneration(generation: {
  lastGenerated: number
  suggestions: ChartSuggestion[]
}): ChartAction
export function setChartUI(ui: Partial<ChartUIState>): ChartAction

// src/actions/analyticsActions.ts
export function setSuggestions(suggestions: PromptSuggestion[]): AnalyticsAction
export function setInsights(insights: InsightCard[]): AnalyticsAction
export function setCurrentPrompt(prompt: string): AnalyticsAction
export function setActiveTab(tab: 'suggestions' | 'prompt'): AnalyticsAction
export function setAnalyticsLoading(loading: boolean): AnalyticsAction
export function setAnalyticsError(error: string | null): AnalyticsAction
export function setAnalyticsSettings(settings: Partial<AnalyticsSettings>): AnalyticsAction

// src/actions/uiActions.ts
export function setSidebar(sidebar: { open: boolean; width: number }): UIAction
export function setDataTable(dataTable: Partial<UIState['dataTable']>): UIAction
export function setSortConfig(config: SortConfig | null): UIAction
export function setTheme(theme: 'light' | 'dark'): UIAction
export function openModal(modalId: string, data?: any): UIAction
export function closeModal(modalId: string): UIAction
export function addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): UIAction
export function removeNotification(id: string): UIAction
export function clearNotifications(): UIAction

// src/actions/sessionActions.ts
export function setSessionActive(active: boolean): SessionAction
export function setRestoreBanner(show: boolean): SessionAction
export function setLastSessionSummary(summary: PersistedSession['summary'] | null): SessionAction
export function setSessions(sessions: PersistedSession[]): SessionAction
export function setSessionRestoring(restoring: boolean): SessionAction
export function setSessionRestoreProgress(progress: RestoreProgress | null): SessionAction
export function setSessionSettings(settings: Partial<SessionSettings>): SessionAction

// src/actions/performanceActions.ts
export function setPerformanceMetrics(metrics: Partial<PerformanceMetrics>): PerformanceAction
export function setPerformanceMark(name: string, timestamp: number): PerformanceAction
export function addPerformanceEvent(event: PerformanceEvent): PerformanceAction
export function setPerformanceSettings(settings: Partial<PerformanceSettings>): PerformanceAction
export function clearPerformanceEvents(): PerformanceAction
```

#### Selector Functions

```typescript
// src/selectors/appSelectors.ts
export function createAppSelectors(state: AppState): AppSelectors
export function getFilteredData(state: AppState): any[][]
export function getActiveFilters(state: AppState): FilterConfig[]
export function getChartsByType(state: AppState, type: ChartType): ChartConfig[]
export function isLoading(state: AppState, key?: string): boolean
export function getError(state: AppState, key?: string): string | null
export function getNotifications(state: AppState): Notification[]
export function isModalOpen(state: AppState, modalId: string): boolean
export function getModalData(state: AppState, modalId: string): any

// src/selectors/dataSelectors.ts
export function createDataSelectors(state: DataState): DataSelectors
export function getCurrentData(state: DataState): ExcelData | null
export function getDataLoading(state: DataState): boolean
export function getDataError(state: DataState): string | null
export function getProgress(state: DataState): ParseProgressEvent | null
export function getIsRestoring(state: DataState): boolean
export function getRestoreProgress(state: DataState): RestoreProgress | null
export function getDataMetadata(state: DataState): DataMetadata
export function getColumnStats(state: DataState, columnName: string): ColumnStats | undefined
export function hasData(state: DataState): boolean

// src/selectors/filterSelectors.ts
export function createFilterSelectors(state: FilterState): FilterSelectors
export function getFilters(state: FilterState): FilterConfig[]
export function getActiveFilters(state: FilterState): FilterConfig[]
export function getFilterById(state: FilterState, id: string): FilterConfig | undefined
export function getFiltersByType(state: FilterState, type: FilterType): FilterConfig[]
export function getFilterSearch(state: FilterState): string
export function getFilterCollapsed(state: FilterState): boolean
export function getFilterExpanded(state: FilterState, id: string): boolean
export function getFilterGeneration(state: FilterState): {
  lastGenerated: number
  columnInfo: ColumnInfo[]
}

// src/selectors/chartSelectors.ts
export function createChartSelectors(state: ChartState): ChartSelectors
export function getCharts(state: ChartState): ChartConfig[]
export function getActiveCharts(state: ChartState): ChartConfig[]
export function getChartById(state: ChartState, id: string): ChartConfig | undefined
export function getChartsByType(state: ChartState, type: ChartType): ChartConfig[]
export function getSelectedChart(state: ChartState): ChartConfig | null
export function getChartUI(state: ChartState): ChartUIState
export function getChartGeneration(state: ChartState): {
  lastGenerated: number
  suggestions: ChartSuggestion[]
}

// src/selectors/analyticsSelectors.ts
export function createAnalyticsSelectors(state: AnalyticsState): AnalyticsSelectors
export function getSuggestions(state: AnalyticsState): PromptSuggestion[]
export function getInsights(state: AnalyticsState): InsightCard[]
export function getCurrentPrompt(state: AnalyticsState): string
export function getActiveTab(state: AnalyticsState): 'suggestions' | 'prompt'
export function getAnalyticsLoading(state: AnalyticsState): boolean
export function getAnalyticsError(state: AnalyticsState): string | null
export function getAnalyticsSettings(state: AnalyticsState): AnalyticsSettings
export function hasSuggestions(state: AnalyticsState): boolean
export function hasInsights(state: AnalyticsState): boolean

// src/selectors/uiSelectors.ts
export function createUISelectors(state: UIState): UISelectors
export function getSidebar(state: UIState): { open: boolean; width: number }
export function getDataTable(state: UIState): UIState['dataTable']
export function getSortConfig(state: UIState): SortConfig | null
export function getTheme(state: UIState): 'light' | 'dark'
export function getOpenModals(state: UIState): string[]
export function getModalData(state: UIState, modalId: string): any
export function getNotifications(state: UIState): Notification[]
export function getNotificationById(state: UIState, id: string): Notification | undefined
export function isModalOpen(state: UIState, modalId: string): boolean
export function getVirtualScrollConfig(state: UIState): UIState['dataTable']['virtualScroll']

// src/selectors/sessionSelectors.ts
export function createSessionSelectors(state: SessionState): SessionSelectors
export function getSessionActive(state: SessionState): boolean
export function getRestoreBanner(state: SessionState): boolean
export function getLastSessionSummary(state: SessionState): PersistedSession['summary'] | null
export function getSessions(state: SessionState): PersistedSession[]
export function getSessionRestoring(state: SessionState): boolean
export function getSessionRestoreProgress(state: SessionState): RestoreProgress | null
export function getSessionSettings(state: SessionState): SessionSettings
export function shouldShowRestoreBanner(state: SessionState): boolean
export function getLastSession(state: SessionState): PersistedSession | null

// src/selectors/performanceSelectors.ts
export function createPerformanceSelectors(state: PerformanceState): PerformanceSelectors
export function getPerformanceMetrics(state: PerformanceState): PerformanceMetrics
export function getPerformanceMarks(state: PerformanceState): Record<string, number>
export function getPerformanceEvents(state: PerformanceState): PerformanceEvent[]
export function getPerformanceSettings(state: PerformanceState): PerformanceSettings
export function getMemoryUsage(state: PerformanceState): {
  used: number
  total: number
  limit: number
}
export function getTimingMetrics(state: PerformanceState): PerformanceMetrics['timing']
export function getEventByName(state: PerformanceState, name: string): PerformanceEvent[]
export function isMonitoringEnabled(state: PerformanceState): boolean
```

#### Utility Functions

```typescript
// src/utils/state/createState.ts
export function createInitialState(): AppState
export function createDataState(): DataState
export function createFilterState(): FilterState
export function createChartState(): ChartState
export function createAnalyticsState(): AnalyticsState
export function createUIState(): UIState
export function createSessionState(): SessionState
export function createPerformanceState(): PerformanceState

// src/utils/state/combineReducers.ts
export function combineReducers<S>(reducers: {
  [K in keyof S]: (state: S[K], action: any) => S[K]
}): (state: S, action: any) => S
export function createRootReducer(): React.Reducer<AppState, AppAction>

// src/utils/state/createSelectors.ts
export function createSelector<T, R>(selector: (state: T) => R): () => R
export function createMemoizedSelector<T, R>(selector: (state: T) => R): () => R
export function createStructuredSelector<T, R extends Record<string, (state: T) => any>>(
  selectors: R,
): (state: T) => { [K in keyof R]: R[K] }

// src/utils/state/middleware.ts
export function createLoggingMiddleware(): (store: any) => (next: any) => (action: any) => any
export function createPerformanceMiddleware(): (store: any) => (next: any) => (action: any) => any
export function createPersistenceMiddleware(): (store: any) => (next: any) => (action: any) => any

// src/utils/context/createContext.ts
export function createContext<T>(displayName: string): React.Context<T | undefined>
export function createContextProvider<T>(
  Context: React.Context<T>,
  initialState: T,
  reducer: React.Reducer<T, any>,
): React.ComponentType<{ children: React.ReactNode }>

// src/utils/context/createProvider.ts
export function createOptimizedProvider<T>(
  Context: React.Context<T>,
  selector: (state: T) => any,
): React.ComponentType<{ children: React.ReactNode }>
export function createProviderWithMiddleware<T>(
  Context: React.Context<T>,
  middleware: ((store: any) => (next: any) => (action: any) => any)[],
): React.ComponentType<{ children: React.ReactNode }>

// src/utils/context/optimizeContext.ts
export function createContextSelector<T, R>(
  Context: React.Context<T>,
  selector: (state: T) => R,
): () => R
export function createMemoizedContextSelector<T, R>(
  Context: React.Context<T>,
  selector: (state: T) => R,
): () => R
export function optimizeContextProvider<T>(
  Provider: React.ComponentType<{ children: React.ReactNode }>,
): React.ComponentType<{ children: React.ReactNode }>
```

### Modified Functions

#### src/types/global.ts - GlobalPropertyManager methods

**Current file**: src/types/global.ts
**Required changes**:

- Remove all GlobalPropertyManager methods
- Replace with context-based approach
- Remove window object pollution

**Migration strategy**:

```typescript
// Before - GlobalPropertyManager
const applyChart = globalProperties.getApplyChartFromAI()
globalProperties.setApplyChartFromAI(fn)

// After - Context-based
const { applyChart } = useChartContext()
// No need to set, context handles it internally
```

#### src/hooks/useSessionPersistence.ts - Session persistence logic

**Current file**: src/hooks/useSessionPersistence.ts
**Required changes**:

- Move session state management to SessionContext
- Simplify hook to use context actions and selectors
- Remove direct global state access
- Improve error handling and recovery

**New approach**:

```typescript
// Before - Direct state management
const [showRestoreBanner, setShowRestoreBanner] = useState(false)
const [sessions, setSessions] = useState<PersistedSession[]>([])

// After - Context-based
const { state, actions } = useSessionContext()
const showRestoreBanner = state.showRestoreBanner
const sessions = state.sessions
const setShowRestoreBanner = actions.setRestoreBanner
const setSessions = actions.setSessions
```

#### src/hooks/useExcelData.ts - Data operations

**Current file**: src/hooks/useExcelData.ts
**Required changes**:

- Move data operations to DataContext
- Use context actions for state updates
- Implement performance optimizations with selectors
- Add better error handling

**New approach**:

```typescript
// Before - Direct state management
const [currentData, setCurrentData] = useState<ExcelData | null>(null)
const [isLoading, setIsLoading] = useState(false)

// After - Context-based
const { state, actions, selectors } = useDataContext()
const currentData = selectors.getCurrentData()
const isLoading = selectors.getDataLoading()
const setCurrentData = actions.setExcelData
```

#### src/components/DataTable.tsx - formatCellValue

**Current file**: src/components/DataTable.tsx
**Required changes**:

- Move to utility function in selectors
- Add type safety and validation
- Improve performance with memoization
- Add error handling for invalid values

**New approach**:

```typescript
// Before - Component method
function formatCellValue(value: any, type: DataType, showTime: boolean): string {
  // formatting logic
}

// After - Selector utility
// src/selectors/dataSelectors.ts
export const formatCellValue = createSelector(
  [getCurrentData, (state, value, type, showTime) => ({ value, type, showTime })],
  (data, { value, type, showTime }) => {
    // memoized formatting logic
  },
)
```

### Removed Functions

#### src/types/global.ts - All GlobalPropertyManager methods

**Current file**: src/types/global.ts
**Reason**: Replaced with React Context providers
**Migration strategy**:

- Replace `globalProperties.get()` with useContext hooks
- Replace `globalProperties.set()` with context dispatch actions
- Remove window object pollution entirely

**Functions to remove**:

- `GlobalPropertyManager.getInstance()`
- `GlobalPropertyManager.get()`
- `GlobalPropertyManager.set()`
- `GlobalPropertyManager.remove()`
- `GlobalPropertyManager.has()`
- `GlobalPropertyManager.getAll()`
- `GlobalPropertyManager.clear()`
- `GlobalPropertyManager.getXLSXUtils()`
- `GlobalPropertyManager.setXLSXUtils()`
- `GlobalPropertyManager.getApplyChartFromAI()`
- `GlobalPropertyManager.setApplyChartFromAI()`
- `GlobalPropertyManager.getImportFiltersFromAI()`
- `GlobalPropertyManager.setImportFiltersFromAI()`
- `GlobalPropertyManager.getPerformanceMetrics()`
- `GlobalPropertyManager.setPerformanceMetric()`
- `GlobalPropertyManager.getPerformanceMarks()`
- `GlobalPropertyManager.setPerformanceMark()`

#### src/app/page.tsx - Direct state management functions

**Current file**: src/app/page.tsx
**Reason**: Business logic moved to container components
**Migration strategy**:

- Move hook calls to appropriate container components
- Use context providers for shared state
- Simplify page component to layout only

**Functions to remove/move**:

- `handleFileSelect()` → Move to DataContainer
- `handleRestoreSession()` → Move to SessionContainer
- Direct hook usage → Replace with context consumers

#### src/components/DataTable.tsx - Direct data processing

**Current file**: src/components/DataTable.tsx
**Reason**: Data processing moved to selectors and context
**Migration strategy**:

- Move data processing to selector functions
- Use context for data access
- Implement memoization for performance

**Functions to remove/move**:

- `formatCellValue()` → Move to dataSelectors
- Direct data access → Replace with context selectors
- Sorting logic → Move to DataTable container

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
  private reducer: React.Reducer<AppState, AppAction>;
  private initialState: AppState;
  private middleware: Middleware[];

  constructor(props: AppContextProviderProps) {
    super(props);
    this.initialState = createInitialState();
    this.reducer = createRootReducer();
    this.middleware = [
      createLoggingMiddleware(),
      createPerformanceMiddleware(),
      createPersistenceMiddleware()
    ];
  }

  render(): React.ReactNode {
    return (
      <AppContext.Provider value={this.getContextValue()}>
        {this.props.children}
      </AppContext.Provider>
    );
  }

  private getContextValue(): AppContextType {
    return {
      state: this.state,
      dispatch: this.dispatch,
      actions: this.createActions(),
      selectors: this.createSelectors()
    };
  }

  private dispatch: React.Dispatch<AppAction>;
  private createActions(): AppActions;
  private createSelectors(): AppSelectors;
}

// src/context/DataContext.tsx
export class DataContextProvider extends React.Component<DataContextProviderProps, DataState> {
  private dataService: DataService;
  private initialState: DataState;

  constructor(props: DataContextProviderProps) {
    super(props);
    this.dataService = new DataService();
    this.initialState = createDataState();
  }

  render(): React.ReactNode {
    return (
      <DataContext.Provider value={this.getContextValue()}>
        {this.props.children}
      </DataContext.Provider>
    );
  }

  private getContextValue(): DataContextType {
    return {
      state: this.state,
      actions: this.createActions(),
      selectors: this.createSelectors()
    };
  }

  private createActions(): DataActions {
    return {
      setExcelData: (data) => this.dispatch({ type: 'SET_EXCEL_DATA', payload: data }),
      setLoading: (key, value) => this.dispatch({ type: 'SET_LOADING', payload: { key, value } }),
      setError: (key, error) => this.dispatch({ type: 'SET_ERROR', payload: { key, error } }),
      setProgress: (progress) => this.dispatch({ type: 'SET_PROGRESS', payload: progress }),
      setRestoring: (restoring) => this.dispatch({ type: 'SET_RESTORING', payload: restoring }),
      setRestoreProgress: (progress) => this.dispatch({ type: 'SET_RESTORE_PROGRESS', payload: progress }),
      updateDataMetadata: (metadata) => this.dispatch({ type: 'UPDATE_DATA_METADATA', payload: metadata }),
      clearData: () => this.dispatch({ type: 'CLEAR_DATA' })
    };
  }

  private createSelectors(): DataSelectors {
    return createDataSelectors(this.state);
  }
}

// src/context/FilterContext.tsx
export class FilterContextProvider extends React.Component<FilterContextProviderProps, FilterState> {
  private filterService: FilterService;
  private initialState: FilterState;

  constructor(props: FilterContextProviderProps) {
    super(props);
    this.filterService = new FilterService();
    this.initialState = createFilterState();
  }

  render(): React.ReactNode {
    return (
      <FilterContext.Provider value={this.getContextValue()}>
        {this.props.children}
      </FilterContext.Provider>
    );
  }

  private getContextValue(): FilterContextType {
    return {
      state: this.state,
      actions: this.createActions(),
      selectors: this.createSelectors()
    };
  }

  private createActions(): FilterActions {
    return {
      setFilters: (filters) => this.dispatch({ type: 'SET_FILTERS', payload: filters }),
      updateFilter: (filterId, updates) => this.dispatch({ type: 'UPDATE_FILTER', payload: { filterId, updates } }),
      resetFilter: (filterId) => this.dispatch({ type: 'RESET_FILTER', payload: filterId }),
      resetAllFilters: () => this.dispatch({ type: 'RESET_ALL_FILTERS' }),
      setFilterGeneration: (generation) => this.dispatch({ type: 'SET_FILTER_GENERATION', payload: generation }),
      setFilterUI: (ui) => this.dispatch({ type: 'SET_FILTER_UI', payload: ui }),
      toggleFilterExpanded: (filterId) => this.dispatch({ type: 'TOGGLE_FILTER_EXPANDED', payload: filterId }),
      setFilterSearch: (query) => this.dispatch({ type: 'SET_FILTER_SEARCH', payload: query })
    };
  }

  private createSelectors(): FilterSelectors {
    return createFilterSelectors(this.state);
  }
}

// Similar pattern for other context providers...
```

#### Service Classes

```typescript
// src/services/StateManagementService.ts
export class StateManagementService {
  private static instance: StateManagementService
  private contexts: Map<string, React.Context<any>>
  private providers: Map<string, React.ComponentType>
  private reducers: Map<string, React.Reducer<any, any>>
  private selectors: Map<string, any>

  static getInstance(): StateManagementService {
    if (!StateManagementService.instance) {
      StateManagementService.instance = new StateManagementService()
    }
    return StateManagementService.instance
  }

  registerContext<T>(name: string, context: React.Context<T>): void {
    this.contexts.set(name, context)
  }

  registerProvider<T>(name: string, provider: React.ComponentType): void {
    this.providers.set(name, provider)
  }

  registerReducer<S, A>(name: string, reducer: React.Reducer<S, A>): void {
    this.reducers.set(name, reducer)
  }

  registerSelectors(name: string, selectors: any): void {
    this.selectors.set(name, selectors)
  }

  getContext<T>(name: string): React.Context<T> | undefined {
    return this.contexts.get(name)
  }

  getProvider(name: string): React.ComponentType | undefined {
    return this.providers.get(name)
  }

  getReducer<S, A>(name: string): React.Reducer<S, A> | undefined {
    return this.reducers.get(name)
  }

  getSelectors(name: string): any {
    return this.selectors.get(name)
  }

  createOptimizedProvider<T>(name: string, selector: (state: T) => any): React.ComponentType {
    const context = this.contexts.get(name)
    if (!context) {
      throw new Error(`Context ${name} not found`)
    }
    return createOptimizedProvider(context, selector)
  }

  private contexts: Map<string, React.Context<any>>
  private providers: Map<string, React.ComponentType>
  private reducers: Map<string, React.Reducer<any, any>>
  private selectors: Map<string, any>
}

// src/services/ContextOptimizationService.ts
export class ContextOptimizationService {
  private static instance: ContextOptimizationService
  private memoizedSelectors: Map<string, any>
  private contextSelectors: Map<string, any>

  static getInstance(): ContextOptimizationService {
    if (!ContextOptimizationService.instance) {
      ContextOptimizationService.instance = new ContextOptimizationService()
    }
    return ContextOptimizationService.instance
  }

  createSelector<T, R>(selector: (state: T) => R): () => R {
    return createSelector(selector)
  }

  createMemoizedSelector<T, R>(selector: (state: T) => R): () => R {
    return createMemoizedSelector(selector)
  }

  createContextSelector<T, R>(context: React.Context<T>, selector: (state: T) => R): () => R {
    const key = `${context.displayName || 'UnknownContext'}_${selector.name || 'anonymous'}`

    if (!this.contextSelectors.has(key)) {
      this.contextSelectors.set(key, createContextSelector(context, selector))
    }

    return this.contextSelectors.get(key)
  }

  optimizeProvider<T>(
    Provider: React.ComponentType<{ children: React.ReactNode }>,
  ): React.ComponentType<{ children: React.ReactNode }> {
    return optimizeContextProvider(Provider)
  }

  clearCache(): void {
    this.memoizedSelectors.clear()
    this.contextSelectors.clear()
  }

  private memoizedSelectors: Map<string, any>
  private contextSelectors: Map<string, any>
}

// src/services/PerformanceMonitoringService.ts
export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService
  private metrics: Map<string, number>
  private events: PerformanceEvent[]
  private isEnabled: boolean

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService()
    }
    return PerformanceMonitoringService.instance
  }

  startMonitoring(): void {
    this.isEnabled = true
    this.startPeriodicMetricsCollection()
  }

  stopMonitoring(): void {
    this.isEnabled = false
    this.stopPeriodicMetricsCollection()
  }

  recordMetric(name: string, value: number): void {
    if (!this.isEnabled) return
    this.metrics.set(name, value)
  }

  recordEvent(event: Omit<PerformanceEvent, 'timestamp'>): void {
    if (!this.isEnabled) return
    this.events.push({
      ...event,
      timestamp: Date.now(),
    })
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics)
  }

  getEvents(): PerformanceEvent[] {
    return [...this.events]
  }

  getMetricsByName(name: string): number | undefined {
    return this.metrics.get(name)
  }

  getEventsByName(name: string): PerformanceEvent[] {
    return this.events.filter((event) => event.name === name)
  }

  clearMetrics(): void {
    this.metrics.clear()
  }

  clearEvents(): void {
    this.events = []
  }

  clearAll(): void {
    this.clearMetrics()
    this.clearEvents()
  }

  private startPeriodicMetricsCollection(): void {
    // Implement periodic collection logic
  }

  private stopPeriodicMetricsCollection(): void {
    // Implement stop logic
  }

  private metrics: Map<string, number>
  private events: PerformanceEvent[]
  private isEnabled: boolean
}
```

#### Utility Classes

```typescript
// src/utils/state/StateManager.ts
export class StateManager<T, A> {
  private state: T
  private reducer: React.Reducer<T, A>
  private listeners: Set<(state: T) => void>

  constructor(initialState: T, reducer: React.Reducer<T, A>) {
    this.state = initialState
    this.reducer = reducer
    this.listeners = new Set()
  }

  getState(): T {
    return this.state
  }

  dispatch(action: A): void {
    this.state = this.reducer(this.state, action)
    this.notifyListeners()
  }

  subscribe(listener: (state: T) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state))
  }

  private state: T
  private reducer: React.Reducer<T, A>
  private listeners: Set<(state: T) => void>
}

// src/utils/context/ContextRegistry.ts
export class ContextRegistry {
  private static instance: ContextRegistry
  private contexts: Map<string, React.Context<any>>
  private providers: Map<string, React.ComponentType>

  static getInstance(): ContextRegistry {
    if (!ContextRegistry.instance) {
      ContextRegistry.instance = new ContextRegistry()
    }
    return ContextRegistry.instance
  }

  registerContext<T>(name: string, context: React.Context<T>): void {
    this.contexts.set(name, context)
  }

  registerProvider(name: string, provider: React.ComponentType): void {
    this.providers.set(name, provider)
  }

  getContext<T>(name: string): React.Context<T> | undefined {
    return this.contexts.get(name)
  }

  getProvider(name: string): React.ComponentType | undefined {
    return this.providers.get(name)
  }

  listContexts(): string[] {
    return Array.from(this.contexts.keys())
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  clear(): void {
    this.contexts.clear()
    this.providers.clear()
  }

  private contexts: Map<string, React.Context<any>>
  private providers: Map<string, React.ComponentType>
}

// src/utils/selector/SelectorFactory.ts
export class SelectorFactory {
  private static instance: SelectorFactory
  private memoizedSelectors: Map<string, any>

  static getInstance(): SelectorFactory {
    if (!SelectorFactory.instance) {
      SelectorFactory.instance = new SelectorFactory()
    }
    return SelectorFactory.instance
  }

  createSelector<T, R>(selector: (state: T) => R, name?: string): () => R {
    const key = name || selector.name || 'anonymous'

    if (!this.memoizedSelectors.has(key)) {
      this.memoizedSelectors.set(key, createSelector(selector))
    }

    return this.memoizedSelectors.get(key)
  }

  createMemoizedSelector<T, R>(selector: (state: T) => R, name?: string): () => R {
    const key = `${name || 'anonymous'}_memoized`

    if (!this.memoizedSelectors.has(key)) {
      this.memoizedSelectors.set(key, createMemoizedSelector(selector))
    }

    return this.memoizedSelectors.get(key)
  }

  createStructuredSelector<T, R extends Record<string, (state: T) => any>>(
    selectors: R,
    name?: string,
  ): (state: T) => { [K in keyof R]: R[K] } {
    const key = `${name || 'anonymous'}_structured`

    if (!this.memoizedSelectors.has(key)) {
      this.memoizedSelectors.set(key, createStructuredSelector(selectors))
    }

    return this.memoizedSelectors.get(key)
  }

  clearCache(): void {
    this.memoizedSelectors.clear()
  }

  private memoizedSelectors: Map<string, any>
}
```

### Modified Classes

#### src/types/global.ts - GlobalPropertyManager

**Current file**: src/types/global.ts
**Specific modifications**:

- Remove entire GlobalPropertyManager class
- Replace with context provider types
- Remove all window object manipulation
- Add new context type definitions

**New approach**:

```typescript
// Remove GlobalPropertyManager entirely
// Replace with context definitions
export interface GlobalStateTypes {
  // Context type definitions
  AppState: AppState
  AppAction: AppAction
  AppContextType: AppContextType
  DataContextType: DataContextType
  FilterContextType: FilterContextType
  ChartContextType: ChartContextType
  AnalyticsContextType: AnalyticsContextType
  UIContextType: UIContextType
  SessionContextType: SessionContextType
  PerformanceContextType: PerformanceContextType
}

// Export context providers
export const AppContext = React.createContext<AppContextType | undefined>(undefined)
export const DataContext = React.createContext<DataContextType | undefined>(undefined)
export const FilterContext = React.createContext<FilterContextType | undefined>(undefined)
export const ChartContext = React.createContext<ChartContextType | undefined>(undefined)
export const AnalyticsContext = React.createContext<AnalyticsContextType | undefined>(undefined)
export const UIContext = React.createContext<UIContextType | undefined>(undefined)
export const SessionContext = React.createContext<SessionContextType | undefined>(undefined)
export const PerformanceContext = React.createContext<PerformanceContextType | undefined>(undefined)
```

#### src/services/excelParser.ts - ExcelParser

**Current file**: src/services/excelParser.ts
**Specific modifications**:

- Add context integration for state updates
- Implement performance monitoring
- Add error reporting to context
- Support progressive loading with context updates

**Enhanced methods**:

```typescript
export class ExcelParser {
  // Existing methods...

  async parseFileWithContext(
    file: File,
    dataContext: DataContextType,
    performanceContext: PerformanceContextType,
    options: ParseOptions = {},
  ): Promise<ExcelData> {
    const startTime = performance.now()

    try {
      // Start loading state
      dataContext.actions.setLoading('excel_parsing', true)
      dataContext.actions.setError('excel_parsing', null)

      // Parse file
      const data = await this.parseFile(file, {
        ...options,
        progress: (progress) => {
          dataContext.actions.setProgress(progress)
          performanceContext.recordEvent({
            name: 'parse_progress',
            timestamp: Date.now(),
            duration: 0,
            metadata: { progress },
          })
        },
      })

      // Update state with parsed data
      dataContext.actions.setExcelData(data)

      // Record performance metrics
      const endTime = performance.now()
      const processingTime = endTime - startTime

      performanceContext.recordMetric('file_processing_time', processingTime)
      performanceContext.recordEvent({
        name: 'file_parse_complete',
        timestamp: endTime,
        duration: processingTime,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          rowCount: data.metadata.totalRows,
          columnCount: data.metadata.totalColumns,
        },
      })

      // Update metadata
      dataContext.actions.updateDataMetadata({
        lastUpdated: Date.now(),
        fileSize: file.size,
        processingTime,
        columnStats: this.calculateColumnStats(data),
      })

      return data
    } catch (error) {
      // Handle error
      dataContext.actions.setError(
        'excel_parsing',
        error instanceof Error ? error.message : 'Unknown error',
      )
      performanceContext.recordEvent({
        name: 'file_parse_error',
        timestamp: Date.now(),
        duration: performance.now() - startTime,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          fileName: file.name,
        },
      })
      throw error
    } finally {
      dataContext.actions.setLoading('excel_parsing', false)
    }
  }

  private calculateColumnStats(data: ExcelData): ColumnStats[] {
    // Calculate column statistics
    return data.metadata.columns.map((column) => ({
      name: column.name,
      type: column.type,
      nullCount: column.nullCount,
      uniqueCount: column.uniqueCount,
      average: column.statistics?.average,
      min: column.statistics?.min,
      max: column.statistics?.max,
    }))
  }

  // Add other enhanced methods...
}
```

### Removed Classes

#### src/types/global.ts - GlobalPropertyManager

**Current file**: src/types/global.ts
**Replacement strategy**: Replace with React Context providers and services

- Use AppContextProvider for global state management
- Use DataContextProvider for data operations
- Use FilterContextProvider for filter operations
- Use ChartContextProvider for chart operations
- Use AnalyticsContextProvider for analytics operations
- Use UIContextProvider for UI state management
- Use SessionContextProvider for session operations
- Use PerformanceContextProvider for performance monitoring

**Migration path**:

```typescript
// Before - GlobalPropertyManager
const globalProps = GlobalPropertyManager.getInstance()
const applyChart = globalProps.getApplyChartFromAI()

// After - Context providers
const { applyChart } = useChartContext()
// Context providers handle state management internally
```

## Dependencies

Single sentence describing dependency modifications.

Details of new packages, version changes, and integration requirements.

### New Dependencies to Install

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "use-context-selector": "^1.4.1",
    "immer": "^10.0.2",
    "reselect": "^4.1.8",
    "redux": "^4.2.1",
    "@reduxjs/toolkit": "^1.9.7",
    "zustand": "^4.4.1",
    "jotai": "^2.5.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@types/redux": "^4.4.10",
    "@types/reselect": "^4.1.9",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "redux-mock-store": "^1.5.4",
    "@types/redux-mock-store": "^1.0.3"
  }
}
```

### Existing Dependencies to Update

```json
{
  "dependencies": {
    "typescript": "^5.2.2",
    "@types/node": "^20.8.0",
    "tailwindcss": "^3.3.3",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "xlsx": "^0.18.5",
    "file-saver": "^2.0.5",
    "uuid": "^9.0.1",
    "clsx": "^2.0.0",
    "lucide-react": "^0.288.0"
  }
}
```

### Integration Requirements

#### React Context Integration

- Replace all global state with context providers
- Implement context selectors for performance optimization
- Add context devtools for debugging
- Ensure proper context provider hierarchy
- Implement context fallbacks and error boundaries

#### State Management Integration

- Integrate Redux Toolkit for complex state management
- Use Immer for immutable state updates
- Implement Reselect for memoized selectors
- Add middleware for logging, persistence, and performance
- Ensure proper state normalization

#### Performance Optimization Integration

- Implement React.memo for presentational components
- Add useMemo and useCallback hooks
- Implement virtual scrolling for large datasets
- Add context selector optimization
- Implement component-level error boundaries

#### Testing Integration

- Add testing utilities for context providers
- Implement mock context providers for testing
- Add selector testing utilities
- Implement state management testing utilities
- Add performance testing utilities

## Testing

Single sentence describing testing approach.

Test file requirements, existing test modifications, and validation strategies.

### New Test Files to Create

#### Context Provider Tests

```
src/__tests__/context/
├── AppContext.test.tsx
├── DataContext.test.tsx
├── FilterContext.test.tsx
├── ChartContext.test.tsx
├── AnalyticsContext.test.tsx
├── UIContext.test.tsx
├── SessionContext.test.tsx
└── PerformanceContext.test.tsx
```

#### Reducer Tests

```
src/__tests__/reducers/
├── appReducer.test.ts
├── dataReducer.test.ts
├── filterReducer.test.ts
├── chartReducer.test.ts
├── analyticsReducer.test.ts
├── uiReducer.test.ts
├── sessionReducer.test.ts
└── performanceReducer.test.ts
```

#### Action Tests

```
src/__tests__/actions/
├── dataActions.test.ts
├── filterActions.test.ts
├── chartActions.test.ts
├── analyticsActions.test.ts
├── uiActions.test.ts
├── sessionActions.test.ts
└── performanceActions.test.ts
```

#### Selector Tests

```
src/__tests__/selectors/
├── appSelectors.test.ts
├── dataSelectors.test.ts
├── filterSelectors.test.ts
├── chartSelectors.test.ts
├── analyticsSelectors.test.ts
├── uiSelectors.test.ts
├── sessionSelectors.test.ts
└── performanceSelectors.test.ts
```

#### Integration Tests

```
src/__tests__/integration/
├── context-integration.test.tsx
├── state-management-integration.test.tsx
├── data-flow-integration.test.tsx
├── performance-integration.test.tsx
├── session-persistence-integration.test.tsx
└── error-handling-integration.test.tsx
```

#### Service Tests

```
src/__tests__/services/
├── StateManagementService.test.ts
├── ContextOptimizationService.test.ts
├── PerformanceMonitoringService.test.ts
├── ContextRegistry.test.ts
└── SelectorFactory.test.ts
```

### Existing Test Modifications

#### Update Hook Tests

- **src/**tests**/hooks/useExcelData.test.ts**: Update to test context integration
- **src/**tests**/hooks/useFilters.test.ts**: Update to test context integration
- **src/**tests**/hooks/useCharts.test.ts**: Update to test context integration
- **src/**tests**/hooks/useSessionPersistence.test.ts**: Update to test context integration
- **src/**tests**/hooks/useLLMAnalytics.test.ts**: Update to test context integration

#### Update Component Tests

- **src/**tests**/components/DataTable.test.ts**: Update to test context integration
- **src/**tests**/components/FilterPanel.test.ts**: Update to test context integration
- **src/**tests**/components/ChartView.test.ts**: Update to test context integration
- **src/**tests**/components/analytics/AnalyticsPanel.test.ts**: Update to test context integration

### Test Strategies

#### Unit Testing Strategy

- **Context Providers**: Test state management, action dispatch, and provider functionality
- **Reducers**: Test state transitions, action handling, and immutability
- **Actions**: Test action creation, payload validation, and type safety
- **Selectors**: Test memoization, derived state calculation, and performance
- **Services**: Test service registration, context management, and optimization

#### Integration Testing Strategy

- **Context Integration**: Test multiple contexts working together
- **State Management**: Test complete state management workflow
- **Data Flow**: Test data flow between contexts and components
- **Performance**: Test performance optimization and monitoring
- **Error Handling**: Test error scenarios and recovery mechanisms

#### Performance Testing Strategy

- **Context Performance**: Test context provider performance with large state
- **Selector Performance**: Test selector memoization and optimization
- **Component Performance**: Test component re-rendering and optimization
- **Memory Usage**: Test memory usage and garbage collection
- **Rendering Performance**: Test rendering performance with large datasets

#### End-to-End Testing Strategy

- **User Workflows**: Test complete user workflows with new state management
- **Data Persistence**: Test session persistence and restoration
- **Error Recovery**: Test error recovery and fallback mechanisms
- **Cross-Component Communication**: Test communication between components
- **Performance Monitoring**: Test performance monitoring and reporting

### Validation Criteria

#### Context Validation

- [ ] All context providers provide expected state and actions
- [ ] Context consumers receive correct data and can dispatch actions
- [ ] Context selectors work correctly and are memoized
- [ ] Context fallbacks and error boundaries work correctly
- [ ] Context performance is optimized with minimal re-renders

#### State Management Validation

- [ ] All reducers handle actions correctly and maintain immutability
- [ ] Action creators create valid actions with correct payloads
- [ ] Selectors calculate derived state correctly and are memoized
- [ ] State transitions are predictable and testable
- [ ] State normalization prevents duplication and improves performance

#### Performance Validation

- [ ] Context providers don't cause unnecessary re-renders
- [ ] Selectors are memoized and prevent unnecessary recalculations
- [ ] Component re-rendering is optimized with React.memo
- [ ] Memory usage remains within acceptable limits
- [ ] Performance monitoring provides accurate metrics and insights

#### Integration Validation

- [ ] All existing functionality works with new state management
- [ ] Data flows correctly between contexts and components
- [ ] User interactions work as expected with new state management
- [ ] Error handling and recovery work correctly
- [ ] Performance monitoring provides useful insights

#### Migration Validation

- [ ] Global state is completely replaced with context providers
- [ ] All components use new context-based state management
- [ ] No direct window object access remains
- [ ] All existing functionality is preserved
- [ ] Performance and maintainability are improved

## Implementation Order

Single sentence describing the implementation sequence.

Numbered steps showing the logical order of changes to minimize conflicts and ensure successful integration.

### 1. Setup Foundation (Day 1-2)

1. **Install new dependencies**: Add use-context-selector, immer, reselect, redux, @reduxjs/toolkit
2. **Create folder structure**: Set up context, reducers, actions, selectors, and utils folders
3. **Update TypeScript configuration**: Add path aliases and strict mode settings
4. **Create base types**: Define AppState, AppAction, and all context types

### 2. Implement Core State Management (Day 2-3)

1. **Create reducers**: Implement appReducer, dataReducer, filterReducer, chartReducer, analyticsReducer, uiReducer,
   sessionReducer, performanceReducer
2. **Create actions**: Implement all action creators with type safety
3. **Create selectors**: Implement memoized selectors for all derived state
4. **Create root reducer**: Combine all reducers into root reducer
5. **Test state management**: Write unit tests for reducers, actions, and selectors

### 3. Implement Context Providers (Day 3-4)

1. **Create AppContextProvider**: Implement main application context provider
2. **Create DataContextProvider**: Implement data-specific context provider
3. **Create FilterContextProvider**: Implement filter-specific context provider
4. **Create ChartContextProvider**: Implement chart-specific context provider
5. **Create other context providers**: Implement AnalyticsContextProvider, UIContextProvider, SessionContextProvider,
   PerformanceContextProvider
6. **Test context providers**: Write unit tests for all context providers

### 4. Implement Services (Day 4-5)

1. **Create StateManagementService**: Implement service for managing contexts and providers
2. **Create ContextOptimizationService**: Implement service for optimizing context performance
3. **Create PerformanceMonitoringService**: Implement service for performance monitoring
4. **Create ContextRegistry**: Implement service for registering contexts and providers
5. **Create SelectorFactory**: Implement service for creating optimized selectors
6. **Test services**: Write unit tests for all services

### 5. Implement Custom Hooks (Day 5-6)

1. **Create context hooks**: Implement useAppContext, useDataContext, useFilterContext, useChartContext,
   useAnalyticsContext, useUIContext, useSessionContext, usePerformanceContext
2. **Migrate existing hooks**: Update useExcelData, useFilters, useCharts, useSessionPersistence, useLLMAnalytics to use
   new context system
3. **Test custom hooks**: Write unit tests for all custom hooks
4. **Test hook migrations**: Ensure migrated hooks work correctly

### 6. Update Components (Day 6-7)

1. **Update page.tsx**: Replace with new context-based architecture
2. **Update DataTable**: Use new context system and selectors
3. **Update FilterPanel**: Use new context system and selectors
4. **Update ChartView**: Use new context system and selectors
5. **Update AnalyticsPanel**: Use new context system and selectors
6. **Update other components**: Update all remaining components to use new context system
7. **Test component updates**: Write integration tests for updated components

### 7. Remove Global State (Day 7-8)

1. **Remove GlobalPropertyManager**: Remove entire class and all references
2. **Remove window object access**: Remove all direct window object access
3. **Update global types**: Replace with context-based types
4. **Test global state removal**: Ensure no global state remains
5. **Test functionality**: Ensure all functionality works without global state

### 8. Implement Error Boundaries (Day 8-9)

1. **Create context error boundaries**: Implement error boundaries for each context
2. **Create component error boundaries**: Implement error boundaries for components
3. **Add error recovery**: Implement error recovery and fallback mechanisms
4. **Integrate with performance monitoring**: Add error reporting to performance monitoring
5. **Test error handling**: Test error scenarios and recovery mechanisms

### 9. Performance Optimization (Day 9-10)

1. **Implement React.memo**: Add memoization to presentational components
2. **Optimize context selectors**: Implement efficient context selectors
3. **Optimize virtual scrolling**: Fine-tune virtual scrolling performance
4. **Add performance monitoring**: Implement comprehensive performance monitoring
5. **Test performance**: Test performance improvements and identify bottlenecks

### 10. Final Testing and Validation (Day 10-11)

1. **Comprehensive testing**: Run all unit, integration, and performance tests
2. **Regression testing**: Ensure all existing functionality works correctly
3. **Performance testing**: Test performance improvements and optimization
4. **User acceptance testing**: Validate user experience and workflows
5. **Documentation**: Update documentation with new state management system

### 11. Rollout and Monitoring (Day 11-12)

1. **Staged rollout**: Roll out changes in stages with monitoring
2. **Performance monitoring**: Monitor performance metrics and user feedback
3. **Bug fixes**: Address any issues found during rollout
4. **Optimization**: Continue optimization based on real-world usage
5. **Documentation updates**: Update documentation based on feedback and lessons learned

This implementation plan provides a comprehensive approach to refactoring the state management system, ensuring better
performance, type safety, and maintainability while preserving all existing functionality.
