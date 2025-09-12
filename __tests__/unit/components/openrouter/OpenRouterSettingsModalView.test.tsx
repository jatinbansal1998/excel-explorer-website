import React from 'react'
import {fireEvent, render, screen, within} from '@testing-library/react'
import {OpenRouterSettingsModalView} from '@/components/presentational/openrouter'
import {OpenRouterModel} from '@/types/openrouter'

describe('OpenRouterSettingsModalView (presentational)', () => {
    const models: OpenRouterModel[] = [
        {id: 'openai/gpt-4', name: 'GPT-4'},
        {id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus'},
    ]

    function setup(extraProps: Partial<React.ComponentProps<typeof OpenRouterSettingsModalView>> = {}) {
        const props: React.ComponentProps<typeof OpenRouterSettingsModalView> = {
            isOpen: true,
            onClose: jest.fn(),
            busy: false,
            error: null,
            apiKeyInput: '',
            keyName: '',
            passphrase: '',
            confirmPassphrase: '',
            showApiKey: false,
            showPassphrase: false,
            showConfirmPassphrase: false,
            onApiKeyInputChange: jest.fn(),
            onKeyNameChange: jest.fn(),
            onPassphraseChange: jest.fn(),
            onConfirmPassphraseChange: jest.fn(),
            onToggleApiKeyVisibility: jest.fn(),
            onTogglePassphraseVisibility: jest.fn(),
            onToggleConfirmPassphraseVisibility: jest.fn(),
            onSaveEncrypted: jest.fn((e: React.FormEvent) => e.preventDefault()),
            onUseWithoutSaving: jest.fn(),
            namedKeyNames: ['Work', 'Personal'],
            loadKeyName: 'Work',
            loadPassphrase: '',
            showLoadPassphrase: false,
            onLoadKeyNameChange: jest.fn(),
            onLoadPassphraseChange: jest.fn(),
            onToggleLoadPassphraseVisibility: jest.fn(),
            onDeleteNamedKey: jest.fn(),
            onLoadEncrypted: jest.fn((e: React.FormEvent) => e.preventDefault()),
            isConnected: true,
            models,
            filteredModels: models,
            selectedModelId: 'openai/gpt-4',
            searchQuery: '',
            filter: 'all',
            onSearchQueryChange: jest.fn(),
            onFilterChange: jest.fn(),
            onRefreshModels: jest.fn(),
            onSelectModel: jest.fn(),
            ...extraProps,
        }
        render(<OpenRouterSettingsModalView {...props} />)
        return props
    }

    it('renders and wires search/filter/refresh controls', () => {
        const props = setup()
        const dialog = screen.getByRole('dialog')
        const searchBoxes = within(dialog).getAllByRole('textbox') as HTMLInputElement[]
        const search = searchBoxes.find((el) => el.placeholder === 'Search models...') as HTMLInputElement
        expect(search).toBeTruthy()
        fireEvent.change(search, {target: {value: 'gpt'}})
        expect(props.onSearchQueryChange).toHaveBeenCalledWith('gpt')

        const freeBtn = screen.getByRole('button', {name: 'Free'})
        fireEvent.click(freeBtn)
        expect(props.onFilterChange).toHaveBeenCalledWith('free')

        const refresh = within(dialog).getByRole('button', {name: /refresh/i})
        fireEvent.click(refresh)
        expect(props.onRefreshModels).toHaveBeenCalled()

        // Displays model count
        expect(within(dialog).getByText(/2 models/)).toBeInTheDocument()
    })

    it('honors save form disabling and triggers callbacks', () => {
        // Invalid state -> disabled
        setup({apiKeyInput: '', keyName: '', passphrase: '', confirmPassphrase: ''})
        const saveBtn = screen.getByRole('button', {name: 'Encrypt & Save Locally'})
        expect(saveBtn).toBeDisabled()

        // Valid state -> enabled
        const props = setup({
            apiKeyInput: 'sk-or-v1-abc',
            keyName: 'Work',
            passphrase: 'pass',
            confirmPassphrase: 'pass',
        })
        const saveBtn2 = screen.getByRole('button', {name: 'Encrypt & Save Locally'})
        expect(saveBtn2).not.toBeDisabled()
        fireEvent.click(saveBtn2)
        expect(props.onSaveEncrypted).toHaveBeenCalled()

        const useWithout = screen.getByRole('button', {name: 'Use Without Saving'})
        fireEvent.click(useWithout)
        expect(props.onUseWithoutSaving).toHaveBeenCalled()
    })

    it('wires load form interactions', () => {
        const props = setup({loadKeyName: 'Work', loadPassphrase: 'secret'})
        const dialog = screen.getByRole('dialog')
        const selectEl = within(dialog).getByRole('combobox', {name: /saved key/i})
        fireEvent.change(selectEl, {target: {value: 'Personal'}})
        expect(props.onLoadKeyNameChange).toHaveBeenCalledWith('Personal')

        const passEl = within(dialog).getByLabelText(/Enter Passphrase/i)
        fireEvent.change(passEl, {target: {value: 'newsecret'}})
        expect(props.onLoadPassphraseChange).toHaveBeenCalledWith('newsecret')

        const delBtn = within(dialog).getByRole('button', {name: 'Delete saved key'})
        fireEvent.click(delBtn)
        expect(props.onDeleteNamedKey).toHaveBeenCalledWith('Work')

        const submitBtn = within(dialog).getByRole('button', {name: 'Load & Connect'})
        fireEvent.click(submitBtn)
        expect(props.onLoadEncrypted).toHaveBeenCalled()
    })

    it('shows connected banner with selected label', () => {
        setup({isConnected: true, selectedModelId: 'openai/gpt-4'})
        expect(screen.getByText(/Connected\. Models loaded:/)).toBeInTheDocument()
        expect(screen.getByText(/Selected: GPT-4/)).toBeInTheDocument()
    })
})
