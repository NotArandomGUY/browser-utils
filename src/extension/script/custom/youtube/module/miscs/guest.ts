import { registerYTValueFilter, registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { isYTLoggedIn } from '@ext/custom/youtube/module/core/bootstrap'
import { Feature } from '@ext/lib/feature'

const MenuItemIconBlacklist = new Set<`${YTRenderer.enums.IconType}` | undefined>(['PLAYLIST_ADD'])
const TransportControlTypeBlacklist = new Set<string | undefined>([
  'TRANSPORT_CONTROLS_BUTTON_TYPE_LIKE_BUTTON',
  'TRANSPORT_CONTROLS_BUTTON_TYPE_SPONSORSHIPS',
  'TRANSPORT_CONTROLS_BUTTON_TYPE_SUPER_THANKS'
])

const updateChannelRenderer = (data: YTValueData<YTRenderer.Mapped<'channelRenderer' | 'gridChannelRenderer'>>): void => {
  if (!isYTLoggedIn()) delete data.subscribeButton
}

const updateVideoOwnerRenderer = (data: YTValueData<YTRenderer.Mapped<'videoOwnerRenderer'>>): void => {
  if (!isYTLoggedIn()) delete data.membershipButton
}

const filterMenuFlexibleItem = (data: YTValueData<YTRenderer.Mapped<'menuFlexibleItemRenderer'>>): boolean => {
  return isYTLoggedIn() || !MenuItemIconBlacklist.has(data.menuItem?.menuServiceItemRenderer?.icon?.iconType)
}

const filterTransportControlsAction = (data: YTValueData<YTRenderer.Component<'transportControlsAction'>>): boolean => {
  return isYTLoggedIn() || !TransportControlTypeBlacklist.has(data.type)
}

export default class YTMiscsGuestModule extends Feature {
  public constructor() {
    super('guest')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    cleanupCallbacks.push(
      registerYTValueFilter(YTRenderer.components.transportControlsAction, filterTransportControlsAction),
      registerYTValueFilter(YTRenderer.mapped.commentSimpleboxRenderer, isYTLoggedIn),
      registerYTValueFilter(YTRenderer.mapped.menuFlexibleItemRenderer, filterMenuFlexibleItem),
      registerYTValueFilter(YTRenderer.mapped.segmentedLikeDislikeButtonViewModel, isYTLoggedIn),
      registerYTValueFilter(YTRenderer.mapped.subscribeButtonRenderer, isYTLoggedIn),
      registerYTValueFilter(YTRenderer.mapped.subscribeButtonViewModel, isYTLoggedIn),
      registerYTValueProcessor(YTRenderer.mapped.channelRenderer, updateChannelRenderer),
      registerYTValueProcessor(YTRenderer.mapped.gridChannelRenderer, updateChannelRenderer),
      registerYTValueProcessor(YTRenderer.mapped.videoOwnerRenderer, updateVideoOwnerRenderer)
    )

    return true
  }
}