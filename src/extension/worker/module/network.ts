import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'

const logger = new Logger('WORKER-NETWORK')

export default class WorkerNetworkModule extends Feature {
  protected activate(): boolean {
    logger.info('updating dynamic rules...')
    chrome.declarativeNetRequest.getDynamicRules(rules => {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(rule => rule.id)
      }, () => chrome.declarativeNetRequest.getDynamicRules(rules => logger.info('updated dynamic rules:', rules)))
    })

    logger.info('updating session rules...')
    chrome.declarativeNetRequest.getSessionRules(rules => {
      chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: rules.map(rule => rule.id)
      }, () => chrome.declarativeNetRequest.getSessionRules(rules => logger.info('updated session rules:', rules)))
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}