export type ChartType = 'pie' | 'bar' | 'line' | 'scatter' | 'histogram'

export interface RecentFileInfo {
  name: string
  size: number
  lastOpened: Date
  rowCount: number
  columnCount: number
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  defaultChartType: ChartType
  autoGenerateCharts: boolean
  maxRowsToDisplay: number
}

export interface FilterPreset {
  id: string
  name: string
  description?: string
  filters: any[]
  createdAt: Date
  lastUsed?: Date
}

export interface ChartConfig {
  id: string
  name: string
  type: ChartType
  config: any
  createdAt: Date
}

export class LocalStorageManager {
  private static readonly PREFIX = 'excel-explorer-'
  private static readonly KEYS = {
    RECENT_FILES: 'recent-files',
    USER_PREFERENCES: 'user-preferences',
    FILTER_PRESETS: 'filter-presets',
    CHART_CONFIGS: 'chart-configs',
    SESSION_DATA: 'session-data',
    APP_STATE: 'app-state',
    OPENROUTER_API_KEY_ENC: 'openrouter-api-key-enc',
    OPENROUTER_NAMED_KEYS: 'openrouter-named-keys',
    OPENROUTER_SETTINGS: 'openrouter-settings',
  }

  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }

  static save<T>(key: string, data: T): boolean {
    if (!this.isBrowser()) return false
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0',
      })
      localStorage.setItem(this.PREFIX + key, serialized)
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  }

  static load<T>(key: string): T | null {
    if (!this.isBrowser()) return null
    try {
      const item = localStorage.getItem(this.PREFIX + key)
      if (!item) return null

      const parsed = JSON.parse(item)

      // Handle legacy data without version/timestamp
      if (parsed.data !== undefined) {
        return parsed.data
      }

      // Assume legacy data format
      return parsed as T
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return null
    }
  }

  static remove(key: string): boolean {
    if (!this.isBrowser()) return false
    try {
      localStorage.removeItem(this.PREFIX + key)
      return true
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
      return false
    }
  }

  static clear(): boolean {
    if (!this.isBrowser()) return false
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(this.PREFIX))
        .forEach((key) => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  }

  static getStorageInfo(): StorageInfo {
    if (!this.isBrowser()) {
      return {
        total: 0,
        used: 0,
        available: 0,
        appUsed: 0,
        appPercentage: 0,
      }
    }
    try {
      const total = this.getStorageQuota()
      const used = this.getStorageUsed()
      const appUsed = this.getAppStorageUsed()

      return {
        total,
        used,
        available: total - used,
        appUsed,
        appPercentage: total > 0 ? (appUsed / total) * 100 : 0,
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return {
        total: 0,
        used: 0,
        available: 0,
        appUsed: 0,
        appPercentage: 0,
      }
    }
  }

  private static getStorageQuota(): number {
    if (!this.isBrowser()) return 5 * 1024 * 1024
    // Most browsers allow ~5-10MB for localStorage
    // We'll estimate based on typical browser limits
    try {
      let testKey = 'storage-test-'
      let testData = '0123456789'
      let data = testData
      let totalSize = 0

      // Try to fill up storage to find limit (not recommended for production)
      // Instead, use a conservative estimate
      return 5 * 1024 * 1024 // 5MB estimate
    } catch {
      return 5 * 1024 * 1024 // 5MB fallback
    }
  }

  private static getStorageUsed(): number {
    if (!this.isBrowser()) return 0
    try {
      let total = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }
      return total * 2 // UTF-16 characters are 2 bytes each
    } catch {
      return 0
    }
  }

  private static getAppStorageUsed(): number {
    if (!this.isBrowser()) return 0
    try {
      let total = 0
      for (let key in localStorage) {
        if (key.startsWith(this.PREFIX)) {
          total += localStorage[key].length + key.length
        }
      }
      return total * 2 // UTF-16 characters are 2 bytes each
    } catch {
      return 0
    }
  }

  // Specific data managers
  static saveRecentFile(fileInfo: RecentFileInfo): void {
    const recent = this.load<RecentFileInfo[]>(this.KEYS.RECENT_FILES) || []
    const updated = [fileInfo, ...recent.filter((f) => f.name !== fileInfo.name)].slice(0, 10) // Keep 10 most recent
    this.save(this.KEYS.RECENT_FILES, updated)
  }

  static getRecentFiles(): RecentFileInfo[] {
    const files = this.load<RecentFileInfo[]>(this.KEYS.RECENT_FILES) || []
    // Convert date strings back to Date objects
    return files.map((file) => ({
      ...file,
      lastOpened: new Date(file.lastOpened),
    }))
  }

  static removeRecentFile(fileName: string): void {
    const recent = this.getRecentFiles()
    const updated = recent.filter((f) => f.name !== fileName)
    this.save(this.KEYS.RECENT_FILES, updated)
  }

  static saveUserPreferences(preferences: UserPreferences): void {
    this.save(this.KEYS.USER_PREFERENCES, preferences)
  }

  static getUserPreferences(): UserPreferences {
    return (
      this.load<UserPreferences>(this.KEYS.USER_PREFERENCES) || {
        theme: 'light',
        defaultChartType: 'pie',
        autoGenerateCharts: true,
        maxRowsToDisplay: 1000,
      }
    )
  }

  static saveFilterPreset(preset: FilterPreset): void {
    const presets = this.getFilterPresets()
    const updated = presets.filter((p) => p.id !== preset.id)
    updated.push(preset)
    this.save(this.KEYS.FILTER_PRESETS, updated)
  }

  static getFilterPresets(): FilterPreset[] {
    const presets = this.load<FilterPreset[]>(this.KEYS.FILTER_PRESETS) || []
    // Convert date strings back to Date objects
    return presets.map((preset) => ({
      ...preset,
      createdAt: new Date(preset.createdAt),
      lastUsed: preset.lastUsed ? new Date(preset.lastUsed) : undefined,
    }))
  }

  static removeFilterPreset(id: string): void {
    const presets = this.getFilterPresets()
    const updated = presets.filter((p) => p.id !== id)
    this.save(this.KEYS.FILTER_PRESETS, updated)
  }

  static saveChartConfig(config: ChartConfig): void {
    const configs = this.getChartConfigs()
    const updated = configs.filter((c) => c.id !== config.id)
    updated.push(config)
    this.save(this.KEYS.CHART_CONFIGS, updated)
  }

  static getChartConfigs(): ChartConfig[] {
    const configs = this.load<ChartConfig[]>(this.KEYS.CHART_CONFIGS) || []
    // Convert date strings back to Date objects
    return configs.map((config) => ({
      ...config,
      createdAt: new Date(config.createdAt),
    }))
  }

  static removeChartConfig(id: string): void {
    const configs = this.getChartConfigs()
    const updated = configs.filter((c) => c.id !== id)
    this.save(this.KEYS.CHART_CONFIGS, updated)
  }

  // Session management
  static saveSessionData(data: any): void {
    this.save(this.KEYS.SESSION_DATA, {
      ...data,
      timestamp: new Date(),
      sessionId: this.generateSessionId(),
    })
  }

  static getSessionData(): any {
    return this.load(this.KEYS.SESSION_DATA)
  }

  static clearSessionData(): void {
    this.remove(this.KEYS.SESSION_DATA)
  }

  // App state management
  static saveAppState(state: any): void {
    this.save(this.KEYS.APP_STATE, {
      ...state,
      lastSaved: new Date(),
    })
  }

  static getAppState(): any {
    return this.load(this.KEYS.APP_STATE)
  }

  private static generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }

  // Cleanup utilities
  static cleanupOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    try {
      const cutoffDate = new Date(Date.now() - maxAge)

      // Clean up old recent files
      const recentFiles = this.getRecentFiles()
      const validRecentFiles = recentFiles.filter((file) => file.lastOpened > cutoffDate)
      this.save(this.KEYS.RECENT_FILES, validRecentFiles)

      // Clean up old filter presets
      const filterPresets = this.getFilterPresets()
      const validPresets = filterPresets.filter(
        (preset) =>
          preset.createdAt > cutoffDate || (preset.lastUsed && preset.lastUsed > cutoffDate),
      )
      this.save(this.KEYS.FILTER_PRESETS, validPresets)

      // Clean up old chart configs
      const chartConfigs = this.getChartConfigs()
      const validConfigs = chartConfigs.filter((config) => config.createdAt > cutoffDate)
      this.save(this.KEYS.CHART_CONFIGS, validConfigs)
    } catch (error) {
      console.error('Failed to cleanup old data:', error)
    }
  }

  static exportAllData(): string {
    try {
      const allData = {
        recentFiles: this.getRecentFiles(),
        userPreferences: this.getUserPreferences(),
        filterPresets: this.getFilterPresets(),
        chartConfigs: this.getChartConfigs(),
        exportDate: new Date(),
        version: '1.0',
      }

      return JSON.stringify(allData, null, 2)
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)

      if (data.recentFiles) {
        this.save(this.KEYS.RECENT_FILES, data.recentFiles)
      }

      if (data.userPreferences) {
        this.save(this.KEYS.USER_PREFERENCES, data.userPreferences)
      }

      if (data.filterPresets) {
        this.save(this.KEYS.FILTER_PRESETS, data.filterPresets)
      }

      if (data.chartConfigs) {
        this.save(this.KEYS.CHART_CONFIGS, data.chartConfigs)
      }

      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }

  // OpenRouter helpers
  static saveOpenRouterEncryptedKey(payloadB64: string): void {
    this.save(this.KEYS.OPENROUTER_API_KEY_ENC, payloadB64)
  }

  static getOpenRouterEncryptedKey(): string | null {
    return this.load<string>(this.KEYS.OPENROUTER_API_KEY_ENC)
  }

  static removeOpenRouterEncryptedKey(): void {
    this.remove(this.KEYS.OPENROUTER_API_KEY_ENC)
  }

  static hasOpenRouterEncryptedKey(): boolean {
    return this.getOpenRouterEncryptedKey() != null
  }

  // Named OpenRouter encrypted keys
  private static getOpenRouterNamedKeysMap(): Record<string, string> {
    const map = this.load<Record<string, string>>(this.KEYS.OPENROUTER_NAMED_KEYS)
    return map || {}
  }

  private static setOpenRouterNamedKeysMap(map: Record<string, string>): void {
    this.save(this.KEYS.OPENROUTER_NAMED_KEYS, map)
  }

  static saveOpenRouterNamedKey(name: string, payloadB64: string): void {
    const trimmed = name.trim()
    if (!trimmed) return
    const map = this.getOpenRouterNamedKeysMap()
    map[trimmed] = payloadB64
    this.setOpenRouterNamedKeysMap(map)
  }

  static getOpenRouterNamedKeyPayload(name: string): string | null {
    const trimmed = name.trim()
    if (!trimmed) return null
    const map = this.getOpenRouterNamedKeysMap()
    return map[trimmed] ?? null
  }

  static getOpenRouterNamedKeyNames(): string[] {
    const map = this.getOpenRouterNamedKeysMap()
    return Object.keys(map).sort()
  }

  static removeOpenRouterNamedKey(name: string): void {
    const trimmed = name.trim()
    if (!trimmed) return
    const map = this.getOpenRouterNamedKeysMap()
    if (Object.prototype.hasOwnProperty.call(map, trimmed)) {
      delete map[trimmed]
      this.setOpenRouterNamedKeysMap(map)
    }
  }

  static saveOpenRouterSettings(settings: {
    selectedModelId?: string
    lastConnectedAt?: string
    analysisEnabled?: boolean
    lastUsedKeyName?: string
  }): void {
    this.save(this.KEYS.OPENROUTER_SETTINGS, settings)
  }

  static getOpenRouterSettings(): {
    selectedModelId?: string
    lastConnectedAt?: string
    analysisEnabled?: boolean
    lastUsedKeyName?: string
  } | null {
    return this.load(this.KEYS.OPENROUTER_SETTINGS)
  }
}

export interface StorageInfo {
  total: number
  used: number
  available: number
  appUsed: number
  appPercentage: number
}
