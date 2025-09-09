import { createMockExcelData } from '../fixtures/test-data/mock-excel-data'

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
    validateFile: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
    parseSheet: jest.fn().mockImplementation((workbook: any, sheetName: string) => {
      return Promise.resolve(createMockExcelData())
    }),
  }
}

export function createMockDataFilter() {
  return {
    applyFilters: jest.fn().mockImplementation((data: any, filters: any[]) => {
      return Promise.resolve(data)
    }),
    generateFilter: jest.fn().mockReturnValue({
      id: 'test-filter',
      type: 'select',
      values: [],
    }),
    validateFilter: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  }
}

export function createMockChartDataProcessor() {
  return {
    processForChart: jest.fn().mockImplementation((data: any, config: any) => {
      return Promise.resolve({
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            data: [1, 2, 3],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          },
        ],
      })
    }),
    validateChartConfig: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    suggestChartType: jest.fn().mockReturnValue('pie'),
  }
}

export function createMockLLMAnalytics() {
  return {
    generateInsights: jest.fn().mockResolvedValue({
      insights: ['Test insight 1', 'Test insight 2'],
      confidence: 0.85,
    }),
    analyzeData: jest.fn().mockResolvedValue({
      summary: 'Test summary',
      keyFindings: ['Finding 1', 'Finding 2'],
    }),
    generateSuggestions: jest
      .fn()
      .mockResolvedValue([{ type: 'chart', column: 'City', confidence: 0.9 }]),
  }
}

export function setupServiceMocks(services: string[]) {
  const mocks: Record<string, any> = {}

  if (services.includes('excelParser')) {
    mocks.excelParser = createMockExcelParser()
  }

  if (services.includes('dataFilter')) {
    mocks.dataFilter = createMockDataFilter()
  }

  if (services.includes('chartDataProcessor')) {
    mocks.chartDataProcessor = createMockChartDataProcessor()
  }

  if (services.includes('llmAnalytics')) {
    mocks.llmAnalytics = createMockLLMAnalytics()
  }

  return mocks
}
