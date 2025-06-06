import ProxyChain from '@ext/lib/proxy/chain'

export default function initPrivacyHotjarModule() {
  ProxyChain.assign(window, 'hj', { trace: ['PRIVACY'] })
  ProxyChain.assign(window, 'hjSiteSettings', { trace: ['PRIVACY'] })
}