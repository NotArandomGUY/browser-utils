import ProxyChain from '@ext/lib/proxy/chain'

export default function initPrivacySentryModule() {
  ProxyChain.assign(window, 'Sentry', { trace: ['PRIVACY'] })
}