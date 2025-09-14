import React from 'react'
import { render } from '@testing-library/react'
import { TestConfig } from './TestConfig'
import { TestServiceManager } from './TestServiceManager'

// Mock providers for testing
export const MockAppContextProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-app-context">{children}</div>
)

export const MockDataContextProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-data-context">{children}</div>
)

export const MockFilterContextProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-filter-context">{children}</div>
)

export const MockChartContextProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-chart-context">{children}</div>
)

export const MockUIContextProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-ui-context">{children}</div>
)

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
    return providers.reduceRight(
      (acc, Provider) => React.createElement(Provider, { key: Provider.name || 'provider' }, acc),
      children,
    )
  }
}

export function cleanupTest() {
  jest.clearAllMocks()
  jest.clearAllTimers()
  localStorage.clear()
  sessionStorage.clear()
}

// Enhanced render function with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options: {
    providers?: React.ComponentType[]
    config?: Record<string, any>
  } = {},
) {
  const { providers = [], config } = options

  // Update test config if provided
  if (config) {
    const testConfig = TestConfig.getInstance()
    Object.assign(testConfig.getConfig(), config)
  }

  const Wrapper = createTestWrapper(providers)

  return render(<Wrapper>{ui}</Wrapper>)
}

// Custom render function for specific test scenarios
export function renderWithMockServices(
  ui: React.ReactElement,
  serviceMocks: Record<string, any> = {},
) {
  const testServiceManager = TestServiceManager.getInstance()

  // Set up service mocks
  Object.entries(serviceMocks).forEach(([serviceName, mock]) => {
    testServiceManager.setMock(serviceName, mock)
  })

  const Wrapper = createTestWrapper()
  return render(<Wrapper>{ui}</Wrapper>)
}

// Helper to create mock file objects
export function createMockFile(name: string, content: string, type: string = 'text/plain'): File {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

// Helper to create mock Excel file
export function createMockExcelFile(name: string, data: any): File {
  const jsonData = JSON.stringify(data)
  return createMockFile(
    name,
    jsonData,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

// Helper to mock API responses
export function mockApiResponse<T>(data: T, delay: number = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

// Helper to create test scenarios
export function createTestScenario<T>(
  name: string,
  setup: () => T,
  test: (context: T) => void | Promise<void>,
) {
  return describe(name, () => {
    let context: T

    beforeEach(() => {
      context = setup()
    })

    it('should execute test scenario', async () => {
      await test(context)
    })
  })
}
