'use client'

import React, {useEffect, useMemo, useState} from 'react'
import {useLLMAnalytics} from '@/hooks/useLLMAnalytics'
import type {ExcelData} from '@/types/excel'
import type {ChartConfig} from '@/types/chart'
import type {FilterConfig} from '@/types/filter'
import {Button} from '../ui/Button'
import {SpinnerIcon} from '../ui/SpinnerIcon'
import {ArrowPathIcon} from '@heroicons/react/24/outline'
import {useOpenRouter} from '@/hooks/useOpenRouter'
import {buildDatasetContext} from '@/services/llmAnalytics'
import {OpenRouterSettingsModal} from '../openrouter/OpenRouterSettingsModal'

interface Props {
  excelData: ExcelData | null
    filteredRows?: (string | number | boolean | Date)[][]
  filtersActive?: boolean
    _onApplyChart?: (_config: ChartConfig) => void
    _onApplyFilters?: (_filters: FilterConfig[] | FilterConfig) => void
}

export function AnalyticsPanel({
  excelData,
  filteredRows,
  filtersActive,
                                   _onApplyChart,
                                   _onApplyFilters,
}: Readonly<Props>) {
  const { state: orState } = useOpenRouter()

  const [prompt, setPrompt] = useState('')
  const [activeTab, setActiveTab] = useState<'suggestions' | 'prompt'>('suggestions')
  const [sliceForPrompt, setSliceForPrompt] = useState(true)
  const [isORSettingsOpen, setIsORSettingsOpen] = useState(false)
  const [useFilteredForLLM, setUseFilteredForLLM] = useState<boolean>(filtersActive === true)

  // Keep toggle logically in sync when filters turn off; don't auto-enable when filters become active
  useEffect(() => {
    if (!filtersActive) setUseFilteredForLLM(false)
  }, [filtersActive])

  const contextOverride = useMemo(
    () =>
      buildDatasetContext(
        excelData,
        sliceForPrompt ? 100 : Number.POSITIVE_INFINITY,
        useFilteredForLLM && filtersActive ? filteredRows : undefined,
      ),
    [excelData, sliceForPrompt, filteredRows, useFilteredForLLM, filtersActive],
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
    cancelSuggestions,
    cancelAnalysis,
  } = useLLMAnalytics(excelData, { contextOverride })

  const selectedModel = useMemo(
    () => orState.models.find((m) => m.id === orState.selectedModelId),
    [orState.models, orState.selectedModelId],
  )
  const selectedModelLabel = selectedModel?.name || orState.selectedModelId

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
    <div className="section-container p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">AI Insights</h2>
          {useFilteredForLLM && filtersActive && (
            <span
              className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
              title={`Using filtered view: ${
                Array.isArray(filteredRows) ? filteredRows.length.toLocaleString() : '0'
              } rows`}
            >
              Using filtered view
            </span>
          )}
          {orState.selectedModelId && (
            <button
              type="button"
              onClick={() => setIsORSettingsOpen(true)}
              className="text-[11px] px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              title={orState.selectedModelId}
            >
              {selectedModelLabel}
            </button>
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
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={sliceForPrompt}
              onChange={(e) => setSliceForPrompt(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Slice data table for prompts (recommended)</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={useFilteredForLLM}
              onChange={(e) => setUseFilteredForLLM(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              disabled={!filtersActive}
            />
            <span className={filtersActive ? '' : 'text-gray-400'}>Use filtered view for LLM</span>
          </label>
        </div>
      </div>

      {activeTab === 'suggestions' && (
        <div className="space-y-2">
          {!canRun && (
            <div className="text-xs text-red-600">
              Connect OpenRouter and select a model to use AI analytics.
            </div>
          )}

          {suggestionsLoading && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <SpinnerIcon className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Thinking...</span>
              </div>
              <span className="text-xs text-blue-600">AI is generating suggestions</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {suggestionsLoading ? 'Generating suggestions...' : 'Suggestions'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={suggestionsLoading ? cancelSuggestions : reloadSuggestions}
                disabled={!canRun}
                aria-label={suggestionsLoading ? 'Cancel suggestions' : 'Reload suggestions'}
                title={suggestionsLoading ? 'Cancel suggestions' : 'Reload suggestions'}
              >
                {suggestionsLoading ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
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
                        variant="primaryOutline"
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
          {analysisLoading && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <SpinnerIcon className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Thinking...</span>
              </div>
              <span className="text-xs text-blue-600">AI is analyzing your request</span>
            </div>
          )}

          <div className="flex justify-end">
            {analysisLoading ? (
              <button
                onClick={cancelAnalysis}
                disabled={!canRun}
                className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 text-sm text-red-600 border border-red-300 hover:bg-red-50"
              >
                <SpinnerIcon className="mr-2" />
                Cancel Analysis
              </button>
            ) : (
              <Button
                onClick={async () => {
                  if (prompt) await runAnalysis(prompt)
                }}
                disabled={!canRun || !prompt}
              >
                Run Analysis
              </Button>
            )}
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
      <OpenRouterSettingsModal
        isOpen={isORSettingsOpen}
        onClose={() => setIsORSettingsOpen(false)}
      />
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
