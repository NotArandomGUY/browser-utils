import { processYTRenderer } from '@ext/custom/youtube/api/processor'
import PlayerParams from '@ext/custom/youtube/api/proto/player-params'
import { YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { YTInnertubeContext } from '@ext/custom/youtube/module/core/bootstrap'
import { defineProperty, fromEntries } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { compress, decompress } from '@ext/lib/compression'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkRequestContext, NetworkState, replaceRequest } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { Message, MessageDefinition } from '@ext/lib/protobuf/message'

const { parse, stringify } = JSON

const logger = new Logger('YTCORE-NETWORK')

const INNERTUBE_API_REGEXP = /(?<=^\/youtubei\/v\d+\/).*$/

export interface YTInnertubeRequestContext extends YTInnertubeContext {
  adSignalsInfo?: {
    params: { key: string, value: string }[]
  }
  clickTracking?: {
    clickTrackingParams: string
  }
  clientScreenNonce?: string
}

export interface YTInnertubeRequestPlaybackContext {
  contentPlaybackContext: Partial<{
    autoCaptionsDefaultOn: boolean
    autonavState: string
    currentUrl: string
    html5Preference: string
    isLivingRoomDeeplink: boolean
    lactMilliseconds: string
    mdxContext: Partial<{}>
    playerHeightPixels: number
    playerWidthPixels: number
    referer: string
    signatureTimestamp: number
    splay: boolean
    vis: number
    watchAmbientModeContext: Partial<{
      hasShownAmbientMode: boolean
      watchAmbientModeEnabled: boolean
    }>
  }>
  devicePlaybackCapabilities: Partial<{
    supportXhr: boolean
    supportsVp9Encoding: boolean
  }>
  prefetchPlaybackContext: {}
}

type YTInnertubeRequestBase = {
  context: YTInnertubeRequestContext
}

type YTInnertubeRequestMap = {
  '*': {}
  'get_watch': {
    playerRequest: object
    watchNextRequest: object
  }
  'next': {}
  'player': Partial<{
    contentCheckOk: boolean
    cpn: string
    racyCheckOk: boolean
    playbackContext: YTInnertubeRequestPlaybackContext
    playlistId: string
    playlistIndex: number
    videoId: string
  }> & { params: InstanceType<typeof PlayerParams> }
  'search': Partial<{
    isPrefetch: boolean
    isZeroPrefixQuery: boolean
    query: string
    suggestionSearchParams: { subtypes: unknown[] }
    webSearchboxStatsUrl: string
  }>
}
export type YTInnertubeRequestEndpoint = keyof YTInnertubeRequestMap
export type YTInnertubeRequest<E extends YTInnertubeRequestEndpoint = YTInnertubeRequestEndpoint> = YTInnertubeRequestBase & YTInnertubeRequestMap[E]

export type YTInnertubeRequestProcessor<E extends YTInnertubeRequestEndpoint = YTInnertubeRequestEndpoint> = (request: YTInnertubeRequest<E>) => Promise<void> | void

const innertubeRequestProcessorMap: { [endpoint: string]: Set<YTInnertubeRequestProcessor> } = {}

const protoBase64UrlDecode = <D extends MessageDefinition>(message: Message<D>, data?: string): Message<D> => {
  if (typeof data !== 'string') return message

  return message.deserialize(bufferFromString(atob(decodeURIComponent(data).replace(/-/g, '+').replace(/_/g, '/')), 'latin1'))
}

const protoBase64UrlEncode = <D extends MessageDefinition>(message: Message<D>): string | undefined => {
  const data = message.serialize()
  if (data.length === 0) return undefined

  return encodeURIComponent(btoa(bufferToString(data, 'latin1')).replace(/\+/g, '-').replace(/\//g, '_'))
}

const processInnertubeRequest = async (endpoint: string, request?: YTInnertubeRequest): Promise<void> => {
  if (request == null) return

  const processors = innertubeRequestProcessorMap[endpoint]
  if (processors == null) return

  switch (endpoint) {
    case 'get_watch': {
      const data = request as YTInnertubeRequest<typeof endpoint>

      processors.forEach(processor => processor(data))

      processInnertubeRequest('player', data.playerRequest as YTInnertubeRequest)
      processInnertubeRequest('next', data.watchNextRequest as YTInnertubeRequest)
      break
    }
    case 'player': {
      const data = request as Omit<YTInnertubeRequest<typeof endpoint>, 'params'> & {
        params?: InstanceType<typeof PlayerParams> | string
      }
      data.params = protoBase64UrlDecode(new PlayerParams(), data.params as string)

      processors.forEach(processor => processor(data))

      data.params = protoBase64UrlEncode(data.params as InstanceType<typeof PlayerParams>)
      break
    }
    default:
      processors.forEach(processor => processor(request))
      break
  }

  innertubeRequestProcessorMap['*']?.forEach(processor => processor(request))
}

const processInnertubeResponse = async (endpoint: string, response: Response): Promise<Response> => {
  let data = null
  try {
    data = await response.clone().json()
  } catch {
    return response
  }

  const renderer = `${endpoint.replace(/[/_][a-z]/g, s => s[1].toUpperCase())}Response` as keyof typeof YTRendererSchemaMap
  await processYTRenderer(renderer, data)

  logger.debug('innertube response:', endpoint, data)

  return new Response(stringify(data), { status: response.status, headers: fromEntries(response.headers.entries()) })
}

const processRequest = async (ctx: NetworkRequestContext): Promise<void> => {
  const { url, request } = ctx

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(url.pathname)?.[0]
  if (innertubeEndpoint == null) return

  const encoding = request.headers.get('content-encoding')

  let data = null
  try {
    const clonedRequest = request.clone()
    switch (encoding) {
      case 'deflate':
      case 'gzip':
        data = parse(bufferToString(await decompress(await clonedRequest.arrayBuffer(), encoding)))
        break
      default:
        data = await clonedRequest.json()
        break
    }
  } catch {
    return
  }

  try {
    await processInnertubeRequest(innertubeEndpoint, data)
  } catch (error) {
    logger.warn('process innertube request error:', error)
  }

  logger.debug('innertube request:', innertubeEndpoint, data)

  let body = bufferFromString(stringify(data))
  switch (encoding) {
    case 'deflate':
    case 'gzip':
      body = await compress(body, encoding)
      break
    default:
      request.headers.delete('content-encoding')
      break
  }
  await replaceRequest(ctx, { body })
}

const processResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url, response } = ctx

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(url.pathname)?.[0]
  if (innertubeEndpoint == null) return

  ctx.response = await processInnertubeResponse(innertubeEndpoint, response)
}

export const registerYTInnertubeRequestProcessor = <E extends YTInnertubeRequestEndpoint>(endpoint: E, processor: YTInnertubeRequestProcessor<E>): void => {
  let processors = innertubeRequestProcessorMap[endpoint]
  if (processors == null) {
    processors = new Set() as NonNullable<typeof processors>
    innertubeRequestProcessorMap[endpoint] = processors
  }

  processors.add(processor as YTInnertubeRequestProcessor)
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

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}