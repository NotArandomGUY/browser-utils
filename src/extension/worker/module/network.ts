import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { DEFAULT_SCRIPT_CONFIG, SITE_SCRIPT_CONFIG } from '@virtual/script-config'

const logger = new Logger('WORKER-NETWORK')

export default class WorkerNetworkModule extends Feature {
  protected activate(): boolean {
    const scriptRules = [
      ...DEFAULT_SCRIPT_CONFIG,
      ...SITE_SCRIPT_CONFIG
    ].flatMap((config, configIdx) => config.networkRules?.map((rule, ruleIdx) => ({
      id: (configIdx << 8) | (ruleIdx & 0xFF),
      ...rule
    }))).filter(rule => rule != null)

    logger.info('updating dynamic rules...')
    chrome.declarativeNetRequest.getDynamicRules().then(rules => {
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: scriptRules,
        removeRuleIds: rules.map(rule => rule.id)
      }).then(() => {
        chrome.declarativeNetRequest.getDynamicRules().then(rules => logger.info('updated dynamic rules:', rules))
      })
    })

    logger.info('updating session rules...')
    chrome.declarativeNetRequest.getSessionRules().then(rules => {
      chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: rules.map(rule => rule.id)
      }).then(() => {
        chrome.declarativeNetRequest.getSessionRules().then(rules => logger.info('updated session rules:', rules))
      })
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}