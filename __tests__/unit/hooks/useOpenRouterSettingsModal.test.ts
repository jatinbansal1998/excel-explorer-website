import {act, renderHook} from '@testing-library/react'
import {useOpenRouterSettingsModal} from '@/hooks/useOpenRouterSettingsModal'

jest.mock('@/hooks/useOpenRouter', () => {
    const state = {
        isConnected: false,
        models: [],
        filteredModels: [],
        credits: null,
        searchQuery: '',
        filter: 'all' as const,
        error: null,
        selectedModelId: undefined,
        namedKeyNames: ['Work'],
        lastUsedKeyName: 'Work',
    }

    const fns = {
        setSearchQuery: jest.fn(),
        setFilter: jest.fn(),
        connectWithPlainKey: jest.fn().mockResolvedValue(true),
        saveEncryptedKeyNamed: jest.fn().mockResolvedValue(undefined),
        loadEncryptedKeyByName: jest.fn().mockResolvedValue('DECRYPTED'),
        refreshNamedKeyNames: jest.fn(),
        deleteNamedKey: jest.fn(),
        disconnect: jest.fn(),
        refreshModels: jest.fn().mockResolvedValue(undefined),
        selectModel: jest.fn(),
        sendChat: jest.fn(),
    }

    return {
        useOpenRouter: () => ({state, ...fns}),
    }
})

describe('useOpenRouterSettingsModal', () => {
    it('initializes and resets fields on open, refreshes named keys', () => {
        const {result, rerender} = renderHook(({open}) => useOpenRouterSettingsModal(open), {
            initialProps: {open: false},
        })

        // Initially closed: no reset
        expect(result.current.loadKeyName).toBe('')

        // Open: fields reset and loadKeyName defaults to lastUsedKeyName
        rerender({open: true})
        expect(result.current.loadKeyName).toBe('Work')
    })

    it('handles saving encrypted, connecting and refreshing models', async () => {
        const {result} = renderHook(() => useOpenRouterSettingsModal(true))

        act(() => {
            result.current.setApiKeyInput('KEY')
            result.current.setPassphrase('p')
            result.current.setConfirmPassphrase('p')
            result.current.setKeyName('Work')
        })

        await act(async () => {
            await result.current.onSaveEncrypted({preventDefault: jest.fn()} as any)
        })

        const {useOpenRouter} = jest.requireMock('@/hooks/useOpenRouter') as any
        const ctx = useOpenRouter()
        expect(ctx.saveEncryptedKeyNamed).toHaveBeenCalledWith('KEY', 'p', 'Work')
        expect(ctx.connectWithPlainKey).toHaveBeenCalledWith('KEY')
        expect(ctx.refreshModels).toHaveBeenCalled()
    })

    it('handles loading encrypted and connecting', async () => {
        const {result} = renderHook(() => useOpenRouterSettingsModal(true))
        act(() => {
            result.current.setLoadKeyName('Work')
            result.current.setLoadPassphrase('pp')
        })

        await act(async () => {
            await result.current.onLoadEncrypted({preventDefault: jest.fn()} as any)
        })

        const {useOpenRouter} = jest.requireMock('@/hooks/useOpenRouter') as any
        const ctx = useOpenRouter()
        expect(ctx.loadEncryptedKeyByName).toHaveBeenCalledWith('Work', 'pp')
        expect(ctx.connectWithPlainKey).toHaveBeenCalledWith('DECRYPTED')
    })

    it('handles use without saving', async () => {
        const {result} = renderHook(() => useOpenRouterSettingsModal(true))
        act(() => result.current.setApiKeyInput('KEY'))

        await act(async () => {
            await result.current.onUseWithoutSaving()
        })

        const {useOpenRouter} = jest.requireMock('@/hooks/useOpenRouter') as any
        const ctx = useOpenRouter()
        expect(ctx.connectWithPlainKey).toHaveBeenCalledWith('KEY')
    })

    it('deletes named key and resets load fields', () => {
        const {result} = renderHook(() => useOpenRouterSettingsModal(true))
        act(() => {
            result.current.setLoadKeyName('Work')
            result.current.setLoadPassphrase('pp')
            result.current.onDeleteNamedKey('Work')
        })

        const {useOpenRouter} = jest.requireMock('@/hooks/useOpenRouter') as any
        const ctx = useOpenRouter()
        expect(ctx.deleteNamedKey).toHaveBeenCalledWith('Work')
        expect(result.current.loadKeyName).toBe('')
        expect(result.current.loadPassphrase).toBe('')
    })

    it('forwards search/filter/select to context', () => {
        const {result} = renderHook(() => useOpenRouterSettingsModal(true))
        act(() => {
            result.current.setSearchQuery('abc')
            result.current.setFilter('paid')
            result.current.selectModel('m1')
        })

        const {useOpenRouter} = jest.requireMock('@/hooks/useOpenRouter') as any
        const ctx = useOpenRouter()
        expect(ctx.setSearchQuery).toHaveBeenCalledWith('abc')
        expect(ctx.setFilter).toHaveBeenCalledWith('paid')
        expect(ctx.selectModel).toHaveBeenCalledWith('m1')
    })
})

