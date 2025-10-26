import { decryptOnesie, encryptOnesie } from '@ext/custom/youtube/api/crypto'
import { processYTRenderer } from '@ext/custom/youtube/api/processor'
import OnesieRequest from '@ext/custom/youtube/api/proto/onesie-request'
import { OnesieHttpHeader } from '@ext/custom/youtube/api/proto/onesie/common'
import OnesieEncryptedInnertubeRequest from '@ext/custom/youtube/api/proto/onesie/encrypted-innertube-request'
import OnesieEncryptedInnertubeResponse from '@ext/custom/youtube/api/proto/onesie/encrypted-innertube-response'
import OnesieInnertubeRequest from '@ext/custom/youtube/api/proto/onesie/innertube-request'
import OnesieInnertubeResponse, { OnesieProxyStatus } from '@ext/custom/youtube/api/proto/onesie/innertube-response'
import SabrRequest from '@ext/custom/youtube/api/proto/sabr-request'
import { UMPType } from '@ext/custom/youtube/api/proto/ump'
import UMPFormatInitializationMetadata from '@ext/custom/youtube/api/proto/ump/format-initialization-metadata'
import UMPFormatSelectionConfig from '@ext/custom/youtube/api/proto/ump/format-selection-config'
import UMPMediaHeader from '@ext/custom/youtube/api/proto/ump/media-header'
import UMPNextRequestPolicy from '@ext/custom/youtube/api/proto/ump/next-request-policy'
import UMPOnesieHeader, { OnesieHeaderType } from '@ext/custom/youtube/api/proto/ump/onesie-header'
import UMPPlaybackStartPolicy from '@ext/custom/youtube/api/proto/ump/playback-start-policy'
import UMPSabrContextUpdate, { UMPSabrContextScope, UMPSabrContextValue } from '@ext/custom/youtube/api/proto/ump/sabr-context-update'
import UMPSabrContextContentAds from '@ext/custom/youtube/api/proto/ump/sabr-context/content-ads'
import UMPSabrError from '@ext/custom/youtube/api/proto/ump/sabr-error'
import UMPSnackbarMessage from '@ext/custom/youtube/api/proto/ump/snackbar-message'
import { registerYTConfigInitCallback, type YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { dispatchYTOpenPopupAction } from '@ext/custom/youtube/module/core/event'
import { ceil, min } from '@ext/global/math'
import { Request, URLSearchParams } from '@ext/global/network'
import { assign, fromEntries } from '@ext/global/object'
import { bufferConcat, bufferFromString, bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState, onInterceptNetworkRequest } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import CodedStream from '@ext/lib/protobuf/coded-stream'
import { varint32Encode } from '@ext/lib/protobuf/varint'

const logger = new Logger('YTPLAYER-UMP')

const UMP_PATHNAME_REGEXP = /^\/(init|video)playback$/
const JSON_PREFIX_REGEXP = /^\)]}'\n/

const sliceMap: Map<UMPType, UMPSlice> = new Map()

let isFirstInterrupt = true
let onesieClientKeys: Uint8Array[] = []
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

  public getBuffer(): Uint8Array<ArrayBuffer> {
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

    onesieClientKeys.push(bufferFromString(atob(clientKey), 'latin1'))
    logger.debug('load onesie client key:', onesieClientKeys, 'config:', webPlayerContextConfig)
  }
}

const processOnesieInnertubeRequest = async (innertubeRequest: InstanceType<typeof OnesieEncryptedInnertubeRequest> | null): Promise<void> => {
  if (innertubeRequest == null) return

  const { encryptedOnesieInnertubeRequest, iv, unencryptedOnesieInnertubeRequest } = innertubeRequest

  let onesieRequest = unencryptedOnesieInnertubeRequest
  let encryptionKey = null

  if (encryptedOnesieInnertubeRequest != null && iv?.length === 16) {
    const [data, key] = await decryptOnesie(encryptedOnesieInnertubeRequest, onesieClientKeys, innertubeRequest)
    onesieRequest = new OnesieInnertubeRequest().deserialize(data)
    encryptionKey = key
  }

  if (onesieRequest == null) {
    logger.warn('empty innertube request')
    return
  }

  const { request } = await onInterceptNetworkRequest(onesieRequest.urls?.[0] ?? location.href, {
    method: 'POST',
    headers: Object.fromEntries(onesieRequest.headers?.map(e => [e.name, e.value]) ?? []),
    body: onesieRequest.body
  })

  onesieRequest.headers = Array.from(request.headers.entries()).map(e => new OnesieHttpHeader({ name: e[0].replace(/(^|-)[a-z]/g, c => c.toUpperCase()), value: e[1] }))
  onesieRequest.body = new Uint8Array(await request.arrayBuffer())

  if (encryptionKey != null) {
    innertubeRequest.encryptedOnesieInnertubeRequest = await encryptOnesie(onesieRequest.serialize(), encryptionKey, innertubeRequest)
    innertubeRequest.unencryptedOnesieInnertubeRequest = null
  }
}

const processOnesieData = async (slice: UMPSlice): Promise<boolean> => {
  if (onesieHeader == null) {
    logger.warn('onesie data without header')
    return false
  }

  const { type, cryptoParams } = onesieHeader

  switch (type) {
    case OnesieHeaderType.PLAYER_RESPONSE: {
      const [data, key] = await decryptOnesie(slice.getBuffer(), onesieClientKeys, cryptoParams)
      const message = new OnesieInnertubeResponse().deserialize(data)

      let body: object | null = null
      if (message.onesiePorxyStatus === OnesieProxyStatus.OK && message.body != null) {
        body = JSON.parse(bufferToString(message.body))
        await processYTRenderer('playerResponse', body)
        message.body = bufferFromString(JSON.stringify(body))
      }
      logger.debug('onesie player response:', message, body)

      slice.setBuffer(await encryptOnesie(message.serialize(), key, cryptoParams))
      break
    }
    case OnesieHeaderType.ENCRYPTED_INNERTUBE_RESPONSE_PART: {
      const message = new OnesieEncryptedInnertubeResponse().deserialize(slice.getBuffer())

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

      logger.trace('onesie header:', onesieHeader)
      return true
    }
    case UMPType.ONESIE_DATA:
      return processOnesieData(slice)
    case UMPType.MEDIA_HEADER: {
      const message = new UMPMediaHeader().deserialize(slice.getBuffer())

      logger.trace('media header:', message)
      return true
    }
    case UMPType.MEDIA:
      logger.trace('media size:', slice.getSize())
      return true
    case UMPType.MEDIA_END:
      logger.trace('media end:', slice.getBuffer())
      return true
    case UMPType.NEXT_REQUEST_POLICY: {
      const message = new UMPNextRequestPolicy().deserialize(slice.getBuffer())

      logger.trace('next request policy:', message)
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

      logger.trace('playback start policy:', message)
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
      logger.trace('slice type:', slice.getType(), 'size:', slice.getSize())
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

  try {
    let body = new Uint8Array(await request.arrayBuffer())

    switch (url.pathname) {
      case '/initplayback': {
        const onesieRequest = new OnesieRequest().deserialize(body)

        logger.debug('onesie request:', onesieRequest)

        await processOnesieInnertubeRequest(onesieRequest.innertubeRequest)

        body = onesieRequest.serialize()
        break
      }
      case '/videoplayback': {
        const sabrRequest = new SabrRequest().deserialize(body)

        logger.debug('sabr request:', sabrRequest)

        body = sabrRequest.serialize()
        break
      }
    }

    if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) ctx.request = new Request(request, { body })
  } catch (error) {
    if (error instanceof Response) {
      assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: error })
      return
    }

    logger.error('process request error:', error)
  }
}

const processUMPResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url, response } = ctx

  if (url.searchParams.has('mime')) return

  const stream = new CodedStream(new Uint8Array(await response.arrayBuffer()))

  logger.trace('response size:', stream.getRemainSize())

  let slice: UMPSlice | null = null
  try {
    while (!stream.isEnd) {
      const slicePosition = stream.getPosition()
      const sliceType = stream.readVUInt32()
      const sliceDataSize = stream.readVUInt32()
      const sliceHeadSize = stream.getPosition() - slicePosition

      const sliceData = stream.readRawBytes(min(stream.getRemainSize(), sliceDataSize))
      const sliceSize = sliceHeadSize + sliceData.length

      slice = sliceMap.get(sliceType) ?? new UMPSlice(sliceType, sliceDataSize)
      if (!slice.addChunk(sliceData)) {
        logger.trace('partial response slice type:', sliceType, 'pos:', slicePosition, 'size:', sliceData.length)

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

    if (!(error instanceof RangeError)) logger.error('process response error:', error, slice)
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
    super('ump')
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

    registerYTConfigInitCallback(ytcfg => loadPlayerContextConfig(ytcfg.get('WEB_PLAYER_CONTEXT_CONFIGS')))

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}