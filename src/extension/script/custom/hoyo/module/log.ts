import { Feature } from '@ext/lib/feature'
import ProxyChain from '@ext/lib/proxy/chain'

export default class HoyoLogModule extends Feature {
  protected activate(): boolean {
    ProxyChain.assign(window, 'miHoYoH5log', { trace: ['HOYO'] })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}