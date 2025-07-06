import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import InterceptImage from '@ext/lib/intercept/image'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { buildPathnameRegexp } from '@ext/lib/regexp'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import { YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { isYTLoggedIn } from '@ext/site/youtube/module/core/bootstrap'

const logger = new Logger('YTCORE-NETWORK')

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
const INTERRUPT_STATUS_MAP = {
  '/error_204': 204,
  '/generate_204': 204,
  '/videoplayback': 403
} satisfies Record<string, number>
const INTERRUPT_PATH_REGEXP = buildPathnameRegexp([
  '/error_204',
  '/generate_204',
  '/pagead',
  '/videoplayback\\?.*?&ctier=L&.*?%2Cctier%2C.*',
  '/ccm/collect'
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
    // Generate response for interrupted request
    const status = Object.entries(INTERRUPT_STATUS_MAP).find(e => new RegExp('^' + e[0]).test(path))?.[1] ?? 200
    logger.debug('network request interrupted:', url.href, status)
    Object.assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(undefined, { status }) })
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

async function processInnertubeResponse(response: Response, endpoint: string): Promise<Response> {
  let data = null
  try {
    data = await response.clone().json()
  } catch {
    return response
  }

  const renderer = `${endpoint.replace(/[/_][a-z]/g, s => s[1].toUpperCase())}Response` as keyof typeof YTRendererSchemaMap
  await processYTRenderer(renderer, data)

  logger.debug('innertube response:', endpoint, data)

  return new Response(JSON.stringify(data), { status: response.status, headers: Object.fromEntries(response.headers.entries()) })
}

async function processResponse(ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> {
  const { url, response } = ctx
  const { pathname } = url

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(pathname)?.[0]
  if (innertubeEndpoint == null) return

  ctx.response = await processInnertubeResponse(response, innertubeEndpoint)
}

export function bypassFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const bypassId = Date.now() + Math.floor(Math.random() * 1e6) - 5e5
  const request = new Request(input, init)

  Object.defineProperty(request, BYPASS_ID, { value: bypassId })
  bypassIdSet.add(bypassId)

  return fetch(request)
}

export default class YTCoreNetworkModule extends Feature {
  public constructor() {
    super('core-network')
  }

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