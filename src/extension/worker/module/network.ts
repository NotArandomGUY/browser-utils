import { Feature } from '@ext/lib/feature'
import IndexedKV from '@ext/lib/ikv'
import Logger from '@ext/lib/logger'
import ScriptNetHeaderInfo from '@ext/proto/script/net/header-info'
import ScriptNetModifyHeaderInfo, { ScriptNetHeaderOperation } from '@ext/proto/script/net/modify-header-info'
import ScriptNetQueryKeyValue from '@ext/proto/script/net/query-key-value'
import ScriptNetQueryTransform from '@ext/proto/script/net/query-transform'
import ScriptNetRedirect from '@ext/proto/script/net/redirect'
import ScriptNetRule from '@ext/proto/script/net/rule'
import ScriptNetRuleAction, { ScriptNetRuleActionType } from '@ext/proto/script/net/rule-action'
import ScriptNetRuleCondition, { ScriptNetDomainType, ScriptNetRequestMethod, ScriptNetResourceType } from '@ext/proto/script/net/rule-condition'
import ScriptNetURLTransform from '@ext/proto/script/net/url-transform'
import { getPackageScriptEntry, getPackageScriptIDs, PackageLoadCallback, parseOptionalConfig } from '@ext/worker/module/package'

import DNR = chrome.declarativeNetRequest

const DomainType = {
  [ScriptNetDomainType.FIRST_PARTY]: 'firstParty',
  [ScriptNetDomainType.THIRD_PARTY]: 'thirdParty'
} satisfies Record<ScriptNetDomainType, `${DNR.DomainType}`>
const HeaderOperation = {
  [ScriptNetHeaderOperation.APPEND]: 'append',
  [ScriptNetHeaderOperation.SET]: 'set',
  [ScriptNetHeaderOperation.REMOVE]: 'remove'
} satisfies Record<ScriptNetHeaderOperation, `${DNR.HeaderOperation}`>
const RequestMethod = {
  [ScriptNetRequestMethod.OTHER]: 'other',
  [ScriptNetRequestMethod.CONNECT]: 'connect',
  [ScriptNetRequestMethod.DELETE]: 'delete',
  [ScriptNetRequestMethod.GET]: 'get',
  [ScriptNetRequestMethod.HEAD]: 'head',
  [ScriptNetRequestMethod.OPTIONS]: 'options',
  [ScriptNetRequestMethod.PATCH]: 'patch',
  [ScriptNetRequestMethod.POST]: 'post',
  [ScriptNetRequestMethod.PUT]: 'put'
} satisfies Record<ScriptNetRequestMethod, `${DNR.RequestMethod}`>
const ResourceType = {
  [ScriptNetResourceType.OTHER]: 'other',
  [ScriptNetResourceType.MAIN_FRAME]: 'main_frame',
  [ScriptNetResourceType.SUB_FRAME]: 'sub_frame',
  [ScriptNetResourceType.STYLESHEET]: 'stylesheet',
  [ScriptNetResourceType.SCRIPT]: 'script',
  [ScriptNetResourceType.IMAGE]: 'image',
  [ScriptNetResourceType.FONT]: 'font',
  [ScriptNetResourceType.OBJECT]: 'object',
  [ScriptNetResourceType.XMLHTTPREQUEST]: 'xmlhttprequest',
  [ScriptNetResourceType.PING]: 'ping',
  [ScriptNetResourceType.CSP_REPORT]: 'csp_report',
  [ScriptNetResourceType.MEDIA]: 'media',
  [ScriptNetResourceType.WEBSOCKET]: 'websocket',
  [ScriptNetResourceType.WEBTRANSPORT]: 'webtransport',
  [ScriptNetResourceType.WEBBUNDLE]: 'webbundle'
} satisfies Record<ScriptNetResourceType, `${DNR.ResourceType}`>
const RuleActionType = {
  [ScriptNetRuleActionType.BLOCK]: 'block',
  [ScriptNetRuleActionType.REDIRECT]: 'redirect',
  [ScriptNetRuleActionType.ALLOW]: 'allow',
  [ScriptNetRuleActionType.UPGRADE_SCHEME]: 'upgradeScheme',
  [ScriptNetRuleActionType.MODIFY_HEADERS]: 'modifyHeaders',
  [ScriptNetRuleActionType.ALLOW_ALL_REQUESTS]: 'allowAllRequests'
} satisfies Record<ScriptNetRuleActionType, `${DNR.RuleActionType}`>

const RULE_EXCLUDE_DOMAIN_KV = 'rule-exclude-domain'

const logger = new Logger('WORKER-NETWORK')

const kv = new IndexedKV('network', [])

const parseScriptNetHeaderInfo = (config?: InstanceType<typeof ScriptNetHeaderInfo> | null): DNR.HeaderInfo | null => {
  if (config == null) return null

  const { header, ...parsed } = parseOptionalConfig(config)
  if (header == null) return null

  return {
    ...parsed,
    header
  }
}

const parseScriptNetModifyHeaderInfo = (config?: InstanceType<typeof ScriptNetModifyHeaderInfo> | null): DNR.ModifyHeaderInfo | null => {
  if (config == null) return null

  const { header, ...parsed } = parseOptionalConfig(config)
  const operation = HeaderOperation[parsed.operation as ScriptNetHeaderOperation]
  if (header == null || operation == null) return null

  return {
    ...parsed,
    header,
    operation
  }
}

const parseScriptNetQueryKeyValue = (config?: InstanceType<typeof ScriptNetQueryKeyValue> | null): DNR.QueryKeyValue | null => {
  if (config == null) return null

  const { key, value } = parseOptionalConfig(config)
  if (key == null || value == null) return null

  return {
    key,
    value
  }
}

const parseScriptNetQueryTransform = (config?: InstanceType<typeof ScriptNetQueryTransform> | null): DNR.QueryTransform | null => {
  if (config == null) return null

  return parseOptionalConfig({
    ...config,
    addOrReplaceParams: config.addOrReplaceParams?.map(parseScriptNetQueryKeyValue).filter(kv => kv != null)
  })
}

const parseScriptNetRedirect = (config?: InstanceType<typeof ScriptNetRedirect> | null): DNR.Redirect | null => {
  if (config == null) return null

  return parseOptionalConfig({
    ...config,
    transform: parseScriptNetURLTransform(config.transform)
  })
}

const parseScriptNetRule = (config?: InstanceType<typeof ScriptNetRule> | null): Omit<DNR.Rule, 'id'> | null => {
  if (config == null) return null

  const parsed = parseOptionalConfig(config)
  const action = parseScriptNetRuleAction(parsed.action)
  const condition = parseScriptNetRuleCondition(parsed.condition)
  if (action == null || condition == null) return null

  return {
    ...parsed,
    action,
    condition
  }
}

const parseScriptNetRuleAction = (config?: InstanceType<typeof ScriptNetRuleAction> | null): DNR.RuleAction | null => {
  if (config == null) return null

  const type = RuleActionType[config.type as ScriptNetRuleActionType]
  if (type == null) return null

  return {
    type,
    ...parseOptionalConfig({
      redirect: parseScriptNetRedirect(config.redirect),
      requestHeaders: config.requestHeaders?.map(parseScriptNetModifyHeaderInfo).filter(info => info != null),
      responseHeaders: config.responseHeaders?.map(parseScriptNetModifyHeaderInfo).filter(info => info != null)
    })
  }
}

const parseScriptNetRuleCondition = (config?: InstanceType<typeof ScriptNetRuleCondition> | null): DNR.RuleCondition | null => {
  if (config == null) return null

  const {
    domainType,
    requestMethods,
    excludedRequestMethods,
    resourceTypes,
    excludedResourceTypes,
    responseHeaders,
    excludedResponseHeaders
  } = config

  return parseOptionalConfig({
    ...config,
    domainType: DomainType[domainType as ScriptNetDomainType],
    requestMethods: requestMethods?.map(v => RequestMethod[v as ScriptNetRequestMethod]),
    excludedRequestMethods: excludedRequestMethods?.map(v => RequestMethod[v as ScriptNetRequestMethod]),
    resourceTypes: resourceTypes?.map(v => ResourceType[v as ScriptNetResourceType]),
    excludedResourceTypes: excludedResourceTypes?.map(v => ResourceType[v as ScriptNetResourceType]),
    responseHeaders: responseHeaders?.map(parseScriptNetHeaderInfo).filter(info => info != null),
    excludedResponseHeaders: excludedResponseHeaders?.map(parseScriptNetHeaderInfo).filter(info => info != null)
  })
}

const parseScriptNetURLTransform = (config?: InstanceType<typeof ScriptNetURLTransform> | null): DNR.URLTransform | null => {
  if (config == null) return null

  return parseOptionalConfig({
    ...config,
    queryTransform: parseScriptNetQueryTransform(config.queryTransform)
  })
}

const updateRules = async (): Promise<void> => {
  const addRules: DNR.Rule[] = []

  const packageEntries = await Promise.all((await getPackageScriptIDs()).map(getPackageScriptEntry))
  const ruleExcludeDomain = await kv.get<Record<string, string[]>>(RULE_EXCLUDE_DOMAIN_KV)

  packageEntries.forEach((entry, scriptIdx) => {
    const config = entry?.config
    if (config?.name == null || config?.networkRules == null) return

    const excludeDomain = ruleExcludeDomain?.[config.name] ?? []

    config.networkRules.map(parseScriptNetRule).forEach((rule, ruleIdx) => {
      if (rule == null) return

      rule.condition.excludedInitiatorDomains ??= [
        ...rule.condition.excludedInitiatorDomains ?? [],
        ...excludeDomain
      ]

      addRules.push({
        id: (scriptIdx << 20) | (ruleIdx & 0xFFFFF),
        ...rule
      })
    })
  })

  DNR.getDynamicRules().then(rules => {
    logger.info('add/remove dynamic rules:', addRules, rules)

    DNR.updateDynamicRules({
      addRules,
      removeRuleIds: rules.map(rule => rule.id)
    }).catch(error => {
      logger.error('update dynamic rules error:', error)
    })
  })
}

export const updateNetworkRuleFilter = async (scriptId: string, includeDomain: string[], excludeDomain: string[]): Promise<void> => {
  const ruleExcludeDomain = await kv.get<Record<string, string[]>>(RULE_EXCLUDE_DOMAIN_KV) ?? {}

  // Merge existing exclude domain
  excludeDomain.push(...ruleExcludeDomain[scriptId] ?? [])

  // Remove duplicate/include domains
  excludeDomain = excludeDomain.filter((domain, i) => excludeDomain.indexOf(domain) === i).filter(domain => !includeDomain.includes(domain))
  excludeDomain.sort()

  // Ignore if nothing changed
  if (JSON.stringify(ruleExcludeDomain[scriptId] ?? []) === JSON.stringify(excludeDomain)) return

  if (excludeDomain.length === 0) {
    delete ruleExcludeDomain[scriptId]
  } else {
    ruleExcludeDomain[scriptId] = excludeDomain
  }

  await kv.put(RULE_EXCLUDE_DOMAIN_KV, ruleExcludeDomain)
  await updateRules()
}

export default class WorkerNetworkModule extends Feature {
  protected activate(): boolean {
    PackageLoadCallback.registerCallback(updateRules)

    return true
  }

  protected deactivate(): boolean {
    PackageLoadCallback.unregisterCallback(updateRules)

    DNR.getDynamicRules().then(rules => DNR.updateDynamicRules({ removeRuleIds: rules.map(rule => rule.id) }))

    return true
  }
}