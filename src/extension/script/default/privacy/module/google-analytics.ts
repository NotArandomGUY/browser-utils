import ProxyChain from '@ext/lib/proxy/chain'

const PROXY_KEYS = ['ga', 'gtag', 'googletag']
const PROXY_CHAIN_OPTIONS = { trace: ['PRIVACY'] }

export default function initPrivacyGoogleAnalyticsModule() {
  PROXY_KEYS.forEach(key => ProxyChain.assign(window, key, PROXY_CHAIN_OPTIONS))
}