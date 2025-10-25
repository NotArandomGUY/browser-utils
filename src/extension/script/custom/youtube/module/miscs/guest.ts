import { registerYTRendererPreProcessor, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { isYTLoggedIn } from '@ext/custom/youtube/module/core/bootstrap'
import { Feature } from '@ext/lib/feature'

const updateChannelRenderer = (data: YTRendererData<YTRenderer<'channelRenderer' | 'gridChannelRenderer'>>): boolean => {
  if (!isYTLoggedIn()) delete data.subscribeButton

  return true
}

const updateVideoOwnerRenderer = (data: YTRendererData<YTRenderer<'videoOwnerRenderer'>>): boolean => {
  if (!isYTLoggedIn()) delete data.membershipButton

  return true
}

const filterMenuFlexibleItem = (data: YTRendererData<YTRenderer<'menuFlexibleItemRenderer'>>): boolean => {
  return isYTLoggedIn() || !['PLAYLIST_ADD'].includes(data.menuItem?.menuServiceItemRenderer?.icon?.iconType ?? '')
}

export default class YTMiscsGuestModule extends Feature {
  public constructor() {
    super('guest')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['channelRenderer'], updateChannelRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['gridChannelRenderer'], updateChannelRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['videoOwnerRenderer'], updateVideoOwnerRenderer)

    removeYTRendererPre(YTRendererSchemaMap['commentSimpleboxRenderer'], isYTLoggedIn)
    removeYTRendererPre(YTRendererSchemaMap['menuFlexibleItemRenderer'], filterMenuFlexibleItem)
    removeYTRendererPre(YTRendererSchemaMap['segmentedLikeDislikeButtonViewModel'], isYTLoggedIn)
    removeYTRendererPre(YTRendererSchemaMap['subscribeButtonRenderer'], isYTLoggedIn)
    removeYTRendererPre(YTRendererSchemaMap['subscribeButtonViewModel'], isYTLoggedIn)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}