import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import { hideOwnWebpackRuntimeFromGlobal } from '@ext/lib/wprt'
import YTActionModule from '@ext/site/youtube/module/action'
import YTBootstrapModule from '@ext/site/youtube/module/bootstrap'
import YTFixupModule from '@ext/site/youtube/module/fixup'
import YTLoggingModule from '@ext/site/youtube/module/logging'
import YTModModule from '@ext/site/youtube/module/mod'
import YTNetworkModule from '@ext/site/youtube/module/network'
import YTPlayerModule from '@ext/site/youtube/module/player'
import YTPremiumModule from '@ext/site/youtube/module/premium'

registerFeatureGroup('youtube', group => {
  registerFeature(group, YTBootstrapModule)
  registerFeature(group, YTActionModule)
  registerFeature(group, YTFixupModule)
  registerFeature(group, YTLoggingModule)
  registerFeature(group, YTPlayerModule)
  registerFeature(group, YTPremiumModule)
  registerFeature(group, YTNetworkModule)
  registerFeature(group, YTModModule)

  hideOwnWebpackRuntimeFromGlobal()
})