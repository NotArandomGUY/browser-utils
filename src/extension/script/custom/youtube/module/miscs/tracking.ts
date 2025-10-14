import { YTSignalActionType } from '@ext/custom/youtube/api/endpoint'
import { registerYTRendererPreProcessor, setYTServiceTrackingOverride, YTLoggingDirectivesSchema, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { YTIconType } from '@ext/custom/youtube/api/types/icon'
import { isYTLoggedIn } from '@ext/custom/youtube/module/core/bootstrap'
import { getYTConfigInt, registerYTConfigMenuItem, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { assign } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import InterceptImage from '@ext/lib/intercept/image'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import { addInterceptNetworkUrlFilter } from '@ext/lib/intercept/network/filter/url'
import { buildPathnameRegexp } from '@ext/lib/regexp'

const TRACKING_LEVEL_KEY = 'tracking-level'

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
const DYNAMIC_BLACKLIST_PATH_REGEXP = buildPathnameRegexp([
  '/api/stats'
])
const DYNAMIC_WHITELIST_PATH_REGEXP = buildPathnameRegexp([
  '/api/stats/(atr|playback|delayplay|watchtime)'
])

const enum TrackingLevel {
  DEFAULT = 0,
  DISABLE
}

const processRequest = (ctx: NetworkRequestContext): void => {
  const { url, request } = ctx

  // Remove visitor id from everything
  request.headers.delete('x-goog-visitor-id')

  // Ignore non dynamic blacklist requests
  const path = url.pathname + url.search
  if (!DYNAMIC_BLACKLIST_PATH_REGEXP.test(path)) return

  const level = getYTConfigInt(TRACKING_LEVEL_KEY, TrackingLevel.DEFAULT)
  if (level !== TrackingLevel.DISABLE) {
    // Enable dynamic whitelist when logged in
    if (isYTLoggedIn() && DYNAMIC_WHITELIST_PATH_REGEXP.test(path)) return
  }

  // Block request
  assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.FAILED, error: new Error('Failed') })
}

const updateLoggingDirectives = (data: YTRendererData<typeof YTLoggingDirectivesSchema>): boolean => {
  delete data.clientVeSpec
  delete data.visibility

  return true
}

const updatePlayerResponse = (data: YTRendererData<YTRenderer<'playerResponse'>>): boolean => {
  delete data.playbackTracking?.ptrackingUrl
  delete data.playbackTracking?.qoeUrl
  delete data.playbackTracking?.atrUrl
  delete data.playbackTracking?.googleRemarketingUrl
  delete data.playbackTracking?.youtubeRemarketingUrl

  return true
}

const updateSearchResponse = (data: YTRendererData<YTRenderer<'searchResponse'>>): boolean => {
  delete data.responseContext?.visitorData

  return true
}

export default class YTMiscsTrackingModule extends Feature {
  public constructor() {
    super('tracking')
  }

  protected activate(): boolean {
    setYTServiceTrackingOverride('CSI', 'yt_ad', '0')
    setYTServiceTrackingOverride('CSI', 'yt_red', '1')

    registerYTRendererPreProcessor(YTLoggingDirectivesSchema, updateLoggingDirectives)
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)
    registerYTRendererPreProcessor(YTRendererSchemaMap['searchResponse'], updateSearchResponse)

    registerYTInnertubeRequestProcessor('player', ({ params }) => {
      params.searchQuery = null
    })
    registerYTInnertubeRequestProcessor('search', request => {
      request.context.client.visitorData = ''

      delete request.suggestionSearchParams
      delete request.webSearchboxStatsUrl
    })

    addInterceptNetworkCallback(ctx => {
      if (ctx.state === NetworkState.UNSENT) processRequest(ctx)
    })
    addInterceptNetworkUrlFilter(HOST_REGEXP, FORBID_PATH_REGEXP, { state: NetworkState.FAILED, error: new Error('Failed') })
    addInterceptNetworkUrlFilter(HOST_REGEXP, FAKE_200_PATH_REGEXP, { state: NetworkState.SUCCESS, response: new Response(null, { status: 200 }) })
    addInterceptNetworkUrlFilter(HOST_REGEXP, FAKE_204_PATH_REGEXP, { state: NetworkState.SUCCESS, response: new Response(null, { status: 204 }) })

    InterceptImage.setCallback((type, event) => {
      if (type !== 'srcchange') return

      const { pathname } = new URL((<CustomEvent<string>>event).detail, location.href)

      // Prevent blocked path from loading
      if (FORBID_PATH_REGEXP.test(pathname) || FAKE_200_PATH_REGEXP.test(pathname) || FAKE_204_PATH_REGEXP.test(pathname)) preventDispatchEvent(event)
    })

    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: TRACKING_LEVEL_KEY,
      disabledIcon: YTIconType.PRIVACY_PUBLIC,
      disabledText: 'Tracking: Default',
      enabledIcon: YTIconType.PRIVACY_PRIVATE,
      enabledText: 'Tracking: Disable',
      defaultValue: false,
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE]
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}