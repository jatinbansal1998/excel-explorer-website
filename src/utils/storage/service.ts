import { DEFAULT_STORAGE_KEYS, type StorageAdapter } from './adapter'
import { deserialize, estimateSizeBytes, serialize, type SerializedPayload } from './serialization'
import type { DataMatrix, ExcelData } from '@/types/excel'
import type { FilterState } from '@/types/filter'
import type { ChartConfig } from '@/types/chart'

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
  isChunked?: boolean
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

export interface ChunkedDatasetInfo {
  version: number
  totalChunks: number
  totalRows: number
  chunkSize: number
  createdAt: string
  chunkKeys: string[]
}

export interface DatasetChunk {
  chunkIndex: number
  startRow: number
  endRow: number
  headers: string[]
  rows: DataMatrix
  metadata?: Record<string, unknown>
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
  adaptiveLimits?: boolean
  chunkSize?: number
}

export class StorageService {
  private readonly local: StorageAdapter
  private readonly idb: StorageAdapter
  private readonly appVersion: string
  private readonly schemaVersion: number
  private readonly maxSessions: number
  private readonly maxCompressedDatasetBytes: number
  private readonly maxRowsPersisted: number
  private readonly adaptiveLimits: boolean
  private readonly chunkSize: number
  private deviceCapabilities: { memory: number; isLowEnd: boolean } | null = null

  constructor(local: StorageAdapter, idb: StorageAdapter, options: StorageServiceOptions = {}) {
    this.local = local
    this.idb = idb
    this.appVersion = options.appVersion ?? '1.0.0'
    this.schemaVersion = options.schemaVersion ?? 1
    this.maxSessions = options.maxSessions ?? 5
    this.maxCompressedDatasetBytes = options.maxCompressedDatasetBytes ?? 3 * 1024 * 1024
    this.maxRowsPersisted = options.maxRowsPersisted ?? 50000
    this.adaptiveLimits = options.adaptiveLimits ?? true
    this.chunkSize = options.chunkSize ?? 1000

    if (this.adaptiveLimits) {
      this.detectDeviceCapabilities()
    }
  }

  async createOrUpdateSession(summary: PersistedSessionSummary): Promise<PersistedSession> {
    const nowIso = new Date().toISOString()
    const activeId =
      (await this.local.getItem<string>(DEFAULT_STORAGE_KEYS.activeSessionId)) || null
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

  async getSession(sessionId: string): Promise<PersistedSession | null> {
    const s = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
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

    // Clean up chunked data if this is a chunked session
    if (session?.isChunked && session?.datasetKey) {
      await this.deleteChunkedDataset(session.datasetKey)
    }

    // Clean up regular data
    if (session?.datasetKey && !session.isChunked) await this.idb.removeItem(session.datasetKey)
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

  private async deleteChunkedDataset(infoKey: string): Promise<void> {
    try {
      const payload = await this.idb.getItem<SerializedPayload>(infoKey)
      if (!payload) return

      const chunkedInfo = deserialize<ChunkedDatasetInfo>(payload)

      // Delete all chunk files
      for (const chunkKey of chunkedInfo.chunkKeys) {
        try {
          await this.idb.removeItem(chunkKey)
        } catch (error) {
          console.warn(`Failed to delete chunk ${chunkKey}:`, error)
        }
      }

      // Delete the info file
      await this.idb.removeItem(infoKey)
    } catch (error) {
      console.warn('Failed to delete chunked dataset:', error)
    }
  }

  async saveDataset(sessionId: string, data: ExcelData): Promise<void> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session) throw new Error('Session not found')

    const limits = this.getAdaptiveLimits()
    const rows = data?.rows?.length || 0

    // Use chunked saving for large datasets
    if (rows > limits.maxRowsPersisted) {
      await this.saveDatasetChunked(sessionId, data, limits)
      return
    }

    const snapshot: ExcelDataSnapshot = {
      version: this.schemaVersion,
      createdAt: new Date().toISOString(),
      excelData: data,
    }
    const payload = serialize(snapshot)
    const size = estimateSizeBytes(payload)

    if (size > limits.maxCompressedDatasetBytes) {
      await this.saveDatasetChunked(sessionId, data, limits)
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

    // Cleanup old sessions if we're over limits
    await this.cleanupOldSessions()
  }

  private async saveDatasetChunked(
    sessionId: string,
    data: ExcelData,
    limits: {
      maxSessions: number
      maxCompressedDatasetBytes: number
      maxRowsPersisted: number
    },
  ): Promise<void> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session) throw new Error('Session not found')

    const chunkSize = Math.min(this.chunkSize, limits.maxRowsPersisted)
    const totalRows = data.rows?.length || 0
    const totalChunks = Math.ceil(totalRows / chunkSize)
    const chunkKeys: string[] = []

    // Save chunks
    for (let i = 0; i < totalChunks; i++) {
      const startRow = i * chunkSize
      const endRow = Math.min(startRow + chunkSize, totalRows)
      const chunkRows = data.rows.slice(startRow, endRow)

      const chunk: DatasetChunk = {
        chunkIndex: i,
        startRow,
        endRow,
        headers: data.headers || [],
        rows: chunkRows,
        metadata: {
          totalRows,
          fileName: data.metadata?.fileName,
          sheetName: data.metadata?.activeSheet,
        },
      }

      const chunkKey = this.makeKey('chunk', sessionId)
      const payload = serialize(chunk)
      await this.idb.setItem<SerializedPayload>(chunkKey, payload)
      chunkKeys.push(chunkKey)
    }

    // Save chunked dataset info
    const chunkedInfo: ChunkedDatasetInfo = {
      version: this.schemaVersion,
      totalChunks,
      totalRows,
      chunkSize,
      createdAt: new Date().toISOString(),
      chunkKeys,
    }

    const infoKey = session.datasetKey ?? this.makeKey('chunked-info', sessionId)
    await this.idb.setItem<SerializedPayload>(infoKey, serialize(chunkedInfo))

    const updated: PersistedSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      datasetKey: infoKey,
      isChunked: true,
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
    // Normalize null/undefined cells to empty string on load
    const normalized: ExcelData = {
      ...snapshot.excelData,
      rows: (snapshot.excelData.rows || []).map((row) => row.map((c) => (c == null ? '' : c))),
    }
    return normalized
  }

  async loadDatasetProgressive(
    sessionId: string,
    onProgress?: (progress: number, stage: string) => void,
  ): Promise<ExcelData | null> {
    const session = await this.local.getItem<PersistedSession>(this.sessionKey(sessionId))
    if (!session?.datasetKey) {
      console.warn('No dataset key found for session:', sessionId)
      return null
    }

    onProgress?.(10, 'Finding session data...')

    // Check if this is a chunked dataset
    if (session.isChunked) {
      return this.loadChunkedDataset(sessionId, session.datasetKey, onProgress)
    }

    const payload = await this.idb.getItem<SerializedPayload>(session.datasetKey)
    if (!payload) {
      console.warn('No payload found for dataset key:', session.datasetKey)
      return null
    }

    onProgress?.(30, 'Deserializing data...')

    try {
      // For large datasets, implement chunked deserialization
      const estimatedSize = this.estimatePayloadSize(payload)

      if (estimatedSize > 1024 * 1024) {
        // 1MB threshold
        return this.loadDatasetChunked(payload, onProgress)
      } else {
        onProgress?.(80, 'Processing data...')
        const snapshot = deserialize<ExcelDataSnapshot>(payload)
        onProgress?.(100, 'Complete')
        return snapshot.excelData
      }
    } catch (error) {
      console.error('Deserialization failed:', error)
      throw new Error(`Failed to deserialize dataset: ${error}`)
    }
  }

  private async loadDatasetChunked(
    payload: SerializedPayload,
    onProgress?: (progress: number, stage: string) => void,
  ): Promise<ExcelData | null> {
    // Simulate chunked loading for large datasets
    // In a real implementation, this would involve actual chunking
    onProgress?.(50, 'Processing large dataset...')

    // Add a small delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 100))

    onProgress?.(80, 'Finalizing data...')
    const snapshot = deserialize<ExcelDataSnapshot>(payload)
    onProgress?.(100, 'Complete')
    const normalized: ExcelData = {
      ...snapshot.excelData,
      rows: (snapshot.excelData.rows || []).map((row) => row.map((c) => (c == null ? '' : c))),
    }
    return normalized
  }

  private async loadChunkedDataset(
    sessionId: string,
    infoKey: string,
    onProgress?: (progress: number, stage: string) => void,
  ): Promise<ExcelData | null> {
    onProgress?.(20, 'Loading chunked dataset info...')

    // Check memory pressure before starting
    if (await this.isMemoryPressureHigh()) {
      throw new Error('Insufficient memory available for large dataset restoration')
    }

    const payload = await this.idb.getItem<SerializedPayload>(infoKey)
    if (!payload) {
      throw new Error('Chunked dataset info not found')
    }

    const chunkedInfo = deserialize<ChunkedDatasetInfo>(payload)
    onProgress?.(30, `Found ${chunkedInfo.totalChunks} chunks...`)

    // Calculate adaptive chunk size based on available memory
    const adaptiveChunkSize = this.getAdaptiveChunkSize(chunkedInfo)
    // Note: chunksToLoad calculation was removed as it wasn't being used

    // Load chunks progressively with memory awareness
    const allChunks: DatasetChunk[] = []
    const totalChunks = chunkedInfo.totalChunks

    for (let i = 0; i < totalChunks; i++) {
      // Check memory before loading each chunk
      if (i % adaptiveChunkSize.memoryCheckInterval === 0 && (await this.isMemoryPressureHigh())) {
        throw new Error('Memory pressure detected during chunk loading')
      }

      const chunkProgress = 30 + (i / totalChunks) * 60
      onProgress?.(chunkProgress, `Loading chunk ${i + 1}/${totalChunks}...`)

      const chunkKey = chunkedInfo.chunkKeys[i]
      const chunkPayload = await this.idb.getItem<SerializedPayload>(chunkKey)

      if (!chunkPayload) {
        console.warn(`Chunk ${i} not found, skipping...`)
        continue
      }

      try {
        const chunk = deserialize<DatasetChunk>(chunkPayload)

        // Estimate memory usage of this chunk
        const chunkSize = this.estimateChunkMemorySize(chunk)

        // Check if adding this chunk would exceed memory limits
        if (chunkSize > adaptiveChunkSize.maxChunkSize) {
          console.warn(`Chunk ${i} too large (${chunkSize} bytes), skipping...`)
          continue
        }

        allChunks.push(chunk)

        // Trigger garbage collection if memory is getting high
        if (i % adaptiveChunkSize.gcInterval === 0) {
          await this.triggerGarbageCollection()
        }
      } catch (error) {
        console.error(`Failed to deserialize chunk ${i}:`, error)
        // Continue with other chunks
      }

      // Adaptive delay based on system performance
      const delay = this.getAdaptiveDelay(allChunks.length, chunkedInfo.totalChunks)
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    onProgress?.(90, 'Reconstructing dataset...')

    // Final memory check before reconstruction
    if (await this.isMemoryPressureHigh()) {
      throw new Error('Insufficient memory for dataset reconstruction')
    }

    // Sort chunks by index and reconstruct dataset
    allChunks.sort((a, b) => a.chunkIndex - b.chunkIndex)

    if (allChunks.length === 0) {
      throw new Error('No valid chunks found')
    }

    // Reconstruct the full dataset with memory monitoring
    const reconstructedData = this.reconstructDatasetFromChunks(allChunks)

    onProgress?.(100, 'Complete')
    return reconstructedData
  }

  private async isMemoryPressureHigh(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('deviceMemory' in navigator)) {
      return false
    }

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4
    const isLowEnd = deviceMemory < 4

    if (isLowEnd) {
      return true
    }

    // Check storage quota usage
    try {
      const estimate = await navigator.storage.estimate()
      if (estimate.usage && estimate.quota) {
        const usagePercentage = estimate.usage / estimate.quota
        return usagePercentage > 0.8 // 80% threshold
      }
    } catch (error) {
      console.warn('Failed to check storage quota:', error)
    }

    return false
  }

  private getAdaptiveChunkSize(_chunkedInfo: ChunkedDatasetInfo) {
    const isLowEnd = this.deviceCapabilities?.isLowEnd || false
    const deviceMemory = this.deviceCapabilities?.memory || 4

    if (isLowEnd) {
      return {
        maxChunkSize: 5000, // 5K rows per chunk
        maxConcurrentChunks: 2,
        memoryCheckInterval: 1,
        gcInterval: 3,
      }
    }

    if (deviceMemory < 8) {
      return {
        maxChunkSize: 10000, // 10K rows per chunk
        maxConcurrentChunks: 3,
        memoryCheckInterval: 2,
        gcInterval: 5,
      }
    }

    // High-end devices
    return {
      maxChunkSize: 20000, // 20K rows per chunk
      maxConcurrentChunks: 5,
      memoryCheckInterval: 3,
      gcInterval: 8,
    }
  }

  private estimateChunkMemorySize(chunk: DatasetChunk): number {
    // Rough estimation of memory usage
    const rowsSize = chunk.rows.length * chunk.headers.length * 50 // ~50 bytes per cell
    const headersSize = chunk.headers.length * 100 // ~100 bytes per header
    return rowsSize + headersSize
  }

  private getAdaptiveDelay(loadedChunks: number, totalChunks: number): number {
    const progressRatio = loadedChunks / totalChunks

    // Increase delay as we load more chunks to prevent memory buildup
    if (progressRatio > 0.8) return 50
    if (progressRatio > 0.6) return 30
    if (progressRatio > 0.4) return 20

    return 10
  }

  private async triggerGarbageCollection(): Promise<void> {
    // Force garbage collection in browsers that support it
    if (typeof gc !== 'undefined') {
      try {
        gc()
      } catch {
        // Ignore errors
      }
    }

    // Alternative: trigger implicit garbage collection
    const _temp = new Array(1000).fill(null).map(() => ({ large: new Array(1000).fill('data') }))
    setTimeout(() => {
      // Allow temp to be garbage collected
    }, 0)
  }

  private reconstructDatasetFromChunks(allChunks: DatasetChunk[]): ExcelData {
    // Reconstruct the full dataset
    const allRows = allChunks
      .flatMap((chunk) => chunk.rows)
      .map((row) => row.map((cell) => (cell == null ? '' : cell)))
    const headers = allChunks[0]?.headers || []

    return {
      headers,
      rows: allRows,
      metadata: {
        fileName: (allChunks[0].metadata?.fileName as string) || 'Unknown',
        activeSheet: (allChunks[0].metadata?.sheetName as string) || 'Sheet1',
        totalRows: allRows.length,
        totalColumns: headers.length,
        fileSize: 0, // Will be calculated later if needed
        sheetNames: [(allChunks[0].metadata?.sheetName as string) || 'Sheet1'],
        columns: headers.map((name, index) => ({
          name,
          index,
          type: 'string' as const,
          uniqueValues: [],
          uniqueCount: 0,
          hasNulls: false,
          nullCount: 0,
          sampleValues: [],
        })),
      },
    }
  }

  private estimatePayloadSize(payload: SerializedPayload): number {
    // Rough estimation of payload size
    return JSON.stringify(payload).length * 2 // Approximate bytes
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
    const limits = this.getAdaptiveLimits()
    const index =
      (await this.local.getItem<SessionIndexItem[]>(DEFAULT_STORAGE_KEYS.sessionsIndex)) || []
    if (index.length <= limits.maxSessions) return
    const overflow = index.slice(limits.maxSessions)
    for (const item of overflow) {
      await this.deleteSession(item.id)
    }
  }

  private makeKey(
    prefix: 'dataset' | 'filters' | 'charts' | 'chunk' | 'chunked-info',
    sessionId: string,
  ): string {
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

  private detectDeviceCapabilities(): void {
    if (typeof navigator === 'undefined' || !('deviceMemory' in navigator)) {
      this.deviceCapabilities = { memory: 4, isLowEnd: false } // Default assumption
      return
    }

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4
    const isLowEnd =
      deviceMemory < 4 ||
      !('hardwareConcurrency' in navigator) ||
      (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency < 4

    this.deviceCapabilities = { memory: deviceMemory, isLowEnd }
  }

  private getAdaptiveLimits(): {
    maxSessions: number
    maxCompressedDatasetBytes: number
    maxRowsPersisted: number
  } {
    if (!this.deviceCapabilities || !this.adaptiveLimits) {
      return {
        maxSessions: this.maxSessions,
        maxCompressedDatasetBytes: this.maxCompressedDatasetBytes,
        maxRowsPersisted: this.maxRowsPersisted,
      }
    }

    const { memory, isLowEnd } = this.deviceCapabilities

    if (isLowEnd) {
      return {
        maxSessions: 2,
        maxCompressedDatasetBytes: 1024 * 1024, // 1MB
        maxRowsPersisted: 10000,
      }
    }

    if (memory < 4) {
      return {
        maxSessions: 3,
        maxCompressedDatasetBytes: 2 * 1024 * 1024, // 2MB
        maxRowsPersisted: 25000,
      }
    }

    if (memory < 8) {
      return {
        maxSessions: 4,
        maxCompressedDatasetBytes: this.maxCompressedDatasetBytes,
        maxRowsPersisted: this.maxRowsPersisted,
      }
    }

    // High-end devices
    return {
      maxSessions: this.maxSessions,
      maxCompressedDatasetBytes: this.maxCompressedDatasetBytes * 1.5, // 4.5MB
      maxRowsPersisted: this.maxRowsPersisted * 1.5, // 75K rows
    }
  }

  async getStorageUsage(): Promise<{ used: number; total: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      const total = estimate.quota || 0
      return {
        used,
        total,
        available: total - used,
      }
    }

    // Fallback estimation
    return {
      used: 0,
      total: 50 * 1024 * 1024, // 50MB assumption
      available: 50 * 1024 * 1024,
    }
  }

  async cleanupOldSessions(): Promise<void> {
    const limits = this.getAdaptiveLimits()
    const sessions = await this.listSessions()

    if (sessions.length <= limits.maxSessions) return

    // Sort by last updated and remove oldest
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    )

    const toRemove = sortedSessions.slice(0, sessions.length - limits.maxSessions)

    for (const session of toRemove) {
      await this.deleteSession(session.id)
    }
  }
}
