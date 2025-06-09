import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import WorkerInjectorModule from '@ext/worker/module/injector'
import WorkerNetworkModule from '@ext/worker/module/network'

let isActive = false

function activateWorker(): void {
  if (isActive) return

  registerFeatureGroup('worker', group => {
    registerFeature(group, WorkerInjectorModule)
    registerFeature(group, WorkerNetworkModule)
  })

  isActive = true
}

chrome.runtime.onStartup.addListener(activateWorker)
activateWorker()