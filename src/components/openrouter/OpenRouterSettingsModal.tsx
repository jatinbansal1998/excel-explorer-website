import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ModelList } from './ModelList'
import { useOpenRouter } from '../../hooks/useOpenRouter'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function OpenRouterSettingsModal({ isOpen, onClose }: Props) {
  const {
    state,
    setSearchQuery,
    setFilter,
    connectWithPlainKey,
    saveEncryptedKey,
    loadEncryptedKey,
    refreshModels,
    selectModel,
  } = useOpenRouter()

  const [apiKeyInput, setApiKeyInput] = useState('')
  const [savePassphrase, setSavePassphrase] = useState('')
  const [saveConfirmPassphrase, setSaveConfirmPassphrase] = useState('')
  const [loadPassphrase, setLoadPassphrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSavePassphrase, setShowSavePassphrase] = useState(false)
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false)
  const [showLoadPassphrase, setShowLoadPassphrase] = useState(false)

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey)
  }

  useEffect(() => {
    if (!isOpen) return
    setApiKeyInput('')
    setSavePassphrase('')
    setSaveConfirmPassphrase('')
    setLoadPassphrase('')
  }, [isOpen])

  const handleRefreshModels = async () => {
    setBusy(true)
    try {
      await refreshModels()
    } finally {
      setBusy(false)
    }
  }

  const handleSaveEncrypted = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKeyInput || !savePassphrase || savePassphrase !== saveConfirmPassphrase) return
    setBusy(true)
    try {
      await saveEncryptedKey(apiKeyInput, savePassphrase)
    } finally {
      setBusy(false)
    }
  }

  const handleLoadEncrypted = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loadPassphrase) return
    setBusy(true)
    try {
      const key = await loadEncryptedKey(loadPassphrase)
      if (key) {
        await connectWithPlainKey(key)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="OpenRouter Settings" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-6">
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <label className="block">
                <span className="text-sm text-gray-700">OpenRouter API Key</span>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    name="api-key"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                    placeholder="sk-or-v1-..."
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={toggleApiKeyVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>
              <Button type="button" onClick={handleRefreshModels} disabled={busy}>
                Refresh Models
              </Button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form
                onSubmit={handleSaveEncrypted}
                className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
                name="save-encrypted-key"
              >
                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Save Encrypted Key
                </h4>
                <p className="text-xs text-gray-600">
                  Encrypt and store your API key locally with a passphrase
                </p>
                <label className="block">
                  <span className="text-sm text-gray-700">Create Passphrase</span>
                  <div className="relative">
                    <input
                      type={showSavePassphrase ? 'text' : 'password'}
                      name="new-passphrase"
                      value={savePassphrase}
                      onChange={(e) => setSavePassphrase(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                      placeholder="Create passphrase for encryption"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSavePassphrase(!showSavePassphrase)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showSavePassphrase ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
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
                      value={saveConfirmPassphrase}
                      onChange={(e) => setSaveConfirmPassphrase(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                      placeholder="Confirm your passphrase"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassphrase ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={
                    !apiKeyInput ||
                    !savePassphrase ||
                    savePassphrase !== saveConfirmPassphrase ||
                    busy
                  }
                >
                  Save Encrypted Key
                </Button>
              </form>

              <form
                onSubmit={handleLoadEncrypted}
                className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
                name="load-encrypted-key"
              >
                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Load Encrypted Key
                </h4>
                <p className="text-xs text-gray-600">
                  Decrypt and connect using a previously saved encrypted key
                </p>
                <label className="block">
                  <span className="text-sm text-gray-700">Enter Passphrase</span>
                  <div className="relative">
                    <input
                      type={showLoadPassphrase ? 'text' : 'password'}
                      name="decrypt-passphrase"
                      value={loadPassphrase}
                      onChange={(e) => setLoadPassphrase(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                      placeholder="Enter passphrase to decrypt"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoadPassphrase(!showLoadPassphrase)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showLoadPassphrase ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>
                <Button type="submit" variant="secondary" disabled={!loadPassphrase || busy}>
                  Load & Connect
                </Button>
              </form>
            </div>

            {state.error && <div className="text-sm text-red-600">{state.error}</div>}
            {state.isConnected && (
              <div className="text-sm text-green-700">
                Connected. Models loaded: {state.models.length}
                {state.selectedModelId &&
                  (() => {
                    const model = state.models.find((m) => m.id === state.selectedModelId)
                    const label = model?.name || state.selectedModelId
                    return (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                        Selected: {label}
                      </span>
                    )
                  })()}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-700">Search</span>
              <input
                type="text"
                value={state.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </label>
            <div className="flex gap-2">
              {(['all', 'free', 'paid'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 rounded-full text-xs border ${state.filter === f ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ModelList
          models={state.filteredModels}
          selectedModelId={state.selectedModelId}
          onSelect={selectModel}
        />

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
