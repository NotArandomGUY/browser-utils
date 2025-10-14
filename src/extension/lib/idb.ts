export type IndexedDBTransactionCallback<T = void> = (transaction: IndexedDBTransaction) => Promise<T> | T

export interface IndexedDBStoreDefinition {
  name: string
  params: IDBObjectStoreParameters
}

export class IndexedDBObjectStore {
  private store: IDBObjectStore

  public constructor(store: IDBObjectStore) {
    this.store = store
  }

  public getAllKeys(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<IDBValidKey[]> {
    return new Promise<IDBValidKey[]>((resolve, reject) => {
      const request = this.store.getAllKeys(query, count)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  public has(query: IDBValidKey | IDBKeyRange): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const request = this.store.openCursor(query)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result != null)
    })
  }

  public get<T = unknown>(query: IDBValidKey | IDBKeyRange): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request = this.store.get(query)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  public put<T = unknown>(value: T, key?: IDBValidKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.store.put(value, key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  public delete(query: IDBValidKey | IDBKeyRange): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = this.store.delete(query)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export class IndexedDBTransaction {
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

  public objectStore(name: string): IndexedDBObjectStore {
    return new IndexedDBObjectStore(this.transaction.objectStore(name))
  }
}

export default class IndexedDB {
  private name: string
  private stores: IndexedDBStoreDefinition[]
  private db: IDBDatabase | null

  public constructor(name: string, stores: IndexedDBStoreDefinition[]) {
    this.name = name
    this.stores = stores
    this.db = null
  }

  public async open(): Promise<boolean> {
    const { name, stores, db } = this

    if (db != null) return false

    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(name)

      request.onerror = () => reject(request.error)
      request.onupgradeneeded = () => {
        const db = request.result

        stores.forEach((store) => db.createObjectStore(store.name, store.params))
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

  public async transaction<T = void>(
    storeNames: string | Iterable<string>,
    callback: IndexedDBTransactionCallback<T>,
  ): Promise<T> {
    const openDbByTransaction = await this.open()

    const db = this.db
    if (db == null) throw new Error('Failed to open DB')

    try {
      const transaction = new IndexedDBTransaction(db.transaction(storeNames, 'readwrite'))
      const result = await Promise.resolve(callback(transaction))

      await transaction.promise()

      return result
    } finally {
      if (openDbByTransaction) this.close()
    }
  }
}