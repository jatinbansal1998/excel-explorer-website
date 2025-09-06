export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>
  setItem<T>(key: string, value: T): Promise<boolean>
  removeItem(key: string): Promise<boolean>
}

export interface StorageKeys {
  activeSessionId: string
  sessionsIndex: string
}

export const DEFAULT_STORAGE_KEYS: StorageKeys = {
  activeSessionId: 'active-session-id',
  sessionsIndex: 'sessions-index',
}

export const PERSISTENCE_FEATURE_FLAG_KEY = 'excel-explorer-persistence-enabled'
