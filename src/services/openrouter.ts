import { OpenRouterChatRequest, OpenRouterChatResponse, OpenRouterModel } from '@/types/openrouter'
import { PerformanceMonitor } from '@/utils/performanceMonitor'
import { ErrorHandler, ErrorType } from '@/utils/errorHandling'

export class OpenRouterService {
  private static readonly BASE_URL: string = 'https://openrouter.ai/api/v1'
  private static readonly SITE_URL: string = 'https://charts.jatinbansal.com/'
  private readonly performanceMonitor = PerformanceMonitor.getInstance()

  public static buildHeaders(apiKey: string): Record<string, string> {
    const title: string =
      typeof document !== 'undefined' && document?.title ? document.title : 'Excel Explorer'
    return {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'HTTP-Referer': OpenRouterService.SITE_URL,
      'X-Title': title,
    }
  }

  public static async parseErrorMessage(res: Response): Promise<string> {
    try {
      const text = await res.text()
      try {
        const json = JSON.parse(text) as Record<string, unknown> | null
        const error = json?.error as Record<string, unknown> | null
        const message = error?.message || json?.message || text
        return `${message}`
      } catch {
        return text || `Request failed with status ${res.status}`
      }
    } catch {
      return `Request failed with status ${res.status}`
    }
  }

  async listModels(apiKey?: string): Promise<OpenRouterModel[]> {
    return this.performanceMonitor.measureAsync(
      'openrouter_list_models',
      async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
        try {
          const headers = apiKey
            ? OpenRouterService.buildHeaders(apiKey)
            : {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              }
          const res = await fetch(`${OpenRouterService.BASE_URL}/models`, {
            method: 'GET',
            headers,
            signal: controller.signal,
          })

          // Support both text() and json() depending on test mocks without using `any`
          type RespWithText = Response & { text?: () => Promise<string> }
          type RespWithJson = Response & { json?: () => Promise<unknown> }
          let text = ''
          let json: unknown = null
          const resT = res as RespWithText
          if (typeof resT.text === 'function') {
            try {
              text = await resT.text()
            } catch {
              text = ''
            }
          }
          if (!text) {
            const resJ = res as RespWithJson
            if (typeof resJ.json === 'function') {
              try {
                json = await resJ.json()
              } catch {
                json = null
              }
            }
          } else {
            try {
              json = JSON.parse(text)
            } catch {
              json = null
            }
          }

          if (!res.ok) {
            const msg = await OpenRouterService.parseErrorMessage(res)
            throw ErrorHandler.getInstance().createError(ErrorType.BROWSER_ERROR, String(msg))
          }

          const modelsRaw: unknown = Array.isArray(json)
            ? json
            : ((json as Record<string, unknown>)?.data ?? json)
          return (modelsRaw as OpenRouterModel[]) || []
        } finally {
          clearTimeout(timeoutId)
        }
      },
      { hasApiKey: !!apiKey },
    )
  }

  async chat(
    apiKey: string,
    body: OpenRouterChatRequest,
    signal?: AbortSignal,
  ): Promise<OpenRouterChatResponse> {
    return this.performanceMonitor.measureAsync(
      'openrouter_chat',
      async () => {
        // Create AbortController with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minute timeout for chat

        // Chain provided signal
        if (signal) {
          signal.addEventListener('abort', () => controller.abort())
        }

        // Clear timeout on completion
        const clearTimeoutOnComplete = () => clearTimeout(timeoutId)

        try {
          const res = await fetch(`${OpenRouterService.BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: OpenRouterService.buildHeaders(apiKey),
            body: JSON.stringify(body),
            signal: controller.signal,
          })

          clearTimeoutOnComplete()

          // Read the response body exactly once to handle both error and success payloads
          const text = await res.text()
          let json: unknown
          try {
            json = text ? JSON.parse(text) : null
          } catch {
            json = null
          }

          // HTTP-level error
          if (!res.ok) {
            const error = (json as Record<string, unknown>)?.error as Record<string, unknown> | null
            const msg =
              error?.message ||
              (json as Record<string, unknown>)?.message ||
              text ||
              `Request failed with status ${res.status}`
            throw ErrorHandler.getInstance().createError(
              ErrorType.BROWSER_ERROR,
              String(msg),
            )
          }

          // Some providers return a 200 with an error object in the body
          if (json && (json as Record<string, unknown>).error) {
            const error = (json as Record<string, unknown>).error as Record<string, unknown> | null
            if (typeof error?.message === 'string') {
              throw ErrorHandler.getInstance().createError(
                ErrorType.BROWSER_ERROR,
                String(error.message),
              )
            }
          }

          return json as OpenRouterChatResponse
        } catch (error) {
          clearTimeoutOnComplete()
          throw error
        }
      },
      {
        model: body.model,
        messageCount: body.messages?.length || 0,
        hasStream: (body as OpenRouterChatRequest & { stream?: boolean }).stream || false,
      },
    )
  }
}
