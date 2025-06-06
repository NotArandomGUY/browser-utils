import ProxyChain from '@ext/lib/proxy/chain'

const PROXY_KEYS = ['adsbygoogle', '__googlefc', 'googlefc']
const PROXY_CHAIN_OPTIONS = { trace: ['ADBLOCK'] }

export default function initAdblockGoogleAdModule(): void {
  PROXY_KEYS.forEach(key => ProxyChain.assign(window, key, PROXY_CHAIN_OPTIONS))
}