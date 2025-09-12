'use client'

import React from 'react'
import {Modal} from '@/components/ui/Modal'
import {Button} from '@/components/ui/Button'
import {ModelList} from '@/components/presentational/openrouter'
import {ArrowPathIcon, EyeIcon, EyeSlashIcon, TrashIcon} from '@heroicons/react/24/outline'
import {OpenRouterModel} from '@/types/openrouter'

type Filter = 'all' | 'free' | 'paid'

interface Props {
    isOpen: boolean
    onClose: () => void

    // Top-level state from container
    busy: boolean
    error?: string | null

    // Save form state
    apiKeyInput: string
    keyName: string
    passphrase: string
    confirmPassphrase: string
    showApiKey: boolean
    showPassphrase: boolean
    showConfirmPassphrase: boolean
    onApiKeyInputChange: (v: string) => void
    onKeyNameChange: (v: string) => void
    onPassphraseChange: (v: string) => void
    onConfirmPassphraseChange: (v: string) => void
    onToggleApiKeyVisibility: () => void
    onTogglePassphraseVisibility: () => void
    onToggleConfirmPassphraseVisibility: () => void
    onSaveEncrypted: (e: React.FormEvent) => void
    onUseWithoutSaving: () => Promise<void> | void

    // Load form state
    namedKeyNames: string[]
    loadKeyName: string
    loadPassphrase: string
    showLoadPassphrase: boolean
    onLoadKeyNameChange: (v: string) => void
    onLoadPassphraseChange: (v: string) => void
    onToggleLoadPassphraseVisibility: () => void
    onDeleteNamedKey: (name: string) => void
    onLoadEncrypted: (e: React.FormEvent) => void

    // Connection/model state
    isConnected: boolean
    models: OpenRouterModel[]
    filteredModels: OpenRouterModel[]
    selectedModelId?: string
    searchQuery: string
    filter: Filter
    onSearchQueryChange: (v: string) => void
    onFilterChange: (f: Filter) => void
    onRefreshModels: () => Promise<void> | void
    onSelectModel: (id: string) => void
}

export default function OpenRouterSettingsModalView(props: Readonly<Props>) {
    const {
        isOpen,
        onClose,
        busy,
        error,
        apiKeyInput,
        keyName,
        passphrase,
        confirmPassphrase,
        showApiKey,
        showPassphrase,
        showConfirmPassphrase,
        onApiKeyInputChange,
        onKeyNameChange,
        onPassphraseChange,
        onConfirmPassphraseChange,
        onToggleApiKeyVisibility,
        onTogglePassphraseVisibility,
        onToggleConfirmPassphraseVisibility,
        onSaveEncrypted,
        onUseWithoutSaving,
        namedKeyNames,
        loadKeyName,
        loadPassphrase,
        showLoadPassphrase,
        onLoadKeyNameChange,
        onLoadPassphraseChange,
        onToggleLoadPassphraseVisibility,
        onDeleteNamedKey,
        onLoadEncrypted,
        isConnected,
        models,
        filteredModels,
        selectedModelId,
        searchQuery,
        filter,
        onSearchQueryChange,
        onFilterChange,
        onRefreshModels,
        onSelectModel,
    } = props

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="OpenRouter Settings" size="xl">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <form
                                onSubmit={onSaveEncrypted}
                                className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50 md:col-span-2"
                                name="save-encrypted-key"
                            >
                                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                    Enter API Key & Save
                                </h4>
                                <p className="text-xs text-gray-600">
                                    Your API key stays on your device and is never uploaded. If you choose Save, it
                                    will be encrypted with your passphrase and stored locally in your browser.
                                </p>
                                <label className="block">
                                    <span className="text-sm text-gray-700">OpenRouter API Key</span>
                                    <div className="relative">
                                        <input
                                            type={showApiKey ? 'text' : 'password'}
                                            name="api-key-save"
                                            value={apiKeyInput}
                                            onChange={(e) => onApiKeyInputChange(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                                            placeholder="sk-or-v1-..."
                                            autoComplete="off"
                                        />
                                        <button
                                            type="button"
                                            onClick={onToggleApiKeyVisibility}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showApiKey ? (
                                                <EyeSlashIcon className="h-4 w-4"/>
                                            ) : (
                                                <EyeIcon className="h-4 w-4"/>
                                            )}
                                        </button>
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-sm text-gray-700">Key Name</span>
                                    <input
                                        type="text"
                                        value={keyName}
                                        onChange={(e) => onKeyNameChange(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                        placeholder="e.g., Work, Personal, Org Sandbox"
                                    />
                                    <div className="mt-1 text-[11px] text-gray-500">
                                        Saving with an existing name will overwrite it.
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-sm text-gray-700">Passphrase</span>
                                    <div className="relative">
                                        <input
                                            type={showPassphrase ? 'text' : 'password'}
                                            name="new-passphrase"
                                            value={passphrase}
                                            onChange={(e) => onPassphraseChange(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                                            placeholder="Create passphrase for encryption"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={onTogglePassphraseVisibility}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassphrase ? (
                                                <EyeSlashIcon className="h-4 w-4"/>
                                            ) : (
                                                <EyeIcon className="h-4 w-4"/>
                                            )}
                                        </button>
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-sm text-gray-700">Confirm Passphrase</span>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassphrase ? 'text' : 'password'}
                                            name="confirm-passphrase"
                                            value={confirmPassphrase}
                                            onChange={(e) => onConfirmPassphraseChange(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                                            placeholder="Confirm your passphrase"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={onToggleConfirmPassphraseVisibility}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassphrase ? (
                                                <EyeSlashIcon className="h-4 w-4"/>
                                            ) : (
                                                <EyeIcon className="h-4 w-4"/>
                                            )}
                                        </button>
                                    </div>
                                </label>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        disabled={
                                            !apiKeyInput ||
                                            !keyName.trim() ||
                                            !passphrase ||
                                            passphrase !== confirmPassphrase ||
                                            busy
                                        }
                                    >
                                        Encrypt & Save Locally
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => onUseWithoutSaving()}
                                        disabled={!apiKeyInput || busy}
                                    >
                                        Use Without Saving
                                    </Button>
                                </div>
                            </form>

                            <form
                                onSubmit={onLoadEncrypted}
                                className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50"
                                name="load-encrypted-key"
                            >
                                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Load Encrypted Key
                                </h4>
                                <p className="text-xs text-gray-600">
                                    Decrypt and connect using a previously saved encrypted key
                                </p>
                                <div className="block">
                                    <label htmlFor="saved-key-select" className="text-sm text-gray-700">
                                        Saved Key
                                    </label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <select
                                            id="saved-key-select"
                                            className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                            value={loadKeyName}
                                            onChange={(e) => onLoadKeyNameChange(e.target.value)}
                                        >
                                            <option value="" disabled>
                                                Select a saved key…
                                            </option>
                                            {(namedKeyNames || []).map((n) => (
                                                <option key={n} value={n}>
                                                    {n}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label="Delete saved key"
                                            title="Delete saved key"
                                            onClick={() => onDeleteNamedKey(loadKeyName)}
                                            disabled={busy || !loadKeyName}
                                        >
                                            <TrashIcon className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                                <label className="block">
                                    <span className="text-sm text-gray-700">Enter Passphrase</span>
                                    <div className="relative">
                                        <input
                                            type={showLoadPassphrase ? 'text' : 'password'}
                                            name="decrypt-passphrase"
                                            value={loadPassphrase}
                                            onChange={(e) => onLoadPassphraseChange(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                                            placeholder="Enter passphrase to decrypt"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={onToggleLoadPassphraseVisibility}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showLoadPassphrase ? (
                                                <EyeSlashIcon className="h-4 w-4"/>
                                            ) : (
                                                <EyeIcon className="h-4 w-4"/>
                                            )}
                                        </button>
                                    </div>
                                </label>
                                <Button type="submit" variant="primary" disabled={!loadPassphrase || busy}>
                                    Load & Connect
                                </Button>
                            </form>
                        </div>

                        {error && <div className="text-sm text-red-600">{error}</div>}
                        {isConnected && (
                            <div className="text-sm text-green-700">
                                Connected. Models loaded: {models.length}
                                {selectedModelId &&
                                    (() => {
                                        const model = models.find((m) => m.id === selectedModelId)
                                        const label = model?.name || selectedModelId
                                        return (
                                            <span
                                                className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                        Selected: {label}
                      </span>
                                        )
                                    })()}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3"></div>
                </div>

                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                        Model Picker
                    </h4>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchQueryChange(e.target.value)}
                                placeholder="Search models..."
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'free', 'paid'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => onFilterChange(f)}
                                    className={`px-2 py-1 rounded-full text-xs border ${filter === f ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                                >
                                    {f[0].toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-2 ml-auto">
                            <div className="text-sm text-gray-600 hidden md:block">
                                {filteredModels.length} models
                            </div>
                            <Button
                                type="button"
                                onClick={onRefreshModels}
                                disabled={busy}
                                size="sm"
                                aria-label="Refresh models"
                            >
                                <ArrowPathIcon className="h-4 w-4 mr-1"/> Refresh
                            </Button>
                        </div>
                    </div>
                </div>
                <ModelList
                    models={filteredModels}
                    selectedModelId={selectedModelId}
                    onSelect={onSelectModel}
                />

                <div className="flex justify-end">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    )
}
