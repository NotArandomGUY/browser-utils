import ProxyChain from '@ext/lib/intercept/proxy-chain'

export default function initTrackingSentryModule() {
  ProxyChain.assign(window, 'Sentry', { trace: ['PRIVACY'] })
}