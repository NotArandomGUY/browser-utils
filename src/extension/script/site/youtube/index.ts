import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import { hideOwnWebpackRuntimeFromGlobal } from '@ext/lib/wprt'
import YTChatBootstrapModule from '@ext/site/youtube/module/chat/bootstrap'
import YTChatEmojiPickerModule from '@ext/site/youtube/module/chat/emoji-picker'
import YTCoreActionModule from '@ext/site/youtube/module/core/action'
import YTCoreBootstrapModule from '@ext/site/youtube/module/core/bootstrap'
import YTCoreConfigModule from '@ext/site/youtube/module/core/config'
import YTCoreLoggingModule from '@ext/site/youtube/module/core/logging'
import YTCoreNetworkModule from '@ext/site/youtube/module/core/network'
import YTFeedFilterModule from '@ext/site/youtube/module/feed/filter'
import YTFeedGuestModule from '@ext/site/youtube/module/feed/guest'
import YTFeedGuideModule from '@ext/site/youtube/module/feed/guide'
import YTMiscsAdsModule from '@ext/site/youtube/module/miscs/ads'
import YTMiscsFixupModule from '@ext/site/youtube/module/miscs/fixup'
import YTMiscsMerchModule from '@ext/site/youtube/module/miscs/merch'
import YTMiscsPopupModule from '@ext/site/youtube/module/miscs/popup'
import YTMiscsTrackingModule from '@ext/site/youtube/module/miscs/tracking'
import YTPlayerAgeCheckModule from '@ext/site/youtube/module/player/age-check'
import YTPlayerBootstrapModule from '@ext/site/youtube/module/player/bootstrap'
import YTPlayerLiveHeadModule from '@ext/site/youtube/module/player/live-head'
import YTPlayerSmartSkipModule from '@ext/site/youtube/module/player/smart-skip'

registerFeatureGroup('youtube', group => {
  // Register core features
  registerFeature(group, YTCoreBootstrapModule)
  registerFeature(group, YTCoreLoggingModule)
  registerFeature(group, YTCoreNetworkModule)
  registerFeature(group, YTCoreActionModule)
  registerFeature(group, YTCoreConfigModule)

  // Register feed features
  registerFeature(group, YTFeedGuideModule)
  registerFeature(group, YTFeedFilterModule)
  registerFeature(group, YTFeedGuestModule)

  // Register player features
  registerFeature(group, YTPlayerBootstrapModule)
  registerFeature(group, YTPlayerLiveHeadModule)
  registerFeature(group, YTPlayerAgeCheckModule)
  registerFeature(group, YTPlayerSmartSkipModule)

  // Register chat features
  registerFeature(group, YTChatBootstrapModule)
  registerFeature(group, YTChatEmojiPickerModule)

  // Register miscs features
  registerFeature(group, YTMiscsAdsModule)
  registerFeature(group, YTMiscsTrackingModule)
  registerFeature(group, YTMiscsMerchModule)
  registerFeature(group, YTMiscsPopupModule)
  registerFeature(group, YTMiscsFixupModule)

  hideOwnWebpackRuntimeFromGlobal()
}, ['adblock', 'privacy'])