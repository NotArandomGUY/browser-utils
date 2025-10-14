import { PRIVACY_STATIC_FILTER_URL_BLOCK_LIST } from '@ext/common/privacy/filter/static'
import type { IScriptConfig } from '@ext/proto/script/config'
import ScriptNetRule from '@ext/proto/script/net/rule'
import ScriptNetRuleAction, { ScriptNetRuleActionType } from '@ext/proto/script/net/rule-action'
import ScriptNetRuleCondition, { ScriptNetResourceType } from '@ext/proto/script/net/rule-condition'

export default {
  name: 'privacy',
  categories: ['privacy'],
  description: 'Generic tracking blocker',
  networkRules: PRIVACY_STATIC_FILTER_URL_BLOCK_LIST.map(urlFilter => new ScriptNetRule({
    action: new ScriptNetRuleAction({
      type: ScriptNetRuleActionType.BLOCK
    }),
    condition: new ScriptNetRuleCondition({
      urlFilter,
      resourceTypes: [
        ScriptNetResourceType.SUB_FRAME,
        ScriptNetResourceType.STYLESHEET,
        ScriptNetResourceType.SCRIPT,
        ScriptNetResourceType.IMAGE,
        ScriptNetResourceType.FONT,
        ScriptNetResourceType.OBJECT,
        ScriptNetResourceType.XMLHTTPREQUEST,
        ScriptNetResourceType.PING,
        ScriptNetResourceType.CSP_REPORT,
        ScriptNetResourceType.MEDIA,
        ScriptNetResourceType.WEBSOCKET
      ]
    })
  }))
} satisfies IScriptConfig