import type { IScriptConfig } from '@ext/proto/script/config'
import ScriptNetModifyHeaderInfo, { ScriptNetHeaderOperation } from '@ext/proto/script/net/modify-header-info'
import ScriptNetRule from '@ext/proto/script/net/rule'
import ScriptNetRuleAction, { ScriptNetRuleActionType } from '@ext/proto/script/net/rule-action'
import ScriptNetRuleCondition, { ScriptNetResourceType } from '@ext/proto/script/net/rule-condition'

const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
// Reference: https://github.com/youtube/cobalt/blob/main/cobalt/browser/user_agent/user_agent_platform_info.cc
// Cobalt's user agent contains the following sections:
//   Mozilla/5.0 (ChromiumStylePlatform)
//   Cobalt/Version.BuildNumber-BuildConfiguration (unlike Gecko)
//   JavaScript Engine Name/Version
//   Starboard/APIVersion,
//   Device/FirmwareVersion (Brand, Model, ConnectionType)
//
// In the case of Evergreen, it contains three additional sections:
//   Evergreen/Version
//   Evergreen-Type
//   Evergreen-FileType
const COBALT_USER_AGENT = 'Mozilla/5.0 (LINUX; Tizen/9.0) Cobalt/25.lts.40.1035033-gold (unlike Gecko) v8/8.8.278.17-jit gles Evergreen/5.40.2 Evergreen-Full Evergreen-Uncompressed Starboard/16, Unknown_TV_Unknown_2026/Unknown (Unknown, Unknown)'

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
        responseHeaders: [
          new ScriptNetModifyHeaderInfo({
            header: 'report-to',
            operation: ScriptNetHeaderOperation.REMOVE
          }),
          new ScriptNetModifyHeaderInfo({
            header: 'reporting-endpoints',
            operation: ScriptNetHeaderOperation.REMOVE
          }),
          new ScriptNetModifyHeaderInfo({
            header: 'content-security-policy-report-only',
            operation: ScriptNetHeaderOperation.REMOVE
          }),
          new ScriptNetModifyHeaderInfo({
            header: 'content-security-policy',
            operation: ScriptNetHeaderOperation.SET,
            value: `script-src 'unsafe-eval' 'self' 'unsafe-inline' blob: https://www.google.com https://apis.google.com https://ssl.gstatic.com https://www.gstatic.com https://*.youtube.com https://*.google.com https://*.gstatic.com https://youtube.com https://www.youtube.com https://google.com https://*.googleapis.com https://www.youtubekids.com https://www.youtube-nocookie.com https://www.youtubeeducation.com https://www-onepick-opensocial.googleusercontent.com, require-trusted-types-for 'script'`
          })
        ]
      }),
      condition: new ScriptNetRuleCondition({
        urlFilter: '||youtube.com',
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
            value: COBALT_USER_AGENT
          })
        ]
      }),
      condition: new ScriptNetRuleCondition({
        urlFilter: '||youtube.com/tv',
        resourceTypes: [ScriptNetResourceType.MAIN_FRAME, ScriptNetResourceType.SUB_FRAME, ScriptNetResourceType.XMLHTTPREQUEST]
      })
    }),
    new ScriptNetRule({
      priority: 2,
      action: new ScriptNetRuleAction({
        type: ScriptNetRuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          new ScriptNetModifyHeaderInfo({
            header: 'user-agent',
            operation: ScriptNetHeaderOperation.SET,
            value: DESKTOP_USER_AGENT
          })
        ]
      }),
      condition: new ScriptNetRuleCondition({
        urlFilter: '||youtube.com/youtubei/*?*prettyPrint=',
        resourceTypes: [ScriptNetResourceType.XMLHTTPREQUEST]
      })
    }),
    new ScriptNetRule({
      priority: 1,
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
        urlFilter: '||youtube.com/api/stats/',
        resourceTypes: [ScriptNetResourceType.XMLHTTPREQUEST]
      })
    }),
    new ScriptNetRule({
      priority: 1,
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