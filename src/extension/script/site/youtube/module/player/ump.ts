import { ceil, min } from '@ext/global/math'
import { assign, fromEntries } from '@ext/global/object'
import { bufferConcat } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import CodedStream from '@ext/lib/protobuf/coded-stream'
import { varint32Encode } from '@ext/lib/protobuf/varint'
import UMPMediaHeader from '@ext/site/youtube/api/proto/ump/media-header'
import UMPNextRequestPolicy from '@ext/site/youtube/api/proto/ump/next-request-policy'
import UMPSabrContextUpdate, { UMPSabrContextScope, UMPSabrContextValue } from '@ext/site/youtube/api/proto/ump/sabr-context-update'
import UMPContentAdsSabrContext from '@ext/site/youtube/api/proto/ump/sabr-context/content-ads'
import UMPSabrError from '@ext/site/youtube/api/proto/ump/sabr-error'
import UMPSnackbarMessage from '@ext/site/youtube/api/proto/ump/snackbar-message'
import { dispatchYTOpenPopupAction } from '@ext/site/youtube/module/core/event'

const logger = new Logger('YTPLAYER-UMP')

const enum UMPType {
  ONESIE_HEADER = 10,
  ONESIE_DATA = 11,
  MEDIA_HEADER = 20,
  MEDIA = 21,
  MEDIA_END = 22,
  LIVE_METADATA = 31,
  HOSTNAME_CHANGE_HINT = 32,
  LIVE_METADATA_PROMISE = 33,
  LIVE_METADATA_PROMISE_CANCELLATION = 34,
  NEXT_REQUEST_POLICY = 35,
  USTREAMER_VIDEO_AND_FORMAT_DATA = 36,
  FORMAT_SELECTION_CONFIG = 37,
  USTREAMER_SELECTED_MEDIA_STREAM = 38,
  FORMAT_INITIALIZATION_METADATA = 42,
  SABR_REDIRECT = 43,
  SABR_ERROR = 44,
  SABR_SEEK = 45,
  RELOAD_PLAYER_RESPONSE = 46,
  PLAYBACK_START_POLICY = 47,
  ALLOWED_CACHED_FORMATS = 48,
  START_BW_SAMPLING_HINT = 49,
  PAUSE_BW_SAMPLING_HINT = 50,
  SELECTABLE_FORMATS = 51,
  REQUEST_IDENTIFIER = 52,
  REQUEST_CANCELLATION_POLICY = 53,
  ONESIE_PREFETCH_REJECTION = 54,
  TIMELINE_CONTEXT = 55,
  REQUEST_PIPELINING = 56,
  SABR_CONTEXT_UPDATE = 57,
  STREAM_PROTECTION_STATUS = 58,
  SABR_CONTEXT_SENDING_POLICY = 59,
  LAWNMOWER_POLICY = 60,
  SABR_ACK = 61,
  END_OF_TRACK = 62,
  CACHE_LOAD_POLICY = 63,
  LAWNMOWER_MESSAGING_POLICY = 64,
  PREWARM_CONNECTION = 65,
  SNACKBAR_MESSAGE = 67
}

const sliceMap: Map<UMPType, UMPSlice> = new Map()

let isFirstInterrupt = true

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

function replaceSlice(stream: CodedStream, position: number, size: number, data: Uint8Array): void {
  const sizeDelta = data.length - size
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length + sizeDelta)

  newBuffer.set(oldBuffer.subarray(0, position), 0)
  newBuffer.set(data, position)
  newBuffer.set(oldBuffer.subarray(position + size), position + data.length)

  stream.setBuffer(newBuffer)
  stream.setPosition(position + data.length)
}

function removeSlice(stream: CodedStream, position: number, size: number): void {
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length - size)

  newBuffer.set(oldBuffer.subarray(0, position), 0)
  newBuffer.set(oldBuffer.subarray(position + size), position)

  stream.setBuffer(newBuffer)
  stream.setPosition(position)
}

function processUMPSlice(slice: UMPSlice): boolean {
  switch (slice.getType()) {
    case UMPType.MEDIA_HEADER: {
      const message = new UMPMediaHeader().deserialize(slice.getBuffer())

      logger.debug('media header:', message)
      return true
    }
    case UMPType.NEXT_REQUEST_POLICY: {
      const message = new UMPNextRequestPolicy().deserialize(slice.getBuffer())

      logger.debug('next request policy:', message)
      return true
    }
    case UMPType.SABR_ERROR: {
      const message = new UMPSabrError().deserialize(slice.getBuffer())

      logger.warn('sabr error:', message)
      return true
    }
    case UMPType.SABR_CONTEXT_UPDATE: {
      const message = new UMPSabrContextUpdate().deserialize(slice.getBuffer())

      logger.debug('sabr context update:', message)

      if (message.type === 5 && message.scope === UMPSabrContextScope.SABR_CONTEXT_SCOPE_CONTENT_ADS && message.value != null) {
        const value = new UMPSabrContextValue().deserialize(message.value)
        if (value.content == null) return true

        const context = new UMPContentAdsSabrContext().deserialize(value.content)

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

async function processUMPRequest(ctx: NetworkRequestContext): Promise<void> {
  const { url, request } = ctx

  const ttl = Number(url.searchParams.get('expire')) - (Date.now() / 1e3)
  if (isNaN(ttl) || ttl < 0 || ttl > 604800) {
    logger.debug('blocked invalid ump request from sending')
    assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(undefined, { status: 403 }) })
    return
  }

  const stream = new CodedStream(new Uint8Array(await request.arrayBuffer()))

  logger.debug('request size:', stream.getRemainSize())

  ctx.request = new Request(request, { body: stream.getBuffer() })
}

async function processUMPResponse(ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> {
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

      if (processUMPSlice(slice)) {
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

export default class YTPlayerUMPModule extends Feature {
  public constructor() {
    super('player-ump')
  }

  protected activate(): boolean {
    addInterceptNetworkCallback(async ctx => {
      if (ctx.url.pathname !== '/videoplayback') return

      switch (ctx.state) {
        case NetworkState.UNSENT:
          await processUMPRequest(ctx)
          break
        case NetworkState.SUCCESS:
          await processUMPResponse(ctx)
          break
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}