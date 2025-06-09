import { Feature } from '@ext/lib/feature'
import ProxyChain from '@ext/lib/proxy/chain'

export let hoYoAnalysisInstance: object // NOSONAR

export default class HoyoAnalysisModule extends Feature {
  protected activate(): boolean {
    hoYoAnalysisInstance = ProxyChain.assign(window, 'miHoYoAnalysis', { trace: ['HOYO'] })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}