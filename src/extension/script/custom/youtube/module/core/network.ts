import { processYTResponse } from '@ext/custom/youtube/api/processor'
import { YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { YTInnertubeContext } from '@ext/custom/youtube/module/core/bootstrap'
import PlayerParams from '@ext/custom/youtube/proto/player-params'
import { assign, defineProperty, fromEntries } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { compress, decompress } from '@ext/lib/compression'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState, replaceRequest } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { Message, MessageDefinition } from '@ext/lib/protobuf/message'

const { parse, stringify } = JSON

const logger = new Logger('YTCORE-NETWORK')

const INNERTUBE_API_REGEXP = /(?<=^\/youtubei\/v\d+\/).*$/

export interface YTInnertubeRequestContext extends YTInnertubeContext {
  adSignalsInfo?: {
    advertisingId?: string
    advertisingIdSignalType?: string
    limitAdTracking?: boolean
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
    mdxContext: Partial<{
      mdxPlaybackSourceContext: Partial<{
        mdxPlaybackContainerInfo: {
          sourceContainerPlaylistId: string
        }
        serializedMdxMetadata: string
      }>
      remoteContexts: {
        adSignalsInfo: YTInnertubeRequestContext['adSignalsInfo']
        remoteClient: {
          applicationState: 'ACTIVE' | 'INACTIVE'
          clientFormFactor: 'LARGE_FORM_FACTOR' | 'SMALL_FORM_FACTOR' | 'UNKNOWN_FORM_FACTOR'
          clientName: 'ANDROID' | 'ANDROID_KIDS' | 'ANDROID_MUSIC' | 'ANDROID_UNPLUGGED' | 'WEB' | 'WEB_REMIX' | 'WEB_UNPLUGGED' | 'IOS' | 'IOS_KIDS' | 'IOS_MUSIC' | 'IOS_UNPLUGGED' | 'UNKNOWN_INTERFACE'
          clientVersion: string
          platform: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN_PLATFORM'
          osName?: string
          userAgent?: string
          windowHeightPoints?: string
          windowWidthPoints?: string
        }
      }[]
      skippableAdsSupported: boolean
      triggeredByMdx: boolean
    }>
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
  prefetchPlaybackContext?: {}
}

type YTInnertubeRequestBase = {
  context?: YTInnertubeRequestContext
}

type YTInnertubeRequestMap = {
  '*': {}
  'att/get': Partial<{
    engagementType: 'ENGAGEMENT_TYPE_PLAYBACK' | 'ENGAGEMENT_TYPE_SHARE' | 'ENGAGEMENT_TYPE_UNBOUND' | 'ENGAGEMENT_TYPE_VIDEO_TRANSCRIPT_REQUEST' | 'ENGAGEMENT_TYPE_YPC_GET_DOWNLOAD_ACTION' | 'ENGAGEMENT_TYPE_YPC_GET_PREMIUM_PAGE'
  }>
  'browse': Partial<{
    browseId: string
    params: string // TODO: should be a protobuf message
  }>
  'get_watch': {
    playerRequest: object
    watchNextRequest: object
  }
  'next': Partial<{
    continuation: string
  }>
  'offline': Partial<{
    playlistIds: string[]
    videoIds: string[]
  }>
  'offline/get_download_action': Partial<{
    crossDeviceDownloadData: { isCrossDeviceDownload?: boolean }
    lastOfflineQualitySettingsSavedMs: string
    offlineWebClientEligibility: { isSupported: boolean }
    params: string
    preferredFormatType: string
    videoId: string
  }>
  'offline/get_playback_data_entity': Partial<{
    videos: {
      downloadParameters?: { maximumDownloadQuality?: string }
      entityKey: string
    }[]
  }>
  'offline/offline_video_playback_position_sync': Partial<{
    lastSyncTimestampUsec: string
    videoPlaybackPositionEntities: {
      key: string
      lastPlaybackPositionSeconds: string
      videoId: string
    }[]
  }>
  'offline/playlist_sync_check': Partial<{
    offlinePlaylistSyncChecks: Partial<{
      autoSync: boolean
      offlineDateAddedTimestamp: string
      offlineLastModifiedTimestamp: string
      playlistId: string
      videoIds: string[]
    }>[]
  }>
  'player': Partial<{
    attestationRequest: { omitBotguardData: boolean }
    contentCheckOk: boolean
    cpn: string
    racyCheckOk: boolean
    playbackContext: YTInnertubeRequestPlaybackContext
    playlistId: string
    playlistIndex: number
    serviceIntegrityDimensions: { poToken: string }
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

export type YTInnertubeRequestProcessor<E extends YTInnertubeRequestEndpoint = YTInnertubeRequestEndpoint> = (
  request: YTInnertubeRequest<E>,
  headers: Headers
) => Promise<YTValueData<YTResponse.Mapped> | void> | YTValueData<YTResponse.Mapped> | void

const innertubeRequestProcessorMap: { [endpoint: string]: Set<YTInnertubeRequestProcessor> } = {}

const protoBase64UrlDecode = <D extends MessageDefinition>(ctor: new (initData?: object) => Message<D>, data?: string): Message<D> => {
  const message = new ctor({})
  if (typeof data !== 'string') return message

  return message.deserialize(bufferFromString(decodeURIComponent(data), 'base64url'))
}

const protoBase64UrlEncode = <D extends MessageDefinition>(message: Message<D>): string | undefined => {
  const data = message.serialize()
  if (data.length === 0) return undefined

  return encodeURIComponent(bufferToString(data, 'base64url'))
}

const invokeProcessors = async (request: YTInnertubeRequest, headers: Headers, processors?: Set<YTInnertubeRequestProcessor>): Promise<YTValueData<YTResponse.Mapped> | null> => {
  let response: YTValueData<YTResponse.Mapped> | null = null
  if (processors == null) return response

  for (const processor of processors) {
    response = await processor(request, headers) ?? null
    if (response != null) break
  }

  return response
}

const processInnertubeRequest = async (endpoint: string, headers: Headers, request?: YTInnertubeRequest): Promise<Response | null> => {
  if (request == null) return null

  let response = await invokeProcessors(request, headers, innertubeRequestProcessorMap['*'])
  if (response == null) {
    const processors = innertubeRequestProcessorMap[endpoint]
    switch (endpoint) {
      case 'get_watch': {
        const data = request as YTInnertubeRequest<typeof endpoint>

        response = await invokeProcessors(data, headers, processors)

        await processInnertubeRequest('player', headers, data.playerRequest as YTInnertubeRequest)
        await processInnertubeRequest('next', headers, data.watchNextRequest as YTInnertubeRequest)
        break
      }
      case 'player': {
        const data = request as Omit<YTInnertubeRequest<typeof endpoint>, 'params'> & {
          params?: InstanceType<typeof PlayerParams> | string
        }
        data.params = protoBase64UrlDecode(PlayerParams, data.params as string)

        response = await invokeProcessors(data, headers, processors)

        data.params = protoBase64UrlEncode(data.params)
        break
      }
      default:
        response = await invokeProcessors(request, headers, processors)
        break
    }
  }
  if (response == null) return null

  response.responseContext ??= {
    mainAppWebResponseContext: {
      trackingParam: '' // should get filled by response processor
    },
    serviceTrackingParams: []
  }

  return new Response(stringify(response), { status: 200, headers: { 'content-type': 'application/json' } })
}

const processInnertubeResponse = async (endpoint: string, request: Request, response: Response): Promise<Response> => {
  let data: YTValueData<YTResponse.Mapped> | null = null
  try {
    data = await response.clone().json()
  } catch {
    return response
  }

  if (request.headers.has('authorization')) {
    const serviceTrackingParams = data?.responseContext?.serviceTrackingParams ?? []
    for (const tracking of serviceTrackingParams) {
      const loggedIn = tracking.params?.find(p => p.key === 'logged_in')?.value
      if (loggedIn != null) ytcfg?.set('LOGGED_IN', Number(loggedIn) !== 0)
    }
  }

  const key = endpoint.replace(/[/_][a-z]/g, s => s[1].toUpperCase()) as YTResponse.MappedKey
  await processYTResponse(key, data)

  logger.debug('innertube response:', endpoint, data)

  return new Response(stringify(data), { status: response.status, headers: fromEntries(response.headers.entries()) })
}

const processRequest = async (ctx: NetworkRequestContext): Promise<void> => {
  const { url, request } = ctx
  const { headers } = request

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(url.pathname)?.[0]
  if (innertubeEndpoint == null) return

  const encoding = headers.get('content-encoding')

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
    const response = await processInnertubeRequest(innertubeEndpoint, headers, data)
    if (response != null) {
      assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response })
      return
    }
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
      headers.delete('content-encoding')
      break
  }
  await replaceRequest(ctx, { body })
}

const processResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url, request, response } = ctx

  const innertubeEndpoint = INNERTUBE_API_REGEXP.exec(url.pathname)?.[0]
  if (innertubeEndpoint == null) return

  ctx.response = await processInnertubeResponse(innertubeEndpoint, request, response)
}

export const registerYTInnertubeRequestProcessor = <E extends YTInnertubeRequestEndpoint>(endpoint: E, processor: YTInnertubeRequestProcessor<E>): () => void => {
  let processors = innertubeRequestProcessorMap[endpoint]
  if (processors == null) {
    processors = new Set() as NonNullable<typeof processors>
    innertubeRequestProcessorMap[endpoint] = processors
  }

  processors.add(processor as YTInnertubeRequestProcessor)

  return () => {
    processors.delete(processor as YTInnertubeRequestProcessor)
    if (processors.size === 0) delete innertubeRequestProcessorMap[endpoint]
  }
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