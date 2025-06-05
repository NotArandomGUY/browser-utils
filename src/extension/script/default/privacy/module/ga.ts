import ProxyChain from '@ext/lib/intercept/proxy-chain'

export default function initTrackingGAModule() {
  ProxyChain.assign(window, 'ga', { trace: ['PRIVACY'] })
  ProxyChain.assign(window, 'gtag', { trace: ['PRIVACY'] })
}