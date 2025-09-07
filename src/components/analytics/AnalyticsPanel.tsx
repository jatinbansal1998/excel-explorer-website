'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useLLMAnalytics } from '@/hooks/useLLMAnalytics'
import type { ExcelData } from '@/types/excel'
import type { ChartConfig } from '@/types/chart'
import type { FilterConfig } from '@/types/filter'
import { Button } from '../ui/Button'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useOpenRouter } from '@/hooks/useOpenRouter'
import { buildDatasetContext } from '@/services/llmAnalytics'

interface Props {
  excelData: ExcelData | null
  onApplyChart?: (config: ChartConfig) => void
  onApplyFilters?: (filters: FilterConfig[] | FilterConfig) => void
}

export function AnalyticsPanel({ excelData, onApplyChart, onApplyFilters }: Props) {
  const { state: orState } = useOpenRouter()

  const [prompt, setPrompt] = useState('')
  const [activeTab, setActiveTab] = useState<'suggestions' | 'prompt'>('suggestions')
  const [sliceForPrompt, setSliceForPrompt] = useState(true)

  const contextOverride = useMemo(
    () => buildDatasetContext(excelData, sliceForPrompt ? 100 : Number.POSITIVE_INFINITY),
    [excelData, sliceForPrompt],
  )

  const {
    canRun,
    suggestions,
    suggestionsLoading,
    suggestionsError,
    analysis,
    analysisLoading,
    analysisError,
    runAnalysis,
    reloadSuggestions,
  } = useLLMAnalytics(excelData, { contextOverride })

  const selectedModel = useMemo(
    () => orState.models.find((m) => m.id === orState.selectedModelId),
    [orState.models, orState.selectedModelId],
  )
  const selectedModelLabel = selectedModel?.name || orState.selectedModelId

  // Refresh suggestions when toggling slice mode so the context matches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    reloadSuggestions()
  }, [sliceForPrompt])

  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, typeof suggestions> = {}
    for (const s of suggestions) {
      const key = s.category || 'other'
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    }
    return groups
  }, [suggestions])

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">AI Insights</div>
          {orState.selectedModelId && (
            <span
              className="text-[11px] px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200"
              title={orState.selectedModelId}
            >
              {selectedModelLabel}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-2 py-1 text-xs rounded border ${activeTab === 'suggestions' ? 'bg-primary-600 text-white border-primary-600' : ''}`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-2 py-1 text-xs rounded border ${activeTab === 'prompt' ? 'bg-primary-600 text-white border-primary-600' : ''}`}
          >
            Prompt
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={sliceForPrompt}
            onChange={(e) => setSliceForPrompt(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span>Slice data table for prompts (recommended)</span>
        </label>
      </div>

      {activeTab === 'suggestions' && (
        <div className="space-y-2">
          {!canRun && (
            <div className="text-xs text-red-600">
              Connect OpenRouter and select a model to use AI analytics.
            </div>
          )}
          <div className="flex items-center justify-between">
            {suggestionsLoading ? (
              <div className="text-xs text-gray-500">Loading suggestions…</div>
            ) : (
              <div className="text-xs text-gray-500">Suggestions</div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => reloadSuggestions()}
                disabled={!canRun || suggestionsLoading}
                aria-label="Reload suggestions"
                title="Reload suggestions"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {suggestionsError && (
            <div className="text-xs text-red-600">
              {renderFriendlyOpenRouterError(suggestionsError)}
            </div>
          )}
          {Object.keys(groupedSuggestions).length === 0 && !suggestionsLoading && (
            <div className="text-xs text-gray-500">No suggestions yet.</div>
          )}
          <div className="space-y-3">
            {Object.entries(groupedSuggestions).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <div className="text-xs font-semibold uppercase text-gray-600">{category}</div>
                <ul className="space-y-1">
                  {items.map((s, idx) => (
                    <li
                      key={`${category}-${s.id || 'noid'}-${idx}`}
                      className="border rounded p-2 text-sm flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-medium">{s.prompt}</div>
                        {s.rationale && (
                          <div className="text-xs text-gray-500 mt-0.5">{s.rationale}</div>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setPrompt(s.prompt)
                          setActiveTab('prompt')
                        }}
                      >
                        Use
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'prompt' && (
        <div className="space-y-2">
          {!canRun && (
            <div className="text-xs text-red-600">
              Connect OpenRouter and select a model to use AI analytics.
            </div>
          )}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a question about your data or paste a suggestion…"
            className="w-full h-24 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm px-3 py-2"
          />
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (prompt) await runAnalysis(prompt)
              }}
              disabled={!canRun || !prompt || analysisLoading}
            >
              {analysisLoading ? 'Running…' : 'Run Analysis'}
            </Button>
          </div>

          {analysisError && (
            <div className="text-xs text-red-600">
              {renderFriendlyOpenRouterError(analysisError)}
            </div>
          )}
          <div className="space-y-2">
            {analysis?.insights?.map((kv, idx) => (
              <div key={`${kv.key}-${idx}`} className="border rounded p-3 space-y-1">
                <div className="font-medium text-sm">{kv.key}</div>
                <div className="text-sm whitespace-pre-wrap">{kv.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPanel

function renderFriendlyOpenRouterError(message: string): React.ReactNode {
  const lower = message.toLowerCase()
  if (lower.includes('no endpoints found') && lower.includes('data policy')) {
    return (
      <span>
        Your model selection requires enabling data policy permissions. Update your
        <a
          href="https://openrouter.ai/settings/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline ml-1"
        >
          privacy settings
        </a>
        , then try again.
      </span>
    )
  }
  return message
}
