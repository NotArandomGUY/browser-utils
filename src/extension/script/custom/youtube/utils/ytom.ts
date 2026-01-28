import { YTCommon, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { decodeEntityKey, encodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import FormatRange from '@ext/custom/youtube/proto/gvs/common/format-range'
import YTOfflineMediaCaption from '@ext/custom/youtube/proto/ytom/caption'
import YTOfflineMediaEntity from '@ext/custom/youtube/proto/ytom/entity'
import YTOfflineMediaMetadata from '@ext/custom/youtube/proto/ytom/metadata'
import YTOfflineMediaStream from '@ext/custom/youtube/proto/ytom/stream'
import { decryptAesCtr, deriveAesCtrKey, digestSHA256, encodeTrackingParam, encryptAesCtr, getNonce } from '@ext/custom/youtube/utils/crypto'
import { getYTLocalEntityByKey, getYTLocalMediaCaptions, getYTLocalMediaChunks, getYTLocalMediaIndex, getYTLocalMediaStorage, putYTLocalEntities, putYTLocalEntity, putYTLocalEntityAssociation, putYTLocalMediaCaptions, putYTLocalMediaStream, setYTLocalMediaStorage, YTLocalEntity, YTLocalEntityAssociation, YTLocalEntityData, YTLocalMediaIndex, YTLocalMediaType } from '@ext/custom/youtube/utils/local'
import { updateYTReduxStoreLocalEntities } from '@ext/custom/youtube/utils/redux'
import { ceil } from '@ext/global/math'
import { URLSearchParams } from '@ext/global/network'
import { assign, entries, fromEntries, values } from '@ext/global/object'
import { PromiseWithProgress } from '@ext/lib/async'
import { bufferConcat, bufferFromString, bufferReadUInt32LE, bufferToString, bufferWriteUInt32LE } from '@ext/lib/buffer'
import { compress, decompress } from '@ext/lib/compression'
import { execFFmpeg } from '@ext/lib/ffmpeg'

const BUNDLE_MAGIC = 'YTOM'
const BUNDLE_VERSION = 1
const BUNDLE_HEADER_SIZE = 32

const EXPORTABLE_ENTITY_TYPES = [
  EntityType.downloadStatusEntity,
  EntityType.mainVideoDownloadStateEntity,
  EntityType.mainVideoEntity,
  EntityType.offlineVideoPolicy,
  EntityType.playbackData,
  EntityType.transfer,
  EntityType.ytMainChannelEntity
] satisfies EntityType[]
const MEDIA_STREAM_TYPES = [YTLocalMediaType.AUDIO, YTLocalMediaType.VIDEO]

const mimeTypeToExt = (mimeType = ''): string => {
  return /(?<=^(audio|video)\/)[A-Za-z0-9]+/.exec(mimeType)?.[0] ?? 'bin'
}

const downloadBlob = (blob: Blob, id: string, type?: string): void => {
  const body = document.body
  const link = document.createElement('a')

  link.href = URL.createObjectURL(blob)
  link.download = `youtube.${id}.${type ?? mimeTypeToExt(blob.type)}`

  body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(link.href)
}

const sanitizeMediaFormat = (data: YTValueData<YTRenderer.Component<'mediaFormat'>>): YTValueData<YTRenderer.Component<'mediaFormat'>> => {
  delete data.signatureCipher
  delete data.url

  return data
}

const sanitizeEntity = <T extends keyof YTLocalEntityData>(entity: YTLocalEntity<T>): YTLocalEntity<T> => {
  switch (entity.entityType) {
    case 'mainVideoEntity':
      delete entity.data.userState
      break
    case 'offlineVideoPolicy':
      assign(entity.data, {
        expirationTimestamp: 'Infinity',
        lastUpdatedTimestampSeconds: 'Infinity',
        offlineStateBytes: null,
        offlineToken: null
      })
      break
    case 'playbackData': {
      const playerResponse: YTValueData<YTResponse.Mapped<'player'>> = JSON.parse(entity.data.playerResponseJson ?? '{}')

      delete playerResponse.playerConfig?.mediaCommonConfig?.mediaUstreamerRequestConfig

      assign(entity.data, {
        playerResponseJson: JSON.stringify(assign(playerResponse, {
          adBreakHeartbeatParams: null,
          offlineState: null,
          playbackTracking: {},
          responseContext: {
            mainAppWebResponseContext: {
              trackingParam: encodeTrackingParam('CioKDnRyYWNraW5nUGFyYW1zEhhDQUFRQUNJTUNBQVZBQUFBQUIwQUFBQUE')
            }
          },
          streamingData: {
            adaptiveFormats: playerResponse.streamingData?.adaptiveFormats?.map(sanitizeMediaFormat),
            formats: playerResponse.streamingData?.formats?.map(sanitizeMediaFormat)
          },
          trackingParams: 'CAAQACIMCAAVAAAAAB0AAAAA'
        })),
        playerResponseTimestamp: '0',
        streamDownloadTimestampSeconds: '0'
      })
      break
    }
    case 'transfer':
      assign(entity.data, {
        cotn: getNonce(16),
        offlineVideoStreams: [
          encodeEntityKey({
            entityId: decodeEntityKey(entity.key).entityId,
            entityType: EntityType.offlineVideoStreams,
            isPersistent: true
          })
        ]
      })
      break
    case 'videoPlaybackPositionEntity':
      entity.data.lastPlaybackPositionSeconds = '0'
      break
  }

  return entity
}

const encodeYTOfflineMediaEntity = (decodedEntity: YTLocalEntity<keyof YTLocalEntityData>): InstanceType<typeof YTOfflineMediaEntity> => {
  const { version, key, data } = decodedEntity

  return new YTOfflineMediaEntity({
    version,
    key: decodeEntityKey(key),
    data: JSON.stringify(data)
  })
}

const decodeYTOfflineMediaEntity = (encodedEntity: InstanceType<typeof YTOfflineMediaEntity>, associations: YTLocalEntityAssociation[]): YTLocalEntity<keyof YTLocalEntityData> => {
  const { version, key, data } = encodedEntity

  const entityKey = encodeEntityKey(key ?? {})
  const decodedEntity = {
    version: version ?? 1,
    key: entityKey,
    entityType: EntityType[key?.entityType!],
    data: JSON.parse(data ?? 'null')
  } as YTLocalEntity<keyof YTLocalEntityData>

  switch (decodedEntity.entityType) {
    case 'mainVideoDownloadStateEntity':
      associations.push(
        [entityKey, decodedEntity.data.downloadStatusEntity.key],
        [entityKey, decodedEntity.data.playbackData]
      )
      break
    case 'mainVideoEntity':
      associations.push(
        [entityKey, decodedEntity.data.downloadState],
        [entityKey, decodedEntity.data.owner],
        [entityKey, decodedEntity.data.userState?.playbackPosition]
      )
      break
    case 'playbackData':
      associations.push(
        [entityKey, decodedEntity.data.offlineVideoPolicy],
        [entityKey, decodedEntity.data.transfer],
        [entityKey, decodedEntity.data.videoDownloadContextEntity]
      )
      break
    case 'transfer':
      associations.push(...decodedEntity.data.offlineVideoStreams.map(key => [entityKey, key] as const))
      break
  }

  return decodedEntity
}

const encodeYTOfflineMediaStream = (index: YTLocalMediaIndex): InstanceType<typeof YTOfflineMediaStream> => {
  const format = index.format
  if (format == null) throw new Error('missing format info')

  const { url, lastModified, itag, bitrate, mimeType, initRange, indexRange } = format
  const { mket, avbr } = fromEntries(new URLSearchParams(index.fmts).entries())
  const { clen, csz } = fromEntries(new URLSearchParams(url).entries())

  const data: ConstructorParameters<typeof YTOfflineMediaStream>[0] = {
    type: index.type,
    lastModified,
    itag,
    bitrate,
    mimeType,
    initRange: new FormatRange(fromEntries(entries(initRange ?? {}).map(e => [e[0], Number(e[1])]))),
    indexRange: new FormatRange(fromEntries(entries(indexRange ?? {}).map(e => [e[0], Number(e[1])]))),
    maxKnownEndTime: Number(mket),
    averageByteRate: Number(avbr),
    contentLength: BigInt(clen),
    chunkSize: Number(csz),
    chunkKey: bufferFromString(getNonce(16)),
    chunkIv: bufferFromString(getNonce(16))
  }

  switch (index.type) {
    case YTLocalMediaType.AUDIO: {
      const { audioChannels, audioSampleRate } = (format as YTLocalMediaIndex<YTLocalMediaType.AUDIO>['format'])!

      assign<typeof data, typeof data>(data, {
        audioChannels,
        audioSampleRate: Number(audioSampleRate)
      })
      break
    }
    case YTLocalMediaType.VIDEO: {
      const { fps, width, height, quality, qualityLabel } = (format as YTLocalMediaIndex<YTLocalMediaType.VIDEO>['format'])!

      assign<typeof data, typeof data>(data, {
        fps,
        width,
        height,
        quality: quality == null ? null : YTCommon.enums.MediaFormatVideoQuality[quality as keyof typeof YTCommon.enums.MediaFormatVideoQuality],
        qualityLabel
      })
      break
    }
    default:
      throw new Error('invalid media type')
  }

  return new YTOfflineMediaStream(data)
}

const decodeYTOfflineMediaStream = (id: string, stream: InstanceType<typeof YTOfflineMediaStream>): YTLocalMediaIndex => {
  const { type, lastModified, itag, bitrate, mimeType, initRange, indexRange, maxKnownEndTime, averageByteRate, contentLength, chunkSize, chunkKey, chunkIv } = stream

  const format: YTLocalMediaIndex['format'] = {
    url: `local://localhost/videoplayback?${new URLSearchParams(fromEntries(entries({
      lmt: lastModified,
      docid: id,
      fmtid: itag,
      type: mimeType?.split(";")[0],
      csz: chunkSize,
      clen: contentLength,
      ck: chunkKey == null ? null : bufferToString(chunkKey),
      civ: chunkIv == null ? null : bufferToString(chunkIv)
    }).filter(e => e[1] != null).map(e => [e[0], String(e[1])])))}`,
    lastModified: lastModified!,
    itag: itag!,
    bitrate: bitrate!,
    mimeType: mimeType!,
    initRange: { start: `${initRange?.start ?? 0}`, end: `${initRange?.end ?? 0}` },
    indexRange: { start: `${indexRange?.start ?? 0}`, end: `${indexRange?.end ?? 0}` }
  }

  switch (type) {
    case YTLocalMediaType.AUDIO: {
      const { audioChannels, audioSampleRate } = stream

      assign<typeof format, typeof format>(format, {
        audioChannels: audioChannels!,
        audioSampleRate: String(audioSampleRate ?? -1)
      })
      break
    }
    case YTLocalMediaType.VIDEO: {
      const { fps, width, height, quality, qualityLabel } = stream

      assign<typeof format, typeof format>(format, {
        fps: fps!,
        width: width!,
        height: height!,
        quality: YTCommon.enums.MediaFormatVideoQuality[quality!],
        qualityLabel: qualityLabel!
      })
      break
    }
    default:
      throw new Error('invalid media type')
  }

  return {
    type: type as YTLocalMediaType,
    fmts: new URLSearchParams({ dlt: '-1', mket: `${maxKnownEndTime ?? -1}`, avbr: `${averageByteRate ?? -1}` }).toString(),
    format
  }
}

export const deleteYTOfflineMedia = async (id: string): Promise<void> => {
  const downloadStatusEntity = await getYTLocalEntityByKey<EntityType.downloadStatusEntity>(encodeEntityKey({
    entityId: id,
    entityType: EntityType.downloadStatusEntity,
    isPersistent: true
  }), true)
  if (downloadStatusEntity != null) {
    downloadStatusEntity.data.downloadState = 'DOWNLOAD_STATE_USER_DELETED'
    await putYTLocalEntity<EntityType.downloadStatusEntity>(downloadStatusEntity, true)
  }

  const downloadStateEntity = await getYTLocalEntityByKey<EntityType.mainVideoDownloadStateEntity>(encodeEntityKey({
    entityId: id,
    entityType: EntityType.mainVideoDownloadStateEntity,
    isPersistent: true
  }), true)
  if (downloadStateEntity != null) {
    downloadStateEntity.data.downloadStatusEntity.downloadState = 'DOWNLOAD_STATE_USER_DELETED'
    await putYTLocalEntity<EntityType.mainVideoDownloadStateEntity>(downloadStateEntity, true)
  }

  await updateYTReduxStoreLocalEntities()
}

export const importYTOfflineMediaBundle = (file: File, password: string) => new PromiseWithProgress<void, string>(async (resolve, reject, progress) => {
  try {
    progress('reading file')

    const header = new Uint8Array(await file.slice(0, BUNDLE_HEADER_SIZE).arrayBuffer())
    if (header.length < BUNDLE_HEADER_SIZE) throw new Error('unexpected EOF reading header')

    const magic = bufferToString(header.slice(0, 4), 'latin1')
    if (magic !== BUNDLE_MAGIC) throw new Error('invalid magic')

    const metadataSize = bufferReadUInt32LE(header, 4)
    if (file.size < (BUNDLE_HEADER_SIZE + metadataSize)) throw new Error('unexpected EOF reading metadata')

    let metadataBuffer = new Uint8Array(await file.slice(BUNDLE_HEADER_SIZE, BUNDLE_HEADER_SIZE + metadataSize).arrayBuffer())

    const metadataHash = header.slice(8)
    if (password.length > 0) {
      metadataBuffer = await decryptAesCtr(await deriveAesCtrKey(password, metadataHash.slice(0, 16)), metadataHash.slice(8, 24), metadataBuffer)
    }

    const isHashMismatch = (await digestSHA256(metadataBuffer, 24)).some((b, i) => metadataHash[i] !== b)
    if (isHashMismatch) throw new Error('file corrupted or wrong password')

    const { version, id, entities, streams, captions } = new YTOfflineMediaMetadata().deserialize(await decompress(metadataBuffer, 'deflate'), false)
    if (version !== BUNDLE_VERSION) throw new Error('version not supported')

    const totalChunkSize = streams?.reduce((p, c) => p + Number(c.contentLength), 0) ?? 0
    if (file.size !== (BUNDLE_HEADER_SIZE + metadataSize + totalChunkSize)) throw new Error('unexpected EOF reading chunks')

    const existingDownloadState = (await getYTLocalEntityByKey<EntityType.mainVideoDownloadStateEntity>(encodeEntityKey({
      entityId: id,
      entityType: EntityType.mainVideoDownloadStateEntity,
      isPersistent: true
    }), true))?.data.downloadStatusEntity.downloadState
    if (existingDownloadState != null && existingDownloadState !== 'DOWNLOAD_STATE_USER_DELETED') throw new Error('video already exists')

    const streamsEntity: YTLocalEntity<EntityType.offlineVideoStreams> = {
      version: 1,
      key: encodeEntityKey({
        entityId: id,
        entityType: EntityType.offlineVideoStreams,
        isPersistent: true
      }),
      entityType: 'offlineVideoStreams',
      data: {
        key: '',
        streamsProgress: []
      }
    }
    streamsEntity.data.key = streamsEntity.key

    let streamPos = BUNDLE_HEADER_SIZE + metadataSize

    for (const stream of streams!) {
      const index = decodeYTOfflineMediaStream(id!, stream)

      const contentLength = Number(stream.contentLength)
      const chunkSize = Number(stream.chunkSize)

      const chunkCount = ceil(contentLength / chunkSize)
      if (isNaN(chunkCount)) throw new Error('invalid chunk size')

      let complete = 0

      const chunks = await Promise.all(
        new Array(chunkCount).fill(null).map((_, i) => {
          const pos = streamPos + (i * chunkSize)
          const size = i < (chunkCount - 1) ? chunkSize : (contentLength % chunkSize)
          return file.slice(pos, pos + size).arrayBuffer().then(chunk => {
            progress(`reading '${id}' stream.${stream.type} (${((++complete / chunkCount) * 100).toFixed(1)}%)`)
            return new Uint8Array(chunk)
          })
        })
      )

      streamsEntity.data.streamsProgress.push({
        formatStreamBytes: JSON.stringify(index),
        numBytesDownloaded: String(contentLength),
        numTotalBytes: String(contentLength),
        streamState: 'DOWNLOAD_STREAM_STATE_COMPLETE',
        streamType: (['STREAM_TYPE_AUDIO', 'STREAM_TYPE_VIDEO'] as const)[index.type]
      })
      await putYTLocalMediaStream(index, chunks).progress(p => progress(`importing '${id}' stream.${index.type} (${(p * 100).toFixed(1)}%)`))

      streamPos += contentLength
    }

    progress('importing video captions')

    await putYTLocalMediaCaptions(id!, captions!.map(({ metadata, trackData }) => ({
      metadata: JSON.parse(metadata ?? '{}'),
      trackData: trackData ?? ''
    })))

    progress('importing video metadata')

    const associations: YTLocalEntityAssociation[] = []
    await putYTLocalEntities<keyof YTLocalEntityData>([
      ...entities!.map(entity => decodeYTOfflineMediaEntity(entity, associations)),
      streamsEntity
    ], true)
    await putYTLocalEntityAssociation(associations)

    setYTLocalMediaStorage({ ...getYTLocalMediaStorage(), [id!]: 1 })
    await updateYTReduxStoreLocalEntities()

    progress(`imported '${id}' successfully`)
    resolve()
  } catch (error) {
    reject(error)
  }
})

export const exportYTOfflineMediaBundle = (id: string, password: string) => new PromiseWithProgress<void, string>(async (resolve, reject, progress) => {
  try {
    const entities = (await Promise.all(EXPORTABLE_ENTITY_TYPES.map(entityType => getYTLocalEntityByKey<keyof YTLocalEntityData>(encodeEntityKey({
      entityId: id,
      entityType,
      isPersistent: true
    }), true)))).filter(entity => entity != null)

    const downloadStateEntity = entities.find(entity => entity.entityType === 'downloadStatusEntity')
    if (downloadStateEntity == null) throw new Error('video not found')
    if (downloadStateEntity.data.downloadState !== 'DOWNLOAD_STATE_COMPLETE') throw new Error('download in progress or failed')

    const indexes = await Promise.all(MEDIA_STREAM_TYPES.map(type => getYTLocalMediaIndex(id, type)))
    const streams = indexes.map(encodeYTOfflineMediaStream)

    const chunks = (await Promise.all(indexes.map(async (index, i) => {
      const { chunkKey, chunkIv } = streams[i]

      const transform = chunkKey == null || chunkIv == null || chunkKey.length < 16 || chunkIv.length < 16 ?
        async (chunk: Uint8Array<ArrayBuffer>) => chunk :
        encryptAesCtr.bind(null, chunkKey, chunkIv)

      return getYTLocalMediaChunks(index, true)
        .progress(p => progress(`exporting '${id}' stream.${index.type} (${(p * 100).toFixed(1)}%)`))
        .then(chunks => Promise.all(chunks.map(transform)))
    }))).flat()

    progress('exporting video captions')

    const captions = (await getYTLocalMediaCaptions(id)).map(({ metadata, trackData }) => new YTOfflineMediaCaption({
      metadata: JSON.stringify(metadata),
      trackData
    }))

    progress('exporting video metadata')

    let metadataBuffer = await compress(new YTOfflineMediaMetadata({
      version: BUNDLE_VERSION,
      id,
      entities: entities.map(entity => encodeYTOfflineMediaEntity(sanitizeEntity(entity))),
      streams,
      captions
    }).serialize(), 'deflate')

    const metadataHash = await digestSHA256(metadataBuffer, 24)
    if (password.length > 0) {
      metadataBuffer = await encryptAesCtr(await deriveAesCtrKey(password, metadataHash.slice(0, 16)), metadataHash.slice(8, 24), metadataBuffer)
    }

    const header = new Uint8Array(BUNDLE_HEADER_SIZE)

    header.set(bufferFromString(BUNDLE_MAGIC, 'latin1'))
    bufferWriteUInt32LE(header, metadataBuffer.length, 4)
    header.set(metadataHash, 8)

    chunks.unshift(header, metadataBuffer)

    progress('downloading file')
    resolve(downloadBlob(new Blob(chunks), id, 'ytom'))
  } catch (error) {
    reject(error)
  }
})

export const exportYTOfflineMediaStream = (id: string, type?: YTLocalMediaType) => new PromiseWithProgress<void, string>(async (resolve, reject, progress) => {
  try {
    const types = type ? [type] : [YTLocalMediaType.AUDIO, YTLocalMediaType.VIDEO]
    const indexes = await Promise.all(types.map(type => getYTLocalMediaIndex(id, type)))
    const streams = await Promise.all(indexes.map((index, i) => getYTLocalMediaChunks(index, true).progress(p => progress(`exporting '${id}' stream.${types[i]} (${(p * 100).toFixed(1)}%)`))))

    const mimeType = type ? (indexes[0]?.format?.mimeType ?? 'application/octet-stream') : 'video/mp4'
    const chunks = type ? streams.flat() : [
      (await execFFmpeg({
        input: fromEntries(values(types).map((type, i) => {
          const index = indexes[i]
          const stream = streams[i]
          return [`${type}.${mimeTypeToExt(index.format?.mimeType)}`, { data: bufferConcat(stream) }]
        })),
        output: { 'o.mp4': ['-c', 'copy', ...values(types).flatMap((type, i) => ['-map', `${i}:${['a', 'v'][type]}:0`])] }
      }).progress(({ progress: p, time }) => progress(`merging streams (${(p * 100).toFixed(1)}%/${(time / 1000000).toFixed(3)}s)`)))['o.mp4']
    ]

    progress('downloading file')
    resolve(downloadBlob(new Blob(chunks, { type: mimeType }), `${id}.${types.join('+')}`))
  } catch (error) {
    reject(error)
  }
})