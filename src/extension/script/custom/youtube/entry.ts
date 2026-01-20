import YTChatEmojiPickerModule from '@ext/custom/youtube/module/chat/emoji-picker'
import YTChatPopoutModule from '@ext/custom/youtube/module/chat/popout'
import YTCoreBootstrapModule from '@ext/custom/youtube/module/core/bootstrap'
import YTCoreCommandModule from '@ext/custom/youtube/module/core/command'
import YTCoreConfigModule from '@ext/custom/youtube/module/core/config'
import YTCoreLoggingModule from '@ext/custom/youtube/module/core/logging'
import YTCoreNetworkModule from '@ext/custom/youtube/module/core/network'
import YTCoreSandboxModule from '@ext/custom/youtube/module/core/sandbox'
import YTFeedFilterModule from '@ext/custom/youtube/module/feed/filter'
import YTFeedGuideModule from '@ext/custom/youtube/module/feed/guide'
import YTMiscsAdsModule from '@ext/custom/youtube/module/miscs/ads'
import YTMiscsBackgroundModule from '@ext/custom/youtube/module/miscs/background'
import YTMiscsFixupModule from '@ext/custom/youtube/module/miscs/fixup'
import YTMiscsGuestModule from '@ext/custom/youtube/module/miscs/guest'
import YTMiscsMerchModule from '@ext/custom/youtube/module/miscs/merch'
import YTMiscsPopupModule from '@ext/custom/youtube/module/miscs/popup'
import YTMiscsThumbnailModule from '@ext/custom/youtube/module/miscs/thumbnail'
import YTMiscsTrackingModule from '@ext/custom/youtube/module/miscs/tracking'
import YTPlayerBootstrapModule from '@ext/custom/youtube/module/player/bootstrap'
import YTPlayerContentCheckModule from '@ext/custom/youtube/module/player/content-check'
import YTPlayerLiveModule from '@ext/custom/youtube/module/player/live'
import YTPlayerOfflineModule from '@ext/custom/youtube/module/player/offline'
import YTPlayerSmartSkipModule from '@ext/custom/youtube/module/player/smart-skip'
import YTPlayerUMPModule from '@ext/custom/youtube/module/player/ump'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import { hideOwnWebpackRuntimeFromGlobal } from '@ext/lib/wprt'

const GROUP_ID_PREFIX = 'youtube'
const CORE_GROUP_ID = `${GROUP_ID_PREFIX}-core`
const FEED_GROUP_ID = `${GROUP_ID_PREFIX}-feed`
const PLAYER_GROUP_ID = `${GROUP_ID_PREFIX}-player`
const CHAT_GROUP_ID = `${GROUP_ID_PREFIX}-chat`
const MISCS_GROUP_ID = `${GROUP_ID_PREFIX}-miscs`

registerFeatureGroup(CORE_GROUP_ID, group => {
  registerFeature(group, YTCoreSandboxModule)
  registerFeature(group, YTCoreBootstrapModule)
  registerFeature(group, YTCoreLoggingModule)
  registerFeature(group, YTCoreNetworkModule)
  registerFeature(group, YTCoreCommandModule)
  registerFeature(group, YTCoreConfigModule)

  hideOwnWebpackRuntimeFromGlobal()
}, ['preload'])

registerFeatureGroup(FEED_GROUP_ID, group => {
  registerFeature(group, YTFeedGuideModule)
  registerFeature(group, YTFeedFilterModule)
}, [CORE_GROUP_ID])

registerFeatureGroup(PLAYER_GROUP_ID, group => {
  registerFeature(group, YTPlayerBootstrapModule)
  registerFeature(group, YTPlayerUMPModule)
  registerFeature(group, YTPlayerLiveModule)
  registerFeature(group, YTPlayerContentCheckModule)
  registerFeature(group, YTPlayerOfflineModule)
  registerFeature(group, YTPlayerSmartSkipModule)
}, [CORE_GROUP_ID])

registerFeatureGroup(CHAT_GROUP_ID, group => {
  registerFeature(group, YTChatEmojiPickerModule)
  registerFeature(group, YTChatPopoutModule)
}, [CORE_GROUP_ID])

registerFeatureGroup(MISCS_GROUP_ID, group => {
  registerFeature(group, YTMiscsAdsModule)
  registerFeature(group, YTMiscsTrackingModule)
  registerFeature(group, YTMiscsGuestModule)
  registerFeature(group, YTMiscsThumbnailModule)
  registerFeature(group, YTMiscsMerchModule)
  registerFeature(group, YTMiscsBackgroundModule)
  registerFeature(group, YTMiscsPopupModule)
  registerFeature(group, YTMiscsFixupModule)
}, [CORE_GROUP_ID])