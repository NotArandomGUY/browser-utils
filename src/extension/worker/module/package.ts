import { defineProperty } from '@ext/global/object'
import { Mutex } from '@ext/lib/async'
import Callback from '@ext/lib/callback'
import { compress, decompress } from '@ext/lib/compression'
import { Feature } from '@ext/lib/feature'
import IndexedKV from '@ext/lib/ikv'
import Logger from '@ext/lib/logger'
import { ExtensionMessageSource, ExtensionMessageType, getExtensionMessageSender } from '@ext/lib/message/extension'
import RemoteBranch from '@ext/proto/remote/branch'
import RemotePackage from '@ext/proto/remote/package'
import { IScriptEntry } from '@ext/proto/script/entry'
import ScriptPackage from '@ext/proto/script/package'

const { subtle } = crypto

const ALARM_NAME = 'package-update'
const BRANCH_KV = 'branch'
const DEFAULT_BRANCH_ID = 'main'
const MAX_CACHE_PACKAGE_COUNT = 3
const AUTO_UPDATE_INTERVAL = 4 * 60 // 4h
const ENCRYPT_ALGO = { name: 'AES-CBC', length: 256 }

const logger = new Logger('WORKER-PACKAGE')

interface IDBPackageEntry {
  version: string
  data: Uint8Array<ArrayBuffer>
}

const fetchMutex = new Mutex()
const loadMutex = new Mutex()

const db = new IndexedKV('package', [{ name: 'spk', params: { keyPath: 'version' } }])
const cache = new ScriptPackage({})

export const PackageLoadCallback = new Callback()

const parseVersion = (version: string): number[] => {
  return version.match(/\d+(?=\.|$)/g)?.map(v => parseInt(v)) ?? []
}

const compareVersion = (left: string, right: string): number => {
  const l = parseVersion(left)
  const r = parseVersion(right)
  return (l.length >= r.length ? l : r).map((_, i) => Math.sign((l[i] ?? 0) - (r[i] ?? 0))).find(v => v !== 0) ?? 0
}

const getCachedPackageVersions = async (branch: string): Promise<string[]> => {
  const versions = await db.transaction('spk', trans => trans.objectStore('spk').getAllKeys())
  const prefix = `${branch}:`

  return versions.map(String).filter(version => version.startsWith(prefix)).sort(compareVersion).reverse()
}

const getRemoteBranch = async (): Promise<InstanceType<typeof RemoteBranch> & { id: string }> => {
  const rpk = new RemotePackage({})

  const rsp = await fetch(chrome.runtime.getURL('extension.rpk'))
  if (rsp.ok) rpk.deserialize(await decompress(await rsp.arrayBuffer(), 'deflate'))

  const branchId = await db.get<string>(BRANCH_KV) ?? DEFAULT_BRANCH_ID

  const branch = rpk.branches?.find(b => b.id === branchId) ?? rpk.branches?.find(b => b.id === DEFAULT_BRANCH_ID)
  if (branch == null) throw new Error('missing branch config')

  branch.id ??= branchId
  db.put(BRANCH_KV, branch.id).catch(error => logger.warn('store branch kv error:', error))

  return branch as Awaited<ReturnType<typeof getRemoteBranch>>
}

const setPackageUpdateStatus = (status: string): void => {
  logger.info(status)

  if (cache.messageKey == null) return

  getExtensionMessageSender(cache.messageKey, ExtensionMessageSource.WORKER).sendMessageToMain(ExtensionMessageType.PACKAGE_UPDATE, { status })
}

const encryptScriptPackage = async (branch: InstanceType<typeof RemoteBranch>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> => {
  data = await compress(data, 'deflate')
  if (branch.encryptKey == null || branch.publicKey == null) return data

  const key = await subtle.importKey('raw', branch.encryptKey, ENCRYPT_ALGO, false, ['encrypt'])
  return new Uint8Array(await subtle.encrypt({ ...ENCRYPT_ALGO, iv: branch.publicKey.subarray(0, 16) }, key, data))
}

const decryptScriptPackage = async (branch: InstanceType<typeof RemoteBranch>, data: BufferSource): Promise<Uint8Array<ArrayBuffer>> => {
  if (branch.encryptKey != null && branch.publicKey != null) {
    const key = await subtle.importKey('raw', branch.encryptKey, ENCRYPT_ALGO, false, ['decrypt'])
    data = new Uint8Array(await subtle.decrypt({ ...ENCRYPT_ALGO, iv: branch.publicKey.subarray(0, 16) }, key, data))
  }

  return decompress(data, 'deflate')
}

const verifyScriptPackage = async (spk: InstanceType<typeof ScriptPackage>, branch?: InstanceType<typeof RemoteBranch>): Promise<boolean> => {
  if (spk.sign == null) throw new Error('missing sign')

  if (branch == null) branch = await getRemoteBranch()
  if (branch.publicKey == null) throw new Error('missing public key')

  const key = await subtle.importKey('spki', branch.publicKey, { name: 'Ed25519' }, false, ['verify'])

  return await subtle.verify({ name: 'Ed25519' }, key, spk.sign, new ScriptPackage({ ...spk, sign: null }).serialize())
}

const openScriptPackage = async (): Promise<boolean> => {
  let isCloseDb = false

  await loadMutex.lock()
  try {
    if (cache.version != null) return true

    isCloseDb = await db.open()

    const branch = await getRemoteBranch()
    const versions = await getCachedPackageVersions(branch.id)

    for (const version of versions) {
      try {
        const { data } = await db.transaction('spk', trans => trans.objectStore('spk').get<IDBPackageEntry>(version))
        cache.deserialize(await decryptScriptPackage(branch, data))
      } catch (error) {
        logger.warn(`package '${version}' deserialize error:`, error)
      }

      if (cache.version !== parseVersion(version).join('.') || !await verifyScriptPackage(cache)) {
        logger.warn(`package '${version}' cache data invalid`)
        await db.transaction('spk', trans => trans.objectStore('spk').delete(version))
        continue
      }

      logger.info(`load package '${version}'`)
      return true
    }
  } catch (error) {
    logger.warn('open package error:', error)
    closeScriptPackage()
  } finally {
    if (isCloseDb) db.close()
    loadMutex.unlock()
  }

  return false
}

const closeScriptPackage = (): void => {
  if (cache.version == null) return

  cache.reset()
  cache.version = null
}

const onStartup = async (): Promise<void> => {
  const isOpen = await openScriptPackage()

  chrome.alarms.clear(ALARM_NAME)
  chrome.alarms.create(ALARM_NAME, { when: Date.now() + (isOpen ? 10e3 : 0), periodInMinutes: AUTO_UPDATE_INTERVAL })

  if (isOpen) PackageLoadCallback.invoke()
}

const onAlarm = (alarm: chrome.alarms.Alarm): void => {
  if (alarm.name !== ALARM_NAME) return

  updateScriptPackage()
}

export const updateScriptPackage = async (): Promise<boolean> => {
  if (fetchMutex.isLocked) return false

  let isCloseDb = false

  await fetchMutex.lock()
  try {
    await db.open()

    const branch = await getRemoteBranch()

    setPackageUpdateStatus(`checking '${branch.id}' branch for package update...`)

    const rsp = await fetch(branch.url || chrome.runtime.getURL(`package/${branch.id}.spk`))
    if (!rsp.ok) throw new Error(`network error status (${rsp.status})`)

    // Parse package
    const spk = new ScriptPackage().deserialize(await decryptScriptPackage(branch, await rsp.arrayBuffer()))

    const version = `${branch.id}:${spk.version}`
    if (parseVersion(version).length === 0) throw new Error('invalid version')

    // Check if this is a new package
    const versions = await getCachedPackageVersions(branch.id)
    if (versions.find(cacheVersion => compareVersion(version, cacheVersion) <= 0)) {
      setPackageUpdateStatus(`package '${version}' is up to date`)
      return false
    }

    // Verify package integrity
    if (!await verifyScriptPackage(spk, branch)) throw new Error('invalid signature')

    // Delete outdated cache
    const outdatedVersions = versions.slice(MAX_CACHE_PACKAGE_COUNT - 1)
    if (outdatedVersions.length > 0) {
      await db.transaction('spk', async trans => {
        const store = trans.objectStore('spk')
        await Promise.all(outdatedVersions.map(store.delete.bind(store)))
      })
    }

    // Save package to cache
    const data = await encryptScriptPackage(branch, spk.serialize())
    await db.transaction('spk', trans => trans.objectStore('spk').put<IDBPackageEntry>({ version, data }))

    setPackageUpdateStatus(`package '${versions[0] ?? 'N/A'}' updated to '${version}'`)

    closeScriptPackage()
    if (!await openScriptPackage()) return false

    PackageLoadCallback.invoke()
    return true
  } catch (error) {
    setPackageUpdateStatus(`fetch package error: ${error instanceof Error ? error.message : String(error)}`)
    return false
  } finally {
    if (isCloseDb) db.close()
    fetchMutex.unlock()
  }
}

export const reloadScriptPackage = async (): Promise<void> => {
  closeScriptPackage()
  if (await openScriptPackage()) PackageLoadCallback.invoke()
}

export const getPackageMessageKey = async (): Promise<Uint8Array | null> => {
  await openScriptPackage()
  return cache.messageKey
}

export const getPackageScriptIDs = async (): Promise<string[]> => {
  await openScriptPackage()
  return cache.entries?.map(e => e.id).filter(id => id != null) ?? []
}

export const getPackageScriptEntry = async (id: string): Promise<IScriptEntry | null> => {
  await openScriptPackage()
  return cache.entries?.find(e => e.id === id) ?? null
}

export const parseOptionalConfig = <T extends object>(data: T): { [K in keyof T as T[K] extends Function ? never : K]?: NonNullable<T[K]> } => {
  return Object.fromEntries(Object.entries(data).filter(e => e[1] != null && typeof e[1] !== 'function')) as ReturnType<typeof parseOptionalConfig<T>>
}

export default class WorkerPackageModule extends Feature {
  protected activate(): boolean {
    chrome.runtime.onInstalled.addListener(onStartup)
    chrome.runtime.onStartup.addListener(onStartup)

    chrome.alarms.onAlarm.addListener(onAlarm)

    defineProperty(globalThis, 'setRemoteBranch', {
      configurable: true,
      writable: false,
      async value(branch: unknown) {
        if (typeof branch !== 'string') throw new Error('invalid branch provided')

        await db.put(BRANCH_KV, branch)
        if (await updateScriptPackage()) return

        await reloadScriptPackage()
      }
    })

    return true
  }

  protected deactivate(): boolean {
    chrome.runtime.onInstalled.removeListener(onStartup)
    chrome.runtime.onStartup.removeListener(onStartup)

    chrome.alarms.clear(ALARM_NAME)
    chrome.alarms.onAlarm.removeListener(onAlarm)

    closeScriptPackage()

    return true
  }
}