import PyBricksKeygenModule from '@ext/custom/pybricks/modules/keygen'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('pybricks', group => {
  registerFeature(group, PyBricksKeygenModule)
}, ['preload'])