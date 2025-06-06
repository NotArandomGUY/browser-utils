import ProxyChain from '@ext/lib/proxy/chain'

export default function initTrackingSentryModule() {
  ProxyChain.assign(window, 'Sentry', { trace: ['PRIVACY'] })
}