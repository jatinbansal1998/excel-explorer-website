import {
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterCredits,
  OpenRouterModel,
} from '../types/openrouter'

export class OpenRouterService {
  private static readonly BASE_URL: string = 'https://openrouter.ai/api/v1'
  private static readonly SITE_URL: string = 'https://charts.jatinbansal.com/'

  private static buildHeaders(apiKey: string): Record<string, string> {
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

  private static async parseErrorMessage(res: Response): Promise<string> {
    try {
      const text = await res.text()
      try {
        const json = JSON.parse(text)
        const message = json?.error?.message || json?.message || text
        return `${message}`
      } catch {
        return text || `Request failed with status ${res.status}`
      }
    } catch {
      return `Request failed with status ${res.status}`
    }
  }

  async listModels(apiKey?: string): Promise<OpenRouterModel[]> {
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
    const models: unknown = Array.isArray(data) ? data : ((data as any)?.data ?? data)
    return (models as OpenRouterModel[]) || []
  }

  async getCredits(apiKey: string): Promise<OpenRouterCredits> {
    const res = await fetch(`${OpenRouterService.BASE_URL}/me/credits`, {
      method: 'GET',
      headers: OpenRouterService.buildHeaders(apiKey),
    })
    if (!res.ok) {
      const msg = await OpenRouterService.parseErrorMessage(res)
      throw new Error(msg)
    }
    return (await res.json()) as OpenRouterCredits
  }

  async chat(apiKey: string, body: OpenRouterChatRequest): Promise<OpenRouterChatResponse> {
    const res = await fetch(`${OpenRouterService.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: OpenRouterService.buildHeaders(apiKey),
      body: JSON.stringify(body),
    })

    // Read the response body exactly once to handle both error and success payloads
    const text = await res.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }

    // HTTP-level error
    if (!res.ok) {
      const msg =
        json?.error?.message || json?.message || text || `Request failed with status ${res.status}`
      throw new Error(msg)
    }

    // Some providers return a 200 with an error object in the body
    if (json && json.error && typeof json.error.message === 'string') {
      throw new Error(json.error.message)
    }

    return json as OpenRouterChatResponse
  }
}
