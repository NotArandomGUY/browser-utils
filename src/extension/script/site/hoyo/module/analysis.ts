import ProxyChain from '@ext/lib/intercept/proxy-chain'

export let hoYoAnalysisInstance: ProxyChain // NOSONAR

export default function initHoyoAnalysisModule(): void {
  hoYoAnalysisInstance = ProxyChain.assign(window, 'miHoYoAnalysis', { trace: ['HOYO'] })
}