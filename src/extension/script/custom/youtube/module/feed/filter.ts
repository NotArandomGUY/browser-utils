import { registerYTValueFilter } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { isYTLoggedIn } from '@ext/custom/youtube/module/core/bootstrap'
import { getYTConfigBool, registerYTConfigMenuItemGroup, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
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

const filterGuideEntryRenderer = (data: YTValueData<YTRenderer.Mapped<'guideEntryRenderer'>>): boolean => {
  const browseId = data.navigationEndpoint?.browseEndpoint?.browseId ?? ''

  // Remove promotion
  if (browseId === 'SPunlimited' || data.navigationEndpoint?.urlEndpoint != null) return false

  // Remove shorts
  if (isYTFeedFilterEnable(YTFeedFilterMask.SHORTS) && data.serviceEndpoint?.reelWatchEndpoint != null) return false

  // Items for logged in users only
  return isYTLoggedIn() || !['FEhistory', 'FElibrary', 'FEsubscriptions', 'SPaccount_overview', 'SPreport_history'].includes(browseId)
}

const filterShelfRenderer = (data: YTValueData<YTRenderer.Mapped<'reelShelfRenderer' | 'richShelfRenderer'>>): boolean => {
  return !isYTFeedFilterEnable(YTFeedFilterMask.SHORTS) || !data.icon?.iconType?.includes('SHORTS')
}

const filterTileRenderer = (data: YTValueData<YTRenderer.Mapped<'tileRenderer'>>): boolean => {
  const header = data.header?.tileHeaderRenderer

  const icon = header?.thumbnailOverlays?.find(r => r.thumbnailOverlayTimeStatusRenderer != null)?.thumbnailOverlayTimeStatusRenderer?.icon?.iconType
  const isLive = icon?.includes('LIVE')

  return !isYTFeedFilterEnable(isLive ? YTFeedFilterMask.VIDEO_LIVE : YTFeedFilterMask.VIDEO)
}

const filterVideoRenderer = (data: YTValueData<YTRenderer.Mapped<'compactVideoRenderer' | 'videoRenderer'>>): boolean => {
  if (isYTFeedFilterEnable(YTFeedFilterMask.SHORTS) && data.navigationEndpoint?.reelWatchEndpoint != null) return false

  const icons = [
    data.thumbnailOverlays?.find(r => r.thumbnailOverlayTimeStatusRenderer)?.thumbnailOverlayTimeStatusRenderer?.icon?.iconType,
    ...data.badges?.map(b => b.metadataBadgeRenderer?.icon?.iconType) ?? []
  ]
  const isLive = icons.some(icon => icon?.includes('LIVE'))

  return !isYTFeedFilterEnable(isLive ? YTFeedFilterMask.VIDEO_LIVE : YTFeedFilterMask.VIDEO)
}

const filterShortsViewModel = (_data: YTValueData<YTRenderer.Mapped<'shortsLockupViewModel'>>): boolean => {
  return !isYTFeedFilterEnable(YTFeedFilterMask.SHORTS)
}

const filterVideoViewModel = (data: YTValueData<YTRenderer.Mapped<'lockupViewModel'>>): boolean => {
  const badges = data.contentImage?.thumbnailViewModel?.overlays?.find(r => r.thumbnailOverlayBadgeViewModel)?.thumbnailOverlayBadgeViewModel?.thumbnailBadges
  const isLive = badges?.find(r => r.thumbnailBadgeViewModel?.badgeStyle === 'THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE') != null

  return !isYTFeedFilterEnable(isLive ? YTFeedFilterMask.VIDEO_LIVE : YTFeedFilterMask.VIDEO)
}

export default class YTFeedFilterModule extends Feature {
  public constructor() {
    super('filter')
  }

  protected activate(): boolean {
    registerYTValueFilter(YTRenderer.mapped.compactVideoRenderer, filterVideoRenderer)
    registerYTValueFilter(YTRenderer.mapped.guideEntryRenderer, filterGuideEntryRenderer)
    registerYTValueFilter(YTRenderer.mapped.reelShelfRenderer, filterShelfRenderer)
    registerYTValueFilter(YTRenderer.mapped.richShelfRenderer, filterShelfRenderer)
    registerYTValueFilter(YTRenderer.mapped.tileRenderer, filterTileRenderer)
    registerYTValueFilter(YTRenderer.mapped.videoRenderer, filterVideoRenderer)
    registerYTValueFilter(YTRenderer.mapped.shortsLockupViewModel, filterShortsViewModel)
    registerYTValueFilter(YTRenderer.mapped.lockupViewModel, filterVideoViewModel)

    registerYTConfigMenuItemGroup(FEED_FILTER_KEY, [
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: FEED_FILTER_KEY,
        icon: YTRenderer.enums.IconType.YOUTUBE_SHORTS_BRAND_24,
        text: 'Shorts',
        mask: YTFeedFilterMask.SHORTS,
        invert: true
      },
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: FEED_FILTER_KEY,
        icon: YTRenderer.enums.IconType.LIVE,
        text: 'Live',
        mask: YTFeedFilterMask.VIDEO_LIVE,
        invert: true
      },
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: FEED_FILTER_KEY,
        icon: YTRenderer.enums.IconType.VIDEOS,
        text: 'Video',
        description: 'WARNING: Hiding videos might cause issues!',
        mask: YTFeedFilterMask.VIDEO,
        invert: true
      }
    ])

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}