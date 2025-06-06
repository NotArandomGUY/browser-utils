import ProxyChain from '@ext/lib/proxy/chain'

export default function initPrivacyBugsnagModule() {
  ProxyChain.assign(window, 'bugsnag', { trace: ['PRIVACY'] })
  ProxyChain.assign(window, 'bugsnagClient', { trace: ['PRIVACY'] })
}