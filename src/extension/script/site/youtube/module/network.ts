import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import InterceptImage from '@ext/lib/intercept/image'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { buildPathnameRegexp } from '@ext/lib/regexp'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import { YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { isYTLoggedIn } from '@ext/site/youtube/module/bootstrap'

const logger = new Logger('YT-NETWORK')

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

async function processResponse(ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> {
  const { url, response } = ctx
  const { pathname } = url

  let data = null
  try { data = await response.clone().json() } catch { }

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(pathname)?.[0]
  if (innertubeEndpoint != null) {
    const renderer = `${innertubeEndpoint.replace(/[/_][a-z]/g, s => s[1].toUpperCase())}Response` as keyof typeof YTRendererSchemaMap
    processYTRenderer(renderer, data)
    ctx.response = new Response(JSON.stringify(data), { headers: Object.fromEntries(response.headers.entries()) })
  }

  logger.debug('network response:', url.href, data)
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