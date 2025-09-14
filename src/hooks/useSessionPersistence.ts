'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {LocalStorageAdapter} from '@/utils/storage/localAdapter'
import {IndexedDbAdapter} from '@/utils/storage/indexedDbAdapter'
import {type PersistedSession, StorageService} from '@/utils/storage/service'
import {PERSISTENCE_FEATURE_FLAG_KEY} from '@/utils/storage/adapter'
import type {ExcelData} from '@/types/excel'
import type {FilterState} from '@/types/filter'
import type {ChartConfig} from '@/types/chart'

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
  isRestoring: boolean
  restoreProgress: {
    stage:
      | 'validating'
      | 'loading-data'
      | 'loading-filters'
      | 'loading-charts'
      | 'applying'
      | 'complete'
    message: string
    progress: number
  } | null
  cancelRestore: () => void
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
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState<{
    stage:
      | 'validating'
      | 'loading-data'
      | 'loading-filters'
      | 'loading-charts'
      | 'applying'
      | 'complete'
    message: string
    progress: number
  } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
      if (!service || isRestoring) return

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        setIsRestoring(true)
        setRestoreProgress({ stage: 'validating', message: 'Validating session...', progress: 0 })

        // Check if session exists
        const session = await service.getSession(sessionId)
        if (!session) {
          throw new Error('Session not found')
        }

        // Load data with progress tracking
        setRestoreProgress({ stage: 'loading-data', message: 'Loading dataset...', progress: 20 })
        let data: ExcelData | null = null

        try {
          data = await service.loadDatasetProgressive(sessionId, (progress, stage) => {
            const overallProgress = 20 + progress * 0.2 // 20-40% range for data loading
            setRestoreProgress({
              stage: 'loading-data',
              message: `Loading dataset: ${stage}`,
              progress: overallProgress,
            })
          })
        } catch (dataError) {
          console.error('Failed to load dataset:', dataError)
          // Continue with other components even if data fails
          setRestoreProgress({
            stage: 'loading-data',
            message: `Dataset loading failed: ${dataError instanceof Error ? dataError.message : 'Unknown error'}`,
            progress: 40,
          })
        }

        setRestoreProgress({
          stage: 'loading-filters',
          message: 'Loading filters...',
          progress: 45,
        })
        let filters: FilterState | null = null
        try {
          filters = await service.loadFilters(sessionId)
        } catch (filterError) {
          console.warn('Failed to load filters:', filterError)
          // Non-critical, continue without filters
        }

        setRestoreProgress({ stage: 'loading-charts', message: 'Loading charts...', progress: 65 })
        let charts: ChartConfig[] | null = null
        try {
          charts = await service.loadCharts(sessionId)
        } catch (chartError) {
          console.warn('Failed to load charts:', chartError)
          // Non-critical, continue without charts
        }

        setRestoreProgress({ stage: 'applying', message: 'Applying data...', progress: 80 })

        // Apply loaded data with validation
        if (data && onLoadDatasetRef.current) {
          try {
            onLoadDatasetRef.current(data)
          } catch (applyError) {
            console.error('Failed to apply dataset:', applyError)
            throw new Error(
              `Failed to apply loaded data: ${applyError instanceof Error ? applyError.message : 'Unknown error'}`,
            )
          }
        } else if (!data) {
          throw new Error('No dataset available for restoration')
        }

        if (filters && onLoadFiltersRef.current) {
          try {
            onLoadFiltersRef.current(filters)
          } catch (filterApplyError) {
            console.warn('Failed to apply filters:', filterApplyError)
          }
        }

        if (charts && onLoadChartsRef.current) {
          try {
            onLoadChartsRef.current(charts)
          } catch (chartApplyError) {
            console.warn('Failed to apply charts:', chartApplyError)
          }
        }

        setShowRestoreBanner(false)
        await service.setActiveSession(sessionId)

        setRestoreProgress({ stage: 'complete', message: 'Complete!', progress: 100 })

        // Reset states after a short delay
        setTimeout(() => {
          setRestoreProgress(null)
          setIsRestoring(false)
        }, 1000)
      } catch (error) {
        console.error('Session restoration failed:', error)
        setRestoreProgress(null)
        setIsRestoring(false)

        // Re-throw with user-friendly message
        if (error instanceof Error) {
          throw new Error(`Session restoration failed: ${error.message}`)
        } else {
          throw new Error('Session restoration failed due to an unknown error')
        }
      } finally {
        abortControllerRef.current = null
      }
    },
    [service, isRestoring],
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

  const cancelRestore = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setRestoreProgress(null)
    setIsRestoring(false)
  }, [])

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
    // New loading states
    isRestoring,
    restoreProgress,
    cancelRestore,
  }
}

export type UseSessionPersistenceReturn = ReturnType<typeof useSessionPersistence>
