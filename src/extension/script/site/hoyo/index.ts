import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import { hideOwnWebpackRuntimeFromGlobal, interruptWebpackRuntime } from '@ext/lib/wprt'
import HoyoAnalysisModule from '@ext/site/hoyo/module/analysis'
import HoyoLogModule from '@ext/site/hoyo/module/log'
import HoyoVueModule from '@ext/site/hoyo/module/vue'

registerFeatureGroup('hoyo', group => {
  registerFeature(group, HoyoAnalysisModule)
  registerFeature(group, HoyoLogModule)
  registerFeature(group, HoyoVueModule)

  hideOwnWebpackRuntimeFromGlobal()
}, ['adblock', 'privacy'])

interruptWebpackRuntime((chunkLoadingGlobal) => {
  console.log('webpack runtime load:', chunkLoadingGlobal)
  return true
})