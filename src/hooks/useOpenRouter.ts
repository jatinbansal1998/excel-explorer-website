'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { PassphraseModal } from '../components/openrouter/PassphraseModal'
import {
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterCredits,
  OpenRouterModel,
} from '../types/openrouter'
import { OpenRouterService } from '../services/openrouter'
import { LocalStorageManager } from '../utils/localStorage'
import { decryptString, encryptString } from '../utils/crypto'

export interface OpenRouterState {
  isConnected: boolean
  models: OpenRouterModel[]
  filteredModels: OpenRouterModel[]
  credits: OpenRouterCredits | null
  searchQuery: string
  filter: 'all' | 'free' | 'paid'
  error: string | null
  selectedModelId?: string
}

export interface OpenRouterContextValue {
  state: OpenRouterState
  setSearchQuery: (q: string) => void
  setFilter: (f: 'all' | 'free' | 'paid') => void
  connectWithPlainKey: (key: string) => Promise<boolean>
  saveEncryptedKey: (key: string, passphrase: string) => Promise<void>
  loadEncryptedKey: (passphrase: string) => Promise<string | null>
  disconnect: () => void
  refreshModels: () => Promise<void>
  selectModel: (modelId: string) => void
  sendChat: (request: OpenRouterChatRequest) => Promise<OpenRouterChatResponse>
}

const OpenRouterContext = createContext<OpenRouterContextValue | null>(null)

function isModelFree(model: OpenRouterModel): boolean {
  const idFree = model.id.endsWith(':free')
  const p = model.pricing
  const pricedFree = !!p && Number(p.prompt) === 0 && Number(p.completion) === 0
  return idFree || pricedFree
}

export function OpenRouterProvider({ children }: { children: React.ReactNode }) {
  const serviceRef = useRef(new OpenRouterService())
  const [apiKey, setApiKey] = useState<string | null>(null)
  const passphraseRef = useRef<string | null>(null)
  const [passphraseModalOpen, setPassphraseModalOpen] = useState(false)
  const [passphraseError, setPassphraseError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState<OpenRouterState>({
    isConnected: false,
    models: [],
    filteredModels: [],
    credits: null,
    searchQuery: '',
    filter: 'all',
    error: null,
    selectedModelId: LocalStorageManager.getOpenRouterSettings()?.selectedModelId,
  })
  const hasAttemptedAutoLoadRef = useRef<boolean>(false)

  const applyFilter = useCallback(
    (
      models: OpenRouterModel[],
      search: string,
      filter: 'all' | 'free' | 'paid',
    ): OpenRouterModel[] => {
      const q = search.trim().toLowerCase()
      const bySearch =
        q.length === 0
          ? models
          : models.filter((m) => {
              const name = (m.name ?? '').toLowerCase()
              const id = m.id.toLowerCase()
              const desc = (m.description ?? '').toLowerCase()
              return id.includes(q) || name.includes(q) || desc.includes(q)
            })
      if (filter === 'all') return bySearch
      if (filter === 'free') return bySearch.filter(isModelFree)
      return bySearch.filter((m) => !isModelFree(m))
    },
    [],
  )

  const setSearchQuery = useCallback(
    (q: string) => {
      setState((prev) => ({
        ...prev,
        searchQuery: q,
        filteredModels: applyFilter(prev.models, q, prev.filter),
      }))
    },
    [applyFilter],
  )

  const setFilter = useCallback(
    (f: 'all' | 'free' | 'paid') => {
      setState((prev) => ({
        ...prev,
        filter: f,
        filteredModels: applyFilter(prev.models, prev.searchQuery, f),
      }))
    },
    [applyFilter],
  )

  const connectWithPlainKey = useCallback(
    async (key: string) => {
      try {
        setApiKey(key)
        const models = await serviceRef.current.listModels(key)
        setState((prev) => ({
          ...prev,
          isConnected: true,
          models,
          filteredModels: applyFilter(models, prev.searchQuery, prev.filter),
          error: null,
        }))
        const settings = LocalStorageManager.getOpenRouterSettings() || {}
        LocalStorageManager.saveOpenRouterSettings({
          ...settings,
          lastConnectedAt: new Date().toISOString(),
        })
        return true
      } catch (e: any) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: `Connection failed: ${e?.message ?? 'Unknown error'}`,
        }))
        return false
      }
    },
    [applyFilter],
  )

  const saveEncryptedKey = useCallback(async (key: string, passphrase: string) => {
    const payload = await encryptString(key, passphrase)
    LocalStorageManager.saveOpenRouterEncryptedKey(payload)
    passphraseRef.current = passphrase
    setApiKey(key)
  }, [])

  const loadEncryptedKey = useCallback(async (passphrase: string): Promise<string | null> => {
    const payload = LocalStorageManager.getOpenRouterEncryptedKey()
    if (!payload) return null
    try {
      const key = await decryptString(payload, passphrase)
      passphraseRef.current = passphrase
      setApiKey(key)
      return key
    } catch (e) {
      setState((prev) => ({ ...prev, error: 'Failed to decrypt API key' }))
      return null
    }
  }, [])

  const disconnect = useCallback(() => {
    setApiKey(null)
    passphraseRef.current = null
    setState((prev) => ({ ...prev, isConnected: false, credits: null }))
  }, [])

  const refreshModels = useCallback(async () => {
    try {
      const models = await serviceRef.current.listModels(apiKey || undefined)
      setState((prev) => ({
        ...prev,
        models,
        filteredModels: applyFilter(models, prev.searchQuery, prev.filter),
        error: null,
      }))
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        error: `Failed to load models: ${e?.message ?? 'Unknown error'}`,
      }))
    }
  }, [apiKey, applyFilter])

  const selectModel = useCallback((modelId: string) => {
    setState((prev) => ({ ...prev, selectedModelId: modelId }))
    const settings = LocalStorageManager.getOpenRouterSettings() || {}
    LocalStorageManager.saveOpenRouterSettings({ ...settings, selectedModelId: modelId })
  }, [])

  const sendChat = useCallback(
    async (request: OpenRouterChatRequest): Promise<OpenRouterChatResponse> => {
      if (!apiKey) throw new Error('Not connected')
      return serviceRef.current.chat(apiKey, request)
    },
    [apiKey],
  )

  const value: OpenRouterContextValue = {
    state,
    setSearchQuery,
    setFilter,
    connectWithPlainKey,
    saveEncryptedKey,
    loadEncryptedKey,
    disconnect,
    refreshModels,
    selectModel,
    sendChat,
  }

  // On first mount in browser: if an encrypted API key exists but we're not connected,
  // prompt the user for a passphrase to decrypt and connect automatically.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (hasAttemptedAutoLoadRef.current) return
    hasAttemptedAutoLoadRef.current = true
    if (apiKey || state.isConnected) return

    const enc = LocalStorageManager.getOpenRouterEncryptedKey()
    if (!enc) return

    setPassphraseModalOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmitPassphrase = useCallback(
    async (p: string) => {
      setBusy(true)
      setPassphraseError(null)
      try {
        const key = await loadEncryptedKey(p)
        if (!key) {
          setPassphraseError('Failed to decrypt API key')
          return
        }
        const ok = await connectWithPlainKey(key)
        if (!ok) {
          setPassphraseError('Failed to connect with decrypted key')
          return
        }
        await refreshModels()
        setPassphraseModalOpen(false)
      } finally {
        setBusy(false)
      }
    },
    [connectWithPlainKey, loadEncryptedKey, refreshModels],
  )

  return React.createElement(
    OpenRouterContext.Provider,
    { value },
    React.createElement(
      React.Fragment,
      null,
      children as any,
      passphraseModalOpen
        ? React.createElement(PassphraseModal, {
            isOpen: passphraseModalOpen,
            onSubmit: handleSubmitPassphrase,
            onClose: () => setPassphraseModalOpen(false),
            error: passphraseError,
            busy,
          })
        : null,
    ),
  )
}

export function useOpenRouter(): OpenRouterContextValue {
  const ctx = useContext(OpenRouterContext)
  if (!ctx) {
    throw new Error('useOpenRouter must be used within OpenRouterProvider')
  }
  return ctx
}

export type { OpenRouterContextValue as UseOpenRouterReturn }
