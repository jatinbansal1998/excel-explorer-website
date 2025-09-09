# Implementation Plan

[Overview]
Create a comprehensive testing framework for UI components to ensure existing functionality doesn't break during refactoring.

This implementation plan establishes a complete testing infrastructure using Jest + React Testing Library to support the component refactoring outlined in REFACTORING_PLAN_PHASE_1_COMPONENTS.md. The testing framework will cover component behavior validation, user interaction testing, state management verification, and integration testing between containers and presentational components. All tests will run in a browser-like DOM environment with real service integration for external dependencies like Excel parsing and OpenRouter API.

[Types]
Type definitions for testing infrastructure, test utilities, and mock configurations.

### Test Configuration Types

```typescript
// Test environment configuration
interface TestConfig {
  setupFiles: string[]
  testEnvironment: string
  moduleNameMapping: Record<string, string>
  collectCoverageFrom: string[]
  coverageDirectory: string
  testMatch: string[]
}

// Test data structures
interface TestData {
  excelFiles: {
    sample: File
    large: File
    corrupted: File
    empty: File
  }
  openRouterConfig: {
    apiKey: string
    baseUrl: string
    model: string
  }
  mockData: {
    excelData: ExcelData
    filterConfigs: FilterConfig[]
    chartConfigs: ChartConfig[]
  }
}

// Test utility types
interface TestHelpers {
  createMockFile: (name: string, content: string, type: string) => File
  createMockExcelData: (overrides?: Partial<ExcelData>) => ExcelData
  createMockFilter: (overrides?: Partial<FilterConfig>) => FilterConfig
  createMockChart: (overrides?: Partial<ChartConfig>) => ChartConfig
  waitForAsync: () => Promise<void>
  mockOpenRouterResponse: (response: any) => void
}

// Component test props
interface ComponentTestProps<T = any> {
  component: React.ComponentType<T>
  props: T
  wrapper?: React.ComponentType
  providers?: React.ComponentType[]
}

// Integration test types
interface IntegrationTestConfig {
  services: {
    excelParser: boolean
    openRouter: boolean
    chartService: boolean
  }
  data: {
    useRealExcel: boolean
    useRealApi: boolean
  }
}
```

### Test Case Types

```typescript
// Component behavior tests
interface ComponentBehaviorTest {
  name: string
  component: string
  scenario: string
  props: Record<string, any>
  expected: {
    rendered: boolean
    text?: string
    elements?: string[]
    state?: Record<string, any>
  }
}

// User interaction tests
interface UserInteractionTest {
  name: string
  component: string
  interactions: Array<{
    action: 'click' | 'type' | 'hover' | 'drag'
    target: string
    value?: string
  }>
  expected: {
    stateChanges?: Record<string, any>
    events?: string[]
    navigation?: string
  }
}

// State management tests
interface StateManagementTest {
  name: string
  component: string
  initialState: Record<string, any>
  actions: Array<{
    type: string
    payload?: any
  }>
  expectedState: Record<string, any>
}

// Integration test types
interface IntegrationTest {
  name: string
  components: string[]
  dataFlow: {
    input: any
    expectedOutput: any
    intermediateStates?: any[]
  }
  services: string[]
}
```

[Files]
New test files and configuration files to be created, plus existing files to be modified.

### New Files to Create

#### Configuration Files

```
jest.config.js                    # Jest configuration
jest.setup.js                    # Jest setup file
testing.config.js                # Testing configuration
testing.env.js                   # Test environment variables
```

#### Test Infrastructure Files

```
__tests__/
├── setup/
│   ├── test-utils.tsx           # Test utilities and helpers
│   ├── mock-data.ts             # Mock data generators
│   ├── mock-services.ts         # Service mocks
│   ├── test-providers.tsx       # Test providers wrapper
│   └── environment-setup.ts     # Test environment setup
├── utils/
│   ├── component-tester.tsx     # Component testing utilities
│   ├── interaction-tester.tsx   # Interaction testing utilities
│   ├── state-tester.tsx         # State testing utilities
│   ├── integration-tester.tsx   # Integration testing utilities
│   └── data-generators.ts       # Test data generators
├── fixtures/
│   ├── excel-files/
│   │   ├── sample-data.xlsx     # Sample Excel file for testing
│   │   ├── large-dataset.xlsx   # Large dataset for performance testing
│   │   └── empty-file.xlsx      # Empty file for edge case testing
│   ├── test-data/
│   │   ├── mock-excel-data.ts   # Mock Excel data
│   │   ├── mock-filters.ts      # Mock filter configurations
│   │   ├── mock-charts.ts       # Mock chart configurations
│   │   └── mock-responses.ts   # Mock API responses
│   └── assets/
│       └── test-images/         # Test images if needed
├── unit/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.test.tsx
│   │   │   ├── Modal.test.tsx
│   │   │   ├── Card.test.tsx
│   │   │   ├── LoadingSpinner.test.tsx
│   │   │   ├── Toast.test.tsx
│   │   │   └── Badge.test.tsx
│   │   ├── data/
│   │   │   ├── DataTable.test.tsx
│   │   │   ├── FileUploader.test.tsx
│   │   │   └── TableComponents.test.tsx
│   │   ├── filters/
│   │   │   ├── FilterPanel.test.tsx
│   │   │   ├── FilterComponents.test.tsx
│   │   │   └── FilterTypes.test.tsx
│   │   ├── charts/
│   │   │   ├── ChartContainer.test.tsx
│   │   │   ├── ChartComponents.test.tsx
│   │   │   └── ChartModals.test.tsx
│   │   ├── analytics/
│   │   │   ├── AnalyticsPanel.test.tsx
│   │   │   ├── Suggestions.test.tsx
│   │   │   └── PromptInput.test.tsx
│   │   ├── layout/
│   │   │   ├── Header.test.tsx
│   │   │   └── LayoutComponents.test.tsx
│   │   └── session/
│   │       ├── SessionManager.test.tsx
│   │       └── SessionComponents.test.tsx
│   ├── hooks/
│   │   ├── useExcelData.test.ts
│   │   ├── useFilters.test.ts
│   │   ├── useCharts.test.ts
│   │   ├── useLLMAnalytics.test.ts
│   │   ├── useOpenRouter.test.ts
│   │   ├── useSessionPersistence.test.ts
│   │   └── usePerformance.test.ts
│   ├── services/
│   │   ├── excelParser.test.ts
│   │   ├── dataFilter.test.ts
│   │   ├── chartDataProcessor.test.ts
│   │   ├── llmAnalytics.test.ts
│   │   └── openrouter.test.ts
│   └── utils/
│       ├── dataTypes.test.ts
│       ├── validation.test.ts
│       ├── exportUtils.test.ts
│       └── performanceMonitor.test.ts
├── integration/
│   ├── data-flow/
│   │   ├── UploadToTable.test.tsx
│   │   ├── TableToFilters.test.tsx
│   │   ├── FiltersToCharts.test.tsx
│   │   └── ChartsToAnalytics.test.tsx
│   ├── component-interactions/
│   │   ├── FilterPanelIntegration.test.tsx
│   │   ├── ChartCreationIntegration.test.tsx
│   │   └── AnalyticsIntegration.test.tsx
│   ├── state-management/
│   │   ├── ContextIntegration.test.tsx
│   │   ├── GlobalStateIntegration.test.tsx
│   │   └── SessionPersistenceIntegration.test.tsx
│   └── services/
│       ├── ExcelParserIntegration.test.tsx
│       ├── OpenRouterIntegration.test.tsx
│       └── ChartServiceIntegration.test.tsx
└── e2e/
    ├── user-workflows/
    │   ├── FileUploadWorkflow.test.tsx
    │   ├── DataExplorationWorkflow.test.tsx
    │   ├── FilterCreationWorkflow.test.tsx
    │   ├── ChartCreationWorkflow.test.tsx
    │   └── AnalyticsWorkflow.test.tsx
    ├── performance/
    │   ├── LargeDatasetPerformance.test.tsx
    │   ├── MultipleChartsPerformance.test.tsx
    │   └── ComplexFiltersPerformance.test.tsx
    └── error-handling/
        ├── ErrorBoundaryIntegration.test.tsx
        ├── FileErrorHandling.test.tsx
        └── ApiErrorHandling.test.tsx
```

### Existing Files to Modify

#### package.json

**Changes**:

- Add testing dependencies
- Add test scripts
- Configure test commands

**New dependencies**:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^15.0.7",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/react-hooks": "^8.0.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.2",
    "@types/jest": "^29.5.12",
    "jest-transform-stub": "^2.0.0",
    "identity-obj-proxy": "^3.0.0",
    "whatwg-fetch": "^3.6.20"
  }
}
```

**New scripts**:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:components": "jest --testPathPattern=components",
    "test:services": "jest --testPathPattern=services"
  }
}
```

#### tsconfig.json

**Changes**:

- Add Jest types
- Add test file includes
- Configure module resolution for test files

**New configuration**:

```json
{
  "compilerOptions": {
    "types": ["jest", "node", "@testing-library/jest-dom"]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
```

#### .gitignore

**Changes**:

- Add test coverage directory
- Add test environment files
- Add test cache files

**Additions**:

```
# Testing
coverage/
.nyc_output/
test-results/
junit.xml
*.lcov

# Test environment
.env.test
.env.local.test
testing.env.js

# Test cache
.jest/
.ts-jest/
```

#### .eslintrc.json

**Changes**:

- Add Jest environment
- Configure ESLint for test files
- Add testing-specific rules

**New configuration**:

```json
{
  "env": {
    "jest": true
  },
  "overrides": [
    {
      "files": ["**/*.test.*", "**/*.spec.*"],
      "rules": {
        "no-unused-expressions": "off",
        "@typescript-eslint/no-unused-expressions": "off"
      }
    }
  ]
}
```

### Test Configuration Files

#### jest.config.js (New)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
    '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/__tests__/utils/fileMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
}
```

#### jest.setup.js (New)

```javascript
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import 'whatwg-fetch'

// Configure testing-library
configure({
  testIdAttribute: 'data-testid',
  throwSuggestions: true,
})

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Global test setup
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
```

#### testing.env.js (New)

```javascript
// Test environment configuration
export const testConfig = {
  // OpenRouter API placeholder - to be replaced with real key
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || 'test-api-key-placeholder',
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',

  // Test file paths
  TEST_EXCEL_FILES: {
    SAMPLE: './__tests__/fixtures/excel-files/sample-data.xlsx',
    LARGE: './__tests__/fixtures/excel-files/large-dataset.xlsx',
    EMPTY: './__tests__/fixtures/excel-files/empty-file.xlsx',
  },

  // Test configuration
  USE_REAL_SERVICES: process.env.USE_REAL_SERVICES === 'true',
  TEST_TIMEOUT: parseInt(process.env.TEST_TIMEOUT || '10000', 10),

  // Coverage configuration
  COVERAGE_THRESHOLD: {
    STATEMENTS: 80,
    BRANCHES: 75,
    FUNCTIONS: 80,
    LINES: 80,
  },
}

// Export for use in tests
export default testConfig
```

[Functions]
Test utility functions, helper functions, and test case generators.

### New Test Utility Functions

#### Test Setup and Teardown Functions

```typescript
// __tests__/setup/test-utils.tsx
export function setupTestProviders() {
  return {
    AppContextProvider: MockAppContextProvider,
    DataContextProvider: MockDataContextProvider,
    FilterContextProvider: MockFilterContextProvider,
    ChartContextProvider: MockChartContextProvider,
    UIContextProvider: MockUIContextProvider,
  }
}

export function createTestWrapper(providers: React.ComponentType[] = []) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return providers.reduceRight((acc, Provider) => (
      <Provider>{acc}</Provider>
    ), children as React.ReactElement)
  }
}

export function cleanupTest() {
  jest.clearAllMocks()
  jest.clearAllTimers()
  localStorage.clear()
  sessionStorage.clear()
}
```

#### Mock Data Generators

```typescript
// __tests__/fixtures/test-data/mock-excel-data.ts
export function createMockExcelData(overrides?: Partial<ExcelData>): ExcelData {
  const defaultData: ExcelData = {
    headers: ['Name', 'Age', 'City', 'Salary'],
    rows: [
      ['John Doe', 30, 'New York', 50000],
      ['Jane Smith', 25, 'Los Angeles', 60000],
      ['Bob Johnson', 35, 'Chicago', 70000],
    ],
    metadata: {
      fileName: 'test-data.xlsx',
      sheetNames: ['Sheet1'],
      activeSheet: 'Sheet1',
      totalRows: 3,
      totalColumns: 4,
      columns: [
        {
          name: 'Name',
          index: 0,
          type: 'string',
          uniqueValues: ['John Doe', 'Jane Smith', 'Bob Johnson'],
          uniqueCount: 3,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['John Doe'],
        },
        {
          name: 'Age',
          index: 1,
          type: 'number',
          uniqueValues: [30, 25, 35],
          uniqueCount: 3,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [30],
        },
        {
          name: 'City',
          index: 2,
          type: 'string',
          uniqueValues: ['New York', 'Los Angeles', 'Chicago'],
          uniqueCount: 3,
          hasNulls: false,
          nullCount: 0,
          sampleValues: ['New York'],
        },
        {
          name: 'Salary',
          index: 3,
          type: 'number',
          uniqueValues: [50000, 60000, 70000],
          uniqueCount: 3,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [50000],
        },
      ],
      fileSize: 1024,
    },
  }

  return { ...defaultData, ...overrides }
}

export function createMockFilter(overrides?: Partial<FilterConfig>): FilterConfig {
  const defaultFilter: FilterConfig = {
    id: 'test-filter-1',
    displayName: 'Test Filter',
    column: 'Name',
    columnIndex: 0,
    type: 'select',
    active: true,
    operator: 'equals',
    values: [
      { value: 'John Doe', selected: true, count: 1 },
      { value: 'Jane Smith', selected: false, count: 1 },
      { value: 'Bob Johnson', selected: false, count: 1 },
    ],
  }

  return { ...defaultFilter, ...overrides }
}

export function createMockChart(overrides?: Partial<ChartConfig>): ChartConfig {
  const defaultChart: ChartConfig = {
    id: 'test-chart-1',
    type: 'pie',
    title: 'Test Chart',
    dataColumn: 'City',
    labelColumn: 'Name',
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  }

  return { ...defaultChart, ...overrides }
}
```

#### Component Testing Utilities

```typescript
// __tests__/utils/component-tester.tsx
export async function renderComponent<T>(
  component: React.ComponentType<T>,
  props: T,
  options: {
    wrapper?: React.ComponentType
    providers?: React.ComponentType[]
  } = {}
) {
  const { wrapper, providers = [] } = options
  const Wrapper = createTestWrapper(providers)

  const renderResult = render(
    <Wrapper>
      <React.createElement(component, props) />
    </Wrapper>,
    { wrapper }
  )

  return {
    ...renderResult,
    rerender: (newProps: Partial<T>) => {
      return renderResult.rerender(
        <Wrapper>
          <React.createElement(component, { ...props, ...newProps } />
        </Wrapper>
      )
    }
  }
}

export function testComponentRendering<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    expected: {
      rendered: boolean
      text?: string
      elements?: string[]
    }
  }>
) {
  describe(`${component.name} rendering`, () => {
    testCases.forEach(({ name, props, expected }) => {
      it(`should render correctly: ${name}`, async () => {
        const { container, getByText } = await renderComponent(component, props)

        expect(container).toBeInTheDocument()

        if (expected.text) {
          expect(getByText(expected.text)).toBeInTheDocument()
        }

        if (expected.elements) {
          expected.elements.forEach(element => {
            expect(container.querySelector(element)).toBeInTheDocument()
          })
        }
      })
    })
  })
}
```

#### Interaction Testing Utilities

```typescript
// __tests__/utils/interaction-tester.tsx
export async function testUserInteractions<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    interactions: Array<{
      action: 'click' | 'type' | 'hover' | 'drag'
      target: string
      value?: string
    }>
    expected: {
      stateChanges?: Record<string, any>
      events?: string[]
      navigation?: string
    }
  }>,
) {
  describe(`${component.name} user interactions`, () => {
    testCases.forEach(({ name, props, interactions, expected }) => {
      it(`should handle interactions: ${name}`, async () => {
        const { container, getByRole, getByLabelText, getByTestId } = await renderComponent(
          component,
          props,
        )

        // Perform interactions
        for (const interaction of interactions) {
          const target = interaction.target.startsWith('data-testid')
            ? getByTestId(interaction.target.replace('data-testid=', ''))
            : interaction.target.startsWith('[aria-label')
              ? getByLabelText(interaction.target.match(/aria-label="([^"]+)"/)?.[1] || '')
              : container.querySelector(interaction.target)

          expect(target).toBeInTheDocument()

          switch (interaction.action) {
            case 'click':
              await userEvent.click(target)
              break
            case 'type':
              await userEvent.type(target, interaction.value || '')
              break
            case 'hover':
              await userEvent.hover(target)
              break
            case 'drag':
              // Drag implementation
              break
          }
        }

        // Verify expected outcomes
        if (expected.stateChanges) {
          // State change verification
        }

        if (expected.events) {
          // Event verification
        }
      })
    })
  })
}
```

#### State Management Testing Utilities

```typescript
// __tests__/utils/state-tester.tsx
export function testStateManagement<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    initialState: Record<string, any>
    actions: Array<{
      type: string
      payload?: any
    }>
    expectedState: Record<string, any>
  }>,
) {
  describe(`${component.name} state management`, () => {
    testCases.forEach(({ name, props, initialState, actions, expectedState }) => {
      it(`should manage state correctly: ${name}`, async () => {
        // Mock context state
        const mockContext = createMockContext(initialState)

        const { container } = await renderComponent(component, props, {
          providers: [mockContext.Provider],
        })

        // Perform actions
        for (const action of actions) {
          const actionButton = container.querySelector(`[data-action="${action.type}"]`)
          if (actionButton) {
            await userEvent.click(actionButton)
          }
        }

        // Verify state changes
        expect(mockContext.getState()).toEqual(expectedState)
      })
    })
  })
}
```

#### Integration Testing Utilities

```typescript
// __tests__/utils/integration-tester.tsx
export async function testIntegrationFlow(
  testName: string,
  components: Array<{
    name: string
    component: React.ComponentType<any>
    props: any
  }>,
  testData: {
    input: any
    expectedOutput: any
    intermediateStates?: any[]
  },
  services: string[] = [],
) {
  describe(`Integration: ${testName}`, () => {
    it('should handle data flow between components correctly', async () => {
      // Setup services
      const serviceMocks = setupServiceMocks(services)

      // Render components in sequence
      let currentData = testData.input

      for (const { name, component, props } of components) {
        const { container } = await renderComponent(component, {
          ...props,
          data: currentData,
        })

        // Simulate user interactions or data processing
        const processedData = await processComponentData(container, name)

        if (testData.intermediateStates) {
          const stateIndex = components.findIndex((c) => c.name === name)
          if (stateIndex >= 0) {
            expect(processedData).toEqual(testData.intermediateStates[stateIndex])
          }
        }

        currentData = processedData
      }

      // Verify final output
      expect(currentData).toEqual(testData.expectedOutput)

      // Verify service calls
      verifyServiceCalls(serviceMocks)
    })
  })
}
```

#### Service Mock Utilities

```typescript
// __tests__/setup/mock-services.ts
export function createMockExcelParser() {
  return {
    parseFile: jest.fn().mockImplementation((file: File) => {
      return Promise.resolve(createMockExcelData())
    }),
    detectColumnTypes: jest.fn().mockReturnValue([]),
    getWorkbookInfo: jest.fn().mockReturnValue({
      sheetNames: ['Sheet1'],
      totalRows: 100,
      totalColumns: 5,
    }),
  }
}

export function createMockOpenRouterService() {
  return {
    generateAnalytics: jest.fn().mockImplementation((prompt: string) => {
      return Promise.resolve({
        insights: ['Test insight 1', 'Test insight 2'],
        suggestions: ['Test suggestion 1'],
        confidence: 0.85,
      })
    }),
    generateChartSuggestions: jest.fn().mockImplementation((data: ExcelData) => {
      return Promise.resolve([
        { type: 'pie', column: 'City', confidence: 0.9 },
        { type: 'bar', column: 'Age', confidence: 0.8 },
      ])
    }),
  }
}

export function setupServiceMocks(services: string[]) {
  const mocks: Record<string, any> = {}

  if (services.includes('excelParser')) {
    mocks.excelParser = createMockExcelParser()
  }

  if (services.includes('openRouter')) {
    mocks.openRouter = createMockOpenRouterService()
  }

  return mocks
}
```

### Modified Functions

#### src/components/DataTable.tsx - formatCellValue

**Current file**: src/components/DataTable.tsx
**Required changes**:

- Extract formatCellValue to utility function for easier testing
- Add type safety and validation
- Make it pure function without side effects

**New signature**:

```typescript
// src/utils/data-formatting.ts
export function formatCellValue(value: any, type: DataType, options: FormatOptions = {}): string {
  // Extracted logic from DataTable component
  // Add validation and error handling
  if (value === null || value === undefined || value === '') {
    return ''
  }

  switch (type) {
    case 'date':
      // Date formatting logic
      break
    case 'number':
      // Number formatting logic
      break
    case 'boolean':
      // Boolean formatting logic
      break
    default:
      return String(value)
  }
}
```

#### src/components/FilterPanel.tsx - FilterComponent

**Current file**: src/components/FilterPanel.tsx
**Required changes**:

- Split into separate filter type components for better testability
- Add prop validation
- Remove direct state mutations

**New components**:

```typescript
// src/components/presentational/filters/SelectFilter.tsx
export function SelectFilter({ filter, onChange }: SelectFilterProps) {
  // Pure presentational component
  // No state management, only UI rendering
}

// src/components/presentational/filters/RangeFilter.tsx
export function RangeFilter({ filter, onChange }: RangeFilterProps) {
  // Pure presentational component
}
```

[Classes]
Test classes and mock classes for testing infrastructure.

### New Test Classes

#### Test Configuration Class

```typescript
// __tests__/setup/TestConfig.ts
export class TestConfig {
  private static instance: TestConfig
  private config: TestConfigType

  private constructor() {
    this.config = this.loadConfig()
  }

  static getInstance(): TestConfig {
    if (!TestConfig.instance) {
      TestConfig.instance = new TestConfig()
    }
    return TestConfig.instance
  }

  private loadConfig(): TestConfigType {
    return {
      testEnvironment: 'jsdom',
      setupFiles: ['<rootDir>/jest.setup.js'],
      testTimeout: 10000,
      coverageThreshold: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
      services: {
        excelParser: {
          useRealService: process.env.USE_REAL_EXCEL_PARSER === 'true',
          mockDataPath: './__tests__/fixtures/excel-files',
        },
        openRouter: {
          useRealService: process.env.USE_REAL_OPENROUTER === 'true',
          apiKey: process.env.OPENROUTER_API_KEY || 'test-key',
          baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        },
      },
    }
  }

  getConfig(): TestConfigType {
    return this.config
  }

  isRealServiceEnabled(serviceName: string): boolean {
    return this.config.services[serviceName]?.useRealService || false
  }

  getTestTimeout(): number {
    return this.config.testTimeout
  }
}
```

#### Test Data Manager Class

```typescript
// __tests__/fixtures/TestDataManager.ts
export class TestDataManager {
  private static instance: TestDataManager
  private testData: Map<string, any> = new Map()

  private constructor() {
    this.initializeTestData()
  }

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager()
    }
    return TestDataManager.instance
  }

  private initializeTestData() {
    // Initialize mock data
    this.testData.set('excelData', createMockExcelData())
    this.testData.set('filters', [
      createMockFilter({ type: 'select' }),
      createMockFilter({ type: 'range' }),
      createMockFilter({ type: 'search' }),
    ])
    this.testData.set('charts', [
      createMockChart({ type: 'pie' }),
      createMockChart({ type: 'bar' }),
    ])
  }

  getTestData(key: string): any {
    return this.testData.get(key)
  }

  setTestData(key: string, data: any): void {
    this.testData.set(key, data)
  }

  getExcelData(): ExcelData {
    return this.testData.get('excelData')
  }

  getFilters(): FilterConfig[] {
    return this.testData.get('filters')
  }

  getCharts(): ChartConfig[] {
    return this.testData.get('charts')
  }

  createLargeDataset(size: number = 1000): ExcelData {
    const headers = ['ID', 'Name', 'Value', 'Category', 'Date']
    const rows = []

    for (let i = 1; i <= size; i++) {
      rows.push([
        i,
        `Item ${i}`,
        Math.floor(Math.random() * 1000),
        `Category ${Math.floor(Math.random() * 10)}`,
        new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      ])
    }

    return createMockExcelData({
      headers,
      rows,
      metadata: {
        fileName: 'large-dataset.xlsx',
        sheetNames: ['Sheet1'],
        activeSheet: 'Sheet1',
        totalRows: size,
        totalColumns: headers.length,
        columns: headers.map((header, index) => ({
          name: header,
          index,
          type: index === 0 ? 'number' : index === 4 ? 'date' : 'string',
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        })),
        fileSize: size * 100,
      },
    })
  }
}
```

#### Test Service Manager Class

```typescript
// __tests__/setup/TestServiceManager.ts
export class TestServiceManager {
  private static instance: TestServiceManager
  private services: Map<string, any> = new Map()
  private mocks: Map<string, any> = new Map()

  private constructor() {
    this.initializeServices()
  }

  static getInstance(): TestServiceManager {
    if (!TestServiceManager.instance) {
      TestServiceManager.instance = new TestServiceManager()
    }
    return TestServiceManager.instance
  }

  private initializeServices() {
    const config = TestConfig.getInstance()

    // Excel Parser Service
    if (config.isRealServiceEnabled('excelParser')) {
      this.services.set('excelParser', new ExcelParser())
    } else {
      this.mocks.set('excelParser', createMockExcelParser())
    }

    // OpenRouter Service
    if (config.isRealServiceEnabled('openRouter')) {
      const openRouterConfig = config.getConfig().services.openRouter
      this.services.set('openRouter', new OpenRouterService(openRouterConfig))
    } else {
      this.mocks.set('openRouter', createMockOpenRouterService())
    }
  }

  getService(name: string): any {
    return this.services.get(name) || this.mocks.get(name)
  }

  getMock(name: string): any {
    return this.mocks.get(name)
  }

  resetAllMocks(): void {
    this.mocks.forEach((mock) => {
      Object.keys(mock).forEach((key) => {
        if (typeof mock[key] === 'function') {
          mock[key].mockClear()
        }
      })
    })
  }

  setupRealServices(): void {
    const config = TestConfig.getInstance()

    if (config.isRealServiceEnabled('excelParser')) {
      this.services.set('excelParser', new ExcelParser())
    }

    if (config.isRealServiceEnabled('openRouter')) {
      const openRouterConfig = config.getConfig().services.openRouter
      this.services.set('openRouter', new OpenRouterService(openRouterConfig))
    }
  }
}
```

#### Test Assertion Helpers Class

```typescript
// __tests__/utils/TestAssertions.ts
export class TestAssertions {
  static assertComponentRendered(container: HTMLElement, componentName: string): void {
    const component = container.querySelector(`[data-component="${componentName}"]`)
    expect(component).toBeInTheDocument()
  }

  static assertComponentNotRendered(container: HTMLElement, componentName: string): void {
    const component = container.querySelector(`[data-component="${componentName}"]`)
    expect(component).not.toBeInTheDocument()
  }

  static assertTextContent(container: HTMLElement, selector: string, expectedText: string): void {
    const element = container.querySelector(selector)
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent(expectedText)
  }

  static assertElementVisible(container: HTMLElement, selector: string): void {
    const element = container.querySelector(selector)
    expect(element).toBeInTheDocument()
    expect(element).toBeVisible()
  }

  static assertElementHidden(container: HTMLElement, selector: string): void {
    const element = container.querySelector(selector)
    if (element) {
      expect(element).not.toBeVisible()
    }
  }

  static assertButtonDisabled(container: HTMLElement, selector: string): void {
    const button = container.querySelector(selector)
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  }

  static assertButtonEnabled(container: HTMLElement, selector: string): void {
    const button = container.querySelector(selector)
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  }

  static assertLoadingState(container: HTMLElement, isLoading: boolean): void {
    const loadingElement = container.querySelector('[data-testid="loading"]')
    if (isLoading) {
      expect(loadingElement).toBeInTheDocument()
    } else {
      expect(loadingElement).not.toBeInTheDocument()
    }
  }

  static assertErrorState(container: HTMLElement, hasError: boolean, errorMessage?: string): void {
    const errorElement = container.querySelector('[data-testid="error"]')
    if (hasError) {
      expect(errorElement).toBeInTheDocument()
      if (errorMessage) {
        expect(errorElement).toHaveTextContent(errorMessage)
      }
    } else {
      expect(errorElement).not.toBeInTheDocument()
    }
  }

  static assertDataTableContent(container: HTMLElement, expectedData: any[][]): void {
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(expectedData.length)

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td')
      expect(cells.length).toBe(expectedData[rowIndex].length)

      cells.forEach((cell, cellIndex) => {
        expect(cell).toHaveTextContent(String(expectedData[rowIndex][cellIndex]))
      })
    })
  }

  static assertFilterActive(container: HTMLElement, filterId: string, isActive: boolean): void {
    const filter = container.querySelector(`[data-filter-id="${filterId}"]`)
    expect(filter).toBeInTheDocument()

    const checkbox = filter?.querySelector('input[type="checkbox"]')
    if (checkbox) {
      if (isActive) {
        expect(checkbox).toBeChecked()
      } else {
        expect(checkbox).not.toBeChecked()
      }
    }
  }

  static assertChartRendered(container: HTMLElement, chartId: string): void {
    const chart = container.querySelector(`[data-chart-id="${chartId}"]`)
    expect(chart).toBeInTheDocument()
  }
}
```

[Dependencies]
Testing dependencies and development dependencies to be installed.

### New Dependencies to Install

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^15.0.7",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/react-hooks": "^8.0.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.2",
    "@types/jest": "^29.5.12",
    "jest-transform-stub": "^2.0.0",
    "identity-obj-proxy": "^3.0.0",
    "whatwg-fetch": "^3.6.20",
    "@jest/types": "^29.5.12",
    "jest-circus": "^29.7.0",
    "jest-environment-node": "^29.7.0"
  }
}
```

### Integration Requirements

#### Jest Integration

- Configure Jest with JSDOM environment for browser-like testing
- Setup TypeScript support with ts-jest
- Configure module mapping for path aliases
- Setup coverage collection and reporting

#### React Testing Library Integration

- Configure testing-library with custom render methods
- Setup user-event for realistic user interaction testing
- Configure custom test ID attributes for better element selection
- Setup async utilities for testing async operations

#### Service Integration

- Excel Parser: Support both real service and mock service testing
- OpenRouter API: Support both real API calls and mocked responses
- Chart.js: Configure mock chart rendering for testing
- Session Persistence: Mock IndexedDB and localStorage for testing

#### Environment Integration

- Browser-like DOM environment with JSDOM
- Fetch API polyfill for HTTP requests
- LocalStorage and SessionStorage mocking
- File API mocking for file upload testing

### Configuration Requirements

#### Jest Configuration

- Test environment: JSDOM
- Setup files for global test configuration
- Module mapping for path aliases
- Coverage configuration with thresholds
- Timeout configuration for async tests

#### TypeScript Configuration

- Jest type definitions
- Test file includes
- Module resolution for test files
- Strict type checking for test files

#### ESLint Configuration

- Jest environment configuration
- Test-specific linting rules
- File pattern matching for test files
- Disable unused expression rules for test files

[Testing]
Comprehensive testing approach covering unit tests, integration tests, and end-to-end tests.

### Test Structure and Organization

#### Unit Tests

**Location**: `__tests__/unit/`

**Purpose**: Test individual components and functions in isolation

**Coverage**:

- All UI components (Button, Modal, DataTable, FilterPanel, etc.)
- All custom hooks (useExcelData, useFilters, useCharts, etc.)
- All utility functions (data formatting, validation, etc.)
- All service classes (ExcelParser, OpenRouterService, etc.)

**Test Types**:

- Rendering tests
- Props validation tests
- User interaction tests
- State management tests
- Error handling tests

#### Integration Tests

**Location**: `__tests__/integration/`

**Purpose**: Test component interactions and data flow

**Coverage**:

- Data flow between components (Upload → Table → Filters → Charts → Analytics)
- Context integration tests
- Service integration tests
- State management integration tests
- Component composition tests

**Test Types**:

- Component interaction tests
- Data flow verification tests
- Service integration tests
- Context state management tests
- Error propagation tests

#### End-to-End Tests

**Location**: `__tests__/e2e/`

**Purpose**: Test complete user workflows

**Coverage**:

- File upload workflow
- Data exploration workflow
- Filter creation workflow
- Chart creation workflow
- Analytics workflow
- Performance testing
- Error handling scenarios

**Test Types**:

- User workflow tests
- Performance tests
- Error scenario tests
- Large dataset tests
- Cross-browser compatibility tests

### Test Data Management

#### Mock Data Generation

```typescript
// __tests__/fixtures/test-data/mock-data.ts
export const mockData = {
  excel: {
    small: createMockExcelData({ totalRows: 10 }),
    medium: createMockExcelData({ totalRows: 100 }),
    large: createMockExcelData({ totalRows: 1000 }),
    withNulls: createMockExcelData({
      rows: [
        ['John', 30],
        [null, 25],
        ['Jane', null],
      ],
    }),
    withDates: createMockExcelData({
      headers: ['Date', 'Value'],
      rows: [
        ['2023-01-01', 100],
        ['2023-01-02', 200],
      ],
    }),
  },
  filters: {
    select: createMockFilter({ type: 'select' }),
    range: createMockFilter({ type: 'range' }),
    search: createMockFilter({ type: 'search' }),
    date: createMockFilter({ type: 'date' }),
    boolean: createMockFilter({ type: 'boolean' }),
  },
  charts: {
    pie: createMockChart({ type: 'pie' }),
    bar: createMockChart({ type: 'bar' }),
    line: createMockChart({ type: 'line' }),
    doughnut: createMockChart({ type: 'doughnut' }),
  },
}
```

#### Real Test Data

**Location**: `__tests__/fixtures/excel-files/`

**Files**:

- `sample-data.xlsx` - Small dataset for basic testing
- `large-dataset.xlsx` - Large dataset for performance testing
- `empty-file.xlsx` - Empty file for edge case testing
- `corrupted-file.xlsx` - Corrupted file for error testing

#### Environment Configuration

**Location**: `testing.env.js`

**Configuration**:

- OpenRouter API key placeholder
- Test file paths
- Service configuration (real vs mock)
- Test timeout settings
- Coverage thresholds

### Test Execution Strategy

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run e2e tests only
npm run test:e2e

# Run specific component tests
npm run test:components

# Run service tests only
npm run test:services
```

#### Test Coverage Requirements

**Thresholds**:

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Reporting**:

- HTML coverage report in `coverage/` directory
- LCOV format for CI/CD integration
- Text summary in console output

#### Continuous Integration

**GitHub Actions Integration**:

- Run tests on every push/PR
- Fail build if coverage thresholds not met
- Upload coverage reports to services like Codecov
- Run performance tests on schedule

### Test Documentation

#### Test Case Documentation

Each test file should include:

- Description of what is being tested
- Test scenarios covered
- Mock data used
- Expected behavior

#### Component Testing Matrix

Create a testing matrix that tracks:

- Components that need tests
- Test types covered (unit, integration, e2e)
- Coverage percentage
- Test status (passing/failing)

#### Service Testing Documentation

Document service testing approach:

- When to use real services vs mocks
- Service dependency management
- API key management for testing
- Service response validation

[Implementation Order]
Sequential implementation steps to establish comprehensive testing infrastructure.

### Phase 1: Testing Infrastructure Setup (Week 1)

1. **Install and Configure Testing Dependencies**
   - Install Jest, React Testing Library, and related dependencies
   - Configure Jest with JSDOM environment
   - Setup TypeScript configuration for tests
   - Configure ESLint for test files

2. **Create Test Configuration Files**
   - Create `jest.config.js` with proper configuration
   - Create `jest.setup.js` for global test setup
   - Create `testing.env.js` for environment configuration
   - Update `.gitignore` for test-related files

3. **Setup Test Utilities and Helpers**
   - Create test utility functions in `__tests__/utils/`
   - Create mock data generators in `__tests__/fixtures/`
   - Create service mock utilities in `__tests__/setup/`
   - Create test assertion helpers

4. **Create Test Data Management System**
   - Implement TestDataManager class
   - Create mock Excel files for testing
   - Setup test data generators for all data types
   - Create test environment configuration

### Phase 2: Unit Tests Implementation (Week 2-3)

1. **UI Components Unit Tests**
   - Test Button, Modal, Card, LoadingSpinner, Toast, Badge components
   - Focus on rendering, props validation, and basic interactions
   - Achieve 90%+ coverage for UI components

2. **Data Components Unit Tests**
   - Test DataTable and its subcomponents
   - Test FileUploader component
   - Test table formatting and virtual scrolling
   - Test error states and loading states

3. **Filter Components Unit Tests**
   - Test FilterPanel and individual filter types
   - Test filter state management
   - Test filter validation and error handling
   - Test filter user interactions

4. **Chart Components Unit Tests**
   - Test ChartContainer and chart components
   - Test chart configuration and rendering
   - Test chart error handling
   - Test chart user interactions

5. **Analytics Components Unit Tests**
   - Test AnalyticsPanel and subcomponents
   - Test prompt input and suggestions
   - Test LLM integration points
   - Test analytics state management

6. **Custom Hooks Unit Tests**
   - Test useExcelData, useFilters, useCharts hooks
   - Test useLLMAnalytics, useOpenRouter hooks
   - Test useSessionPersistence, usePerformance hooks
   - Test hook state management and side effects

7. **Services Unit Tests**
   - Test ExcelParser service methods
   - Test data filtering and processing services
   - Test chart data processing services
   - Test LLM analytics service methods

### Phase 3: Integration Tests Implementation (Week 4)

1. **Data Flow Integration Tests**
   - Test Upload to Table data flow
   - Test Table to Filters data flow
   - Test Filters to Charts data flow
   - Test Charts to Analytics data flow

2. **Component Interaction Integration Tests**
   - Test FilterPanel integration with DataTable
   - Test Chart creation integration with data
   - Test Analytics integration with charts and filters
   - Test session management integration

3. **State Management Integration Tests**
   - Test Context provider integration
   - Test global state management
   - Test session persistence integration
   - Test state synchronization between components

4. **Service Integration Tests**
   - Test ExcelParser integration with real Excel files
   - Test OpenRouter API integration (with real API key)
   - Test chart service integration
   - Test session storage service integration

### Phase 4: End-to-End Tests Implementation (Week 5)

1. **User Workflow Tests**
   - Test complete file upload to analysis workflow
   - Test data exploration and filtering workflow
   - Test chart creation and configuration workflow
   - Test analytics and insights generation workflow

2. **Performance Tests**
   - Test large dataset handling performance
   - Test multiple charts rendering performance
   - Test complex filters performance
   - Test memory usage and optimization

3. **Error Handling Tests**
   - Test file upload error scenarios
   - Test API error handling
   - Test data validation errors
   - Test component error boundaries

### Phase 5: Test Optimization and Documentation (Week 6)

1. **Test Performance Optimization**
   - Optimize slow-running tests
   - Implement test parallelization
   - Setup test caching strategies
   - Optimize test data generation

2. **Coverage Improvement**
   - Achieve target coverage thresholds
   - Add tests for uncovered code paths
   - Implement mutation testing if needed
   - Setup coverage reporting for CI/CD

3. **Documentation and Training**
   - Create test documentation and guidelines
   - Document test data management
   - Create test writing guidelines
   - Setup test maintenance procedures

4. **CI/CD Integration**
   - Configure GitHub Actions for test automation
   - Setup coverage reporting
   - Configure test failure notifications
   - Setup performance monitoring

### Success Criteria

#### Phase 1 Success Criteria

- [ ] All testing dependencies installed and configured
- [ ] Jest configuration working with TypeScript
- [ ] Test utilities and helpers implemented
- [ ] Test data management system operational
- [ ] Can run basic test suite successfully

#### Phase 2 Success Criteria

- [ ] All UI components have unit tests with 90%+ coverage
- [ ] All data components have comprehensive unit tests
- [ ] All filter components have complete unit tests
- [ ] All chart components have thorough unit tests
- [ ] All analytics components have unit tests
- [ ] All custom hooks have unit tests
- [ ] All services have unit tests
- [ ] Unit tests passing with 80%+ overall coverage

#### Phase 3 Success Criteria

- [ ] All data flow integration tests implemented
- [ ] All component interaction tests working
- [ ] State management integration tests complete
- [ ] Service integration tests with real services working
- [ ] Integration tests covering all major user workflows
- [ ] Integration tests passing consistently

#### Phase 4 Success Criteria

- [ ] All major user workflows have e2e tests
- [ ] Performance tests for large datasets implemented
- [ ] Error handling scenarios comprehensively tested
- [ ] E2E tests stable and reliable
- [ ] Performance benchmarks established

#### Phase 5 Success Criteria

- [ ] Test suite optimized for performance
- [ ] Coverage targets achieved and maintained
- [ ] Complete test documentation available
- [ ] CI/CD pipeline with automated testing
- [ ] Team trained on test maintenance

#### Overall Project Success Criteria

- [ ] Comprehensive test suite covering all components
- [ ] 80%+ code coverage across all categories
- [ ] Tests running reliably in CI/CD
- [ ] Real service integration working
- [ ] Performance benchmarks met
- [ ] Complete documentation available
- [ ] Team can maintain and extend tests
- [ ] Refactoring can proceed with test safety net
