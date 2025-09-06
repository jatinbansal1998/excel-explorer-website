import { StorageAdapter } from './adapter'

export class LocalStorageAdapter implements StorageAdapter {
  private readonly prefix: string

  constructor(prefix: string = 'excel-explorer-') {
    this.prefix = prefix
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.prefix + key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch (error) {
      console.error('LocalStorageAdapter.getItem error', error)
      return null
    }
  }

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const raw = JSON.stringify(value)
      localStorage.setItem(this.prefix + key, raw)
      return true
    } catch (error) {
      console.error('LocalStorageAdapter.setItem error', error)
      return false
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(this.prefix + key)
      return true
    } catch (error) {
      console.error('LocalStorageAdapter.removeItem error', error)
      return false
    }
  }
}
