import { registerYTValueFilter, registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { isYTLoggedIn } from '@ext/custom/youtube/module/core/bootstrap'
import { Feature } from '@ext/lib/feature'

const updateChannelRenderer = (data: YTValueData<YTRenderer.Mapped<'channelRenderer' | 'gridChannelRenderer'>>): boolean => {
  if (!isYTLoggedIn()) delete data.subscribeButton

  return true
}

const updateVideoOwnerRenderer = (data: YTValueData<YTRenderer.Mapped<'videoOwnerRenderer'>>): boolean => {
  if (!isYTLoggedIn()) delete data.membershipButton

  return true
}

const filterMenuFlexibleItem = (data: YTValueData<YTRenderer.Mapped<'menuFlexibleItemRenderer'>>): boolean => {
  return isYTLoggedIn() || !['PLAYLIST_ADD'].includes(data.menuItem?.menuServiceItemRenderer?.icon?.iconType ?? '')
}

export default class YTMiscsGuestModule extends Feature {
  public constructor() {
    super('guest')
  }

  protected activate(): boolean {
    registerYTValueFilter(YTRenderer.mapped.commentSimpleboxRenderer, isYTLoggedIn)
    registerYTValueFilter(YTRenderer.mapped.menuFlexibleItemRenderer, filterMenuFlexibleItem)
    registerYTValueFilter(YTRenderer.mapped.segmentedLikeDislikeButtonViewModel, isYTLoggedIn)
    registerYTValueFilter(YTRenderer.mapped.subscribeButtonRenderer, isYTLoggedIn)
    registerYTValueFilter(YTRenderer.mapped.subscribeButtonViewModel, isYTLoggedIn)
    registerYTValueProcessor(YTRenderer.mapped.channelRenderer, updateChannelRenderer)
    registerYTValueProcessor(YTRenderer.mapped.gridChannelRenderer, updateChannelRenderer)
    registerYTValueProcessor(YTRenderer.mapped.videoOwnerRenderer, updateVideoOwnerRenderer)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}