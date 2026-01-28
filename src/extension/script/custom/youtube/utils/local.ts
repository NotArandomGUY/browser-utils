import { YTCommon, YTEndpoint, YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { EntityType } from '@ext/custom/youtube/proto/entity-key'
import { decryptAesCtr, decryptEntityData, encryptAesCtr, encryptEntityData, getNonce } from '@ext/custom/youtube/utils/crypto'
import { ceil } from '@ext/global/math'
import { PromiseWithProgress } from '@ext/lib/async'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import IndexedDB, { IndexedDBStoreDefinition } from '@ext/lib/idb'

export type ReverseEntityType = {
  [K in keyof typeof EntityType as typeof EntityType[K]]: K
}

export const enum YTLocalMediaType {
  AUDIO = 0,
  VIDEO
}

export type YTLocalEntityAssociation = readonly [
  parentEntityKey: string | null | undefined,
  childEntityKey: string | null | undefined
]

export type YTLocalEntityData = {
  [EntityType.downloadStatusEntity]: {
    downloadState: 'DOWNLOAD_STATE_PENDING_DOWNLOAD' | 'DOWNLOAD_STATE_DOWNLOAD_IN_PROGRESS' | 'DOWNLOAD_STATE_PAUSED' | 'DOWNLOAD_STATE_RETRYABLE_FAILURE' | 'DOWNLOAD_STATE_FAILED' | 'DOWNLOAD_STATE_COMPLETE' | 'DOWNLOAD_STATE_USER_DELETED'
    key: string
  }
  [EntityType.mainDownloadsListEntity]: {
    downloads?: {
      videoItem: string // ->mainVideoEntity
    }[]
    downloadsListVersion: string
    id: string
    refresh: string
  }
  [EntityType.mainPlaylistDownloadStateEntity]: {
    addedTimestampMillis: string
    key: string
    lastSyncedTimestampMillis: string
  }
  [EntityType.mainPlaylistEntity]: {
    channelOwner: string // ->ytMainChannelEntity
    downloadState: string // ->mainPlaylistDownloadStateEntity
    entityMetadata: {
      offlineLastModifiedTimestampSeconds: string
    }
    key: string
    playlistId: string
    title: string
    videos: string[] // ->mainPlaylistVideoEntity{"videoId":"...","playlistId":"..."}
    thumbnailStyleData: {
      key: null
      value: {
        collageThumbnail: {
          coverThumbnail: YTValueData<YTRenderer.Component<'thumbnail'>>
        }
      }
    }[]
    visibility: 'PLAYLIST_VISIBILITY_PUBLIC'
  }
  [EntityType.mainPlaylistVideoEntity]: {
    id: string // ->mainPlaylistVideoEntity{"videoId":"...","playlistId":"..."}
    video: string // ->mainVideoEntity
  }
  [EntityType.mainVideoDownloadStateEntity]: {
    addedTimestampMillis: string
    downloadStatusEntity: YTLocalEntityData[EntityType.downloadStatusEntity]
    playbackData: string // ->playbackData
  }
  [EntityType.mainVideoEntity]: {
    downloadState: string // ->mainVideoDownloadStateEntity
    formattedDescription: YTValueData<YTRenderer.Component<'text'>>
    key: string
    lengthSeconds: number
    localizedStrings: {
      viewCount: string
    }
    owner: string // ->ytMainChannelEntity
    publishedTimestampMillis: string
    thumbnail: YTValueData<YTRenderer.Component<'thumbnail'>>
    title: string
    userState?: {
      playbackPosition: string // ->videoPlaybackPositionEntity
    }
    videoId: string
  }
  [EntityType.offlineVideoPolicy]: NonNullable<YTValueData<YTEndpoint.Component<'entityMutationPayload'>>['offlineVideoPolicy']>
  [EntityType.offlineVideoStreams]: {
    key: string
    streamsProgress: {
      formatStreamBytes: string // local media index
      numBytesDownloaded: string
      numTotalBytes: string
      streamState: 'DOWNLOAD_STREAM_STATE_IN_PROGRESS' | 'DOWNLOAD_STREAM_STATE_ERROR_STREAMS_MISSING' | 'DOWNLOAD_STREAM_STATE_COMPLETE'
      streamType: 'STREAM_TYPE_UNKNOWN' | 'STREAM_TYPE_AUDIO' | 'STREAM_TYPE_VIDEO' | 'STREAM_TYPE_AUDIO_AND_VIDEO'
    }[]
  }
  [EntityType.playbackData]: NonNullable<YTValueData<YTEndpoint.Component<'entityMutationPayload'>>['playbackData']>
  [EntityType.transfer]: {
    cotn: string
    enqueuedTimestampMs: string
    hasLoggedFirstStarted: boolean
    isRefresh: boolean
    key: string
    lastProgressTimeMs: string
    maximumDownloadQuality: YTCommon.enums.OfflineFormatType
    offlineVideoStreams: string[] // ->offlineVideoStreams
    transferRetryCount: number
    transferState: 'TRANSFER_STATE_TRANSFER_IN_QUEUE' | 'TRANSFER_STATE_TRANSFERRING' | 'TRANSFER_STATE_PAUSED_BY_USER' | 'TRANSFER_STATE_FAILED' | 'TRANSFER_STATE_COMPLETE' | 'TRANSFER_STATE_WAITING_FOR_PLAYER_RESPONSE_REFRESH'
  }
  [EntityType.videoDownloadContextEntity]: { // smart download
    key: string
    offlineModeType: 'OFFLINE_MODE_TYPE_AUTO_OFFLINE' | 'OFFLINE_NOW'
    persistentData: string /* message { uint32 timestamp = 1; } */
  }
  [EntityType.videoPlaybackPositionEntity]: {
    key: string
    lastPlaybackPositionSeconds: string
    videoId: string
  }
  [EntityType.ytMainChannelEntity]: {
    avatar: YTValueData<YTRenderer.Component<'thumbnail'>>
    channelId: string
    channelVersion?: string
    id: string
    title: string
    userChannelDetails?: string
  }
}

export type YTLocalEntity<T extends keyof YTLocalEntityData | void = void> = T extends keyof YTLocalEntityData ? {
  version: number
  key: string
  entityType: ReverseEntityType[T]
  data: YTLocalEntityData[T]
} : {
  version: number
  key: string
  entityType: `${keyof typeof EntityType}`
  data: Uint8Array<ArrayBuffer>
}

export interface YTLocalMediaIndex<T extends YTLocalMediaType = YTLocalMediaType> {
  type: T
  fmts?: string
  format?: Partial<(
    T extends YTLocalMediaType.AUDIO ? {
      audioChannels: number
      audioSampleRate: string
      bitrate: number
      indexRange: { start: string, end: string }
      initRange: { start: string, end: string }
      itag: number
      lastModified: string
      mimeType: string
      url: string
    } :
    T extends YTLocalMediaType.VIDEO ? {
      bitrate: number
      fps: number
      height: number
      indexRange: { start: string, end: string }
      initRange: { start: string, end: string }
      itag: number
      lastModified: string
      mimeType: string
      quality: string
      qualityLabel: string
      url: string
      width: number
    } : never
  )>
}

export interface YTLocalMediaCaption {
  metadata: {
    languageCode: string
    languageName: string
    displayName: string
    kind: string
    name: string
    id: string | null
    is_servable: boolean
    is_default: boolean
    is_translateable: boolean
    vss_id: string
  }
  trackData: string
}

const PLAYER_LMS_KEY = 'yt-player-lv'

const LOCAL_DATABASE_CONFIGS = [
  {
    name: 'PersistentEntityStoreDb',
    stores: [
      { name: 'EntityStore', params: { keyPath: 'key' }, index: [{ name: 'entityType', keyPath: 'entityType' }] },
      { name: 'EntityAssociationStore', params: { keyPath: ['parentEntityKey', 'childEntityKey'] }, index: [{ name: 'byParentEntityKey', keyPath: 'parentEntityKey' }, { name: 'byChildEntityKey', keyPath: 'childEntityKey' }] }
    ]
  },
  {
    name: 'yt-player-local-media',
    stores: [
      { name: 'index' },
      { name: 'media' },
      { name: 'captions' }
    ]
  }
] as const satisfies { name: string, stores: IndexedDBStoreDefinition[] }[]

const getDataSyncId = (): string => {
  const datasyncId = ytcfg?.get('DATASYNC_ID')
  if (datasyncId == null) throw new Error('datasync id not set')

  return String(datasyncId)
}

const getPlayerLocalStorageKey = (key: string): string => {
  return `${getDataSyncId()}::yt-player::${key}`
}

const getLocalDataDB = <N extends number>(index: N): IndexedDB<typeof LOCAL_DATABASE_CONFIGS[N]['stores']> => {
  const config = LOCAL_DATABASE_CONFIGS[index]
  if (config == null) throw new Error('database config not found')

  return new IndexedDB(`${config.name}:${getDataSyncId()}`, config.stores)
}

const encodeYTLocalEntity = async <T extends keyof YTLocalEntityData | void>(entity: YTLocalEntity<T>, encrypt: T extends void ? false : true): Promise<YTLocalEntity> => {
  if (!encrypt) return entity as YTLocalEntity

  return {
    ...entity,
    data: await encryptEntityData(entity.key, bufferFromString(JSON.stringify(entity.data)))
  } as YTLocalEntity
}

const encodeYTLocalEntities = async <T extends keyof YTLocalEntityData | void>(entities: YTLocalEntity<T>[], encrypt: T extends void ? false : true): Promise<YTLocalEntity[]> => {
  return Promise.all(entities.map(entity => encodeYTLocalEntity(entity, encrypt)))
}

const decodeYTLocalEntity = async <T extends keyof YTLocalEntityData | void>(entity: YTLocalEntity, decrypt: T extends void ? false : true): Promise<YTLocalEntity<T>> => {
  if (!decrypt) return entity as YTLocalEntity<T>

  return {
    ...entity,
    data: JSON.parse(bufferToString(await decryptEntityData(entity.key, entity.data)))
  } as YTLocalEntity<T>
}

const decodeYTLocalEntities = async <T extends keyof YTLocalEntityData | void>(entities: YTLocalEntity[], decrypt: T extends void ? false : true): Promise<YTLocalEntity<T>[]> => {
  return Promise.all(entities.map(entity => decodeYTLocalEntity(entity, decrypt)))
}

export const getYTLocalMediaStorage = (): Record<string, number> => {
  try {
    const data = JSON.parse(localStorage.getItem(getPlayerLocalStorageKey(PLAYER_LMS_KEY)) ?? '{}')?.data
    return JSON.parse(data ?? '{}') ?? {}
  } catch {
    return {}
  }
}

export const getYTLocalEntityByType = async <T extends keyof YTLocalEntityData | void = void>(entityType: T extends void ? EntityType : T, decrypt: T extends void ? false : true): Promise<YTLocalEntity<T> | null> => {
  const entity = await getLocalDataDB(0).transaction(
    'EntityStore',
    async trans => {
      const store = trans.objectStore('EntityStore').index('entityType')
      const key = typeof entityType === 'string' ? entityType : EntityType[entityType]
      return await store.has(key) ? store.get<YTLocalEntity>(key) : null
    }
  )
  if (entity == null) return null

  return decodeYTLocalEntity(entity, decrypt)
}

export const getYTLocalEntityByKey = async <T extends keyof YTLocalEntityData | void = void>(entityKey: string, decrypt: T extends void ? false : true): Promise<YTLocalEntity<T> | null> => {
  const entity = await getLocalDataDB(0).transaction(
    'EntityStore',
    async trans => {
      const store = trans.objectStore('EntityStore')
      return await store.has(entityKey) ? store.get<YTLocalEntity>(entityKey) : null
    }
  )
  if (entity == null) return null

  return decodeYTLocalEntity(entity, decrypt)
}

export const getYTLocalEntitiesByType = async <T extends keyof YTLocalEntityData | void = void>(entityType: T extends void ? EntityType : T, decrypt: T extends void ? false : true): Promise<YTLocalEntity<T>[]> => {
  return decodeYTLocalEntities(await getLocalDataDB(0).transaction(
    'EntityStore',
    trans => trans.objectStore('EntityStore').index('entityType').getAll<YTLocalEntity[]>(typeof entityType === 'string' ? entityType : EntityType[entityType])
  ), decrypt)
}

export const getYTLocalEntitiesByKey = async <T extends keyof YTLocalEntityData | void = void>(entityKey: string, decrypt: T extends void ? false : true): Promise<YTLocalEntity<T>[]> => {
  return decodeYTLocalEntities(await getLocalDataDB(0).transaction(
    'EntityStore',
    trans => trans.objectStore('EntityStore').getAll<YTLocalEntity[]>(entityKey)
  ), decrypt)
}

export const getYTLocalEntities = async <D extends boolean>(decrypt: D): Promise<YTLocalEntity<D extends true ? keyof YTLocalEntityData : void>[]> => {
  return decodeYTLocalEntities(await getLocalDataDB(0).transaction(
    'EntityStore',
    trans => trans.objectStore('EntityStore').getAll<YTLocalEntity[]>()
  ), decrypt as Parameters<typeof decodeYTLocalEntities<D extends true ? keyof YTLocalEntityData : void>>[1])
}

export const getYTLocalMediaCaptions = async (id: string): Promise<YTLocalMediaCaption[]> => {
  return getLocalDataDB(1).transaction(
    'captions',
    trans => trans.objectStore('captions').getAll(IDBKeyRange.bound(`${id}|`, `${id}~`))
  )
}

export const getYTLocalMediaIndex = async <T extends YTLocalMediaType>(id: string, type: T): Promise<YTLocalMediaIndex<T>> => {
  const index = await getLocalDataDB(1).transaction(
    'index',
    trans => trans.objectStore('index').get<YTLocalMediaIndex<T>>(`${id}|${['a', 'v'][type]}`)
  )

  return { ...index, type }
}

export const getYTLocalMediaChunks = (
  index: YTLocalMediaIndex,
  decrypt: boolean,
  begin?: number,
  end?: number
) => new PromiseWithProgress<Uint8Array<ArrayBuffer>[], number>(async (resolve, reject, progress) => {
  try {
    if (typeof index.format?.url !== 'string') throw new Error('invalid media index')

    const { searchParams: params } = new URL(index.format.url)

    const videoId = params.get('docid') ?? ''
    const formatId = params.get('fmtid') ?? ''
    const lastModified = params.get('lmt') ?? '0'
    const contentLength = Number(params.get('clen'))
    const chunkSize = Number(params.get('csz'))
    const chunkCount = ceil(contentLength / chunkSize)
    if (isNaN(chunkCount)) throw new Error('unknown media size')

    const chunkKey = bufferFromString(params.get('ck')?.padEnd(16, '\x00') ?? '')
    const chunkIv = bufferFromString(params.get('civ')?.padEnd(16, '\x00') ?? '')
    const transform = !decrypt || chunkKey.length < 16 || chunkIv.length < 16 ?
      async (chunk: Uint8Array<ArrayBuffer>) => chunk :
      decryptAesCtr.bind(null, chunkKey, chunkIv)

    resolve(await getLocalDataDB(1).transaction(
      'media',
      trans => {
        const store = trans.objectStore('media')
        const tasks: Promise<Uint8Array<ArrayBuffer>>[] = []

        let complete = 0

        end ??= chunkCount
        for (let i = begin ?? 0; i < end; i++) {
          tasks.push(
            store.get<Uint8Array<ArrayBuffer>>(`${videoId}|${formatId}|${lastModified}|${String(i).padStart(10, '0')}`)
              .then(transform)
              .then(chunk => {
                progress(++complete / tasks.length)
                return chunk
              })
          )
        }

        return Promise.all(tasks)
      }
    ))
  } catch (error) {
    reject(error)
  }
})

export const putYTLocalEntity = async <T extends keyof YTLocalEntityData | void = void>(entity: YTLocalEntity<T>, encrypt: T extends void ? false : true): Promise<void> => {
  const encodedEntity = await encodeYTLocalEntity(entity, encrypt)

  await getLocalDataDB(0).transaction(
    'EntityStore',
    trans => trans.objectStore('EntityStore').put(encodedEntity)
  )
}

export const putYTLocalEntities = async <T extends keyof YTLocalEntityData | void = void>(entities: YTLocalEntity<T>[], encrypt: T extends void ? false : true): Promise<void> => {
  const encodedEntities = await encodeYTLocalEntities(entities, encrypt)

  await getLocalDataDB(0).transaction(
    'EntityStore',
    trans => {
      const store = trans.objectStore('EntityStore')
      return Promise.all(encodedEntities.map(encodedEntity => store.put(encodedEntity)))
    }
  )
}

export const putYTLocalEntityAssociation = async (associations: YTLocalEntityAssociation[]): Promise<void> => {
  await getLocalDataDB(0).transaction(
    'EntityAssociationStore',
    trans => {
      const store = trans.objectStore('EntityAssociationStore')
      return Promise.all(
        associations
          .filter(([parentEntityKey, childEntityKey]) => parentEntityKey != null && childEntityKey != null)
          .map(([parentEntityKey, childEntityKey]) => store.put({ parentEntityKey, childEntityKey }))
      )
    }
  )
}

export const putYTLocalMediaCaptions = async (id: string, captions: YTLocalMediaCaption[]): Promise<void> => {
  await getLocalDataDB(1).transaction(
    'captions',
    trans => {
      const store = trans.objectStore('captions')
      return Promise.all(captions.map(caption => store.put(caption, `${id}|${caption.metadata.vss_id}`)))
    }
  )
}

export const putYTLocalMediaStream = (index: YTLocalMediaIndex, chunks: Uint8Array<ArrayBuffer>[]) => new PromiseWithProgress<void, number>(async (resolve, reject, progress) => {
  const transactionKeys: string[] = []

  let db: IndexedDB<typeof LOCAL_DATABASE_CONFIGS[1]['stores']> | null = null

  try {
    db = getLocalDataDB(1)

    if (typeof index.format?.url !== 'string') throw new Error('invalid media index')

    const url = new URL(index.format.url)
    const { searchParams: params } = url

    const videoId = params.get('docid') ?? ''
    const formatId = params.get('fmtid') ?? ''
    const lastModified = params.get('lmt') ?? '0'
    const contentLength = Number(params.get('clen'))
    const chunkSize = Number(params.get('csz'))
    const chunkCount = ceil(contentLength / chunkSize)
    if (chunkCount !== chunks.length) throw new Error('invalid chunk count')

    let chunkKey = bufferFromString(params.get('ck')?.padEnd(16, '\x00') ?? '')
    let chunkIv = bufferFromString(params.get('civ')?.padEnd(16, '\x00') ?? '')
    let transform = decryptAesCtr.bind(null, chunkKey, chunkIv)

    let complete = 0
    if (chunkKey.length >= 16 && chunkIv.length >= 16) {
      chunks = await Promise.all(chunks.map(chunk => transform(chunk).then(chunk => {
        progress((++complete / chunkCount) * 0.25)
        return chunk
      })))
    }

    const totalChunkSize = chunks.reduce((p, c) => p + c.length, 0)
    if (totalChunkSize !== contentLength) throw new Error('invalid total chunk size')

    const invalidChunk = chunks.find((chunk, i) => i < (chunkCount - 1) ? chunk.length !== chunkSize : chunk.length > chunkSize)
    if (invalidChunk != null) throw new Error('invalid chunk size')

    chunkKey = bufferFromString(getNonce(16))
    chunkIv = bufferFromString(getNonce(16))
    transform = encryptAesCtr.bind(null, chunkKey, chunkIv)

    complete = 0
    chunks = await Promise.all(
      chunks.map(chunk => transform(chunk).then(chunk => {
        progress((++complete / chunkCount) * 0.25 + 0.25)
        return chunk
      }))
    )

    params.set('ck', bufferToString(chunkKey))
    params.set('civ', bufferToString(chunkIv))
    index.format.url = url.toString()

    await db.transaction(
      'index',
      trans => trans.objectStore('index').put({ fmts: index.fmts, format: index.format }, `${videoId}|${['a', 'v'][index.type]}`)
    )

    complete = 0
    await db.transaction(
      'media',
      trans => {
        const store = trans.objectStore('media')
        return Promise.all(
          chunks.map((chunk, i) => {
            const key = `${videoId}|${formatId}|${lastModified}|${String(i).padStart(10, '0')}`
            return store.put(chunk, key).then(() => progress((++complete / chunkCount) * 0.5 + 0.5))
          })
        )
      }
    )

    resolve()
  } catch (error) {
    if (db == null || transactionKeys.length === 0) return reject(error)

    db.transaction(
      ['index', 'media'],
      trans => {
        const store = trans.objectStore('media')
        return Promise.all([
          trans.objectStore('index').delete(transactionKeys[0]),
          Promise.all(transactionKeys.slice(1).map(key => store.delete(key)))
        ])
      }
    ).then(() => {
      reject(error)
    }).catch(error => {
      reject(error)
    })
  }
})

export const setYTLocalMediaStorage = (data: Record<string, number>): void => {
  localStorage.setItem(getPlayerLocalStorageKey(PLAYER_LMS_KEY), JSON.stringify({
    creation: Date.now(),
    data: JSON.stringify(data)
  }))
}