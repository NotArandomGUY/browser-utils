import { Feature } from '@ext/lib/feature'
import { removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { isYTLoggedIn } from '@ext/site/youtube/module/core/bootstrap'
import { isShowShorts } from '@ext/site/youtube/module/feed/filter'

function filterGuideEntry(data: YTRendererData<YTRenderer<'guideEntryRenderer'>>): boolean {
  const browseId = data.navigationEndpoint?.browseEndpoint?.browseId ?? ''

  // Remove premium promotion
  if (browseId === 'SPunlimited' || data.navigationEndpoint?.urlEndpoint != null) return false

  // Remove shorts guide entry
  if (!isShowShorts() && data.serviceEndpoint?.reelWatchEndpoint != null) return false

  // Hide inaccessible guide entries for guest
  return isYTLoggedIn() || !['FEhistory', 'FElibrary', 'FEsubscriptions', 'SPaccount_overview', 'SPreport_history'].includes(browseId)
}

export default class YTFeedGuideModule extends Feature {
  public constructor() {
    super('feed-guide')
  }

  protected activate(): boolean {
    removeYTRendererPre(YTRendererSchemaMap['guideEntryRenderer'], filterGuideEntry)
    removeYTRendererPre(YTRendererSchemaMap['guideSigninPromoRenderer'])

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}