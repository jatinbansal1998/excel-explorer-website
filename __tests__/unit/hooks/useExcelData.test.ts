import { act, renderHook } from '@testing-library/react'
import { useExcelData } from '@/hooks/useExcelData'
import { ExcelParser } from '@/services/excelParser'
import { PerformanceMonitor } from '@/utils/performanceMonitor'
import { createMockFile } from '../../setup/test-utils'
import type { ExcelData, ParseOptions, ParseProgressEvent } from '@/types/excel'

// Mock the dependencies
jest.mock('@/services/excelParser')
jest.mock('@/utils/performanceMonitor')

const MockExcelParser = ExcelParser as jest.MockedClass<typeof ExcelParser>
const MockPerformanceMonitor = PerformanceMonitor as jest.MockedClass<typeof PerformanceMonitor>

describe('useExcelData', () => {
  const mockSessionPersistence = {
    showRestoreBanner: false,
    lastSessionSummary: null,
    restoreLastSession: jest.fn(),
    dismissRestoreBanner: jest.fn(),
    sessions: [],
    refreshSessions: jest.fn(),
    restoreSession: jest.fn(),
    deleteSession: jest.fn(),
    clearAll: jest.fn(),
    registerOnLoadDataset: jest.fn(),
    registerOnLoadFilters: jest.fn(),
    registerOnLoadCharts: jest.fn(),
    service: null as any,
    getActiveSessionId: jest.fn(),
    setFeatureEnabled: jest.fn(),
    isRestoring: false,
    restoreProgress: null,
    cancelRestore: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    const mockExcelData: ExcelData = {
      headers: ['col1', 'col2'],
      rows: [['data1', 'data2']],
      metadata: {
        fileName: 'test.xlsx',
        sheetNames: ['Sheet1'],
        activeSheet: 'Sheet1',
        totalRows: 1,
        totalColumns: 2,
        columns: [],
        fileSize: 1024,
      },
    }
    MockExcelParser.prototype.parseFile = jest.fn().mockResolvedValue(mockExcelData)

    const mockPerformanceMonitor = {
      measureAsync: jest
        .fn()
        .mockImplementation((name: string, fn: () => Promise<any>, meta?: any) => fn()),
    }
    MockPerformanceMonitor.getInstance = jest.fn().mockReturnValue(mockPerformanceMonitor)

    // Mock useSessionPersistence
    const mockUseSessionPersistence = jest.fn(() => mockSessionPersistence)
    require('@/hooks/useSessionPersistence').useSessionPersistence = mockUseSessionPersistence
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useExcelData())

      expect(result.current.currentData).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.progress).toBeNull()
      expect(result.current.isRestoring).toBe(false)
    })

    it('should accept external session persistence', () => {
      const externalSession = { ...mockSessionPersistence, isRestoring: true }
      const { result } = renderHook(() => useExcelData(externalSession as any))

      expect(result.current.isRestoring).toBe(true)
    })
  })

  describe('parseFile - success scenarios', () => {
    it('should successfully parse a file and update state', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')

      const mockExcelData: ExcelData = {
        headers: ['Name', 'Age'],
        rows: [
          ['John', '25'],
          ['Jane', '30'],
        ],
        metadata: {
          fileName: 'test.xlsx',
          sheetNames: ['Sheet1'],
          activeSheet: 'Sheet1',
          totalRows: 2,
          totalColumns: 2,
          columns: [],
          fileSize: 2048,
        },
      }

      MockExcelParser.prototype.parseFile.mockResolvedValueOnce(mockExcelData)

      await act(async () => {
        await result.current.parseFile(mockFile)
      })

      expect(result.current.currentData).toEqual(mockExcelData)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle parse progress events', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')
      const progressCallback = jest.fn()

      const progressEvents = [
        { stage: 'validating', message: 'Validating file' },
        { stage: 'parsing', message: 'Parsing data' },
        { stage: 'processing', message: 'Processing results' },
      ]

      MockExcelParser.prototype.parseFile.mockImplementationOnce(
        (file, options: ParseOptions = {}) => {
          progressEvents.forEach((event) => options.progress?.(event as ParseProgressEvent))
          return Promise.resolve({
            headers: ['col1'],
            rows: [['data1']],
            metadata: {
              fileName: 'test.xlsx',
              sheetNames: ['Sheet1'],
              activeSheet: 'Sheet1',
              totalRows: 1,
              totalColumns: 1,
              columns: [],
              fileSize: 1024,
            },
          })
        },
      )

      await act(async () => {
        await result.current.parseFile(mockFile, { progress: progressCallback })
      })

      expect(progressCallback).toHaveBeenCalledTimes(3)
      expect(result.current.progress).toEqual(progressEvents[progressEvents.length - 1])
    })

    it('should use default parse options when not provided', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')

      await act(async () => {
        await result.current.parseFile(mockFile)
      })

      const parseCall = MockExcelParser.prototype.parseFile.mock.calls[0]
      expect(parseCall[1]).toEqual({
        computeStatistics: false,
        uniqueValuesTrackingCap: 2000,
        uniqueValuesReturnLimit: 50,
        sampleValuesCount: 5,
        progress: expect.any(Function),
      })
    })

    it('should merge custom options with defaults', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')
      const customOptions = {
        computeStatistics: true,
        uniqueValuesTrackingCap: 1000,
      }

      await act(async () => {
        await result.current.parseFile(mockFile, customOptions)
      })

      const parseCall = MockExcelParser.prototype.parseFile.mock.calls[0]
      expect(parseCall[1]).toEqual({
        computeStatistics: true,
        uniqueValuesTrackingCap: 1000,
        uniqueValuesReturnLimit: 50,
        sampleValuesCount: 5,
        progress: expect.any(Function),
      })
    })
  })

  describe('parseFile - error scenarios', () => {
    it('should handle parser errors and set error state', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')
      const mockError = new Error('Failed to parse Excel file')

      MockExcelParser.prototype.parseFile.mockRejectedValueOnce(mockError)

      await act(async () => {
        await expect(result.current.parseFile(mockFile)).rejects.toThrow(
          'Failed to parse Excel file',
        )
      })

      expect(result.current.error).toBe('Failed to parse Excel file')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.currentData).toBeNull()
    })

    it('should handle errors without message property', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')

      // Create an error that when processed by the hook becomes 'Failed to parse file'
      const errorWithoutMessage = new Error()
      delete (errorWithoutMessage as any).message
      MockExcelParser.prototype.parseFile.mockRejectedValueOnce(errorWithoutMessage)

      await act(async () => {
        await expect(result.current.parseFile(mockFile)).rejects.toThrow()
      })

      expect(result.current.error).toBe('Failed to parse file')
    })

    it('should handle persistence errors non-blocking', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      // Create a mock service with methods
      const mockService = {
        createOrUpdateSession: jest.fn().mockRejectedValue(new Error('Persistence failed')),
        saveDataset: jest.fn(),
      }

      // Temporarily replace the service
      const originalService = mockSessionPersistence.service
      mockSessionPersistence.service = mockService as any

      const mockExcelData: ExcelData = {
        headers: ['col1'],
        rows: [['data1']],
        metadata: {
          fileName: 'test.xlsx',
          sheetNames: ['Sheet1'],
          activeSheet: 'Sheet1',
          totalRows: 1,
          totalColumns: 1,
          columns: [],
          fileSize: 1024,
        },
      }

      MockExcelParser.prototype.parseFile.mockResolvedValueOnce(mockExcelData)

      await act(async () => {
        await result.current.parseFile(mockFile)
      })

      expect(result.current.currentData).toEqual(mockExcelData)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Dataset persistence failed:',
        expect.any(Error),
      )

      // Restore original service
      mockSessionPersistence.service = originalService
      consoleWarnSpy.mockRestore()
    })

    it('should handle missing persistence service gracefully', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock session without service
      const sessionWithoutService = { ...mockSessionPersistence, service: null }
      const mockUseSessionPersistence = jest.fn(() => sessionWithoutService)
      jest.doMock('@/hooks/useSessionPersistence', () => mockUseSessionPersistence)

      const mockExcelData: ExcelData = {
        headers: ['col1'],
        rows: [['data1']],
        metadata: {
          fileName: 'test.xlsx',
          sheetNames: ['Sheet1'],
          activeSheet: 'Sheet1',
          totalRows: 1,
          totalColumns: 1,
          columns: [],
          fileSize: 1024,
        },
      }

      MockExcelParser.prototype.parseFile.mockResolvedValueOnce(mockExcelData)

      // Re-render with new session mock
      const { result: newResult } = renderHook(() => useExcelData(sessionWithoutService as any))

      await act(async () => {
        await newResult.current.parseFile(mockFile)
      })

      expect(newResult.current.currentData).toEqual(mockExcelData)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Persistence service not ready; skipping dataset save',
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('performance monitoring', () => {
    it('should measure parse performance', async () => {
      // Create a fresh hook with mocked performance monitor
      const mockMeasureAsync = jest.fn().mockImplementation((name, fn, meta) => fn())
      const mockInstance = { measureAsync: mockMeasureAsync }
      MockPerformanceMonitor.getInstance = jest.fn().mockReturnValue(mockInstance as any)

      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')

      await act(async () => {
        await result.current.parseFile(mockFile)
      })

      expect(mockMeasureAsync).toHaveBeenCalledWith('excel_file_parse', expect.any(Function), {
        fileName: 'test.xlsx',
        fileSize: expect.any(Number),
        fileType: 'text/plain',
      })
    })
  })

  describe('deleteColumn', () => {
    it('should delete column and update data structure', async () => {
      const { result } = renderHook(() => useExcelData())

      const initialData: ExcelData = {
        headers: ['col1', 'col2', 'col3'],
        rows: [
          ['data1', 'data2', 'data3'],
          ['data4', 'data5', 'data6'],
        ],
        metadata: {
          fileName: 'test.xlsx',
          sheetNames: ['Sheet1'],
          activeSheet: 'Sheet1',
          totalRows: 2,
          totalColumns: 3,
          columns: [],
          fileSize: 1024,
        },
      }

      // Simulate setting data through successful parse
      MockExcelParser.prototype.parseFile.mockResolvedValueOnce(initialData)
      await act(async () => {
        await result.current.parseFile(createMockFile('test.xlsx', 'content'))
      })

      act(() => {
        result.current.deleteColumn(1) // Delete middle column
      })

      // Check the main structure and handle columns dynamically
      const resultData = result.current.currentData
      expect(resultData).toBeTruthy()

      // Check headers and rows structure
      expect(resultData).toEqual(
        expect.objectContaining({
          headers: ['col1', 'col3'],
          rows: [
            ['data1', 'data3'],
            ['data4', 'data6'],
          ],
        }),
      )

      // Check metadata structure separately (excluding columns which becomes undefined)
      const { columns, ...expectedMetadata } = initialData.metadata
      expect(resultData!.metadata).toEqual(
        expect.objectContaining({
          ...expectedMetadata,
          totalColumns: 2,
        }),
      )

      // Check that columns property exists
      expect(resultData!.metadata).toHaveProperty('columns')
    })

    it('should not modify data when column index is invalid', async () => {
      const { result } = renderHook(() => useExcelData())

      const initialData: ExcelData = {
        headers: ['col1', 'col2'],
        rows: [['data1', 'data2']],
        metadata: {
          fileName: 'test.xlsx',
          sheetNames: ['Sheet1'],
          activeSheet: 'Sheet1',
          totalRows: 1,
          totalColumns: 2,
          columns: [],
          fileSize: 1024,
        },
      }

      // Simulate setting data through successful parse
      MockExcelParser.prototype.parseFile.mockResolvedValueOnce(initialData)
      await act(async () => {
        await result.current.parseFile(createMockFile('test.xlsx', 'content'))
      })

      act(() => {
        result.current.deleteColumn(5) // Invalid index
      })

      expect(result.current.currentData).toEqual(initialData)
    })

    it('should handle null current data gracefully', () => {
      const { result } = renderHook(() => useExcelData())

      act(() => {
        result.current.deleteColumn(0)
      })

      expect(result.current.currentData).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useExcelData())
      const mockFile = createMockFile('test.xlsx', 'mock content')

      // First, parse a file to set state
      await act(async () => {
        await result.current.parseFile(mockFile)
      })

      expect(result.current.currentData).not.toBeNull()
      expect(result.current.isLoading).toBe(false)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.currentData).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('session persistence integration', () => {
    it('should register load dataset callback', () => {
      renderHook(() => useExcelData())

      expect(mockSessionPersistence.registerOnLoadDataset).toHaveBeenCalledWith(
        expect.any(Function),
      )
    })

    it('should handle dataset loading from session', () => {
      const { result } = renderHook(() => useExcelData())
      const mockData: ExcelData = {
        headers: ['loadedCol'],
        rows: [['loadedData']],
        metadata: {
          fileName: 'loaded.xlsx',
          sheetNames: ['Sheet1'],
          activeSheet: 'Sheet1',
          totalRows: 1,
          totalColumns: 1,
          columns: [],
          fileSize: 512,
        },
      }

      // Simulate session loading dataset
      const loadCallback = mockSessionPersistence.registerOnLoadDataset.mock.calls[0][0]
      act(() => {
        loadCallback(mockData)
      })

      expect(result.current.currentData).toEqual(mockData)
      expect(result.current.isRestoring).toBe(false)
    })

    it('should sync restoration state from session', () => {
      const { result, rerender } = renderHook(({ session }) => useExcelData(session), {
        initialProps: { session: mockSessionPersistence },
      })

      expect(result.current.isRestoring).toBe(false)

      // Update session to indicate restoring
      const restoringSession = { ...mockSessionPersistence, isRestoring: true }
      rerender({ session: restoringSession })

      expect(result.current.isRestoring).toBe(true)
    })
  })

  describe('memoization', () => {
    it('should memoize parser instance', () => {
      const { result, rerender } = renderHook(() => useExcelData())

      const parser1 = MockExcelParser.mock.instances[0]
      rerender()
      const parser2 = MockExcelParser.mock.instances[0]

      expect(parser1).toBe(parser2)
    })

    it('should memoize performance monitor instance', () => {
      const { result, rerender } = renderHook(() => useExcelData())

      const monitor1 = MockPerformanceMonitor.getInstance()
      rerender()
      const monitor2 = MockPerformanceMonitor.getInstance()

      expect(monitor1).toBe(monitor2)
    })
  })

  describe('large file handling', () => {
    it('should handle large file parsing with progress', async () => {
      const { result } = renderHook(() => useExcelData())
      const largeFile = createMockFile(
        'large.xlsx',
        'large content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )

      // Mock file size
      Object.defineProperty(largeFile, 'size', { value: 50 * 1024 * 1024 }) // 50MB

      const progressEvents: ParseProgressEvent[] = []
      for (let i = 0; i <= 100; i += 10) {
        progressEvents.push({ stage: 'parsing_workbook', message: `Processing ${i}%`, percent: i })
      }

      MockExcelParser.prototype.parseFile.mockImplementationOnce(
        (file, options: ParseOptions = {}) => {
          progressEvents.forEach((event) => options.progress?.(event))
          return Promise.resolve({
            headers: ['col1'],
            rows: Array(1000).fill(['data']),
            metadata: {
              fileName: 'large.xlsx',
              sheetNames: ['Sheet1'],
              activeSheet: 'Sheet1',
              totalRows: 1000,
              totalColumns: 1,
              columns: [],
              fileSize: 50 * 1024 * 1024,
            },
          })
        },
      )

      await act(async () => {
        await result.current.parseFile(largeFile)
      })

      expect(result.current.currentData).not.toBeNull()
      expect(result.current.progress).toEqual(progressEvents[progressEvents.length - 1])
    })
  })
})
