import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {ModelList} from '@/components/presentational/openrouter'
import {OpenRouterModel} from '@/types/openrouter'

describe('ModelList (presentational)', () => {
    const models: OpenRouterModel[] = [
        {
            id: 'openai/gpt-4',
            name: 'GPT-4',
            description: 'Advanced model',
            context_length: 2000,
            pricing: {prompt: '0.03', completion: '0.06', request: '0.08'},
        },
        {
            id: 'anthropic/claude-3-opus',
            name: 'Claude 3 Opus',
            description: 'Anthropic flagship',
            context_length: 200000,
            pricing: {prompt: '0.005', completion: '0.01'},
        },
    ]

    it('renders headers and rows with formatted values', () => {
        const onSelect = jest.fn()
        render(<ModelList models={models} selectedModelId={undefined} onSelect={onSelect}/>)

        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Provider')).toBeInTheDocument()
        expect(screen.getByText('Context Length')).toBeInTheDocument()
        expect(screen.getByText('Prompt')).toBeInTheDocument()
        expect(screen.getByText('Completion')).toBeInTheDocument()
        expect(screen.getByText('Request')).toBeInTheDocument()
        expect(screen.getByText('ID')).toBeInTheDocument()

        // Row content
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
        expect(screen.getByText('openai')).toBeInTheDocument()
        // 2000 -> 2k
        expect(screen.getByText('2k')).toBeInTheDocument()
        expect(screen.getAllByText('$0.03')[0]).toBeInTheDocument()
        expect(screen.getAllByText('$0.06')[0]).toBeInTheDocument()
        expect(screen.getAllByText('$0.08')[0]).toBeInTheDocument()
        expect(screen.getByText('openai/gpt-4')).toBeInTheDocument()

        // Second row provider + large context formatting
        expect(screen.getByText('anthropic')).toBeInTheDocument()
        // 200000 -> 200k
        expect(screen.getByText('200k')).toBeInTheDocument()
    })

    it('calls onSelect when clicking a row and highlights selected model', () => {
        const onSelect = jest.fn()
        render(<ModelList models={models} selectedModelId={'openai/gpt-4'} onSelect={onSelect}/>)

        const row = screen.getByText('openai/gpt-4').closest('li') as HTMLElement
        expect(row).toBeInTheDocument()
        fireEvent.click(row)
        expect(onSelect).toHaveBeenCalledWith('openai/gpt-4')

        // selected styling is applied on inner div
        const inner = row.querySelector('div') as HTMLElement
        expect(inner.className).toMatch(/ring-2/)
    })
})
