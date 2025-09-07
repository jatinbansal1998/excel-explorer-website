import React, { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ModelList } from './ModelList'
import { useOpenRouter } from '@/hooks/useOpenRouter'
import { EyeIcon, EyeSlashIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'

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

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey)
  }

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
    if (!apiKeyInput || !passphrase || passphrase !== confirmPassphrase) return
    setBusy(true)
    try {
      const name = keyName.trim()
      await saveEncryptedKeyNamed(apiKeyInput, passphrase, name)
      // After save, connect and refresh models
      const ok = await connectWithPlainKey(apiKeyInput)
      if (ok) {
        await refreshModels()
      }
    } finally {
      setBusy(false)
    }
  }

  const handleLoadEncrypted = async (e: React.FormEvent) => {
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
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="OpenRouter Settings" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <form
                onSubmit={handleSaveEncrypted}
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
                <label className="block">
                  <span className="text-sm text-gray-700">Key Name</span>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
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
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                      placeholder="Create passphrase for encryption"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassphrase ? (
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
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
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
                    onClick={async () => {
                      if (!apiKeyInput) return
                      setBusy(true)
                      try {
                        await connectWithPlainKey(apiKeyInput)
                      } finally {
                        setBusy(false)
                      }
                    }}
                    disabled={!apiKeyInput || busy}
                  >
                    Use Without Saving
                  </Button>
                </div>
              </form>

              <form
                onSubmit={handleLoadEncrypted}
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
                      onChange={(e) => setLoadKeyName(e.target.value)}
                    >
                      <option value="" disabled>
                        Select a saved key…
                      </option>
                      {(state.namedKeyNames || []).map((n) => (
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
                      onClick={() => {
                        deleteNamedKey(loadKeyName)
                        setLoadKeyName('')
                        setLoadPassphrase('')
                      }}
                      disabled={busy || !loadKeyName}
                    >
                      <TrashIcon className="h-4 w-4" />
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
                value={state.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
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
            <div className="flex items-center justify-end gap-2 ml-auto">
              <div className="text-sm text-gray-600 hidden md:block">
                {state.filteredModels.length} models
              </div>
              <Button
                type="button"
                onClick={handleRefreshModels}
                disabled={busy}
                size="sm"
                aria-label="Refresh models"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" /> Refresh
              </Button>
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
