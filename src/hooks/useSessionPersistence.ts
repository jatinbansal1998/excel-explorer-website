'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LocalStorageAdapter } from '../utils/storage/localAdapter'
import { IndexedDbAdapter } from '../utils/storage/indexedDbAdapter'
import { StorageService, type PersistedSession } from '../utils/storage/service'
import { PERSISTENCE_FEATURE_FLAG_KEY } from '../utils/storage/adapter'
import type { ExcelData } from '../types/excel'
import type { FilterState } from '../types/filter'
import type { ChartConfig } from '../types/chart'

interface UseSessionRestoreBanner {
  showRestoreBanner: boolean
  lastSessionSummary: PersistedSession['summary'] | null
  restoreLastSession: () => Promise<void>
  dismissRestoreBanner: () => void
}

export interface UseSessionPersistence extends UseSessionRestoreBanner {
  sessions: PersistedSession[]
  refreshSessions: () => Promise<void>
  restoreSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
}

export function useSessionPersistence(options?: { enabled?: boolean; appVersion?: string }) {
  const enabled =
    options?.enabled ??
    (typeof window !== 'undefined'
      ? localStorage.getItem(PERSISTENCE_FEATURE_FLAG_KEY) !== 'false'
      : true)
  const [service, setService] = useState<StorageService | null>(null)
  // Lazily create service on client after mount to avoid SSR indexedDB usage
  useEffect(() => {
    if (typeof window === 'undefined') return
    setService(
      new StorageService(new LocalStorageAdapter(), new IndexedDbAdapter(), {
        appVersion: options?.appVersion,
      }),
    )
  }, [options?.appVersion])

  const [showRestoreBanner, setShowRestoreBanner] = useState(false)
  const [lastSessionSummary, setLastSessionSummary] = useState<PersistedSession['summary'] | null>(
    null,
  )
  const [sessions, setSessions] = useState<PersistedSession[]>([])

  const onLoadDatasetRef = useRef<((d: ExcelData) => void) | null>(null)
  const onLoadFiltersRef = useRef<((f: FilterState) => void) | null>(null)
  const onLoadChartsRef = useRef<((c: ChartConfig[]) => void) | null>(null)

  useEffect(() => {
    if (!enabled || !service) return
    ;(async () => {
      const active = await service.getActiveSession()
      if (active) {
        setLastSessionSummary(active.summary)
        setShowRestoreBanner(true)
      }
      const list = await service.listSessions()
      setSessions(list)
    })()
  }, [service, enabled])

  const refreshSessions = useCallback(async () => {
    if (!service) return
    const list = await service.listSessions()
    setSessions(list)
  }, [service])

  const restoreSession = useCallback(
    async (sessionId: string) => {
      if (!service) return
      const data = await service.loadDataset(sessionId)
      const filters = await service.loadFilters(sessionId)
      const charts = await service.loadCharts(sessionId)
      if (data && onLoadDatasetRef.current) onLoadDatasetRef.current(data)
      if (filters && onLoadFiltersRef.current) onLoadFiltersRef.current(filters)
      if (charts && onLoadChartsRef.current) onLoadChartsRef.current(charts)
      setShowRestoreBanner(false)
      await service.setActiveSession(sessionId)
    },
    [service],
  )

  const restoreLastSession = useCallback(async () => {
    if (!service) return
    const active = await service.getActiveSession()
    if (active) {
      await restoreSession(active.id)
    } else {
      setShowRestoreBanner(false)
    }
  }, [service, restoreSession])

  const dismissRestoreBanner = useCallback(() => setShowRestoreBanner(false), [])

  return {
    showRestoreBanner,
    lastSessionSummary,
    restoreLastSession,
    dismissRestoreBanner,
    sessions,
    refreshSessions,
    restoreSession,
    deleteSession: async (id: string) => {
      if (service) {
        await service.deleteSession(id)
        await refreshSessions()
      }
    },
    clearAll: async () => {
      if (service) {
        const list = await service.listSessions()
        for (const s of list) {
          await service.deleteSession(s.id)
        }
        await refreshSessions()
      }
    },
    // registration callbacks used by hooks to receive loaded state
    registerOnLoadDataset: (cb: (d: ExcelData) => void) => (onLoadDatasetRef.current = cb),
    registerOnLoadFilters: (cb: (f: FilterState) => void) => (onLoadFiltersRef.current = cb),
    registerOnLoadCharts: (cb: (c: ChartConfig[]) => void) => (onLoadChartsRef.current = cb),
    service,
    getActiveSessionId: async () =>
      service ? (await service.getActiveSession())?.id || null : null,
    setFeatureEnabled: (flag: boolean) => {
      localStorage.setItem(PERSISTENCE_FEATURE_FLAG_KEY, flag ? 'true' : 'false')
    },
  }
}

export type UseSessionPersistenceReturn = ReturnType<typeof useSessionPersistence>
