import { Feature } from '@ext/lib/feature'
import ProxyChain from '@ext/lib/proxy/chain'

const PROXY_KEYS = ['adsbygoogle', '__googlefc', 'googlefc']
const PROXY_CHAIN_OPTIONS = { trace: ['ADBLOCK'] }

export default class AdblockGoogleAdModule extends Feature {
  public constructor() {
    super('dummy-google-ad')
  }

  protected activate(): boolean {
    PROXY_KEYS.forEach(key => ProxyChain.assign(window, key, PROXY_CHAIN_OPTIONS))

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}