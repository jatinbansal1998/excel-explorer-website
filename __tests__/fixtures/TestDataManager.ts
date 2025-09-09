import { createMockChart, createMockExcelData, createMockFilter } from './test-data/mock-excel-data'

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

  getExcelData(): any {
    return this.testData.get('excelData')
  }

  getFilters(): any[] {
    return this.testData.get('filters')
  }

  getCharts(): any[] {
    return this.testData.get('charts')
  }

  createLargeDataset(size: number = 1000): any {
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
