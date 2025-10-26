import type { IScriptConfig } from '@ext/proto/script/config'
import ScriptNetModifyHeaderInfo, { ScriptNetHeaderOperation } from '@ext/proto/script/net/modify-header-info'
import ScriptNetRule from '@ext/proto/script/net/rule'
import ScriptNetRuleAction, { ScriptNetRuleActionType } from '@ext/proto/script/net/rule-action'
import ScriptNetRuleCondition, { ScriptNetResourceType } from '@ext/proto/script/net/rule-condition'

const TV_USER_AGENT = 'Mozilla/5.0 (PlayStation 5/SmartTV) AppleWebKit/605.1.15 (KHTML, like Gecko)'

export default {
  name: 'youtube',
  categories: ['videoplatform', 'adblock', 'mod'],
  description: 'Dedicated ad blocker & Mods',
  matches: [
    '*://*.youtube.com/*',
    '*://*.youtube-nocookie.com/*'
  ],
  networkRules: [
    new ScriptNetRule({
      action: new ScriptNetRuleAction({
        type: ScriptNetRuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          new ScriptNetModifyHeaderInfo({
            header: 'user-agent',
            operation: ScriptNetHeaderOperation.SET,
            value: TV_USER_AGENT
          })
        ]
      }),
      condition: new ScriptNetRuleCondition({
        urlFilter: '||youtube.com/tv',
        resourceTypes: [ScriptNetResourceType.MAIN_FRAME, ScriptNetResourceType.SUB_FRAME, ScriptNetResourceType.XMLHTTPREQUEST]
      })
    }),
    new ScriptNetRule({
      action: new ScriptNetRuleAction({
        type: ScriptNetRuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          new ScriptNetModifyHeaderInfo({
            header: 'user-agent',
            operation: ScriptNetHeaderOperation.SET,
            value: TV_USER_AGENT
          })
        ]
      }),
      condition: new ScriptNetRuleCondition({
        urlFilter: '||youtube.com/api/stats/*?*el=leanback',
        resourceTypes: [ScriptNetResourceType.XMLHTTPREQUEST]
      })
    }),
    new ScriptNetRule({
      action: new ScriptNetRuleAction({
        type: ScriptNetRuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          new ScriptNetModifyHeaderInfo({
            header: 'user-agent',
            operation: ScriptNetHeaderOperation.REMOVE
          })
        ]
      }),
      condition: new ScriptNetRuleCondition({
        urlFilter: '||youtube.com/youtubei/',
        resourceTypes: [ScriptNetResourceType.XMLHTTPREQUEST]
      })
    })
  ]
} satisfies IScriptConfig