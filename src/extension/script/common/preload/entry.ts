import PreloadMessageModule from '@ext/common/preload/module/message'
import PreloadOverlayModule from '@ext/common/preload/module/overlay'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('preload', group => {
  registerFeature(group, PreloadMessageModule)
  registerFeature(group, PreloadOverlayModule)
})