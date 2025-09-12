import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {AnalyticsPanelView} from '@/components/presentational/analytics'
import {OpenRouterProvider} from '@/hooks/useOpenRouter'

function renderWithProviders(ui: React.ReactElement) {
    return render(<OpenRouterProvider>{ui}</OpenRouterProvider>)
}

const baseProps = {
    useFilteredForLLM: false,
    filtersActive: false,
    filteredRowsCount: 0,
    selectedModelLabel: undefined as string | undefined,
    selectedModelId: undefined as string | undefined,
    isORSettingsOpen: false,
    onOpenORSettings: jest.fn(),
    onCloseORSettings: jest.fn(),
    activeTab: 'suggestions' as const,
    onActiveTabChange: jest.fn(),
    sliceForPrompt: true,
    onSliceForPromptChange: jest.fn(),
    onUseFilteredForLLMChange: jest.fn(),
    canRun: false,
    groupedSuggestions: {} as Record<string, any[]>,
    suggestionsLoading: false,
    suggestionsError: null as string | null,
    onReloadSuggestions: jest.fn(),
    onCancelSuggestions: jest.fn(),
    onUseSuggestion: jest.fn(),
    prompt: '',
    onPromptChange: jest.fn(),
    analysis: null,
    analysisLoading: false,
    analysisError: null as string | null,
    onRunAnalysis: jest.fn(),
    onCancelAnalysis: jest.fn(),
}

describe('AnalyticsPanelView (presentational)', () => {
    test('renders header and basic controls', () => {
        renderWithProviders(<AnalyticsPanelView {...baseProps} />)

        expect(screen.getByRole('heading', {name: /AI Insights/i})).toBeInTheDocument()
        expect(screen.getByText('Slice data table for prompts (recommended)')).toBeInTheDocument()
        expect(screen.getByText('Use filtered view for LLM')).toBeInTheDocument()
    })

    test('shows filtered view badge when enabled and filters active', () => {
        renderWithProviders(
            <AnalyticsPanelView
                {...baseProps}
                useFilteredForLLM
                filtersActive
                filteredRowsCount={5}
            />,
        )

        expect(screen.getByText('Using filtered view')).toBeInTheDocument()
    })

    test('model chip renders and opens settings', () => {
        const onOpenORSettings = jest.fn()
        renderWithProviders(
            <AnalyticsPanelView
                {...baseProps}
                selectedModelId="test-model"
                selectedModelLabel="Test Model"
                onOpenORSettings={onOpenORSettings}
            />,
        )

        const chip = screen.getByRole('button', {name: /Test Model/i})
        expect(chip).toBeInTheDocument()
        fireEvent.click(chip)
        expect(onOpenORSettings).toHaveBeenCalled()
    })

    test('tab buttons call onActiveTabChange', () => {
        const onActiveTabChange = jest.fn()
        renderWithProviders(
            <AnalyticsPanelView {...baseProps} onActiveTabChange={onActiveTabChange}/>,
        )

        fireEvent.click(screen.getByRole('button', {name: /Prompt/i}))
        expect(onActiveTabChange).toHaveBeenCalledWith('prompt')
    })

    test('suggestions reload/cancel button behavior', () => {
        const onReload = jest.fn()
        const onCancel = jest.fn()

        const {rerender} = renderWithProviders(
            <AnalyticsPanelView
                {...baseProps}
                canRun
                suggestionsLoading={false}
                onReloadSuggestions={onReload}
                onCancelSuggestions={onCancel}
            />,
        )

        const reloadBtn = screen.getByRole('button', {name: /Reload suggestions/i})
        fireEvent.click(reloadBtn)
        expect(onReload).toHaveBeenCalled()

        rerender(
            <OpenRouterProvider>
                <AnalyticsPanelView
                    {...baseProps}
                    canRun
                    suggestionsLoading
                    onReloadSuggestions={onReload}
                    onCancelSuggestions={onCancel}
                />
            </OpenRouterProvider>,
        )

        const cancelBtn = screen.getByRole('button', {name: /Cancel suggestions/i})
        fireEvent.click(cancelBtn)
        expect(onCancel).toHaveBeenCalled()
    })

    test('renders suggestions and Use button calls handler', () => {
        const onUseSuggestion = jest.fn()
        renderWithProviders(
            <AnalyticsPanelView
                {...baseProps}
                canRun
                groupedSuggestions={{descriptive: [{id: '1', category: 'descriptive', prompt: 'Try X'}]}}
                onUseSuggestion={onUseSuggestion}
            />,
        )

        expect(screen.getByText('descriptive')).toBeInTheDocument()
        expect(screen.getByText('Try X')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', {name: /Use/i}))
        expect(onUseSuggestion).toHaveBeenCalledWith('Try X')
    })

    test('prompt tab run/cancel flows and insights render', () => {
        const onRun = jest.fn()
        const onCancel = jest.fn()
        const {rerender} = renderWithProviders(
            <AnalyticsPanelView
                {...baseProps}
                activeTab="prompt"
                canRun
                prompt="Hello"
                onRunAnalysis={onRun}
                onCancelAnalysis={onCancel}
            />,
        )

        fireEvent.click(screen.getByRole('button', {name: /Run Analysis/i}))
        expect(onRun).toHaveBeenCalled()

        rerender(
            <OpenRouterProvider>
                <AnalyticsPanelView
                    {...baseProps}
                    activeTab="prompt"
                    canRun
                    prompt="Hello"
                    analysisLoading
                    onRunAnalysis={onRun}
                    onCancelAnalysis={onCancel}
                    analysis={{insights: [{key: 'K', value: 'V'}]}}
                />
            </OpenRouterProvider>,
        )

        expect(screen.getByText('K')).toBeInTheDocument()
        expect(screen.getByText('V')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', {name: /Cancel Analysis/i}))
        expect(onCancel).toHaveBeenCalled()
    })

    test('renders friendly error with privacy link for OpenRouter policy error', () => {
        renderWithProviders(
            <AnalyticsPanelView
                {...baseProps}
                activeTab="prompt"
                analysisError="No endpoints found due to data policy"
            />,
        )

        expect(screen.getByRole('link', {name: /privacy settings/i})).toBeInTheDocument()
    })
})
