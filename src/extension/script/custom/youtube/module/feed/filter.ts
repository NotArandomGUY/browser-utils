import { YTSignalActionType } from '@ext/custom/youtube/api/endpoint'
import { removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { YTIconType } from '@ext/custom/youtube/api/types/icon'
import { isYTLoggedIn } from '@ext/custom/youtube/module/core/bootstrap'
import { getYTConfigBool, registerYTConfigMenuItem, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { Feature } from '@ext/lib/feature'

const FEED_FILTER_KEY = 'feed-filter'

export const enum YTFeedFilterMask {
  VIDEO = 0x01,
  VIDEO_LIVE = 0x02,
  SHORTS = 0x04
}

export const isYTFeedFilterEnable = (mask: YTFeedFilterMask): boolean => {
  return getYTConfigBool(FEED_FILTER_KEY, false, mask)
}

const filterGuideEntryRenderer = (data: YTRendererData<YTRenderer<'guideEntryRenderer'>>): boolean => {
  const browseId = data.navigationEndpoint?.browseEndpoint?.browseId ?? ''

  // Remove promotion
  if (browseId === 'SPunlimited' || data.navigationEndpoint?.urlEndpoint != null) return false

  // Remove shorts
  if (isYTFeedFilterEnable(YTFeedFilterMask.SHORTS) && data.serviceEndpoint?.reelWatchEndpoint != null) return false

  // Items for logged in users only
  return isYTLoggedIn() || !['FEhistory', 'FElibrary', 'FEsubscriptions', 'SPaccount_overview', 'SPreport_history'].includes(browseId)
}

const filterShelfRenderer = (data: YTRendererData<YTRenderer<'reelShelfRenderer' | 'richShelfRenderer'>>): boolean => {
  return !isYTFeedFilterEnable(YTFeedFilterMask.SHORTS) || !data.icon?.iconType?.includes('SHORTS')
}

const filterTileRenderer = (data: YTRendererData<YTRenderer<'tileRenderer'>>): boolean => {
  const header = data.header?.tileHeaderRenderer

  const icon = header?.thumbnailOverlays?.find(r => r.thumbnailOverlayTimeStatusRenderer != null)?.thumbnailOverlayTimeStatusRenderer?.icon?.iconType
  const isLive = icon?.includes('LIVE')

  return !isYTFeedFilterEnable(isLive ? YTFeedFilterMask.VIDEO_LIVE : YTFeedFilterMask.VIDEO)
}

const filterVideoRenderer = (data: YTRendererData<YTRenderer<'compactVideoRenderer' | 'videoRenderer'>>): boolean => {
  if (isYTFeedFilterEnable(YTFeedFilterMask.SHORTS) && data.navigationEndpoint?.reelWatchEndpoint != null) return false

  const icons = [
    data.thumbnailOverlays?.find(r => r.thumbnailOverlayTimeStatusRenderer)?.thumbnailOverlayTimeStatusRenderer?.icon?.iconType,
    ...data.badges?.map(b => b.metadataBadgeRenderer?.icon?.iconType) ?? []
  ]
  const isLive = icons.find(icon => icon?.includes('LIVE')) != null

  return !isYTFeedFilterEnable(isLive ? YTFeedFilterMask.VIDEO_LIVE : YTFeedFilterMask.VIDEO)
}

const filterShortsViewModel = (_data: YTRendererData<YTRenderer<'shortsLockupViewModel'>>): boolean => {
  return !isYTFeedFilterEnable(YTFeedFilterMask.SHORTS)
}

const filterVideoViewModel = (data: YTRendererData<YTRenderer<'lockupViewModel'>>): boolean => {
  const badges = data.contentImage?.thumbnailViewModel?.overlays?.find(r => r.thumbnailOverlayBadgeViewModel)?.thumbnailOverlayBadgeViewModel?.thumbnailBadges
  const isLive = badges?.find(r => r.thumbnailBadgeViewModel?.badgeStyle === 'THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE') != null

  return !isYTFeedFilterEnable(isLive ? YTFeedFilterMask.VIDEO_LIVE : YTFeedFilterMask.VIDEO)
}

export default class YTFeedFilterModule extends Feature {
  public constructor() {
    super('filter')
  }

  protected activate(): boolean {
    removeYTRendererPre(YTRendererSchemaMap['compactVideoRenderer'], filterVideoRenderer)
    removeYTRendererPre(YTRendererSchemaMap['guideEntryRenderer'], filterGuideEntryRenderer)
    removeYTRendererPre(YTRendererSchemaMap['reelShelfRenderer'], filterShelfRenderer)
    removeYTRendererPre(YTRendererSchemaMap['richShelfRenderer'], filterShelfRenderer)
    removeYTRendererPre(YTRendererSchemaMap['tileRenderer'], filterTileRenderer)
    removeYTRendererPre(YTRendererSchemaMap['videoRenderer'], filterVideoRenderer)
    removeYTRendererPre(YTRendererSchemaMap['shortsLockupViewModel'], filterShortsViewModel)
    removeYTRendererPre(YTRendererSchemaMap['lockupViewModel'], filterVideoViewModel)

    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: FEED_FILTER_KEY,
      disabledIcon: YTIconType.YOUTUBE_SHORTS_BRAND_24,
      disabledText: 'Hide Shorts',
      enabledIcon: YTIconType.YOUTUBE_SHORTS_BRAND_24,
      enabledText: 'Show Shorts',
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE],
      mask: YTFeedFilterMask.SHORTS
    })
    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: FEED_FILTER_KEY,
      disabledIcon: YTIconType.LIVE,
      disabledText: 'Hide Live',
      enabledIcon: YTIconType.LIVE,
      enabledText: 'Show Live',
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE],
      mask: YTFeedFilterMask.VIDEO_LIVE
    })
    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: FEED_FILTER_KEY,
      disabledIcon: YTIconType.VIDEOS,
      disabledText: 'Hide Video !!Dangerous!!',
      enabledIcon: YTIconType.VIDEOS,
      enabledText: 'Show Video',
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE],
      mask: YTFeedFilterMask.VIDEO
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}