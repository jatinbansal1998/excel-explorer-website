import {OpenRouterService} from '@/services/openrouter'
import {PerformanceMonitor} from '@/utils/performanceMonitor'
import {OpenRouterChatRequest, OpenRouterChatResponse, OpenRouterModel,} from '@/types/openrouter'

// Mock PerformanceMonitor
jest.mock('@/utils/performanceMonitor', () => ({
  PerformanceMonitor: {
    getInstance: jest.fn().mockReturnValue({
      measureAsync: jest.fn(),
    }),
  },
}))

describe('OpenRouterService', () => {
  let openRouterService: OpenRouterService
  let mockPerformanceMonitor: Record<string, unknown>
  let mockFetch: jest.MockedFunction<typeof fetch>

  // Mock data
  const mockApiKey = 'test-api-key'
  const mockModels: OpenRouterModel[] = [
    {
      id: 'openai/gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'A fast, inexpensive model',
      context_length: 4096,
      pricing: {
        prompt: '0.001',
        completion: '0.002',
      },
      capabilities: {
        chat: true,
        completion: false,
      },
    },
    {
      id: 'anthropic/claude-2',
      name: 'Claude 2',
      description: 'A helpful AI assistant',
      context_length: 100000,
      pricing: {
        prompt: '0.008',
        completion: '0.024',
      },
      capabilities: {
        chat: true,
        completion: true,
      },
    },
  ]

  const mockChatRequest: OpenRouterChatRequest = {
    model: 'openai/gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you!' },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  }

  const mockChatResponse: OpenRouterChatResponse = {
    id: 'chat-123',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hello! I am doing well, thank you for asking.',
        },
        finish_reason: 'stop',
      },
    ],
    created: 1640995200,
    model: 'openai/gpt-3.5-turbo',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup PerformanceMonitor mock
    mockPerformanceMonitor = {
      measureAsync: jest.fn().mockImplementation((_name, fn, _context) => fn()),
    }
    ;(PerformanceMonitor.getInstance as jest.Mock).mockReturnValue(mockPerformanceMonitor)

    // Setup fetch mock
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
    global.fetch = mockFetch

    openRouterService = new OpenRouterService()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('listModels', () => {
    it('should fetch models successfully with API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      } as Response)

      const result = await openRouterService.listModels(mockApiKey)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockApiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://charts.jatinbansal.com/',
            'X-Title': 'Excel Explorer',
          },
          signal: expect.any(AbortSignal),
        }),
      )
      expect(result).toEqual(mockModels)
      expect(mockPerformanceMonitor.measureAsync).toHaveBeenCalledWith(
        'openrouter_list_models',
        expect.any(Function),
        { hasApiKey: true },
      )
    })

    it('should fetch models successfully without API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      } as Response)

      const result = await openRouterService.listModels()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          signal: expect.any(AbortSignal),
        }),
      )
      expect(result).toEqual(mockModels)
      expect(mockPerformanceMonitor.measureAsync).toHaveBeenCalledWith(
        'openrouter_list_models',
        expect.any(Function),
        { hasApiKey: false },
      )
    })

    it('should handle models in data property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockModels }),
      } as Response)

      const result = await openRouterService.listModels(mockApiKey)

      expect(result).toEqual(mockModels)
    })

    it('should handle empty models array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)

      const result = await openRouterService.listModels(mockApiKey)

      expect(result).toEqual([])
    })

    it('should handle non-array response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Not found' }),
      } as Response)

      const result = await openRouterService.listModels(mockApiKey)

      expect(result).toEqual({ message: 'Not found' })
    })

    it('should handle HTTP error response', async () => {
      const errorResponse = {
        error: { message: 'Invalid API key' },
      }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve(JSON.stringify(errorResponse)),
      } as Response)

      await expect(openRouterService.listModels(mockApiKey)).rejects.toMatchObject({
        message: expect.stringContaining('Invalid API key'),
      })
    })

    it('should handle plain text error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      } as Response)

      await expect(openRouterService.listModels(mockApiKey)).rejects.toMatchObject({
        message: expect.stringContaining('Internal Server Error'),
      })
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(openRouterService.listModels(mockApiKey)).rejects.toThrow('Network error')
    })

    it('should handle JSON parsing error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Invalid JSON {'),
      } as Response)

      await expect(openRouterService.listModels(mockApiKey)).rejects.toMatchObject({
        message: expect.stringContaining('Invalid JSON {'),
      })
    })
  })

  describe('chat', () => {
    it('should send chat request successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockChatResponse)),
      } as Response)

      const result = await openRouterService.chat(mockApiKey, mockChatRequest)

      expect(mockFetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockApiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://charts.jatinbansal.com/',
          'X-Title': 'Excel Explorer',
        },
        body: JSON.stringify(mockChatRequest),
        signal: expect.any(AbortSignal),
      })
      expect(result).toEqual(mockChatResponse)
      expect(mockPerformanceMonitor.measureAsync).toHaveBeenCalledWith(
        'openrouter_chat',
        expect.any(Function),
        {
          model: 'openai/gpt-3.5-turbo',
          messageCount: 2,
          hasStream: false,
        },
      )
    })

    it('should handle chat request with abort signal', async () => {
      const abortController = new AbortController()
      const signal = abortController.signal

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockChatResponse)),
      } as Response)

      await openRouterService.chat(mockApiKey, mockChatRequest, signal)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      )
    })

    it('should handle abort signal being triggered', async () => {
      const abortController = new AbortController()
      const signal = abortController.signal

      // Mock fetch to throw when called with aborted signal
      mockFetch.mockImplementationOnce(() => {
        if (signal.aborted) {
          return Promise.reject(new DOMException('Aborted', 'AbortError'))
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockChatResponse)),
        } as Response)
      })

      // Abort before calling the method
      abortController.abort()

      await expect(openRouterService.chat(mockApiKey, mockChatRequest, signal)).rejects.toThrow(
        'Aborted',
      )
    })

    it('should handle HTTP error response', async () => {
      const errorResponse = {
        error: { message: 'Model not found' },
      }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify(errorResponse)),
      } as Response)

      await expect(openRouterService.chat(mockApiKey, mockChatRequest)).rejects.toMatchObject({
        message: expect.stringContaining('Model not found'),
      })
    })

    it('should handle error response without error object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad request' })),
      } as Response)

      await expect(openRouterService.chat(mockApiKey, mockChatRequest)).rejects.toMatchObject({
        message: expect.stringContaining('Bad request'),
      })
    })

    it('should handle plain text error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      } as Response)

      await expect(openRouterService.chat(mockApiKey, mockChatRequest)).rejects.toMatchObject({
        message: expect.stringContaining('Server Error'),
      })
    })

    it('should handle 200 response with error object', async () => {
      const errorResponse = {
        error: { message: 'Provider error' },
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(errorResponse)),
      } as Response)

      await expect(openRouterService.chat(mockApiKey, mockChatRequest)).rejects.toMatchObject({
        message: expect.stringContaining('Provider error'),
      })
    })

    it('should handle empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      } as Response)

      const result = await openRouterService.chat(mockApiKey, mockChatRequest)
      expect(result).toBeNull()
    })

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Invalid JSON {'),
      } as Response)

      const result = await openRouterService.chat(mockApiKey, mockChatRequest)
      expect(result).toBeNull()
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'))

      await expect(openRouterService.chat(mockApiKey, mockChatRequest)).rejects.toThrow(
        'Network connection failed',
      )
    })

    it('should handle chat request with streaming', async () => {
      const streamingRequest = {
        ...mockChatRequest,
        stream: true,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockChatResponse)),
      } as Response)

      await openRouterService.chat(mockApiKey, streamingRequest)

      expect(mockPerformanceMonitor.measureAsync).toHaveBeenCalledWith(
        'openrouter_chat',
        expect.any(Function),
        {
          model: 'openai/gpt-3.5-turbo',
          messageCount: 2,
          hasStream: true,
        },
      )
    })

    it('should handle chat request with minimal required fields', async () => {
      const minimalRequest: OpenRouterChatRequest = {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockChatResponse)),
      } as Response)

      const result = await openRouterService.chat(mockApiKey, minimalRequest)

      expect(result).toEqual(mockChatResponse)
      expect(mockPerformanceMonitor.measureAsync).toHaveBeenCalledWith(
        'openrouter_chat',
        expect.any(Function),
        {
          model: 'openai/gpt-3.5-turbo',
          messageCount: 1,
          hasStream: false,
        },
      )
    })
  })

  describe('buildHeaders', () => {
    it('should build headers with API key', () => {
      const headers = OpenRouterService.buildHeaders(mockApiKey)

      expect(headers).toEqual({
        Authorization: `Bearer ${mockApiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://charts.jatinbansal.com/',
        'X-Title': 'Excel Explorer',
      })
    })

    it('should include X-Title header', () => {
      const headers = OpenRouterService.buildHeaders(mockApiKey)

      expect(headers).toHaveProperty('X-Title')
      expect(typeof headers['X-Title']).toBe('string')
    })

    it('should include HTTP-Referer header', () => {
      const headers = OpenRouterService.buildHeaders(mockApiKey)

      expect(headers).toHaveProperty('HTTP-Referer')
      expect(headers['HTTP-Referer']).toBe('https://charts.jatinbansal.com/')
    })
  })

  describe('parseErrorMessage', () => {
    it('should parse error message from JSON response', async () => {
      const response = {
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ error: { message: 'Test error' } })),
      } as Response

      const message = await OpenRouterService.parseErrorMessage(response)
      expect(message).toBe('Test error')
    })

    it('should parse error message from top-level message field', async () => {
      const response = {
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'Top-level error' })),
      } as Response

      const message = await OpenRouterService.parseErrorMessage(response)
      expect(message).toBe('Top-level error')
    })

    it('should fallback to raw text when JSON parsing fails', async () => {
      const response = {
        ok: false,
        status: 400,
        text: () => Promise.resolve('Raw error text'),
      } as Response

      const message = await OpenRouterService.parseErrorMessage(response)
      expect(message).toBe('Raw error text')
    })

    it('should fallback to status message when text() fails', async () => {
      const response = {
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('Text parsing failed')),
      } as Response

      const message = await OpenRouterService.parseErrorMessage(response)
      expect(message).toBe('Request failed with status 500')
    })

    it('should handle empty text response', async () => {
      const response = {
        ok: false,
        status: 404,
        text: () => Promise.resolve(''),
      } as Response

      const message = await OpenRouterService.parseErrorMessage(response)
      expect(message).toBe('Request failed with status 404')
    })
  })
})
