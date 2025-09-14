'use client'

import {useEffect, useMemo, useState} from 'react'
import type {DataMatrix, ExcelData} from '@/types/excel'
import {buildDatasetContext} from '@/services/llmAnalytics'
import {useLLMAnalytics} from '@/hooks/useLLMAnalytics'
import {useOpenRouter} from '@/hooks/useOpenRouter'

export interface UseAnalyticsPanelArgs {
    excelData: ExcelData | null
    filteredRows?: DataMatrix
    filtersActive?: boolean
}

export function useAnalyticsPanel({
                                      excelData,
                                      filteredRows,
                                      filtersActive,
                                  }: UseAnalyticsPanelArgs) {
    const {state: orState} = useOpenRouter()

    const [prompt, setPrompt] = useState('')
    const [activeTab, setActiveTab] = useState<'suggestions' | 'prompt'>('suggestions')
    const [sliceForPrompt, setSliceForPrompt] = useState(true)
    const [isORSettingsOpen, setIsORSettingsOpen] = useState(false)
    const [useFilteredForLLM, setUseFilteredForLLM] = useState<boolean>(filtersActive === true)

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
    } = useLLMAnalytics(excelData, {contextOverride})

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

    const filteredRowsCount = Array.isArray(filteredRows) ? filteredRows.length : 0

    return {
        // UI state
        prompt,
        setPrompt,
        activeTab,
        setActiveTab,
        sliceForPrompt,
        setSliceForPrompt,
        isORSettingsOpen,
        setIsORSettingsOpen,
        useFilteredForLLM,
        setUseFilteredForLLM,

        // Derived / config
        contextOverride,
        canRun,
        selectedModelId: orState.selectedModelId,
        selectedModelLabel,
        groupedSuggestions,
        filteredRowsCount,

        // Suggestions
        suggestionsLoading,
        suggestionsError,
        reloadSuggestions,
        cancelSuggestions,

        // Analysis
        analysis,
        analysisLoading,
        analysisError,
        runAnalysis,
        cancelAnalysis,
    } as const
}

export type UseAnalyticsPanelReturn = ReturnType<typeof useAnalyticsPanel>

