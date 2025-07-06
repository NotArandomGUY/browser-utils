import { Feature } from '@ext/lib/feature'
import ProxyChain from '@ext/lib/proxy/chain'

export default class PrivacySentryModule extends Feature {
  public constructor() {
    super('dummy-sentry')
  }

  protected activate(): boolean {
    ProxyChain.assign(window, 'Sentry', { trace: ['PRIVACY'] })
    return true
  }

  protected deactivate(): boolean {
    return false
  }
}