import NFNetworkModule from '@ext/custom/netflix/modules/network'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('netflix', group => {
  registerFeature(group, NFNetworkModule)
}, ['preload'])