import ProxyChain from '@ext/lib/proxy/chain'

export default function initPrivacyGoogleAnalyticsModule() {
  ProxyChain.assign(window, 'ga', { trace: ['PRIVACY'] })
  ProxyChain.assign(window, 'gtag', { trace: ['PRIVACY'] })
}