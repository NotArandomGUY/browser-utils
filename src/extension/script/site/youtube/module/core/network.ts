import { Request } from '@ext/global/network'
import { defineProperty, fromEntries } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { compress, decompress } from '@ext/lib/compression'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { Message, MessageDefinition } from '@ext/lib/protobuf/message'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import PlayerParams from '@ext/site/youtube/api/proto/player-params'
import { YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { YTInnertubeContext } from '@ext/site/youtube/module/core/bootstrap'

const { parse, stringify } = JSON

const logger = new Logger('YTCORE-NETWORK')

const INNERTUBE_API_REGEXP = /(?<=^\/youtubei\/v\d+\/).*$/

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
  'get_watch': { playerRequest: object, watchNextRequest: object }
  'next': {}
  'player': { contentCheckOk: boolean, racyCheckOk: boolean, params: InstanceType<typeof PlayerParams> }
  'search': { isPrefetch?: boolean, isZeroPrefixQuery?: boolean, query?: string, suggestionSearchParams?: { subtypes: unknown[] }, webSearchboxStatsUrl?: string }
}
export type YTInnertubeRequestEndpoint = keyof YTInnertubeRequestMap
export type YTInnertubeRequest<E extends YTInnertubeRequestEndpoint = YTInnertubeRequestEndpoint> = YTInnertubeRequestBase & YTInnertubeRequestMap[E]

export type YTInnertubeRequestProcessor<E extends YTInnertubeRequestEndpoint = YTInnertubeRequestEndpoint> = (request: YTInnertubeRequest<E>) => Promise<void> | void

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

const processInnertubeRequestData = async (endpoint: YTInnertubeRequestEndpoint, requestData?: YTInnertubeRequest): Promise<void> => {
  if (requestData == null) return

  const processors = innertubeRequestProcessorMap[endpoint] as Set<YTInnertubeRequestProcessor>
  if (processors == null) return

  switch (endpoint) {
    case 'get_watch': {
      const data = requestData as YTInnertubeRequest<typeof endpoint>

      processors.forEach(processor => processor(data))

      processInnertubeRequestData('player', data.playerRequest as YTInnertubeRequest)
      processInnertubeRequestData('next', data.watchNextRequest as YTInnertubeRequest)
      break
    }
    case 'player': {
      const data = requestData as Omit<YTInnertubeRequest<typeof endpoint>, 'params'> & {
        params?: InstanceType<typeof PlayerParams> | string
      }
      data.params = protoBase64UrlDecode(new PlayerParams(), data.params as string)

      processors.forEach(processor => processor(data))

      data.params = protoBase64UrlEncode(data.params as InstanceType<typeof PlayerParams>)
      break
    }
    default:
      processors.forEach(processor => processor(requestData))
      break
  }
}

const processInnertubeRequest = async (endpoint: string, request: Request): Promise<Request> => {
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
    return request
  }

  try {
    await processInnertubeRequestData(endpoint as YTInnertubeRequestEndpoint, data)
  } catch (error) {
    logger.warn('process innertube request error:', error)
  }

  logger.debug('innertube request:', endpoint, data)

  switch (request.method.toUpperCase()) {
    case 'GET':
    case 'HEAD':
      return new Request(request.url, {
        method: request.method,
        headers: request.headers
      })
    default: {
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

      return new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body
      })
    }
  }
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

  ctx.request = await processInnertubeRequest(innertubeEndpoint, request)
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

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}