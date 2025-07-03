import { bufferConcat } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import CodedStream from '@ext/lib/protobuf/coded-stream'
import { varint32Encode } from '@ext/lib/protobuf/varint'
import UMPNextRequestPolicy from '@ext/site/youtube/api/proto/ump/next-request-policy'
import UMPSabrContextUpdate from '@ext/site/youtube/api/proto/ump/sabr-context-update'
import UMPSnackbarMessage from '@ext/site/youtube/api/proto/ump/snackbar-message'

const logger = new Logger('YTPLAYER-UMP')

const enum UMPPartType {
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

const partialPartDataMap: Map<UMPPartType, UMPPartData> = new Map()

class UMPPartData {
  private readonly chunks: Uint8Array[]
  private readonly reportedSize: number
  private currentSize: number

  public constructor(size: number) {
    this.chunks = []
    this.reportedSize = size
    this.currentSize = 0
  }

  public get isComplete(): boolean {
    return this.currentSize >= this.reportedSize
  }

  public getBuffer(): Uint8Array {
    return bufferConcat(this.chunks)
  }

  public getSize(): number {
    return this.currentSize
  }

  public setBuffer(data: Uint8Array): void {
    const { chunks } = this

    chunks.splice(0, chunks.length, data)
    this.currentSize = data.length
  }

  public addChunk(chunk: Uint8Array): boolean {
    this.chunks.push(chunk)
    this.currentSize += chunk.length

    return this.isComplete
  }
}

function replaceSection(stream: CodedStream, position: number, size: number, data: Uint8Array): void {
  const sizeDelta = data.length - size
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length + sizeDelta)

  newBuffer.set(oldBuffer.subarray(0, position), 0)
  newBuffer.set(data, position)
  newBuffer.set(oldBuffer.subarray(position + size), position + data.length)

  stream.setBuffer(newBuffer)
  stream.setPosition(position + data.length)
}

function removeSection(stream: CodedStream, position: number, size: number): void {
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length - size)

  newBuffer.set(oldBuffer.subarray(0, position), 0)
  newBuffer.set(oldBuffer.subarray(position + size), position)

  stream.setBuffer(newBuffer)
  stream.setPosition(position)
}

function processUMPPart(type: UMPPartType, data: UMPPartData): boolean {
  switch (type) {
    case UMPPartType.NEXT_REQUEST_POLICY: {
      const message = new UMPNextRequestPolicy().deserialize(data.getBuffer())

      logger.debug('next request policy:', message)
      return true
    }
    case UMPPartType.SABR_CONTEXT_UPDATE: {
      const message = new UMPSabrContextUpdate().deserialize(data.getBuffer())

      logger.debug('sabr context update:', message)
      return true
    }
    case UMPPartType.SNACKBAR_MESSAGE: {
      const message = new UMPSnackbarMessage().deserialize(data.getBuffer())

      logger.debug('snackbar message:', message)
      return false
    }
    default:
      logger.debug('part type:', type, 'size:', data.getSize())
      return true
  }
}

async function processUMPResponse(response: Response): Promise<Response> {
  const stream = new CodedStream(new Uint8Array(await response.arrayBuffer()))

  logger.debug('response size:', stream.getBuffer().length)

  try {
    while (!stream.isEnd) {
      const partPosition = stream.getPosition()
      const partType = stream.readVUInt32()
      const partDataSize = stream.readVUInt32()
      const partHeadSize = stream.getPosition() - partPosition

      const partData = partialPartDataMap.get(partType) ?? new UMPPartData(partDataSize)
      const partDataChunk = stream.readRawBytes(Math.min(stream.getRemainSize(), partDataSize))
      const sectionSize = partHeadSize + partDataChunk.length

      logger.trace('part chunk type:', partType, 'pos:', partPosition, 'size:', partDataSize)

      if (!partData.addChunk(partDataChunk)) {
        partialPartDataMap.set(partType, partData)
        removeSection(stream, partPosition, sectionSize)
        continue
      }

      partialPartDataMap.delete(partType)

      if (processUMPPart(partType, partData)) {
        replaceSection(stream, partPosition, sectionSize, bufferConcat([varint32Encode(partType)[0], varint32Encode(partData.getSize())[0], partData.getBuffer()]))
      } else {
        removeSection(stream, partPosition, sectionSize)
      }
    }
  } catch (error) {
    if (!(error instanceof RangeError)) logger.error('process response error:', error)
  }

  return new Response(stream.getBuffer(), { status: response.status, headers: Object.fromEntries(response.headers.entries()) })
}

export default class YTPlayerUMPModule extends Feature {
  protected activate(): boolean {
    addInterceptNetworkCallback(async ctx => {
      if (ctx.state !== NetworkState.SUCCESS) return

      const { url, response } = ctx
      const { pathname } = url

      if (pathname !== '/videoplayback') return

      ctx.response = await processUMPResponse(response)
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}