import { DEFAULT_STORAGE_KEYS, type StorageAdapter } from './adapter'
import { serialize, deserialize, estimateSizeBytes, type SerializedPayload } from './serialization'
import type { ExcelData } from '../../types/excel'
import type { FilterState } from '../../types/filter'
import type { ChartConfig } from '../../types/chart'

export interface PersistedSessionSummary {
  fileName?: string
  sheetName?: string
  totalRows?: number
  totalColumns?: number
  columns?: string[]
}

export interface PersistedSession {
  id: string
  createdAt: string
  updatedAt: string
  appVersion: string
  schemaVersion: number
  datasetKey: string | null
  filtersKey: string | null
  chartsKey: string | null
  preferencesKey: string | null
  summary: PersistedSessionSummary
}

export interface ExcelDataSnapshot {
  version: number
  createdAt: string
  excelData: ExcelData
}

export interface FiltersSnapshot {
  version: number
  createdAt: string
  filters: FilterState
}

export interface ChartsSnapshot {
  version: number
  createdAt: string
  charts: ChartConfig[]
}

interface SessionIndexItem {
  id: string
  updatedAt: string
}

interface StorageServiceOptions {
  appVersion?: string
  schemaVersion?: number
  maxSessions?: number
  maxCompressedDatasetBytes?: number
  maxRowsPersisted?: number
}

export class StorageService {
  private readonly local: StorageAdapter
  private readonly idb: StorageAdapter
  private readonly appVersion: string
  private readonly schemaVersion: number
  private readonly maxSessions: number
  private readonly maxCompressedDatasetBytes: number
  private readonly maxRowsPersisted: number

  constructor(local: StorageAdapter, idb: StorageAdapter, options: StorageServiceOptions = {}) {
    this.local = local
    this.idb = idb
    this.appVersion = options.appVersion ?? '1.0.0'
    this.schemaVersion = options.schemaVersion ?? 1
    this.maxSessions = options.maxSessions ?? 5
    this.maxCompressedDatasetBytes = options.maxCompressedDatasetBytes ?? 3 * 1024 * 1024
    this.maxRowsPersisted = options.maxRowsPersisted ?? 50000
  }

  async createOrUpdateSession(summary: PersistedSessionSummary): Promise<PersistedSession> {
    const nowIso = new Date().toISOString()
    let activeId = (await this.local.getItem<string>(DEFAULT_STORAGE_KEYS.activeSessionId)) || null
    let session: PersistedSession | null = null

    if (activeId) {
      session = await this.local.getItem<PersistedSession>(this.sessionKey(activeId))
    }

    if (!session) {
      const id = this.generateId()
      session = {
        id,
        createdAt: nowIso,
        updatedAt: nowIso,
        appVersion: this.appVersion,
        schemaVersion: this.schemaVersion,
        datasetKey: null,
        filtersKey: null,
        chartsKey: null,
        preferencesKey: null,
        summary,
      }
      await this.local.setItem(DEFAULT_STORAGE_KEYS.activeSessionId, id)
    } else {
      session = { ...session, updatedAt: nowIso, summary }
    }

    await this.local.setItem(this.sessionKey(session.id), session)
    await this.bumpSessionIndex(session.id, nowIso)
    await this.evictOverflowSessions()
    return session
  }

  async getActiveSession(): Promise<PersistedSession | null> {
    const id = await this.local.getItem<string>(DEFAULT_STORAGE_KEYS.activeSessionId)
    if (!id) return null
    const s = await this.local.getItem<PersistedSession>(this.sessionKey(id))
    return s ?? null
  }

  async setActiveSession(sessionId: string | null): Promise<void> {
    if (sessionId) {
      await this.local.setItem(DEFAULT_STORAGE_KEYS.activeSessionId, sessionId)
    } else {
      await this.local.removeItem(DEFAULT_STORAGE_KEYS.activeSessionId)
    }
  }

  async listSessions(): Promise<PersistedSession[]> {
    const index =
      (await this.local.getItem<SessionIndexItem[]>(DEFAULT_STORAGE_KEYS.sessionsIndex)) || []
    const ordered = [...index].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    const sessions: PersistedSession[] = []
    for (const item of ordered) {
      const s = await this.local.getItem<PersistedSession>(this.sessionKey(item.id))
      if (s) sessions.push(s)
    }
    return sessions
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (session?.datasetKey) await this.idb.removeItem(session.datasetKey)
    if (session?.filtersKey) await this.idb.removeItem(session.filtersKey)
    if (session?.chartsKey) await this.idb.removeItem(session.chartsKey)
    await this.local.removeItem(this.sessionKey(sessionId))

    const index =
      (await this.local.getItem<SessionIndexItem[]>(DEFAULT_STORAGE_KEYS.sessionsIndex)) || []
    const next = index.filter((i) => i.id !== sessionId)
    await this.local.setItem(DEFAULT_STORAGE_KEYS.sessionsIndex, next)

    const activeId = await this.local.getItem<string>(DEFAULT_STORAGE_KEYS.activeSessionId)
    if (activeId === sessionId) {
      await this.local.removeItem(DEFAULT_STORAGE_KEYS.activeSessionId)
    }
  }

  async saveDataset(sessionId: string, data: ExcelData): Promise<void> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session) throw new Error('Session not found')

    const rows = data?.rows?.length || 0
    if (rows > this.maxRowsPersisted) {
      // degrade to metadata-only
      const updated: PersistedSession = {
        ...session,
        updatedAt: new Date().toISOString(),
        datasetKey: null,
        summary: this.buildSummaryFromData(data),
      }
      await this.local.setItem(this.sessionKey(sessionId), updated)
      await this.bumpSessionIndex(sessionId, updated.updatedAt)
      return
    }

    const snapshot: ExcelDataSnapshot = {
      version: this.schemaVersion,
      createdAt: new Date().toISOString(),
      excelData: data,
    }
    const payload = serialize(snapshot)
    const size = estimateSizeBytes(payload)
    if (size > this.maxCompressedDatasetBytes) {
      const updated: PersistedSession = {
        ...session,
        updatedAt: new Date().toISOString(),
        datasetKey: null,
        summary: this.buildSummaryFromData(data),
      }
      await this.local.setItem(this.sessionKey(sessionId), updated)
      await this.bumpSessionIndex(sessionId, updated.updatedAt)
      return
    }

    const key = session.datasetKey ?? this.makeKey('dataset', sessionId)
    await this.idb.setItem<SerializedPayload>(key, payload)

    const updated: PersistedSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      datasetKey: key,
      summary: this.buildSummaryFromData(data),
    }
    await this.local.setItem(this.sessionKey(sessionId), updated)
    await this.bumpSessionIndex(sessionId, updated.updatedAt)
  }

  async saveFilters(sessionId: string, filters: FilterState): Promise<void> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session) throw new Error('Session not found')
    const snapshot: FiltersSnapshot = {
      version: this.schemaVersion,
      createdAt: new Date().toISOString(),
      filters,
    }
    const payload = serialize(snapshot)
    const key = session.filtersKey ?? this.makeKey('filters', sessionId)
    await this.idb.setItem<SerializedPayload>(key, payload)

    const updated: PersistedSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      filtersKey: key,
    }
    await this.local.setItem(this.sessionKey(sessionId), updated)
    await this.bumpSessionIndex(sessionId, updated.updatedAt)
  }

  async saveCharts(sessionId: string, charts: ChartConfig[]): Promise<void> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session) throw new Error('Session not found')
    const snapshot: ChartsSnapshot = {
      version: this.schemaVersion,
      createdAt: new Date().toISOString(),
      charts,
    }
    const payload = serialize(snapshot)
    const key = session.chartsKey ?? this.makeKey('charts', sessionId)
    await this.idb.setItem<SerializedPayload>(key, payload)

    const updated: PersistedSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      chartsKey: key,
    }
    await this.local.setItem(this.sessionKey(sessionId), updated)
    await this.bumpSessionIndex(sessionId, updated.updatedAt)
  }

  async loadDataset(sessionId: string): Promise<ExcelData | null> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session?.datasetKey) return null
    const payload = await this.idb.getItem<SerializedPayload>(session.datasetKey)
    if (!payload) return null
    const snapshot = deserialize<ExcelDataSnapshot>(payload)
    return snapshot.excelData
  }

  async loadFilters(sessionId: string): Promise<FilterState | null> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session?.filtersKey) return null
    const payload = await this.idb.getItem<SerializedPayload>(session.filtersKey)
    if (!payload) return null
    const snapshot = deserialize<FiltersSnapshot>(payload)
    return snapshot.filters
  }

  async loadCharts(sessionId: string): Promise<ChartConfig[] | null> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session?.chartsKey) return null
    const payload = await this.idb.getItem<SerializedPayload>(session.chartsKey)
    if (!payload) return null
    const snapshot = deserialize<ChartsSnapshot>(payload)
    return snapshot.charts
  }

  private sessionKey(id: string): string {
    return `session:${id}`
  }

  private async bumpSessionIndex(id: string, updatedAtIso: string): Promise<void> {
    const index =
      (await this.local.getItem<SessionIndexItem[]>(DEFAULT_STORAGE_KEYS.sessionsIndex)) || []
    const filtered = index.filter((i) => i.id !== id)
    filtered.unshift({ id, updatedAt: updatedAtIso })
    await this.local.setItem(DEFAULT_STORAGE_KEYS.sessionsIndex, filtered)
  }

  private async evictOverflowSessions(): Promise<void> {
    const index =
      (await this.local.getItem<SessionIndexItem[]>(DEFAULT_STORAGE_KEYS.sessionsIndex)) || []
    if (index.length <= this.maxSessions) return
    const overflow = index.slice(this.maxSessions)
    for (const item of overflow) {
      await this.deleteSession(item.id)
    }
  }

  private makeKey(prefix: 'dataset' | 'filters' | 'charts', sessionId: string): string {
    const rand = Math.random().toString(36).slice(2, 8)
    return `${prefix}:${sessionId}:${rand}`
  }

  private buildSummaryFromData(data: ExcelData): PersistedSessionSummary {
    const cols = data?.metadata?.columns?.map((c) => c.name) || []
    return {
      fileName: data?.metadata?.fileName,
      sheetName: data?.metadata?.activeSheet,
      totalRows: data?.metadata?.totalRows,
      totalColumns: data?.metadata?.totalColumns,
      columns: cols.slice(0, 50),
    }
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}
