import IndexedDB, { IndexedDBStoreDefinition } from '@ext/lib/idb'

interface IndexedKVEntry<T> {
  key: string
  value: T
}

export default class IndexedKV extends IndexedDB {
  public constructor(name: string, stores?: IndexedDBStoreDefinition[]) {
    super(name, [{ name: 'kv', params: { keyPath: 'key' } }, ...stores ?? []])
  }

  public async keys(): Promise<string[]> {
    return (await this.transaction('kv', trans => trans.objectStore('kv').getAllKeys())).map(String)
  }

  public async has(key: string): Promise<boolean> {
    return this.transaction('kv', trans => trans.objectStore('kv').has(key))
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = await this.transaction('kv', async trans => {
      const store = trans.objectStore('kv')
      if (!await store.has(key)) return null

      return store.get<IndexedKVEntry<T>>(key)
    })

    return entry?.value ?? null
  }

  public async put<T>(key: string, value: T): Promise<void> {
    await this.transaction('kv', trans => trans.objectStore('kv').put<IndexedKVEntry<T>>({ key, value }))
  }

  public async delete(key: string): Promise<void> {
    await this.transaction('kv', async trans => {
      const store = trans.objectStore('kv')
      if (await store.has(key)) await store.delete(key)
    })
  }
}