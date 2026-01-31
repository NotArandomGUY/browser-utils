import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, ytv_enp, ytv_ren, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { isYTLoggedIn, YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { getYTConfigBool, getYTConfigInt, registerYTConfigMenuItemGroup, setYTConfigInt, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { YTPlayerContextConfigCallback } from '@ext/custom/youtube/module/player/bootstrap'
import { encodeTrackingParam } from '@ext/custom/youtube/utils/crypto'
import { assign, defineProperty, getOwnPropertyDescriptor, keys, values } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import InterceptImage from '@ext/lib/intercept/image'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState, replaceRequest } from '@ext/lib/intercept/network'
import { addInterceptNetworkUrlFilter } from '@ext/lib/intercept/network/filter/url'
import { buildPathnameRegexp } from '@ext/lib/regexp'

const TRACKING_SWITCHES_KEY = 'tracking-switches'
const SHARE_URL_ALLOW_PARAMS = new Set(['fmt', 'hl', 'index', 'list', 'pp', 't', 'v'])
const STATS_API_BLOCK_PARAMS = new Set(['cbr', 'cbrand', 'cbrver', 'cmodel', 'cos', 'cosver'])
const OVERRIDE_TRACKING_PARAMS = 'CAAQACIMCAAVAAAAAB0AAAAA'

const HOST_REGEXP = /./
const FORBID_PATH_REGEXP = buildPathnameRegexp([
  '/ddm',
  '/log',
  '/ptracking',
  '/youtubei/v\\d+/(log_event|video_stats)',
  '/youtubei/v\\d+/att/log',
  '/youtubei/v\\d+/player/ad_break'
])
const FAKE_200_PATH_REGEXP = buildPathnameRegexp([
  '/pagead',
  '/ccm/collect'
])
const FAKE_204_PATH_REGEXP = buildPathnameRegexp([
  '/error_204',
  '/generate_204'
])
/*
const FAKE_403_PATH_REGEXP = buildPathnameRegexp([
  // NOTE: will cause ads to play as video instead, so blocking this is kinda useless
  //'/videoplayback\\?.*?&ctier=L&.*?%2Cctier%2C.*'
])
*/
const STATS_BLACKLIST_PATH_REGEXP = buildPathnameRegexp([
  '/api/stats'
])
const STATS_WHITELIST_PATH_REGEXP = buildPathnameRegexp([
  '/api/stats/(atr|playback|delayplay|watchtime)'
])
const INJECT_ACCESS_TOKEN_PATH_REGEXP = buildPathnameRegexp([
  '/api/stats',
  '/youtubei/v\\d+/player'
])

const enum YTTrackingSwitchMask {
  GUEST_STATS = 0x01,
  LOGIN_STATS = 0x02,
  SHARE_ID = 0x04
}

let accessTokenCacheKey: string | null = null

export const isYTTrackingSwitchEnabled = (mask: YTTrackingSwitchMask): boolean => {
  return getYTConfigBool(TRACKING_SWITCHES_KEY, false, mask)
}

const getCachedAccessToken = (): string | null => {
  try {
    const { data } = JSON.parse(localStorage.getItem('yt.leanback.default::cached-access-tokens') ?? 'null')
    const accessToken = data[accessTokenCacheKey!].accessToken
    return typeof accessToken === 'string' ? accessToken : null
  } catch {
    return null
  }
}

const sanitizeShareUrl = (url: string | URL): string => {
  try {
    url = new URL(url)

    const { searchParams } = url

    if (['youtu.be', 'youtube.com', 'youtube-nocookie.com'].includes(url.hostname)) {
      searchParams.forEach((_, key) => SHARE_URL_ALLOW_PARAMS.has(key) || searchParams.delete(key))
    } else {
      searchParams.forEach((value, key) => searchParams.set(key, sanitizeShareUrl(value)))
    }

    return url.toString()
  } catch {
    return String(url)
  }
}

const processPlayerContextConfig = (config: YTPlayerWebPlayerContextConfig): void => {
  const obfuscatedGaiaId = config.datasyncId?.replace(/\|/g, '')
  if (obfuscatedGaiaId == null) return

  accessTokenCacheKey = `${obfuscatedGaiaId}||${obfuscatedGaiaId}`
}

const processRequest = async (ctx: NetworkRequestContext): Promise<void> => {
  const { url, request } = ctx
  const { pathname, search, searchParams } = url

  // Remove visitor id from everything
  request.headers.delete('x-goog-visitor-id')

  const path = pathname + search

  // Inject access token for some requests
  if (INJECT_ACCESS_TOKEN_PATH_REGEXP.test(path)) {
    const accessToken = getCachedAccessToken()
    if (accessToken != null) request.headers.set('authorization', `Bearer ${accessToken}`)
  }

  // Ignore non stats requests
  if (!STATS_BLACKLIST_PATH_REGEXP.test(path)) return

  // Block stats requests unless switch is enabled
  const isLoggedIn = isYTLoggedIn() || (searchParams.has('cttype') && searchParams.has('ctt')) || request.headers.has('authorization')
  if (!isYTTrackingSwitchEnabled(isLoggedIn ? YTTrackingSwitchMask.LOGIN_STATS : YTTrackingSwitchMask.GUEST_STATS) || !STATS_WHITELIST_PATH_REGEXP.test(path)) {
    assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.FAILED, error: new Error('Failed') })
    return
  }

  // Sanitize stats requests params
  searchParams.forEach((_, key) => STATS_API_BLOCK_PARAMS.has(key) && searchParams.delete(key))

  await replaceRequest(ctx, { url })
}

const updateEndpoint = (data: YTValueData<{ type: YTValueType.ENDPOINT }>): void => {
  if (data?.clickTrackingParams != null) data.clickTrackingParams = OVERRIDE_TRACKING_PARAMS
}

const updateRendererInner = (data: YTValueData<YTRenderer.Mapped | YTResponse.Mapped>): void => {
  if (data.clickTrackingParams != null) data.clickTrackingParams = OVERRIDE_TRACKING_PARAMS
  if (data.trackingParams != null) data.trackingParams = OVERRIDE_TRACKING_PARAMS
}

const updateRenderer = (data: YTValueData<{ type: YTValueType.RENDERER }>): void => {
  for (const key in data) {
    const child = data[key as keyof typeof data]
    if (child != null) updateRendererInner(child)
  }
}

const updateLoggingDirectives = (data: YTValueData<YTRenderer.Component<'loggingDirectives'>>): void => {
  delete data.clientVeSpec
  delete data.visibility
}

const updateChannelMetadataRenderer = (data: YTValueData<YTRenderer.Mapped<'channelMetadataRenderer'>>): void => {
  delete data.channelConversionUrl
}

const updateCopyLinkRenderer = (data: YTValueData<YTRenderer.Mapped<'copyLinkRenderer'>>): void => {
  const { shortUrl } = data

  if (shortUrl == null || isYTTrackingSwitchEnabled(YTTrackingSwitchMask.SHARE_ID)) return

  data.shortUrl = sanitizeShareUrl(shortUrl)
}

const updateFeedNudgeRenderer = (data: YTValueData<YTRenderer.Mapped<'feedNudgeRenderer'>>): void => {
  if (isYTTrackingSwitchEnabled(isYTLoggedIn() ? YTTrackingSwitchMask.LOGIN_STATS : YTTrackingSwitchMask.GUEST_STATS)) return

  data.title = { simpleText: 'Oh hi!' }
  data.subtitle = {
    runs: [
      { text: 'Watch history is currently disabled\n' },
      { text: 'You can enable watch history from the menu' }
    ]
  }
}

const updateShareTargetRenderer = (data: YTValueData<YTRenderer.Mapped<'shareTargetRenderer'>>): void => {
  const { navigationEndpoint } = data

  if (navigationEndpoint == null || isYTTrackingSwitchEnabled(YTTrackingSwitchMask.SHARE_ID)) return

  const { commandMetadata, urlEndpoint } = navigationEndpoint
  const { webCommandMetadata } = commandMetadata ?? {}

  if (webCommandMetadata?.url != null) webCommandMetadata.url = sanitizeShareUrl(webCommandMetadata.url)
  if (urlEndpoint?.url != null) urlEndpoint.url = sanitizeShareUrl(urlEndpoint.url)
}

const updateSharingEmbedRenderer = (data: YTValueData<YTRenderer.Mapped<'sharingEmbedRenderer'>>): void => {
  if (!isYTTrackingSwitchEnabled(YTTrackingSwitchMask.SHARE_ID)) delete data.attributionId
}

const updateResponseContext = (data: YTValueData<YTResponse.Component<'responseContext'>>): void => {
  const { mainAppWebResponseContext, serviceTrackingParams } = data

  if (mainAppWebResponseContext != null) {
    mainAppWebResponseContext.trackingParam = encodeTrackingParam('CioKDnRyYWNraW5nUGFyYW1zEhhDQUFRQUNJTUNBQVZBQUFBQUIwQUFBQUE')
  }
  serviceTrackingParams?.splice(0)
}

const updatePlayerResponse = (data: YTValueData<YTResponse.Mapped<'player'>>): void => {
  delete data.playbackTracking?.ptrackingUrl
  delete data.playbackTracking?.qoeUrl
  delete data.playbackTracking?.googleRemarketingUrl
  delete data.playbackTracking?.youtubeRemarketingUrl
}

const updateSearchResponse = (data: YTValueData<YTResponse.Mapped<'search'>>): void => {
  delete data.responseContext?.visitorData
}

export default class YTMiscsTrackingModule extends Feature {
  public constructor() {
    super('tracking')
  }

  protected activate(): boolean {
    YTPlayerContextConfigCallback.registerCallback(processPlayerContextConfig)

    values(YTResponse.mapped).forEach(schema => registerYTValueProcessor(schema, updateRendererInner))
    registerYTValueProcessor(ytv_enp(), updateEndpoint)
    registerYTValueProcessor(ytv_ren(), updateRenderer)
    registerYTValueProcessor(YTRenderer.components.loggingDirectives, updateLoggingDirectives)
    registerYTValueProcessor(YTRenderer.mapped.channelMetadataRenderer, updateChannelMetadataRenderer)
    registerYTValueProcessor(YTRenderer.mapped.copyLinkRenderer, updateCopyLinkRenderer)
    registerYTValueProcessor(YTRenderer.mapped.feedNudgeRenderer, updateFeedNudgeRenderer)
    registerYTValueProcessor(YTRenderer.mapped.shareTargetRenderer, updateShareTargetRenderer)
    registerYTValueProcessor(YTRenderer.mapped.sharingEmbedRenderer, updateSharingEmbedRenderer)
    registerYTValueProcessor(YTResponse.components.responseContext, updateResponseContext)
    registerYTValueProcessor(YTResponse.mapped.player, updatePlayerResponse)
    registerYTValueProcessor(YTResponse.mapped.search, updateSearchResponse)

    registerYTInnertubeRequestProcessor('*', ({ context }) => {
      delete context?.adSignalsInfo
      delete context?.clickTracking
      delete context?.clientScreenNonce
    })

    registerYTInnertubeRequestProcessor('player', ({ params, playbackContext, playlistId, playlistIndex, videoId }) => {
      params.searchQuery = null

      const contentPlaybackContext = playbackContext?.contentPlaybackContext
      if (contentPlaybackContext == null) return

      if (contentPlaybackContext.mdxContext != null && keys(contentPlaybackContext.mdxContext).length === 0) {
        delete contentPlaybackContext.mdxContext
      }
      delete contentPlaybackContext.isLivingRoomDeeplink
      delete contentPlaybackContext.playerHeightPixels
      delete contentPlaybackContext.playerWidthPixels
      delete contentPlaybackContext.referer

      contentPlaybackContext.lactMilliseconds = '-1'

      // Limited current url (can also be used to unlock formats in leanback /player request)
      const searchParams = new URLSearchParams()

      if (videoId != null) searchParams.set('v', videoId)
      if (playlistId != null) searchParams.set('list', playlistId)
      if (playlistIndex != null) searchParams.set('index', `${playlistIndex}`)

      contentPlaybackContext.currentUrl = `/watch?${searchParams.toString()}`
    })
    registerYTInnertubeRequestProcessor('search', request => {
      const { context } = request

      if (context != null) context.client.visitorData = ''

      delete request.suggestionSearchParams
      delete request.webSearchboxStatsUrl
    })

    addInterceptNetworkCallback(async ctx => {
      if (ctx.state === NetworkState.UNSENT) await processRequest(ctx)
    })
    addInterceptNetworkUrlFilter(HOST_REGEXP, FORBID_PATH_REGEXP, { state: NetworkState.FAILED, error: new Error('Failed') })
    addInterceptNetworkUrlFilter(HOST_REGEXP, FAKE_200_PATH_REGEXP, { state: NetworkState.SUCCESS, response: new Response(null, { status: 200 }) })
    addInterceptNetworkUrlFilter(HOST_REGEXP, FAKE_204_PATH_REGEXP, { state: NetworkState.SUCCESS, response: new Response(null, { status: 204 }) })

    const { get, set } = getOwnPropertyDescriptor(Document.prototype, 'cookie') ?? getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie') ?? {}
    defineProperty(document, 'cookie', {
      configurable: true,
      enumerable: true,
      get,
      set(v) {
        if (!String(v).startsWith('ST-')) set?.call(document, v)
      }
    })

    InterceptImage.setCallback((type, event) => {
      if (type !== 'srcchange') return

      const { pathname } = new URL((<CustomEvent<string>>event).detail, location.href)

      // Prevent blocked path from loading
      if (FORBID_PATH_REGEXP.test(pathname) || FAKE_200_PATH_REGEXP.test(pathname) || FAKE_204_PATH_REGEXP.test(pathname)) preventDispatchEvent(event)
    })

    registerYTConfigMenuItemGroup('privacy', [
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: TRACKING_SWITCHES_KEY,
        icon: YTRenderer.enums.IconType.PRIVACY_PUBLIC,
        text: 'Guest Watch History',
        mask: YTTrackingSwitchMask.GUEST_STATS,
        signals: [YTEndpoint.enums.SignalActionType.POPUP_BACK, YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE]
      },
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: TRACKING_SWITCHES_KEY,
        icon: YTRenderer.enums.IconType.PRIVACY_PRIVATE,
        text: 'Login Watch History',
        mask: YTTrackingSwitchMask.LOGIN_STATS,
        signals: [YTEndpoint.enums.SignalActionType.POPUP_BACK, YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE]
      },
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: TRACKING_SWITCHES_KEY,
        icon: YTRenderer.enums.IconType.SHARE_ARROW,
        text: 'Share ID',
        mask: YTTrackingSwitchMask.SHARE_ID,
        signals: [YTEndpoint.enums.SignalActionType.POPUP_BACK, YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE]
      }
    ])

    // Default only enable login stats
    if (getYTConfigInt(TRACKING_SWITCHES_KEY, -1) < 0) setYTConfigInt(TRACKING_SWITCHES_KEY, YTTrackingSwitchMask.LOGIN_STATS)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}