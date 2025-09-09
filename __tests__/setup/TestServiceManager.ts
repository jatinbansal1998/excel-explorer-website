import { TestConfig } from './TestConfig'
import { ExcelParser } from '@/services/excelParser'
import { OpenRouterService } from '@/services/openrouter'
import { createMockExcelParser } from './mock-services'

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
      this.services.set('openRouter', new OpenRouterService())
    } else {
      this.mocks.set('openRouter', this.createMockOpenRouterService())
    }
  }

  getService(name: string): any {
    return this.services.get(name) || this.mocks.get(name)
  }

  getMock(name: string): any {
    return this.mocks.get(name)
  }

  setMock(name: string, mock: any): void {
    this.mocks.set(name, mock)
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
      this.services.set('openRouter', new OpenRouterService())
    }
  }

  private createMockOpenRouterService() {
    return {
      generateAnalytics: jest.fn().mockImplementation((prompt: string) => {
        return Promise.resolve({
          insights: ['Test insight 1', 'Test insight 2'],
          suggestions: ['Test suggestion 1'],
          confidence: 0.85,
        })
      }),
      generateChartSuggestions: jest.fn().mockImplementation((data: any) => {
        return Promise.resolve([
          { type: 'pie', column: 'City', confidence: 0.9 },
          { type: 'bar', column: 'Age', confidence: 0.8 },
        ])
      }),
      testConnection: jest.fn().mockResolvedValue(true),
      getModels: jest.fn().mockResolvedValue([
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'anthropic/claude-2', name: 'Claude 2' },
      ]),
    }
  }
}
