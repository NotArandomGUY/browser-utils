import { Feature } from '@ext/lib/feature'
import { YTSignalActionType } from '@ext/site/youtube/api/endpoint'
import { removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { YTIconType } from '@ext/site/youtube/api/types/icon'
import { isYTLoggedIn } from '@ext/site/youtube/module/core/bootstrap'
import { getYTConfigBool, registerYTConfigMenuItem, YTConfigMenuItemType } from '@ext/site/youtube/module/core/config'

const SHOW_SHORTS_KEY = 'show-shorts'
const SHOW_LIVE_KEY = 'show-live'
const SHOW_VIDEO_KEY = 'show-video'

export function isShowShorts(): boolean {
  return getYTConfigBool(SHOW_SHORTS_KEY, true)
}

export function isShowLive(): boolean {
  return getYTConfigBool(SHOW_LIVE_KEY, true)
}

export function isShowVideo(): boolean {
  return getYTConfigBool(SHOW_VIDEO_KEY, true)
}

function filterGuideEntry(data: YTRendererData<YTRenderer<'guideEntryRenderer'>>): boolean {
  const browseId = data.navigationEndpoint?.browseEndpoint?.browseId ?? ''

  // Remove promotion
  if (browseId === 'SPunlimited' || data.navigationEndpoint?.urlEndpoint != null) return false

  // Remove shorts
  if (!isShowShorts() && data.serviceEndpoint?.reelWatchEndpoint != null) return false

  // Items for logged in users only
  return isYTLoggedIn() || !['FEhistory', 'FElibrary', 'FEsubscriptions', 'SPaccount_overview', 'SPreport_history'].includes(browseId)
}

function filterShelf(data: YTRendererData<YTRenderer<'reelShelfRenderer' | 'richShelfRenderer'>>): boolean {
  return isShowShorts() || !data.icon?.iconType?.includes('SHORTS')
}

function filterVideo(data: YTRendererData<YTRenderer<'compactVideoRenderer' | 'videoRenderer'>>): boolean {
  if (!isShowShorts() && data.navigationEndpoint?.reelWatchEndpoint != null) return false

  const isLive = data.badges?.map(b => b.metadataBadgeRenderer?.icon?.iconType).find(b => b?.includes('LIVE')) != null
  if (!isShowLive() && isLive) return false
  if (!isShowVideo() && !isLive) return false

  return true
}

export default class YTFeedFilterModule extends Feature {
  public constructor() {
    super('feed-filter')
  }

  protected activate(): boolean {
    removeYTRendererPre(YTRendererSchemaMap['compactVideoRenderer'], filterVideo)
    removeYTRendererPre(YTRendererSchemaMap['guideEntryRenderer'], filterGuideEntry)
    removeYTRendererPre(YTRendererSchemaMap['reelShelfRenderer'], filterShelf)
    removeYTRendererPre(YTRendererSchemaMap['richShelfRenderer'], filterShelf)
    removeYTRendererPre(YTRendererSchemaMap['shortsLockupViewModel'], isShowShorts)
    removeYTRendererPre(YTRendererSchemaMap['videoRenderer'], filterVideo)

    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: SHOW_SHORTS_KEY,
      disabledIcon: YTIconType.YOUTUBE_SHORTS_BRAND_24,
      disabledText: 'Show Shorts',
      enabledIcon: YTIconType.YOUTUBE_SHORTS_BRAND_24,
      enabledText: 'Hide Shorts',
      defaultValue: true,
      signals: [YTSignalActionType.RELOAD_PAGE]
    })
    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: SHOW_LIVE_KEY,
      disabledIcon: YTIconType.LIVE,
      disabledText: 'Show Live',
      enabledIcon: YTIconType.LIVE,
      enabledText: 'Hide Live',
      defaultValue: true,
      signals: [YTSignalActionType.SOFT_RELOAD_PAGE]
    })
    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: SHOW_VIDEO_KEY,
      disabledIcon: YTIconType.VIDEOS,
      disabledText: 'Show Video',
      enabledIcon: YTIconType.VIDEOS,
      enabledText: 'Hide Video !!Dangerous!!',
      defaultValue: true,
      signals: [YTSignalActionType.SOFT_RELOAD_PAGE]
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}