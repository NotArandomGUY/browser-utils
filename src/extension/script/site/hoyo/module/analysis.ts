import ProxyChain from '@ext/lib/proxy/chain'

export let hoYoAnalysisInstance: object // NOSONAR

export default function initHoyoAnalysisModule(): void {
  hoYoAnalysisInstance = ProxyChain.assign(window, 'miHoYoAnalysis', { trace: ['HOYO'] })
}