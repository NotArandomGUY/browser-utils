import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import InterceptImage from '@ext/lib/intercept/image'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { varintDecode32 } from '@ext/lib/protobuf/varint'
import { makeTag, WireType } from '@ext/lib/protobuf/wiretag'
import { buildPathnameRegexp } from '@ext/lib/regexp'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import { YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { isYTLoggedIn } from '@ext/site/youtube/module/bootstrap'

const logger = new Logger('YT-NETWORK')

const enum UMPPayloadType {
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

const BYPASS_ID = '__ytbu_bpid__'
const INNERTUBE_API_REGEXP = /(?<=^\/youtubei\/v\d+\/).*$/
const BLOCKED_PATH_REGEXP = buildPathnameRegexp([
  '/api/stats',
  '/ddm',
  '/log',
  '/ptracking',
  '/youtubei/v\\d+/(log_event|video_stats)',
  '/youtubei/v\\d+/att/log',
  '/youtubei/v\\d+/player/ad_break'
])
const INTERRUPT_PATH_REGEXP = buildPathnameRegexp([
  '/error_204',
  '/generate_204',
  '/pagead',
  '/videoplayback\\?.*?&ctier=L&.*?%2Cctier%2C.*'
])
const LOGIN_WHITELIST_PATH = buildPathnameRegexp([
  '/api/stats/(playback|delayplay|watchtime)'
])

const bypassIdSet = new Set<number>()

function processRequest(ctx: NetworkRequestContext): void {
  const { url, request } = ctx

  const bypassId = Number(request != null && BYPASS_ID in request ? request[BYPASS_ID] : null)
  if (bypassIdSet.has(bypassId)) {
    bypassIdSet.delete(bypassId)
    ctx.passthrough = true
    return
  }

  const path = url.pathname + url.search

  // Ignore request with fake url
  if (request != null && Object.getOwnPropertyDescriptor(request, 'url')?.get?.toString().includes(url.pathname)) {
    ctx.passthrough = true
    return
  }

  // Ignore whitelisted request
  if (isYTLoggedIn() && LOGIN_WHITELIST_PATH.test(path)) return

  if (INTERRUPT_PATH_REGEXP.test(path)) {
    // Generate error response for interrupted request
    logger.debug('network request interrupted:', url.href)
    Object.assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(undefined, { status: 403 }) })
    return
  }

  if (BLOCKED_PATH_REGEXP.test(path)) {
    // Force blocked request to fail
    logger.debug('network request blocked:', url.href)
    Object.assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.FAILED, error: new Error('Failed') })
    return
  }

  logger.debug('network request:', url.href)
}

async function processUMPResponse(response: Response): Promise<Response> { // NOSONAR
  let data = new Uint8Array(await response.arrayBuffer())
  if (data.length > 1024) return new Response(data, { headers: Object.fromEntries(response.headers.entries()) })

  let pos = 0

  function readVarint(): number {
    if (pos >= data.length) return 0

    const [value, nextPos] = varintDecode32(data, pos)
    pos = nextPos

    return value
  }

  while (pos < data.length) {
    const messagePos = pos
    const payloadType = readVarint()
    const payloadSize = readVarint()
    const headerSize = pos - messagePos

    if (payloadType < 0 || payloadSize < 0) break

    logger.trace(`ump response message(${payloadType})@${messagePos}`)

    let isValidMessage = true

    switch (payloadType) {
      case UMPPayloadType.NEXT_REQUEST_POLICY:
        if (readVarint() !== makeTag(4, WireType.VARINT)) break
        logger.warn('recv ump backoff time')
        break
      case UMPPayloadType.SABR_CONTEXT_UPDATE: {
        if (readVarint() !== makeTag(1, WireType.VARINT)) break
        const ctxType = readVarint()
        if (readVarint() !== makeTag(2, WireType.VARINT)) break
        const ctxScope = readVarint()
        if (ctxType !== 5 || ctxScope !== 4) break
        logger.warn('recv ump adb response')
        break
      }
      case UMPPayloadType.SNACKBAR_MESSAGE:
        isValidMessage = false
        break
      default:
        break
    }

    if (isValidMessage) {
      pos = messagePos + headerSize + payloadSize
      continue
    }

    const temp = new Uint8Array(data.length - headerSize - payloadSize)
    temp.set(data.subarray(0, messagePos), 0)
    temp.set(data.subarray(messagePos + headerSize + payloadSize), messagePos)
    data = temp
    pos = messagePos
  }

  return new Response(data, { headers: Object.fromEntries(response.headers.entries()) })
}

async function processInnertubeResponse(response: Response, endpoint: string): Promise<Response> {
  let data = null
  try {
    data = await response.clone().json()
  } catch {
    return response
  }

  const renderer = `${endpoint.replace(/[/_][a-z]/g, s => s[1].toUpperCase())}Response` as keyof typeof YTRendererSchemaMap
  processYTRenderer(renderer, data)

  logger.debug('innertube response:', endpoint, data)

  return new Response(JSON.stringify(data), { headers: Object.fromEntries(response.headers.entries()) })
}

async function processResponse(ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> {
  const { url, response } = ctx
  const { pathname } = url

  switch (pathname) { // NOSONAR: Might add more endpoints later
    case '/videoplayback':
      ctx.response = await processUMPResponse(response)
      break
    default: {
      const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(pathname)?.[0]
      if (innertubeEndpoint == null) break

      ctx.response = await processInnertubeResponse(response, innertubeEndpoint)
      break
    }
  }
}

export function bypassFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const bypassId = Date.now() + Math.floor(Math.random() * 1e6) - 5e5
  const request = new Request(input, init)

  Object.defineProperty(request, BYPASS_ID, { value: bypassId })
  bypassIdSet.add(bypassId)

  return fetch(request)
}

export default class YTNetworkModule extends Feature {
  protected activate(): boolean {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: null
    })

    addInterceptNetworkCallback(async ctx => {
      switch (ctx.state) {
        case NetworkState.UNSENT:
          processRequest(ctx)
          break
        case NetworkState.SUCCESS:
          await processResponse(ctx)
          break
      }
    })

    InterceptImage.setCallback((type, event) => {
      if (type !== 'srcchange') return

      const { pathname } = new URL((<CustomEvent<string>>event).detail, location.href)

      // Prevent interrupted or blocked path from loading
      if (INTERRUPT_PATH_REGEXP.test(pathname) || BLOCKED_PATH_REGEXP.test(pathname)) {
        preventDispatchEvent(event)
        return
      }

      logger.debug('image load:', pathname)
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}