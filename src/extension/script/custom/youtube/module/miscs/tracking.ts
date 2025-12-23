import { YTSignalActionType } from '@ext/custom/youtube/api/endpoint'
import { registerYTRendererPreProcessor, setYTServiceTrackingOverride, YTLoggingDirectivesSchema, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { YTIconType } from '@ext/custom/youtube/api/types/icon'
import { isYTLoggedIn, YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { CONFIG_TEXT_DISABLE, CONFIG_TEXT_ENABLE, getYTConfigBool, getYTConfigInt, registerYTConfigMenuItem, setYTConfigInt, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { YTPlayerContextConfigCallback } from '@ext/custom/youtube/module/player/bootstrap'
import { assign, defineProperty, getOwnPropertyDescriptor, keys } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import InterceptImage from '@ext/lib/intercept/image'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState, replaceRequest } from '@ext/lib/intercept/network'
import { addInterceptNetworkUrlFilter } from '@ext/lib/intercept/network/filter/url'
import { buildPathnameRegexp } from '@ext/lib/regexp'

const TRACKING_SWITCHES_KEY = 'tracking-switches'
const SHARE_URL_ALLOW_PARAMS = new Set(['fmt', 'hl', 'index', 'list', 'pp', 't', 'v'])
const STATS_API_BLOCK_PARAMS = new Set(['cbr', 'cbrand', 'cbrver', 'cmodel', 'cos', 'cosver'])

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

const updateLoggingDirectives = (data: YTRendererData<typeof YTLoggingDirectivesSchema>): boolean => {
  delete data.clientVeSpec
  delete data.visibility

  return true
}

const updatePlayerResponse = (data: YTRendererData<YTRenderer<'playerResponse'>>): boolean => {
  delete data.playbackTracking?.ptrackingUrl
  delete data.playbackTracking?.qoeUrl
  delete data.playbackTracking?.googleRemarketingUrl
  delete data.playbackTracking?.youtubeRemarketingUrl

  return true
}

const updateSearchResponse = (data: YTRendererData<YTRenderer<'searchResponse'>>): boolean => {
  delete data.responseContext?.visitorData

  return true
}

const updateCopyLinkRenderer = (data: YTRendererData<YTRenderer<'copyLinkRenderer'>>): boolean => {
  const { shortUrl } = data

  if (!isYTTrackingSwitchEnabled(YTTrackingSwitchMask.SHARE_ID) && shortUrl != null) {
    data.shortUrl = sanitizeShareUrl(shortUrl)
  }

  return true
}

const updateFeedNudgeRenderer = (data: YTRendererData<YTRenderer<'feedNudgeRenderer'>>): boolean => {
  if (!isYTTrackingSwitchEnabled(isYTLoggedIn() ? YTTrackingSwitchMask.LOGIN_STATS : YTTrackingSwitchMask.GUEST_STATS)) {
    data.title = { simpleText: 'Oh hi!' }
    data.subtitle = {
      runs: [
        { text: 'Watch history is currently disabled\n' },
        { text: 'You can enable watch history from the menu' }
      ]
    }
  }

  return true
}

const updateShareTargetRenderer = (data: YTRendererData<YTRenderer<'shareTargetRenderer'>>): boolean => {
  const { navigationEndpoint } = data

  if (!isYTTrackingSwitchEnabled(YTTrackingSwitchMask.SHARE_ID) && navigationEndpoint != null) {
    const { commandMetadata, urlEndpoint } = navigationEndpoint
    const { webCommandMetadata } = commandMetadata ?? {}

    if (webCommandMetadata?.url != null) webCommandMetadata.url = sanitizeShareUrl(webCommandMetadata.url)
    if (urlEndpoint?.url != null) urlEndpoint.url = sanitizeShareUrl(urlEndpoint.url)
  }

  return true
}

const updateSharingEmbedRenderer = (data: YTRendererData<YTRenderer<'sharingEmbedRenderer'>>): boolean => {
  if (!isYTTrackingSwitchEnabled(YTTrackingSwitchMask.SHARE_ID)) delete data.attributionId

  return true
}

export default class YTMiscsTrackingModule extends Feature {
  public constructor() {
    super('tracking')
  }

  protected activate(): boolean {
    YTPlayerContextConfigCallback.registerCallback(processPlayerContextConfig)

    setYTServiceTrackingOverride('CSI', 'yt_ad', '0')
    setYTServiceTrackingOverride('CSI', 'yt_red', '1')

    registerYTRendererPreProcessor(YTLoggingDirectivesSchema, updateLoggingDirectives)
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)
    registerYTRendererPreProcessor(YTRendererSchemaMap['searchResponse'], updateSearchResponse)
    registerYTRendererPreProcessor(YTRendererSchemaMap['copyLinkRenderer'], updateCopyLinkRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['feedNudgeRenderer'], updateFeedNudgeRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['shareTargetRenderer'], updateShareTargetRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['sharingEmbedRenderer'], updateSharingEmbedRenderer)

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

    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: TRACKING_SWITCHES_KEY,
      disabledIcon: YTIconType.PRIVACY_PRIVATE,
      disabledText: `Guest Watch History: ${CONFIG_TEXT_DISABLE}`,
      enabledIcon: YTIconType.PRIVACY_PUBLIC,
      enabledText: `Guest Watch History: ${CONFIG_TEXT_ENABLE}`,
      mask: YTTrackingSwitchMask.GUEST_STATS,
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE]
    })
    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: TRACKING_SWITCHES_KEY,
      disabledIcon: YTIconType.PRIVACY_PRIVATE,
      disabledText: `Login Watch History: ${CONFIG_TEXT_DISABLE}`,
      enabledIcon: YTIconType.PRIVACY_PUBLIC,
      enabledText: `Login Watch History: ${CONFIG_TEXT_ENABLE}`,
      mask: YTTrackingSwitchMask.LOGIN_STATS,
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE]
    })
    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: TRACKING_SWITCHES_KEY,
      disabledIcon: YTIconType.PRIVACY_PRIVATE,
      disabledText: `Share ID: ${CONFIG_TEXT_DISABLE}`,
      enabledIcon: YTIconType.PRIVACY_PUBLIC,
      enabledText: `Share ID: ${CONFIG_TEXT_ENABLE}`,
      mask: YTTrackingSwitchMask.SHARE_ID,
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE]
    })

    // Default only enable login stats
    if (getYTConfigInt(TRACKING_SWITCHES_KEY, -1) < 0) setYTConfigInt(TRACKING_SWITCHES_KEY, YTTrackingSwitchMask.LOGIN_STATS)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}