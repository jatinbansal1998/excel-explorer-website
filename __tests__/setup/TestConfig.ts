export class TestConfig {
  private static instance: TestConfig
  private config: any

  private constructor() {
    this.config = this.loadConfig()
  }

  static getInstance(): TestConfig {
    if (!TestConfig.instance) {
      TestConfig.instance = new TestConfig()
    }
    return TestConfig.instance
  }

  private loadConfig(): any {
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

  getConfig(): any {
    return this.config
  }

  isRealServiceEnabled(serviceName: string): boolean {
    return this.config.services[serviceName]?.useRealService || false
  }

  getTestTimeout(): number {
    return this.config.testTimeout
  }
}
