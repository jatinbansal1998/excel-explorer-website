import { OpenRouterService } from './openrouter'
import type { LLMAnalyticsResponse, PromptSuggestion } from '@/types/llmAnalytics'
import { LLM_ANALYTICS_SCHEMA_TEXT } from '@/types/llmAnalytics'
import type { ExcelData } from '@/types/excel'
import type { OpenRouterChatRequest, OpenRouterChatResponse } from '@/types/openrouter'

const TEMPLATE_CACHE: Map<string, string> = new Map()

function safeJsonParse<T = any>(text: string): T | null {
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

function tryParseFromCodeFences(text: string): any | null {
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

function parseLLMJsonPayload(text: string): any | null {
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

function pickSampleRows(rows: any[][], limit: number): any[][] {
  if (!rows || rows.length <= limit) return rows || []
  const mid = Math.floor(limit / 2)
  const head = rows.slice(0, mid)
  const tail = rows.slice(-mid)
  return [...head, ...tail]
}

export function buildDatasetContext(data: ExcelData | null, sampleRowLimit: number = 100): string {
  if (!data) return 'No dataset provided.'
  const meta = data.metadata
  const headers = data.headers || []
  const sample = pickSampleRows(data.rows || [], sampleRowLimit)
  const cols = (meta.columns || []).map((c) => ({
    name: c.name,
    index: c.index,
    type: c.type,
    uniqueCount: c.uniqueCount,
    hasNulls: c.hasNulls,
    nullCount: c.nullCount,
    sampleValues: (c.sampleValues || []).slice(0, 5),
  }))
  const payload = {
    fileName: meta.fileName,
    sheet: meta.activeSheet,
    totalRows: meta.totalRows,
    totalColumns: meta.totalColumns,
    headers,
    columns: cols,
    sampleRows: sample,
    note: 'This is a bounded sample for privacy and token limits.',
  }
  return JSON.stringify(payload)
}

function isOpenRouterError(response: any): boolean {
  return response && typeof response === 'object' && response.error && response.error.message
}

function normalizeResponseShape(maybeJson: any): LLMAnalyticsResponse {
  // Handle { insights: [{ key, value }, ...] }
  if (
    maybeJson &&
    Array.isArray(maybeJson.insights) &&
    (maybeJson.insights.length === 0 || maybeJson.insights[0]?.key !== undefined)
  ) {
    const insights = (maybeJson.insights as any[]).map((it: any, idx: number) => ({
      key: String(it?.key ?? `Insight ${idx + 1}`),
      value: typeof it?.value === 'string' ? it.value : JSON.stringify(it?.value ?? '', null, 2),
    }))
    const followUps = Array.isArray(maybeJson.followUps)
      ? maybeJson.followUps.map((f: any) => ({
          id: String(f?.id || ''),
          category: String(f?.category || 'other').toLowerCase() as
            | 'descriptive'
            | 'diagnostic'
            | 'predictive'
            | 'prescriptive'
            | 'other',
          prompt: String(f?.prompt || ''),
          rationale: f?.rationale ? String(f.rationale) : undefined,
        }))
      : []
    return { insights, followUps }
  }

  // Handle legacy cards: { insights: [{ id,title,kind,details, ... }] }
  if (
    maybeJson &&
    Array.isArray(maybeJson.insights) &&
    (maybeJson.insights.length === 0 || maybeJson.insights[0]?.title !== undefined)
  ) {
    const insights = (maybeJson.insights as any[]).map((it: any, idx: number) => ({
      key: String(it?.title ?? `Insight ${idx + 1}`),
      value:
        typeof it?.details === 'string' ? it.details : JSON.stringify(it?.details ?? '', null, 2),
    }))
    const followUps = Array.isArray(maybeJson.followUps)
      ? maybeJson.followUps.map((f: any) => ({
          id: String(f?.id || ''),
          category: String(f?.category || 'other').toLowerCase() as
            | 'descriptive'
            | 'diagnostic'
            | 'predictive'
            | 'prescriptive'
            | 'other',
          prompt: String(f?.prompt || ''),
          rationale: f?.rationale ? String(f.rationale) : undefined,
        }))
      : []
    return { insights, followUps }
  }

  // Default empty
  return { insights: [], followUps: [] }
}

export class LLMAnalyticsService {
  private readonly openrouter: OpenRouterService

  constructor(openrouter?: OpenRouterService) {
    this.openrouter = openrouter ?? new OpenRouterService()
  }

  async suggestPrompts(
    apiKey: string,
    model: string,
    context: string,
  ): Promise<PromptSuggestion[]> {
    const system = await buildSystemInstruction()
    const user = await buildSuggestUser(context)
    const res = await this.openrouter.chat(apiKey, {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
    const content = res.choices?.[0]?.message?.content || ''
    try {
      const parsed = parseLLMJsonPayload(content)
      if (!parsed) throw new Error('Failed to parse JSON')
      const normalized = normalizeResponseShape(parsed)
      return normalized.followUps || []
    } catch {
      return []
    }
  }

  async analyze(
    apiKey: string,
    model: string,
    prompt: string,
    context: string,
  ): Promise<LLMAnalyticsResponse> {
    const system = await buildSystemInstruction()
    const user = await buildAnalyzeUser(context, prompt)
    const res = await this.openrouter.chat(apiKey, {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })

    const content = res.choices?.[0]?.message?.content || ''
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

  // Variants that reuse an injected chat function (e.g., from useOpenRouter)
  async suggestPromptsViaChat(
    model: string,
    context: string,
    chat: (req: OpenRouterChatRequest) => Promise<OpenRouterChatResponse>,
  ): Promise<PromptSuggestion[]> {
    const system = await buildSystemInstruction()
    const user = await buildSuggestUser(context)
    const res = await chat({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
    const content = res.choices?.[0]?.message?.content || ''
    try {
      const parsed = parseLLMJsonPayload(content)
      if (!parsed) throw new Error('Failed to parse JSON')
      const normalized = normalizeResponseShape(parsed)
      return normalized.followUps || []
    } catch {
      return []
    }
  }

  async analyzeViaChat(
    model: string,
    userPrompt: string,
    context: string,
    chat: (req: OpenRouterChatRequest) => Promise<OpenRouterChatResponse>,
  ): Promise<LLMAnalyticsResponse> {
    const system = await buildSystemInstruction()
    const user = await buildAnalyzeUser(context, userPrompt)
    const res = await chat({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })

    const content = res.choices?.[0]?.message?.content || ''
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
}
