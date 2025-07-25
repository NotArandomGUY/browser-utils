import { ceil, min } from '@ext/global/math'
import { assign, fromEntries } from '@ext/global/object'
import { bufferConcat, bufferFromString, bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import CodedStream from '@ext/lib/protobuf/coded-stream'
import { varint32Encode } from '@ext/lib/protobuf/varint'
import { decryptOnesie, encryptOnesie } from '@ext/site/youtube/api/crypto'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import { UMPType } from '@ext/site/youtube/api/proto/ump'
import UMPFormatInitializationMetadata from '@ext/site/youtube/api/proto/ump/format-initialization-metadata'
import UMPFormatSelectionConfig from '@ext/site/youtube/api/proto/ump/format-selection-config'
import UMPMediaHeader from '@ext/site/youtube/api/proto/ump/media-header'
import UMPNextRequestPolicy from '@ext/site/youtube/api/proto/ump/next-request-policy'
import UMPOnesieHeader, { OnesieHeaderType } from '@ext/site/youtube/api/proto/ump/onesie-header'
import UMPOnesieEncryptedInnertubeResponse from '@ext/site/youtube/api/proto/ump/onesie/encrypted-innertube-response'
import UMPOnesiePlayerResponse, { OnesieProxyStatus } from '@ext/site/youtube/api/proto/ump/onesie/encrypted-player-response'
import UMPPlaybackStartPolicy from '@ext/site/youtube/api/proto/ump/playback-start-policy'
import UMPSabrContextUpdate, { UMPSabrContextScope, UMPSabrContextValue } from '@ext/site/youtube/api/proto/ump/sabr-context-update'
import UMPSabrContextContentAds from '@ext/site/youtube/api/proto/ump/sabr-context/content-ads'
import UMPSabrError from '@ext/site/youtube/api/proto/ump/sabr-error'
import UMPSnackbarMessage from '@ext/site/youtube/api/proto/ump/snackbar-message'
import type { YTPlayerWebPlayerContextConfig } from '@ext/site/youtube/module/core/bootstrap'
import { dispatchYTOpenPopupAction } from '@ext/site/youtube/module/core/event'

const logger = new Logger('YTPLAYER-UMP')

const UMP_PATHNAME_REGEXP = /^\/(init|video)playback$/
const JSON_PREFIX_REGEXP = /^\)]}'\n/

const sliceMap: Map<UMPType, UMPSlice> = new Map()

let isFirstInterrupt = true
let onesieClientKey: Uint8Array | null = null
let onesieHeader: InstanceType<typeof UMPOnesieHeader> | null = null

class UMPSlice {
  private readonly chunks: Uint8Array[]
  private readonly fulfillSize: number
  private type: UMPType
  private currentSize: number

  public constructor(type: UMPType, size: number) {
    this.chunks = []
    this.fulfillSize = size
    this.type = type
    this.currentSize = 0
  }

  public get isFulfilled(): boolean {
    return this.currentSize >= this.fulfillSize
  }

  public getType(): UMPType {
    return this.type
  }

  public getBuffer(): Uint8Array {
    return bufferConcat(this.chunks)
  }

  public getSize(): number {
    return this.currentSize
  }

  public setType(type: UMPType): void {
    this.type = type
  }

  public setBuffer(data: Uint8Array): void {
    const { chunks } = this

    chunks.splice(0, chunks.length, data)
    this.currentSize = data.length
  }

  public addChunk(chunk: Uint8Array): boolean {
    this.chunks.push(chunk)
    this.currentSize += chunk.length

    return this.isFulfilled
  }
}

const replaceSlice = (stream: CodedStream, position: number, size: number, data: Uint8Array): void => {
  const sizeDelta = data.length - size
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length + sizeDelta)

  newBuffer.set(oldBuffer.subarray(0, position), 0)
  newBuffer.set(data, position)
  newBuffer.set(oldBuffer.subarray(position + size), position + data.length)

  stream.setBuffer(newBuffer)
  stream.setPosition(position + data.length)
}

const removeSlice = (stream: CodedStream, position: number, size: number): void => {
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length - size)

  newBuffer.set(oldBuffer.subarray(0, position), 0)
  newBuffer.set(oldBuffer.subarray(position + size), position)

  stream.setBuffer(newBuffer)
  stream.setPosition(position)
}

const loadPlayerContextConfig = (webPlayerContextConfig: Record<string, YTPlayerWebPlayerContextConfig>): void => {
  if (webPlayerContextConfig == null) return

  for (const id in webPlayerContextConfig) {
    const config = webPlayerContextConfig[id]
    if (config == null) continue

    const { serializedExperimentFlags, onesieHotConfig } = config

    const flags = new URLSearchParams(serializedExperimentFlags)

    flags.set('html5_force_hfr_support', 'true')
    flags.set('html5_tv_ignore_capable_constraint', 'true')

    config.serializedExperimentFlags = flags.toString()

    const clientKey = onesieHotConfig?.clientKey
    if (clientKey == null) continue

    onesieClientKey = bufferFromString(atob(clientKey), 'latin1')
    logger.debug('load onesie client key:', onesieClientKey, 'config:', webPlayerContextConfig)
  }
}

const processOnesieData = async (slice: UMPSlice): Promise<boolean> => {
  if (onesieHeader == null) {
    logger.warn('onesie data without header')
    return false
  }

  const { type, cryptoParams } = onesieHeader

  switch (type) {
    case OnesieHeaderType.ENCRYPTED_PLAYER_RESPONSE: {
      const key = onesieClientKey
      const data = key && cryptoParams && await decryptOnesie(slice.getBuffer(), key, cryptoParams)
      if (!data) {
        logger.debug('onesie player response:', btoa(bufferToString(slice.getBuffer(), 'latin1')))
        break
      }

      const message = new UMPOnesiePlayerResponse().deserialize(data)

      logger.debug('onesie player response:', message)

      if (message.onesiePorxyStatus !== OnesieProxyStatus.OK || message.body == null) break

      const body = JSON.parse(bufferToString(message.body))
      await processYTRenderer('playerResponse', body)
      message.body = bufferFromString(JSON.stringify(body))

      slice.setBuffer(await encryptOnesie(message.serialize(), key, cryptoParams))
      break
    }
    case OnesieHeaderType.ENCRYPTED_INNERTUBE_RESPONSE_PART: {
      const message = new UMPOnesieEncryptedInnertubeResponse().deserialize(slice.getBuffer())

      logger.debug('onesie encrypted innertube response:', message)
      break
    }
    default:
      logger.debug('onesie data type:', type, 'size:', slice.getSize())
      break
  }

  return true
}

const processUMPSlice = async (slice: UMPSlice): Promise<boolean> => {
  switch (slice.getType()) {
    case UMPType.ONESIE_HEADER: {
      onesieHeader = new UMPOnesieHeader().deserialize(slice.getBuffer())

      logger.debug('onesie header:', onesieHeader)
      return true
    }
    case UMPType.ONESIE_DATA:
      return processOnesieData(slice)
    case UMPType.MEDIA_HEADER: {
      const message = new UMPMediaHeader().deserialize(slice.getBuffer())

      logger.debug('media header:', message)
      return true
    }
    case UMPType.MEDIA:
      logger.debug('media size:', slice.getSize())
      return true
    case UMPType.MEDIA_END:
      logger.debug('media end:', slice.getBuffer())
      return true
    case UMPType.NEXT_REQUEST_POLICY: {
      const message = new UMPNextRequestPolicy().deserialize(slice.getBuffer())

      logger.debug('next request policy:', message)
      return true
    }
    case UMPType.FORMAT_SELECTION_CONFIG: {
      const message = new UMPFormatSelectionConfig().deserialize(slice.getBuffer())

      logger.debug('format selection config:', message)
      return true
    }
    case UMPType.FORMAT_INITIALIZATION_METADATA: {
      const message = new UMPFormatInitializationMetadata().deserialize(slice.getBuffer())

      logger.debug('format initialization metadata:', message)
      return true
    }
    case UMPType.SABR_ERROR: {
      const message = new UMPSabrError().deserialize(slice.getBuffer())

      logger.warn('sabr error:', message)
      return true
    }
    case UMPType.PLAYBACK_START_POLICY: {
      const message = new UMPPlaybackStartPolicy().deserialize(slice.getBuffer())

      logger.debug('playback start policy:', message)
      return true
    }
    case UMPType.SABR_CONTEXT_UPDATE: {
      const message = new UMPSabrContextUpdate().deserialize(slice.getBuffer())

      logger.debug('sabr context update:', message)

      if (message.type === 5 && message.scope === UMPSabrContextScope.SABR_CONTEXT_SCOPE_CONTENT_ADS && message.value != null) {
        const value = new UMPSabrContextValue().deserialize(message.value)
        if (value.content == null) return true

        const context = new UMPSabrContextContentAds().deserialize(value.content)

        const backoffTimeMs = context.backoffTimeMs ?? 0
        if (backoffTimeMs <= 0) return true

        if (isFirstInterrupt) {
          isFirstInterrupt = false
          throw new Response(null, { status: 403 })
        }

        dispatchYTOpenPopupAction({
          durationHintMs: backoffTimeMs,
          popup: {
            notificationActionRenderer: {
              responseText: { runs: [{ text: `Waiting for server ad delay (${ceil(backoffTimeMs / 1e3)}s)...` }] }
            }
          },
          popupType: 'TOAST'
        })
      }
      return true
    }
    case UMPType.SNACKBAR_MESSAGE: {
      const message = new UMPSnackbarMessage().deserialize(slice.getBuffer())

      logger.debug('snackbar message:', message)
      return false
    }
    default:
      logger.debug('slice type:', slice.getType(), 'size:', slice.getSize())
      return true
  }
}

const processUMPRequest = async (ctx: NetworkRequestContext): Promise<void> => {
  const { url, request } = ctx

  if (url.searchParams.has('expire')) {
    const ttl = Number(url.searchParams.get('expire')) - (Date.now() / 1e3)
    if (isNaN(ttl) || ttl < 0 || ttl > 604800) {
      logger.debug('blocked invalid ump request from sending')
      assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(undefined, { status: 403 }) })
      return
    }
  }

  const stream = new CodedStream(new Uint8Array(await request.arrayBuffer()))
  const size = stream.getRemainSize()

  logger.debug('request size:', size)

  ctx.request = new Request(request, { body: size > 0 ? stream.getBuffer() : undefined })
}

const processUMPResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { response } = ctx

  const stream = new CodedStream(new Uint8Array(await response.arrayBuffer()))

  logger.debug('response size:', stream.getRemainSize())

  try {
    while (!stream.isEnd) {
      const slicePosition = stream.getPosition()
      const sliceType = stream.readVUInt32()
      const sliceDataSize = stream.readVUInt32()
      const sliceHeadSize = stream.getPosition() - slicePosition

      const sliceData = stream.readRawBytes(min(stream.getRemainSize(), sliceDataSize))
      const sliceSize = sliceHeadSize + sliceData.length

      const slice = sliceMap.get(sliceType) ?? new UMPSlice(sliceType, sliceDataSize)
      if (!slice.addChunk(sliceData)) {
        logger.trace('partial slice type:', sliceType, 'pos:', slicePosition, 'size:', sliceData.length)

        sliceMap.set(sliceType, slice)
        removeSlice(stream, slicePosition, sliceSize)
        continue
      }

      sliceMap.delete(sliceType)

      if (await processUMPSlice(slice)) {
        replaceSlice(stream, slicePosition, sliceSize, bufferConcat([varint32Encode(slice.getType())[0], varint32Encode(slice.getSize())[0], slice.getBuffer()]))
      } else {
        removeSlice(stream, slicePosition, sliceSize)
      }
    }
  } catch (error) {
    if (error instanceof Response) {
      ctx.response = error
      return
    }

    if (!(error instanceof RangeError)) logger.error('process response error:', error)
  }

  ctx.response = new Response(stream.getBuffer(), { status: response.status, headers: fromEntries(response.headers.entries()) })
}

const processTVConfig = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url, response } = ctx
  const { searchParams } = url

  try {
    const data = await response.clone().text()
    const isPrefixed = JSON_PREFIX_REGEXP.test(data)
    const config = JSON.parse(data.replace(JSON_PREFIX_REGEXP, ''))

    if (searchParams.has('action_get_config')) {
      const { webPlayerContextConfig } = config

      loadPlayerContextConfig(webPlayerContextConfig)
    }

    ctx.response = new Response(`${isPrefixed ? ')]}\'\n' : ''}${JSON.stringify(data)}`, { status: response.status, headers: fromEntries(response.headers.entries()) })
  } catch (error) {
    logger.warn('process tv config error:', error)
  }
}

export default class YTPlayerUMPModule extends Feature {
  public constructor() {
    super('player-ump')
  }

  protected activate(): boolean {
    addInterceptNetworkCallback(async ctx => {
      const { url } = ctx

      if (url.hostname.startsWith('redirector.') || !UMP_PATHNAME_REGEXP.test(url.pathname)) {
        if (ctx.state === NetworkState.SUCCESS && url.pathname === '/tv_config') await processTVConfig(ctx)
        return
      }

      switch (ctx.state) {
        case NetworkState.UNSENT:
          await processUMPRequest(ctx)
          break
        case NetworkState.SUCCESS:
          await processUMPResponse(ctx)
          break
      }
    })

    window.addEventListener('load', () => {
      if (onesieClientKey != null) return

      const ytcfg = window.ytcfg
      if (ytcfg == null) return

      loadPlayerContextConfig(ytcfg.get('WEB_PLAYER_CONTEXT_CONFIGS'))
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}