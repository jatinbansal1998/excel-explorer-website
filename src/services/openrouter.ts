import {OpenRouterChatRequest, OpenRouterChatResponse, OpenRouterModel,} from '@/types/openrouter'
import {PerformanceMonitor} from '@/utils/performanceMonitor'

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
                const json = JSON.parse(text)
                const message = ((json as Record<string, unknown>).error as Record<string, unknown>)?.message || (json as Record<string, unknown>)?.message || text
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
                const headers = apiKey
                    ? OpenRouterService.buildHeaders(apiKey)
                    : {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    }
                const res = await fetch(`${OpenRouterService.BASE_URL}/models`, {
                    method: 'GET',
                    headers,
                })
                if (!res.ok) {
                    const msg = await OpenRouterService.parseErrorMessage(res)
                    throw new Error(msg)
                }
                const data: unknown = await res.json()
                const models: unknown = Array.isArray(data) ? data : ((data as Record<string, unknown>)?.data ?? data)
                return (models as OpenRouterModel[]) || []
            },
            {hasApiKey: !!apiKey},
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
                        const msg =
                            ((json as Record<string, unknown>)?.error as Record<string, unknown>)?.message ||
                            (json as Record<string, unknown>)?.message ||
                            text ||
                            `Request failed with status ${res.status}`
                        throw new Error(msg)
                    }

                    // Some providers return a 200 with an error object in the body
                    if (json && (json as Record<string, unknown>).error && typeof ((json as Record<string, unknown>).error as Record<string, unknown>).message === 'string') {
                        throw new Error(((json as Record<string, unknown>).error as Record<string, unknown>).message as string)
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
