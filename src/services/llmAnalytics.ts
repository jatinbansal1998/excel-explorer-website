import { OpenRouterService } from './openrouter'
import type { LLMAnalyticsResponse, PromptSuggestion } from '@/types/llmAnalytics'
import { LLM_ANALYTICS_SCHEMA_TEXT } from '@/types/llmAnalytics'
import type { ExcelData } from '@/types/excel'
import type { OpenRouterChatRequest, OpenRouterChatResponse } from '@/types/openrouter'

const TEMPLATE_CACHE: Map<string, string> = new Map()

function safeJsonParse<T = Record<string, unknown>>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function stripBom(text: string): string {
  if (!text) return text
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1)
  return text
}

function tryParseFromCodeFences(text: string): Record<string, unknown> | null {
  const re = /```(?:json|jsonc|ts|typescript|js|javascript)?\s*([\s\S]*?)```/gi
  let match: RegExpExecArray | null
  let firstBlock: string | null = null
  const candidates: { block: string; weight: number }[] = []
  while ((match = re.exec(text)) !== null) {
    const block = (match[1] || '').trim()
    if (!block) continue
    if (!firstBlock) firstBlock = block
    const weight = /"insights"\s*:/.test(block) || /"followUps"\s*:/.test(block) ? 2 : 1
    candidates.push({ block, weight })
  }
  candidates.sort((a, b) => b.weight - a.weight)
  for (const c of candidates) {
    const parsed = safeJsonParse(c.block)
    if (parsed) return parsed
  }
  if (firstBlock) {
    const parsed = safeJsonParse(firstBlock)
    if (parsed) return parsed
  }
  return null
}

function findBalancedJsonSubstring(input: string): string | null {
  const text = input
  const tryScan = (openChar: '{' | '[', closeChar: '}' | ']'): string | null => {
    const start = text.indexOf(openChar)
    if (start < 0) return null
    let inString = false
    let escape = false
    let depth = 0
    for (let i = start; i < text.length; i++) {
      const ch = text[i]
      if (inString) {
        if (escape) {
          escape = false
        } else if (ch === '\\') {
          escape = true
        } else if (ch === '"') {
          inString = false
        }
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === openChar) {
        depth++
      } else if (ch === closeChar) {
        depth--
        if (depth === 0) {
          return text.slice(start, i + 1)
        }
      }
    }
    return null
  }
  // Prefer object payloads; fallback to array
  return tryScan('{', '}') ?? tryScan('[', ']')
}

function parseLLMJsonPayload(text: string): Record<string, unknown> | null {
  if (!text) return null
  const cleaned = stripBom(text).trim()
  // 1) Direct parse
  const direct = safeJsonParse(cleaned)
  if (direct) return direct
  // 2) From code fences
  const fenced = tryParseFromCodeFences(cleaned)
  if (fenced) return fenced
  // 3) Balanced substring
  const candidate = findBalancedJsonSubstring(cleaned)
  if (candidate) {
    const parsed = safeJsonParse(candidate)
    if (parsed) return parsed
  }
  return null
}

async function loadTemplate(path: string): Promise<string> {
  if (TEMPLATE_CACHE.has(path)) return TEMPLATE_CACHE.get(path) as string
  const res = await fetch(path)
  const text = await res.text()
  TEMPLATE_CACHE.set(path, text)
  return text
}

async function buildSystemInstruction(): Promise<string> {
  const md = await loadTemplate('/prompts/analytics_system.md')
  return md.replace('<SCHEMA>', LLM_ANALYTICS_SCHEMA_TEXT)
}

async function buildSuggestUser(context: string): Promise<string> {
  const md = await loadTemplate('/prompts/analytics_suggest_prompts.md')
  return md.replace('{{CONTEXT}}', context)
}

async function buildAnalyzeUser(context: string, prompt: string): Promise<string> {
  const md = await loadTemplate('/prompts/analytics_analyze.md')
  return md.replace('{{CONTEXT}}', context).replace('{{PROMPT}}', prompt)
}

function pickSampleRows(rows: unknown[][], limit: number): unknown[][] {
  if (!rows || rows.length <= limit) return rows || []
  const mid = Math.floor(limit / 2)
  const head = rows.slice(0, mid)
  const tail = rows.slice(-mid)
  return [...head, ...tail]
}

export function buildDatasetContext(
  data: ExcelData | null,
  sampleRowLimit: number = 100,
  rowsOverride?: unknown[][],
): string {
  if (!data) return 'No dataset provided.'
  const meta = data.metadata
  const headers = data.headers || []
  const rows = rowsOverride !== undefined ? rowsOverride : data.rows || []
  const sample = pickSampleRows(rows, sampleRowLimit)
  const cols = (meta.columns || []).map((c) => {
    const sampleValues = rowsOverride
      ? sample
          .map((r) => (Array.isArray(r) ? r[c.index] : undefined))
          .filter((v) => v !== undefined)
          .slice(0, 5)
      : (c.sampleValues || []).slice(0, 5)
    return {
      name: c.name,
      index: c.index,
      type: c.type,
      uniqueCount: c.uniqueCount,
      hasNulls: c.hasNulls,
      nullCount: c.nullCount,
      sampleValues,
    }
  })
  const payload = {
    fileName: meta.fileName,
    sheet: meta.activeSheet,
    totalRows: rows.length,
    totalColumns: meta.totalColumns,
    headers,
    columns: cols,
    sampleRows: sample,
    note: rowsOverride
      ? 'This is a bounded sample of the currently filtered view for privacy and token limits.'
      : 'This is a bounded sample for privacy and token limits.',
  }
  return JSON.stringify(payload)
}

function mapFollowUps(raw: unknown): PromptSuggestion[] {
  if (!Array.isArray(raw)) return []
  return (raw as unknown[]).map((f: unknown) => {
    const followUp = f as Record<string, unknown> | null
    return {
      id: String(followUp?.id || ''),
      category: String(followUp?.category || 'other').toLowerCase() as
        | 'descriptive'
        | 'diagnostic'
        | 'predictive'
        | 'prescriptive'
        | 'other',
      prompt: String(followUp?.prompt || ''),
      rationale: followUp?.rationale ? String(followUp.rationale) : undefined,
    }
  })
}

function mapInsights(raw: unknown): { insights: { key: string; value: string }[] } {
  if (!Array.isArray(raw)) return { insights: [] }
  const items = raw as unknown[]
  const first = (items[0] || null) as Record<string, unknown> | null
  const isLegacy = first && (first.title !== undefined || first.details !== undefined)

  const insights = items.map((it: unknown, idx: number) => {
    const item = it as Record<string, unknown> | null
    const key = isLegacy
      ? String(item?.title ?? `Insight ${idx + 1}`)
      : String(item?.key ?? `Insight ${idx + 1}`)
    const rawValue = isLegacy ? item?.details : item?.value
    const value = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue ?? '', null, 2)
    return { key, value }
  })

  return { insights }
}

function normalizeResponseShape(maybeJson: unknown): LLMAnalyticsResponse {
  const json = maybeJson as Record<string, unknown> | null
  if (!json) return { insights: [], followUps: [] }

  const { insights } = mapInsights(json.insights)
  const followUps = mapFollowUps(json.followUps)
  return { insights, followUps }
}

export class LLMAnalyticsService {
  private readonly openrouter: OpenRouterService

  constructor(openrouter?: OpenRouterService) {
    this.openrouter = openrouter ?? new OpenRouterService()
  }

  private async buildSuggestMessages(context: string): Promise<{ system: string; user: string }> {
    const system = await buildSystemInstruction()
    const user = await buildSuggestUser(context)
    return { system, user }
  }

  private async buildAnalyzeMessages(
    context: string,
    prompt: string,
  ): Promise<{ system: string; user: string }> {
    const system = await buildSystemInstruction()
    const user = await buildAnalyzeUser(context, prompt)
    return { system, user }
  }

  private async runChat(
    model: string,
    system: string,
    user: string,
    chatFn: (req: OpenRouterChatRequest) => Promise<OpenRouterChatResponse>,
  ): Promise<string> {
    const res = await chatFn({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
    return res.choices?.[0]?.message?.content || ''
  }

  private parseSuggestionsFromContent(content: string): PromptSuggestion[] {
    try {
      const parsed = parseLLMJsonPayload(content)
      if (!parsed) throw new Error('Failed to parse JSON')
      const normalized = normalizeResponseShape(parsed)
      return normalized.followUps || []
    } catch {
      return []
    }
  }

  private parseAnalysisFromContent(content: string): LLMAnalyticsResponse {
    try {
      const parsed = parseLLMJsonPayload(content)
      if (!parsed) throw new Error('Failed to parse JSON')
      return normalizeResponseShape(parsed)
    } catch {
      return {
        insights: [{ key: 'Model Response', value: content || 'No content' }],
      }
    }
  }

  private async suggestPromptsWithChat(
    model: string,
    context: string,
    chatFn: (req: OpenRouterChatRequest) => Promise<OpenRouterChatResponse>,
  ): Promise<PromptSuggestion[]> {
    const { system, user } = await this.buildSuggestMessages(context)
    const content = await this.runChat(model, system, user, chatFn)
    return this.parseSuggestionsFromContent(content)
  }

  private async analyzeWithChat(
    model: string,
    prompt: string,
    context: string,
    chatFn: (req: OpenRouterChatRequest) => Promise<OpenRouterChatResponse>,
  ): Promise<LLMAnalyticsResponse> {
    const { system, user } = await this.buildAnalyzeMessages(context, prompt)
    const content = await this.runChat(model, system, user, chatFn)
    return this.parseAnalysisFromContent(content)
  }

  async suggestPrompts(
    apiKey: string,
    model: string,
    context: string,
  ): Promise<PromptSuggestion[]> {
    const chatFn = (req: OpenRouterChatRequest) => this.openrouter.chat(apiKey, req)
    return this.suggestPromptsWithChat(model, context, chatFn)
  }

  async analyze(
    apiKey: string,
    model: string,
    prompt: string,
    context: string,
  ): Promise<LLMAnalyticsResponse> {
    const chatFn = (req: OpenRouterChatRequest) => this.openrouter.chat(apiKey, req)
    return this.analyzeWithChat(model, prompt, context, chatFn)
  }

  // Variants that reuse an injected chat function (e.g., from useOpenRouter)
  async suggestPromptsViaChat(
    model: string,
    context: string,
    chat: (req: OpenRouterChatRequest) => Promise<OpenRouterChatResponse>,
  ): Promise<PromptSuggestion[]> {
    return this.suggestPromptsWithChat(model, context, chat)
  }

  async analyzeViaChat(
    model: string,
    userPrompt: string,
    context: string,
    chat: (req: OpenRouterChatRequest) => Promise<OpenRouterChatResponse>,
  ): Promise<LLMAnalyticsResponse> {
    return this.analyzeWithChat(model, userPrompt, context, chat)
  }
}
