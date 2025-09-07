'use client'

'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
  namedKeyNames?: string[]
  lastUsedKeyName?: string
}

export interface OpenRouterContextValue {
  state: OpenRouterState
  setSearchQuery: (q: string) => void
  setFilter: (f: 'all' | 'free' | 'paid') => void
  connectWithPlainKey: (key: string) => Promise<boolean>
  saveEncryptedKeyNamed: (key: string, passphrase: string, name: string) => Promise<void>
  loadEncryptedKeyByName: (name: string, passphrase: string) => Promise<string | null>
  refreshNamedKeyNames: () => void
  deleteNamedKey: (name: string) => void
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
    namedKeyNames: LocalStorageManager.getOpenRouterNamedKeyNames(),
    lastUsedKeyName: LocalStorageManager.getOpenRouterSettings()?.lastUsedKeyName,
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
        let selectedId: string | undefined = undefined
        setState((prev) => {
          const prevSelected = prev.selectedModelId
          if (prevSelected && models.some((m) => m.id === prevSelected)) {
            selectedId = prevSelected
          } else {
            const free = models.find((m) => isModelFree(m))
            selectedId = free?.id || models[0]?.id
          }
          return {
            ...prev,
            isConnected: true,
            models,
            filteredModels: applyFilter(models, prev.searchQuery, prev.filter),
            selectedModelId: selectedId,
            error: null,
          }
        })
        const settings = LocalStorageManager.getOpenRouterSettings() || {}
        LocalStorageManager.saveOpenRouterSettings({
          ...settings,
          lastConnectedAt: new Date().toISOString(),
          selectedModelId: selectedId || settings.selectedModelId,
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

  // No unnamed key support; saving/loading requires a name

  const refreshNamedKeyNames = useCallback(() => {
    const names = LocalStorageManager.getOpenRouterNamedKeyNames()
    setState((prev) => ({ ...prev, namedKeyNames: names }))
  }, [])

  const saveEncryptedKeyNamed = useCallback(
    async (key: string, passphrase: string, name: string) => {
      const payload = await encryptString(key, passphrase)
      LocalStorageManager.saveOpenRouterNamedKey(name, payload)
      passphraseRef.current = passphrase
      setApiKey(key)
      refreshNamedKeyNames()
    },
    [refreshNamedKeyNames],
  )

  const loadEncryptedKeyByName = useCallback(
    async (name: string, passphrase: string): Promise<string | null> => {
      const payload = LocalStorageManager.getOpenRouterNamedKeyPayload(name)
      if (!payload) {
        setState((prev) => ({ ...prev, error: `Saved key not found: ${name}` }))
        return null
      }
      try {
        const key = await decryptString(payload, passphrase)
        passphraseRef.current = passphrase
        setApiKey(key)
        const settings = LocalStorageManager.getOpenRouterSettings() || {}
        LocalStorageManager.saveOpenRouterSettings({
          ...settings,
          lastUsedKeyName: name,
        })
        setState((prev) => ({ ...prev, lastUsedKeyName: name }))
        return key
      } catch (e) {
        setState((prev) => ({ ...prev, error: 'Failed to decrypt API key' }))
        return null
      }
    },
    [],
  )

  const deleteNamedKey = useCallback(
    (name: string) => {
      const trimmed = (name || '').trim()
      if (trimmed.length === 0) return
      LocalStorageManager.removeOpenRouterNamedKey(trimmed)
      refreshNamedKeyNames()
      const settings = LocalStorageManager.getOpenRouterSettings() || {}
      if (settings.lastUsedKeyName === trimmed) {
        LocalStorageManager.saveOpenRouterSettings({ ...settings, lastUsedKeyName: undefined })
      }
    },
    [refreshNamedKeyNames],
  )

  const disconnect = useCallback(() => {
    setApiKey(null)
    passphraseRef.current = null
    setState((prev) => ({ ...prev, isConnected: false, credits: null }))
  }, [])

  const refreshModels = useCallback(async () => {
    try {
      const models = await serviceRef.current.listModels(apiKey || undefined)
      let selectedId: string | undefined = undefined
      setState((prev) => {
        const prevSelected = prev.selectedModelId
        if (prevSelected && models.some((m) => m.id === prevSelected)) {
          selectedId = prevSelected
        } else {
          const free = models.find((m) => isModelFree(m))
          selectedId = free?.id || models[0]?.id
        }
        return {
          ...prev,
          models,
          filteredModels: applyFilter(models, prev.searchQuery, prev.filter),
          selectedModelId: selectedId,
          error: null,
        }
      })
      const settings = LocalStorageManager.getOpenRouterSettings() || {}
      LocalStorageManager.saveOpenRouterSettings({
        ...settings,
        selectedModelId: selectedId || settings.selectedModelId,
      })
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

  // Ensure named key list is refreshed on client mount (avoids SSR empty state)
  useEffect(() => {
    refreshNamedKeyNames()
  }, [refreshNamedKeyNames])

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
    saveEncryptedKeyNamed,
    loadEncryptedKeyByName,
    refreshNamedKeyNames,
    deleteNamedKey: (name: string) => deleteNamedKey(name),
    disconnect,
    refreshModels,
    selectModel,
    sendChat,
  }

  return React.createElement(OpenRouterContext.Provider, { value }, children as any)
}

export function useOpenRouter(): OpenRouterContextValue {
  const ctx = useContext(OpenRouterContext)
  if (!ctx) {
    throw new Error('useOpenRouter must be used within OpenRouterProvider')
  }
  return ctx
}

export type { OpenRouterContextValue as UseOpenRouterReturn }
