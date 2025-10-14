import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import WorkerMessageModule from '@ext/worker/module/message'
import WorkerNetworkModule from '@ext/worker/module/network'
import WorkerPackageModule from '@ext/worker/module/package'
import WorkerScriptModule from '@ext/worker/module/script'

registerFeatureGroup('worker', group => {
  registerFeature(group, WorkerScriptModule)
  registerFeature(group, WorkerNetworkModule)
  registerFeature(group, WorkerMessageModule)

  // Register last so the other modules can register callbacks first before package load
  registerFeature(group, WorkerPackageModule)
})