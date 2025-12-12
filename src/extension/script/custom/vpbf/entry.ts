import VPBFLeanbackShell from '@ext/custom/vpbf/module/lbshell'
import VPBFMessage from '@ext/custom/vpbf/module/message'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('vpbf', group => {
  registerFeature(group, VPBFMessage)
  registerFeature(group, VPBFLeanbackShell)
})