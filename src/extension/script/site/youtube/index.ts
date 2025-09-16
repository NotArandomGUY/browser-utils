import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import { hideOwnWebpackRuntimeFromGlobal } from '@ext/lib/wprt'
import YTChatBootstrapModule from '@ext/site/youtube/module/chat/bootstrap'
import YTChatEmojiPickerModule from '@ext/site/youtube/module/chat/emoji-picker'
import YTChatPopoutModule from '@ext/site/youtube/module/chat/popout'
import YTCoreBootstrapModule from '@ext/site/youtube/module/core/bootstrap'
import YTCoreConfigModule from '@ext/site/youtube/module/core/config'
import YTCoreEventModule from '@ext/site/youtube/module/core/event'
import YTCoreLoggingModule from '@ext/site/youtube/module/core/logging'
import YTCoreNetworkModule from '@ext/site/youtube/module/core/network'
import YTCoreSandboxModule from '@ext/site/youtube/module/core/sandbox'
import YTFeedFilterModule from '@ext/site/youtube/module/feed/filter'
import YTFeedGuideModule from '@ext/site/youtube/module/feed/guide'
import YTMiscsAdsModule from '@ext/site/youtube/module/miscs/ads'
import YTMiscsBackgroundModule from '@ext/site/youtube/module/miscs/background'
import YTMiscsFixupModule from '@ext/site/youtube/module/miscs/fixup'
import YTMiscsGuestModule from '@ext/site/youtube/module/miscs/guest'
import YTMiscsMerchModule from '@ext/site/youtube/module/miscs/merch'
import YTMiscsPopupModule from '@ext/site/youtube/module/miscs/popup'
import YTMiscsThumbnailModule from '@ext/site/youtube/module/miscs/thumbnail'
import YTMiscsTrackingModule from '@ext/site/youtube/module/miscs/tracking'
import YTPlayerAgeCheckModule from '@ext/site/youtube/module/player/age-check'
import YTPlayerBootstrapModule from '@ext/site/youtube/module/player/bootstrap'
import YTPlayerLiveModule from '@ext/site/youtube/module/player/live'
import YTPlayerSmartSkipModule from '@ext/site/youtube/module/player/smart-skip'
import YTPlayerUMPModule from '@ext/site/youtube/module/player/ump'

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
  registerFeature(group, YTCoreEventModule)
  registerFeature(group, YTCoreConfigModule)

  hideOwnWebpackRuntimeFromGlobal()
}, ['adblock', 'privacy'])

registerFeatureGroup(FEED_GROUP_ID, group => {
  registerFeature(group, YTFeedGuideModule)
  registerFeature(group, YTFeedFilterModule)
}, [CORE_GROUP_ID])

registerFeatureGroup(PLAYER_GROUP_ID, group => {
  registerFeature(group, YTPlayerBootstrapModule)
  registerFeature(group, YTPlayerUMPModule)
  registerFeature(group, YTPlayerLiveModule)
  registerFeature(group, YTPlayerAgeCheckModule)
  registerFeature(group, YTPlayerSmartSkipModule)
}, [CORE_GROUP_ID])

registerFeatureGroup(CHAT_GROUP_ID, group => {
  registerFeature(group, YTChatBootstrapModule)
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