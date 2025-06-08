import AdblockGoogleAdModule from '@ext/default/adblock/module/google-ad'
import AdblockNavigatorModule from '@ext/default/adblock/module/navigator'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('adblock', group => {
  registerFeature(group, AdblockNavigatorModule)
  registerFeature(group, AdblockGoogleAdModule)
})