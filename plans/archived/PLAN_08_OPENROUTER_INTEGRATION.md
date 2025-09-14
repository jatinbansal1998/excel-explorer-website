# Plan 08: OpenRouter Client‑Side Integration

## Overview

Enable users to analyze their uploaded data using OpenRouter models with a 100% client‑side integration: user supplies their OpenRouter API key, we validate/connect, list available models with search + free/paid filters, and provide a typed service for chat completions to drive analysis features. No server proxy.

References:

- API root and endpoints: `https://openrouter.ai/api/v1`
- List models: `GET /v1/models` (Authorization required) — see docs: `https://openrouter.ai/docs/api-reference/completion`
- Chat completions: `POST /v1/chat/completions` — example headers/payloads documented
- Pricing object and free/paid detection: `https://openrouter.ai/docs/models`
- Usage and credits: `GET /v1/me/credits` — `https://openrouter.ai/docs/use-cases/usage-accounting`

## Goals

- Client‑side collection and encrypted persistence of OpenRouter API key
- Connectivity check (credits endpoint) and error surfacing
- List and search models; filter free vs paid
- Strong typing, minimal deps, Web Crypto for encryption
- Reusable hooks/services to be consumed by analysis UI

## Non‑Goals

- Server proxy or secret management on backend
- Advanced OAuth/key exchange flows
- Provider‑specific custom UIs beyond model list/search/filter in this phase

## API Contract (Strict Types)

```ts
// src/types/openrouter.ts
export interface OpenRouterModelPricing {
  prompt?: string // USD per input token (as string). "0" means free
  completion?: string // USD per output token (as string). "0" means free
  request?: string // USD per request (as string). "0" means free
  image?: string
  web_search?: string
  internal_reasoning?: string
  input_cache_read?: string
  input_cache_write?: string
}

export interface OpenRouterModel {
  id: string // e.g. "openai/gpt-4o"
  name?: string
  description?: string
  pricing?: OpenRouterModelPricing
  capabilities?: {
    chat?: boolean
    completion?: boolean
    [key: string]: boolean | undefined
  }
  // Additional fields may be present in API response
  [key: string]: unknown
}

export interface OpenRouterCredits {
  // shape may evolve; keep minimal strictly typed fields we read
  balanceUsd?: number
  [key: string]: unknown
}

export interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

export interface OpenRouterChatRequest {
  model: string
  messages: OpenRouterChatMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stop?: string[]
  // extend as needed
}

export interface OpenRouterChatResponseChoice {
  index: number
  message: OpenRouterChatMessage
  finish_reason?: string
}

export interface OpenRouterChatResponse {
  id: string
  choices: OpenRouterChatResponseChoice[]
  created: number
  model: string
}
```

## Services

```ts
// src/services/openrouter.ts
export class OpenRouterService {
  private static readonly BASE_URL = 'https://openrouter.ai/api/v1'

  async listModels(apiKey: string): Promise<OpenRouterModel[]> {
    const res = await fetch(`${OpenRouterService.BASE_URL}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) throw new Error(`Models request failed: ${res.status}`)
    const data = await res.json()
    const models: unknown = Array.isArray(data) ? data : (data?.data ?? data)
    return (models as OpenRouterModel[]) || []
  }

  async getCredits(apiKey: string): Promise<OpenRouterCredits> {
    const res = await fetch(`${OpenRouterService.BASE_URL}/me/credits`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) throw new Error(`Credits request failed: ${res.status}`)
    return (await res.json()) as OpenRouterCredits
  }

  async chat(apiKey: string, body: OpenRouterChatRequest): Promise<OpenRouterChatResponse> {
    const res = await fetch(`${OpenRouterService.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Chat request failed: ${res.status}`)
    return (await res.json()) as OpenRouterChatResponse
  }
}
```

Notes:

- Endpoints and headers follow docs for `GET /v1/models` and `POST /v1/chat/completions` with `Authorization: Bearer <token>`.

## Encryption & Storage

Approach: Password‑based encryption using Web Crypto (AES‑GCM + PBKDF2). We store only ciphertext, salt, and iv in `localStorage`. Passphrase is user‑supplied and kept in memory only. If forgotten, user re‑enters API key.

```ts
// src/utils/crypto.ts
export async function encryptString(plaintext: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext)),
  )
  const payload = {
    v: 1,
    s: Array.from(salt),
    i: Array.from(iv),
    c: Array.from(ciphertext),
  }
  return btoa(JSON.stringify(payload))
}

export async function decryptString(payloadB64: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  const payload = JSON.parse(atob(payloadB64)) as {
    v: number
    s: number[]
    i: number[]
    c: number[]
  }
  const salt = new Uint8Array(payload.s)
  const iv = new Uint8Array(payload.i)
  const ciphertext = new Uint8Array(payload.c)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return dec.decode(new Uint8Array(plaintext))
}
```

Persistence keys (extend Plan 06 `LocalStorageManager`):

- `OPENROUTER_API_KEY_ENC` — encrypted API key payload
- `OPENROUTER_SETTINGS` — small JSON: selected model id, last connected time, flags

## Hook

```ts
// src/hooks/useOpenRouter.ts
export interface OpenRouterState {
  isConnected: boolean
  models: OpenRouterModel[]
  filteredModels: OpenRouterModel[]
  credits: OpenRouterCredits | null
  searchQuery: string
  filter: 'all' | 'free' | 'paid'
  error: string | null
}

export function useOpenRouter() {
  // manages apiKey in memory, encryption/decryption via crypto utils,
  // list models, search+filter, and connectivity check via credits endpoint.
}
```

Filtering logic:

- A model is considered "free" if:
  - Any pricing field indicates zero cost (e.g., prompt and completion are "0"); or
  - Model id suffix contains `:free` (e.g., `...:free`).
- Otherwise, treat as paid. Pricing schema per docs.

## UI Components

- `src/components/openrouter/OpenRouterSettingsModal.tsx`
  - Inputs: API key, passphrase (confirm), buttons: Save (encrypt → localStorage), Test Connection (calls credits), Remove Key
  - Shows connection state and credits

- `src/components/openrouter/ModelList.tsx`
  - Search input (debounced), filter pills: All / Free / Paid
  - Virtualized list for performance, columns: name, id, provider (from id), pricing summary
  - Select model → persists selection in `OPENROUTER_SETTINGS`

- Integration points:
  - Add a button in `src/components/Header.tsx` to open Settings modal
  - Display current selected model (if any)

## Analysis Integration (Phase A)

Provide a thin analysis adaptor that can send contextual prompts (dataset metadata and user query) to the selected model using `OpenRouterService.chat(...)`. Initial scope:

- Summarize dataset columns, suggest analyses
- Generate SQL‑like queries or filter suggestions as text
- Explain chart insights

Wire this into the main analytics panel:

- `src/components/analytics/AnalyticsPanel.tsx` — comprehensive LLM analytics with suggestions, prompt-based analysis, and rich insights display

## Phases & Tasks

1. Types + Service

- Add `src/types/openrouter.ts`
- Implement `src/services/openrouter.ts` with `listModels`, `getCredits`, `chat`

2. Crypto + Storage

- Add `src/utils/crypto.ts` for AES‑GCM + PBKDF2 helpers
- Extend `LocalStorageManager` with new keys and helpers

3. Hook

- Implement `useOpenRouter` with state (connected, models, search/filter, credits)
- Debounce search; cache last models payload in memory

4. UI

- Create `OpenRouterSettingsModal` and `ModelList`
- Hook into `Header` with a "Connect OpenRouter" action

5. Analysis Panel (optional for MVP toggle)

- Enhance `AnalyticsPanel` with LLM analytics capabilities including suggestions generation and prompt-based analysis

6. Testing

- Unit tests: crypto utils, model filter predicate, service error handling
- Integration: enter key → encrypt+save → reconnect → list models → filter/search

## Feature Flags

- `openrouter.enabled` (default true)
- `openrouter.analysis.enabled` (default false until refined prompts)

## Error Handling & UX

- 401/403: invalid key → show actionable message, keep encrypted key but mark as disconnected
- CORS/network: show retry with backoff
- Quota/credits exhausted: surface credits and suggest switching to free model

## Security Notes

- API key never leaves the browser; all requests originate client‑side with `Authorization: Bearer <token>`
- Key is encrypted at rest in `localStorage`; passphrase is not persisted
- Users can choose not to persist: keep key only in memory for current session

## Validation Criteria

- Can enter & encrypt key; reconnect after refresh via passphrase
- Successful credits fetch validates connection
- Model list populates; search and free/paid filters work
- Chat request succeeds with selected model and returns output

## Open Questions

- Do we require passphrase every session, or allow optional weaker obfuscation with OS‑level storage (e.g., WebAuthn in future)?
- Should we pre‑tag free models by checking all pricing fields == "0" vs relying on `:free` suffix only?

## Appendix: API Examples

List models (authorized):

```http
GET https://openrouter.ai/api/v1/models
Authorization: Bearer <token>
Content-Type: application/json
```

Chat completions:

```http
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer <token>
Content-Type: application/json

{
  "model": "openai/gpt-3.5-turbo",
  "messages": [{ "role": "user", "content": "Analyze my data context..." }]
}
```

Pricing schema (used to detect free vs paid): prompt/completion/request of "0" considered free.
