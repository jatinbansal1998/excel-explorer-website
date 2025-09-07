import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { StorageAdapter } from './adapter'

interface ExplorerDB extends DBSchema {
  kv: {
    key: string
    value: unknown
  }
}

export class IndexedDbAdapter implements StorageAdapter {
  private readonly dbPromise: Promise<IDBPDatabase<ExplorerDB>>

  constructor(dbName: string = 'excel-explorer-db') {
    this.dbPromise = openDB<ExplorerDB>(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv')
        }
      },
    })
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const db = await this.dbPromise
      const value = await db.get('kv', key)
      return (value as T) ?? null
    } catch (error) {
      console.error('IndexedDbAdapter.getItem error', error)
      return null
    }
  }

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const db = await this.dbPromise
      await db.put('kv', value as unknown, key)
      return true
    } catch (error) {
      console.error('IndexedDbAdapter.setItem error', error)
      return false
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      const db = await this.dbPromise
      await db.delete('kv', key)
      return true
    } catch (error) {
      console.error('IndexedDbAdapter.removeItem error', error)
      return false
    }
  }
}
