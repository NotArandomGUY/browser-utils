import ProxyChain from '@ext/lib/proxy/chain'

export default function initHoyoLogModule(): void {
  ProxyChain.assign(window, 'miHoYoH5log', { trace: ['HOYO'] })
}