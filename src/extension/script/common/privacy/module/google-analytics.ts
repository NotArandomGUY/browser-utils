import { Feature } from '@ext/lib/feature'
import ProxyChain, { ProxyChainOptions } from '@ext/lib/proxy/chain'

const PROXY_KEYS = ['ga', 'googletag'] as const
const SHARED_PROXY_CHAIN_OPTIONS = {
  trace: ['PRIVACY']
} satisfies ProxyChainOptions
const CUSTOM_PROXY_CHAIN_OPTIONS = {
  'googletag': {
    target: { cmd: [], queryIds: [] },
    ignoreProperties: ['cmd', 'queryIds']
  }
} as Partial<Record<typeof PROXY_KEYS[number], ProxyChainOptions<Record<string, unknown>>>>

export default class PrivacyGoogleAnalyticsModule extends Feature {
  public constructor() {
    super('dummy-google-analytics')
  }

  protected activate(): boolean {
    PROXY_KEYS.forEach(key => ProxyChain.assign(window, key, {
      ...SHARED_PROXY_CHAIN_OPTIONS,
      ...CUSTOM_PROXY_CHAIN_OPTIONS[key]
    }))

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}