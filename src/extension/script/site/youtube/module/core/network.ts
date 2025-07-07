import { floor, random } from '@ext/global/math'
import { assign, defineProperty, entries, fromEntries, getOwnPropertyDescriptor } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import InterceptImage from '@ext/lib/intercept/image'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { buildPathnameRegexp } from '@ext/lib/regexp'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import PlayerParams from '@ext/site/youtube/api/proto/player-params'
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

type InnertubeRequestProcessorParamsMap = {
  'player': [params: InstanceType<typeof PlayerParams>]
}
type InnertubeRequestEndpoint = keyof InnertubeRequestProcessorParamsMap
type InnertubeRequestProcessorParams<E extends InnertubeRequestEndpoint> = InnertubeRequestProcessorParamsMap[E]

export type InnertubeRequestProcessor<E extends InnertubeRequestEndpoint> = (...args: InnertubeRequestProcessorParams<E>) => Promise<void> | void

const bypassIdSet = new Set<number>()
const innertubeRequestProcessorMap: { [E in InnertubeRequestEndpoint]?: Set<InnertubeRequestProcessor<E>> } = {}

async function processInnertubeRequest(request: Request, endpoint: string): Promise<Request> {
  let data = null
  try {
    data = await request.clone().json()
  } catch {
    return request
  }

  try {
    switch (endpoint) { // NOSONAR: add more endpoints later
      case 'player': {
        const params = new PlayerParams()
        if (typeof data?.params === 'string') {
          params.deserialize(bufferFromString(atob(decodeURIComponent(data.params).replace(/-/g, '+').replace(/_/g, '/')), 'latin1'))
        }

        innertubeRequestProcessorMap[endpoint]?.forEach(processor => processor(params))

        const encodedParams = params.serialize()
        if (encodedParams.length > 0) {
          data.params = encodeURIComponent(btoa(bufferToString(encodedParams, 'latin1')).replace(/\+/g, '-').replace(/\//g, '_'))
        } else {
          delete data.params
        }
        break
      }
    }
  } catch (error) {
    logger.warn('process innertube request error:', error)
  }

  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(data)
  })
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

  return new Response(JSON.stringify(data), { status: response.status, headers: fromEntries(response.headers.entries()) })
}

async function processRequest(ctx: NetworkRequestContext): Promise<void> {
  const { url, request } = ctx

  const bypassId = Number(request != null && BYPASS_ID in request ? request[BYPASS_ID] : null)
  if (bypassIdSet.has(bypassId)) {
    bypassIdSet.delete(bypassId)
    ctx.passthrough = true
    return
  }

  const path = url.pathname + url.search

  // Ignore request with fake url
  if (request != null && getOwnPropertyDescriptor(request, 'url')?.get?.toString().includes(url.pathname)) {
    ctx.passthrough = true
    return
  }

  // Ignore whitelisted request
  if (isYTLoggedIn() && LOGIN_WHITELIST_PATH.test(path)) return

  if (INTERRUPT_PATH_REGEXP.test(path)) {
    // Generate response for interrupted request
    const status = entries(INTERRUPT_STATUS_MAP).find(e => new RegExp('^' + e[0]).test(path))?.[1] ?? 200
    logger.debug('network request interrupted:', url.href, status)
    assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(undefined, { status }) })
    return
  }

  if (BLOCKED_PATH_REGEXP.test(path)) {
    // Force blocked request to fail
    logger.debug('network request blocked:', url.href)
    assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.FAILED, error: new Error('Failed') })
    return
  }

  logger.debug('network request:', url.href)

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(url.pathname)?.[0]
  if (innertubeEndpoint == null) return

  ctx.request = await processInnertubeRequest(request, innertubeEndpoint)
}

async function processResponse(ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> {
  const { url, response } = ctx
  const { pathname } = url

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(pathname)?.[0]
  if (innertubeEndpoint == null) return

  ctx.response = await processInnertubeResponse(response, innertubeEndpoint)
}

export function bypassFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const bypassId = Date.now() + floor(random() * 1e6) - 5e5
  const request = new Request(input, init)

  defineProperty(request, BYPASS_ID, { value: bypassId })
  bypassIdSet.add(bypassId)

  return fetch(request)
}

export function registerYTInnertubeRequestProcessor<E extends InnertubeRequestEndpoint>(endpoint: E, processor: InnertubeRequestProcessor<E>): void {
  let processors = innertubeRequestProcessorMap[endpoint]
  if (processors == null) {
    processors = new Set()
    innertubeRequestProcessorMap[endpoint] = processors
  }

  processors.add(processor)
}

export default class YTCoreNetworkModule extends Feature {
  public constructor() {
    super('core-network')
  }

  protected activate(): boolean {
    defineProperty(navigator, 'sendBeacon', {
      value: null
    })

    addInterceptNetworkCallback(async ctx => {
      switch (ctx.state) {
        case NetworkState.UNSENT:
          await processRequest(ctx)
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