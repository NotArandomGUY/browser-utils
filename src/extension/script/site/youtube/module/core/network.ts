import { floor, random } from '@ext/global/math'
import { fetch, Request, URL } from '@ext/global/network'
import { assign, defineProperty, entries, fromEntries } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import InterceptImage from '@ext/lib/intercept/image'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { Message, MessageDefinition } from '@ext/lib/protobuf/message'
import { buildPathnameRegexp } from '@ext/lib/regexp'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import PlayerParams from '@ext/site/youtube/api/proto/player-params'
import { YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { isYTLoggedIn, YTInnertubeContext } from '@ext/site/youtube/module/core/bootstrap'

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
  // NOTE: will cause ads to play as video instead, so blocking this is kinda useless
  //'/videoplayback\\?.*?&ctier=L&.*?%2Cctier%2C.*',
  '/ccm/collect'
])
const LOGIN_WHITELIST_PATH = buildPathnameRegexp([
  '/api/stats/(playback|delayplay|watchtime)'
])

export interface YTInnertubeRequestContext extends YTInnertubeContext {
  adSignalsInfo: {
    params: { key: string, value: string }[]
  }
  request: {
    consistencyTokenJars: unknown[]
    internalExperimentFlags: unknown[]
    useSsl: boolean
  }
}

type YTInnertubeRequestBase = {
  context: YTInnertubeRequestContext
}

type YTInnertubeRequestMap = {
  'player': { params: InstanceType<typeof PlayerParams> }
  'search': { isPrefetch?: boolean, isZeroPrefixQuery?: boolean, query?: string, suggestionSearchParams?: { subtypes: unknown[] }, webSearchboxStatsUrl?: string }
}
export type YTInnertubeRequestEndpoint = keyof YTInnertubeRequestMap
export type YTInnertubeRequest<E extends YTInnertubeRequestEndpoint> = YTInnertubeRequestBase & YTInnertubeRequestMap[E]

export type YTInnertubeRequestProcessor<E extends YTInnertubeRequestEndpoint> = (request: YTInnertubeRequest<E>) => Promise<void> | void

const bypassIdSet = new Set<number>()
const innertubeRequestProcessorMap: { [E in YTInnertubeRequestEndpoint]?: Set<YTInnertubeRequestProcessor<E>> } = {}

const protoBase64UrlDecode = <D extends MessageDefinition>(message: Message<D>, data?: string): Message<D> => {
  if (typeof data !== 'string') return message

  return message.deserialize(bufferFromString(atob(decodeURIComponent(data).replace(/-/g, '+').replace(/_/g, '/')), 'latin1'))
}

const protoBase64UrlEncode = <D extends MessageDefinition>(message: Message<D>): string | undefined => {
  const data = message.serialize()
  if (data.length === 0) return undefined

  return encodeURIComponent(btoa(bufferToString(data, 'latin1')).replace(/\+/g, '-').replace(/\//g, '_'))
}

const processInnertubeRequest = async (request: Request, endpoint: string): Promise<Request> => {
  const processors = innertubeRequestProcessorMap[endpoint as YTInnertubeRequestEndpoint]
  if (processors == null) return request

  let data = null
  try {
    data = await request.clone().json()
  } catch {
    return request
  }

  try {
    switch (endpoint) {
      case 'player': {
        const innertubeRequest = {
          ...data as YTInnertubeRequest<typeof endpoint>,
          params: protoBase64UrlDecode(new PlayerParams(), data?.params)
        }

        processors.forEach(processor => (processor as YTInnertubeRequestProcessor<typeof endpoint>)(innertubeRequest))

        data = {
          ...innertubeRequest,
          params: protoBase64UrlEncode(innertubeRequest.params)
        }
        break
      }
      default: {
        const innertubeRequest = {
          ...data as YTInnertubeRequest<YTInnertubeRequestEndpoint>
        }

        processors.forEach(processor => (processor as YTInnertubeRequestProcessor<YTInnertubeRequestEndpoint>)(innertubeRequest))

        data = {
          ...innertubeRequest
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
    body: ['GET', 'HEAD'].includes(request.method.toUpperCase()) ? null : JSON.stringify(data)
  })
}

const processInnertubeResponse = async (response: Response, endpoint: string): Promise<Response> => {
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

const processRequest = async (ctx: NetworkRequestContext): Promise<void> => {
  const { url, request } = ctx

  const bypassId = Number(request != null && BYPASS_ID in request ? request[BYPASS_ID] : null)
  if (bypassIdSet.has(bypassId)) {
    bypassIdSet.delete(bypassId)
    ctx.passthrough = true
    return
  }

  const path = url.pathname + url.search

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

const processResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url, response } = ctx
  const { pathname } = url

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(pathname)?.[0]
  if (innertubeEndpoint == null) return

  ctx.response = await processInnertubeResponse(response, innertubeEndpoint)
}

export const bypassFetch = (input: string, init: RequestInit = {}): Promise<Response> => {
  const bypassId = Date.now() + floor(random() * 1e6) - 5e5
  const request = new Request(input, init)

  defineProperty(request, BYPASS_ID, { value: bypassId })
  bypassIdSet.add(bypassId)

  return fetch(request)
}

export const registerYTInnertubeRequestProcessor = <E extends YTInnertubeRequestEndpoint>(endpoint: E, processor: YTInnertubeRequestProcessor<E>): void => {
  let processors = innertubeRequestProcessorMap[endpoint]
  if (processors == null) {
    processors = new Set() as NonNullable<typeof processors>
    innertubeRequestProcessorMap[endpoint] = processors
  }

  processors.add(processor)
}

export default class YTCoreNetworkModule extends Feature {
  public constructor() {
    super('network')
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