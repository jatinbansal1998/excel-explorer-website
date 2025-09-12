'use client'

import React from 'react'
import type {DataMatrix, ExcelData} from '@/types/excel'
import type {ChartConfig} from '@/types/chart'
import type {FilterConfig} from '@/types/filter'
import {useAnalyticsPanel} from '@/hooks/useAnalyticsPanel'
import {AnalyticsPanelView} from '@/components/presentational/analytics'

interface Props {
  excelData: ExcelData | null
  filteredRows?: DataMatrix
  filtersActive?: boolean
  _onApplyChart?: (_config: ChartConfig) => void
  _onApplyFilters?: (_filters: FilterConfig[] | FilterConfig) => void
}

export function AnalyticsPanel({
  excelData,
  filteredRows,
  filtersActive,
}: Readonly<Props>) {
    const state = useAnalyticsPanel({excelData, filteredRows, filtersActive})

  return (
      <AnalyticsPanelView
          useFilteredForLLM={state.useFilteredForLLM}
          filtersActive={filtersActive}
          filteredRowsCount={state.filteredRowsCount}
          selectedModelLabel={state.selectedModelLabel}
          selectedModelId={state.selectedModelId}
          isORSettingsOpen={state.isORSettingsOpen}
          onOpenORSettings={() => state.setIsORSettingsOpen(true)}
          onCloseORSettings={() => state.setIsORSettingsOpen(false)}
          activeTab={state.activeTab}
          onActiveTabChange={state.setActiveTab}
          sliceForPrompt={state.sliceForPrompt}
          onSliceForPromptChange={state.setSliceForPrompt}
          onUseFilteredForLLMChange={state.setUseFilteredForLLM}
          canRun={state.canRun}
          groupedSuggestions={state.groupedSuggestions}
          suggestionsLoading={state.suggestionsLoading}
          suggestionsError={state.suggestionsError}
          onReloadSuggestions={state.reloadSuggestions}
          onCancelSuggestions={state.cancelSuggestions}
          onUseSuggestion={(p) => {
              state.setPrompt(p)
              state.setActiveTab('prompt')
          }}
          prompt={state.prompt}
          onPromptChange={state.setPrompt}
          analysis={state.analysis}
          analysisLoading={state.analysisLoading}
          analysisError={state.analysisError}
          onRunAnalysis={async () => {
              if (state.prompt) await state.runAnalysis(state.prompt)
          }}
          onCancelAnalysis={state.cancelAnalysis}
      />
  )
}

export default AnalyticsPanel
