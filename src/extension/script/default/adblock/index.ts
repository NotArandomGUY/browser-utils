import AdblockGoogleAdModule from '@ext/default/adblock/module/google-ad'
import AdblockNavigatorModule from '@ext/default/adblock/module/navigator'
import AdblockRedirectDebugModule from '@ext/default/adblock/module/redirect-debug'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('adblock', group => {
  registerFeature(group, AdblockNavigatorModule)
  registerFeature(group, AdblockGoogleAdModule)
  registerFeature(group, AdblockRedirectDebugModule)
})