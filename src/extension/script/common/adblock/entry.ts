import AdblockGoogleAdModule from '@ext/common/adblock/module/google-ad'
import AdblockNavigatorModule from '@ext/common/adblock/module/navigator'
import AdblockNetworkModule from '@ext/common/adblock/module/network'
import AdblockRedirectDebugModule from '@ext/common/adblock/module/redirect-debug'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('adblock', group => {
  registerFeature(group, AdblockNetworkModule)
  registerFeature(group, AdblockNavigatorModule)
  registerFeature(group, AdblockGoogleAdModule)
  registerFeature(group, AdblockRedirectDebugModule)
}, ['preload'])