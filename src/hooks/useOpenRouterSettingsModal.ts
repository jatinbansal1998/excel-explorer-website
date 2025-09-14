'use client'

import {useCallback, useEffect, useState} from 'react'
import {useOpenRouter} from '@/hooks/useOpenRouter'

type Filter = 'all' | 'free' | 'paid'

export function useOpenRouterSettingsModal(isOpen: boolean) {
    const {
        state,
        setSearchQuery,
        setFilter,
        connectWithPlainKey,
        saveEncryptedKeyNamed,
        loadEncryptedKeyByName,
        refreshNamedKeyNames,
        deleteNamedKey,
        refreshModels,
        selectModel,
    } = useOpenRouter()

    const [apiKeyInput, setApiKeyInput] = useState('')
    const [passphrase, setPassphrase] = useState('')
    const [confirmPassphrase, setConfirmPassphrase] = useState('')
    const [keyName, setKeyName] = useState('')
    const [loadPassphrase, setLoadPassphrase] = useState('')
    const [loadKeyName, setLoadKeyName] = useState('')
    const [busy, setBusy] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [showPassphrase, setShowPassphrase] = useState(false)
    const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false)
    const [showLoadPassphrase, setShowLoadPassphrase] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setApiKeyInput('')
        setPassphrase('')
        setConfirmPassphrase('')
        setLoadPassphrase('')
        setKeyName('')
        setLoadKeyName(state.lastUsedKeyName || '')
        refreshNamedKeyNames()
    }, [isOpen, state.lastUsedKeyName, refreshNamedKeyNames])

    const handleRefreshModels = useCallback(async () => {
        setBusy(true)
        try {
            await refreshModels()
        } finally {
            setBusy(false)
        }
    }, [refreshModels])

    const handleSaveEncrypted = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (!apiKeyInput || !passphrase || passphrase !== confirmPassphrase) return
            setBusy(true)
            try {
                const name = keyName.trim()
                await saveEncryptedKeyNamed(apiKeyInput, passphrase, name)
                const ok = await connectWithPlainKey(apiKeyInput)
                if (ok) {
                    await refreshModels()
                }
            } finally {
                setBusy(false)
            }
        },
        [apiKeyInput, passphrase, confirmPassphrase, keyName, saveEncryptedKeyNamed, connectWithPlainKey, refreshModels],
    )

    const handleLoadEncrypted = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (!loadPassphrase) return
            setBusy(true)
            try {
                let key: string | null = null
                if (loadKeyName.trim()) {
                    key = await loadEncryptedKeyByName(loadKeyName, loadPassphrase)
                }
                if (key) {
                    await connectWithPlainKey(key)
                }
            } finally {
                setBusy(false)
            }
        },
        [loadPassphrase, loadKeyName, loadEncryptedKeyByName, connectWithPlainKey],
    )

    const handleUseWithoutSaving = useCallback(async () => {
        if (!apiKeyInput) return
        setBusy(true)
        try {
            await connectWithPlainKey(apiKeyInput)
        } finally {
            setBusy(false)
        }
    }, [apiKeyInput, connectWithPlainKey])

    const handleDeleteNamedKey = useCallback(
        (name: string) => {
            deleteNamedKey(name)
            setLoadKeyName('')
            setLoadPassphrase('')
        },
        [deleteNamedKey],
    )

    return {
        // state from context
        state,
        // expose convenient fields
        busy,
        error: state.error,
        searchQuery: state.searchQuery,
        filter: state.filter as Filter,
        isConnected: state.isConnected,
        models: state.models,
        filteredModels: state.filteredModels,
        selectedModelId: state.selectedModelId,
        namedKeyNames: state.namedKeyNames || [],

        // inputs
        apiKeyInput,
        setApiKeyInput,
        keyName,
        setKeyName,
        passphrase,
        setPassphrase,
        confirmPassphrase,
        setConfirmPassphrase,
        loadPassphrase,
        setLoadPassphrase,
        loadKeyName,
        setLoadKeyName,

        // toggles
        showApiKey,
        setShowApiKey,
        showPassphrase,
        setShowPassphrase,
        showConfirmPassphrase,
        setShowConfirmPassphrase,
        showLoadPassphrase,
        setShowLoadPassphrase,

        // actions
        setSearchQuery,
        setFilter: (f: Filter) => setFilter(f),
        selectModel,
        onRefreshModels: handleRefreshModels,
        onSaveEncrypted: handleSaveEncrypted,
        onLoadEncrypted: handleLoadEncrypted,
        onUseWithoutSaving: handleUseWithoutSaving,
        onDeleteNamedKey: handleDeleteNamedKey,
    }
}

export type UseOpenRouterSettingsModalReturn = ReturnType<typeof useOpenRouterSettingsModal>

