import { Feature } from '@ext/lib/feature'
import { registerYTRendererPreProcessor, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { isYTLoggedIn } from '@ext/site/youtube/module/core/bootstrap'

function updateFeedNudgeRenderer(data: YTRendererData<YTRenderer<'feedNudgeRenderer'>>): boolean {
  if (!isYTLoggedIn()) {
    data.title = { simpleText: 'Oh hi!' }
    data.subtitle = {
      runs: [
        { text: 'Home feed has been disabled~\n' },
        { text: 'Sign in to use it!\n' },
        { text: 'P.S. let me know if it suddenly works, it should not' }
      ]
    }
  }

  return true
}

function updateChannelRenderer(data: YTRendererData<YTRenderer<'channelRenderer' | 'gridChannelRenderer'>>): boolean {
  if (!isYTLoggedIn()) delete data.subscribeButton

  return true
}

function updateVideoOwnerRenderer(data: YTRendererData<YTRenderer<'videoOwnerRenderer'>>): boolean {
  if (!isYTLoggedIn()) delete data.membershipButton

  return true
}

function filterMenuFlexibleItem(data: YTRendererData<YTRenderer<'menuFlexibleItemRenderer'>>): boolean {
  return isYTLoggedIn() || !['PLAYLIST_ADD'].includes(data.menuItem?.menuServiceItemRenderer?.icon?.iconType ?? '')
}

export default class YTMiscsGuestModule extends Feature {
  public constructor() {
    super('guest')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['channelRenderer'], updateChannelRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['feedNudgeRenderer'], updateFeedNudgeRenderer)
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