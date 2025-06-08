import { Feature } from '@ext/lib/feature'
import ProxyChain from '@ext/lib/proxy/chain'

const PROXY_KEYS = ['bugsnag', 'bugsnagClient']
const PROXY_CHAIN_OPTIONS = { trace: ['PRIVACY'] }

export default class PrivacyBugsnagModule extends Feature {
  protected activate(): boolean {
    PROXY_KEYS.forEach(key => ProxyChain.assign(window, key, PROXY_CHAIN_OPTIONS))

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}