export type IndexedDBTransactionCallback<T = void, S extends string[] = string[]> = (
  transaction: IndexedDBTransaction<S>,
) => Promise<T> | T

export interface IndexedDBIndexDefinition {
  name: string
  keyPath: string | string[]
  params?: IDBIndexParameters
}

export interface IndexedDBStoreDefinition {
  name: string
  params?: IDBObjectStoreParameters
  index?: IndexedDBIndexDefinition[]
}

export class IndexedDBIndex<I extends IDBObjectStore | IDBIndex = IDBIndex> {
  protected interface: I

  public constructor(index: I) {
    this.interface = index
  }

  public getAllKeys(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<IDBValidKey[]> {
    return new Promise<IDBValidKey[]>((resolve, reject) => {
      const request = this.interface.getAllKeys(query, count)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  public getAll<T extends unknown[] = unknown[]>(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request = this.interface.getAll(query, count)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result as T)
    })
  }

  public has(query: IDBValidKey | IDBKeyRange): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const request = this.interface.openCursor(query)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result != null)
    })
  }

  public get<T = unknown>(query: IDBValidKey | IDBKeyRange): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request = this.interface.get(query)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }
}

export class IndexedDBObjectStore extends IndexedDBIndex<IDBObjectStore> {
  public constructor(store: IDBObjectStore) {
    super(store)
  }

  public put<T = unknown>(value: T, key?: IDBValidKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.interface.put(value, key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  public delete(query: IDBValidKey | IDBKeyRange): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = this.interface.delete(query)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  public index(name: string): IndexedDBIndex {
    return new IndexedDBIndex(this.interface.index(name))
  }
}

export class IndexedDBTransaction<const S extends string[] = string[]> {
  private transaction: IDBTransaction

  public constructor(transaction: IDBTransaction) {
    this.transaction = transaction
  }

  public promise(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { transaction } = this

      transaction.addEventListener('error', () => reject(transaction.error))
      transaction.addEventListener('complete', () => resolve())
    })
  }

  public objectStore(name: S[number]): IndexedDBObjectStore {
    return new IndexedDBObjectStore(this.transaction.objectStore(name))
  }
}

export default class IndexedDB<const Stores extends IndexedDBStoreDefinition[] = IndexedDBStoreDefinition[]> {
  private name: string
  private stores: IndexedDBStoreDefinition[]
  private db: IDBDatabase | null

  public constructor(name: string, stores: Stores) {
    this.name = name
    this.stores = stores
    this.db = null
  }

  public [Symbol.dispose](): void {
    this.close()
  }

  public async open(): Promise<boolean> {
    const { name, stores, db } = this

    if (db != null) return false

    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(name)

      request.onerror = () => reject(request.error)
      request.onupgradeneeded = () => {
        const db = request.result

        stores.forEach(({ name, params, index }) => {
          const store = db.createObjectStore(name, params)
          index?.forEach(({ name, keyPath, params }) => store.createIndex(name, keyPath, params))
          return store
        })
      }
      request.onsuccess = () => {
        const db = request.result

        db.onerror = (event) => console.warn('idb error event:', event)
        db.onclose = () => {
          if (this.db === db) this.db = null
        }

        this.db = db

        resolve(true)
      }
    })
  }

  public close(): void {
    this.db?.close()
    this.db = null
  }

  public async transaction<T = void, S extends Stores[number]['name'] | Stores[number]['name'][] = []>(
    storeNames: S,
    callback: IndexedDBTransactionCallback<T, S extends string ? [S] : S>,
  ): Promise<T> {
    const openDbByTransaction = await this.open()

    const db = this.db
    if (db == null) throw new Error('Failed to open DB')

    try {
      const transaction = new IndexedDBTransaction(db.transaction(storeNames, 'readwrite'))

      return (await Promise.all([
        callback(transaction),
        transaction.promise()
      ]))[0]
    } finally {
      if (openDbByTransaction) this.close()
    }
  }
}