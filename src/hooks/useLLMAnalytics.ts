'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LLMAnalyticsService, buildDatasetContext } from '@/services/llmAnalytics'
import type { ExcelData } from '@/types/excel'
import type { LLMAnalyticsResponse, PromptSuggestion } from '@/types/llmAnalytics'
import { useOpenRouter } from './useOpenRouter'
import { LocalStorageManager } from '@/utils/localStorage'

type AsyncState<T> = { isLoading: boolean; data: T | null; error: string | null }

export function useLLMAnalytics(
  excelData: ExcelData | null,
  options?: { contextOverride?: string },
) {
  const { state: orState, sendChat } = useOpenRouter()
  const serviceRef = useRef(new LLMAnalyticsService())

  // Suggestions state
  const [suggestionsState, setSuggestionsState] = useState<AsyncState<PromptSuggestion[]>>({
    isLoading: false,
    data: null,
    error: null,
  })
  // Insights state
  const [analysisState, setAnalysisState] = useState<AsyncState<LLMAnalyticsResponse>>({
    isLoading: false,
    data: null,
    error: null,
  })

  // dataset context payload
  const contextPayload = useMemo(
    () => options?.contextOverride ?? buildDatasetContext(excelData),
    [excelData, options?.contextOverride],
  )

  const canRun = Boolean(orState.selectedModelId && orState.isConnected)

  // Cache key for suggestions per dataset signature
  const suggestionsCacheKey = useMemo(() => {
    const meta = excelData?.metadata
    const cols = meta?.columns?.map((c) => c.name).join('|') || ''
    return `llm-suggestions:${meta?.fileName || 'nofile'}:${meta?.activeSheet || 'nosheet'}:${cols}:${meta?.totalRows || 0}`
  }, [excelData?.metadata])

  const fetchSuggestions = useCallback(
    async (force?: boolean) => {
      if (!canRun || !orState.selectedModelId) return
      setSuggestionsState({ isLoading: true, data: suggestionsState.data, error: null })
      try {
        if (!force) {
          const cached = LocalStorageManager.load<PromptSuggestion[]>(suggestionsCacheKey)
          if (cached && cached.length > 0) {
            setSuggestionsState({ isLoading: false, data: cached, error: null })
            return
          }
        }

        const resp = await serviceRef.current.suggestPromptsViaChat(
          orState.selectedModelId!,
          contextPayload,
          sendChat,
        )

        setSuggestionsState({ isLoading: false, data: resp, error: null })
        LocalStorageManager.save(suggestionsCacheKey, resp)
      } catch (e: any) {
        setSuggestionsState({
          isLoading: false,
          data: null,
          error: e?.message || 'Failed to get suggestions',
        })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [canRun, orState.selectedModelId, contextPayload, sendChat, suggestionsCacheKey],
  )

  // debounce suggestion requests on dataset change
  useEffect(() => {
    if (!excelData) {
      setSuggestionsState({ isLoading: false, data: null, error: null })
      return
    }
    const handle = setTimeout(() => {
      fetchSuggestions()
    }, 600)
    return () => clearTimeout(handle)
  }, [excelData, fetchSuggestions])

  const runAnalysis = useCallback(
    async (prompt: string) => {
      if (!canRun || !orState.selectedModelId) return null
      setAnalysisState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const parsed = await serviceRef.current.analyzeViaChat(
          orState.selectedModelId!,
          prompt,
          contextPayload,
          sendChat,
        )
        setAnalysisState({ isLoading: false, data: parsed, error: null })
        return parsed
      } catch (e: any) {
        const raw = e?.message || 'Failed to analyze'
        const msg = normalizeOpenRouterError(raw)
        setAnalysisState({ isLoading: false, data: null, error: msg })
        return null
      }
    },
    [canRun, orState.selectedModelId, contextPayload, sendChat],
  )

  return {
    canRun,
    contextPayload,
    suggestions: suggestionsState.data || [],
    suggestionsLoading: suggestionsState.isLoading,
    suggestionsError: suggestionsState.error,
    analysis: analysisState.data,
    analysisLoading: analysisState.isLoading,
    analysisError: analysisState.error,
    fetchSuggestions,
    reloadSuggestions: () => fetchSuggestions(true),
    runAnalysis,
  } as const
}

function normalizeOpenRouterError(message: string): string {
  const lower = message.toLowerCase()
  // Privacy/data policy error surfaced by OpenRouter
  if (lower.includes('no endpoints found') && lower.includes('data policy')) {
    return 'Your model selection requires enabling data policy permissions. Update your privacy settings and try again.'
  }
  if (lower.includes('invalid api key') || lower.includes('unauthorized')) {
    return 'OpenRouter API key is invalid or unauthorized. Check your key and try again.'
  }
  return message
}
