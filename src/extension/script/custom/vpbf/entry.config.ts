import type { IScriptConfig } from '@ext/proto/script/config'
import ScriptNetModifyHeaderInfo, { ScriptNetHeaderOperation } from '@ext/proto/script/net/modify-header-info'
import ScriptNetRule from '@ext/proto/script/net/rule'
import ScriptNetRuleAction, { ScriptNetRuleActionType } from '@ext/proto/script/net/rule-action'
import ScriptNetRuleCondition, { ScriptNetResourceType } from '@ext/proto/script/net/rule-condition'
import { FRAME_CONFIG } from '@sh/bu-remote/config'

export default {
  name: 'vpbf',
  categories: ['videoplatform', 'extension'],
  description: 'Browser Frame Extension',
  matches: [
    '*://accounts.google.com/*',
    '*://*.youtube.com/tv*'
  ],
  networkRules: [
    new ScriptNetRule({
      action: new ScriptNetRuleAction({
        type: ScriptNetRuleActionType.MODIFY_HEADERS,
        responseHeaders: [
          new ScriptNetModifyHeaderInfo({
            header: 'x-frame-options',
            operation: ScriptNetHeaderOperation.REMOVE
          }),
          new ScriptNetModifyHeaderInfo({
            header: 'access-control-allow-origin',
            value: '*',
            operation: ScriptNetHeaderOperation.SET
          }),
          new ScriptNetModifyHeaderInfo({
            header: 'access-control-allow-credentials',
            value: 'true',
            operation: ScriptNetHeaderOperation.SET
          }),
          new ScriptNetModifyHeaderInfo({
            header: 'permissions-policy',
            value: 'autoplay=*,ch-ua-arch=*,ch-ua-bitness=*,ch-ua-full-version=*,ch-ua-full-version-list=*,ch-ua-model=*,ch-ua-wow64=*,ch-ua-form-factors=*,ch-ua-platform=*,ch-ua-platform-version=*',
            operation: ScriptNetHeaderOperation.SET
          })
        ]
      }),
      condition: new ScriptNetRuleCondition({
        initiatorDomains: ['accounts.google.com', 'youtube.com', ...FRAME_CONFIG.domains],
        requestDomains: ['accounts.google.com', 'youtube.com'],
        resourceTypes: [ScriptNetResourceType.MAIN_FRAME, ScriptNetResourceType.SUB_FRAME]
      })
    })
  ]
} satisfies IScriptConfig