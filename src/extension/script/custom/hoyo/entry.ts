import HoyoAnalysisModule from '@ext/custom/hoyo/module/analysis'
import HoyoLogModule from '@ext/custom/hoyo/module/log'
import HoyoVueModule from '@ext/custom/hoyo/module/vue'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import { hideOwnWebpackRuntimeFromGlobal, interruptWebpackRuntime } from '@ext/lib/wprt'

registerFeatureGroup('hoyo', group => {
  registerFeature(group, HoyoAnalysisModule)
  registerFeature(group, HoyoLogModule)
  registerFeature(group, HoyoVueModule)

  hideOwnWebpackRuntimeFromGlobal()
}, ['preload'])

interruptWebpackRuntime((chunkLoadingGlobal) => {
  console.log('webpack runtime load:', chunkLoadingGlobal)
  return true
})