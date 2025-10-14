import { pbf_i32, pbf_msg, pbf_repeat } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptNetModifyHeaderInfo from '@ext/proto/script/net/modify-header-info'
import ScriptNetRedirect from '@ext/proto/script/net/redirect'

export const enum ScriptNetRuleActionType {
  BLOCK = 0,
  REDIRECT,
  ALLOW,
  UPGRADE_SCHEME,
  MODIFY_HEADERS,
  ALLOW_ALL_REQUESTS
}

// chrome.declarativeNetRequest.RuleAction
const ScriptNetRuleAction = createMessage({
  type: pbf_i32(1),
  redirect: pbf_msg(2, ScriptNetRedirect),
  requestHeaders: pbf_repeat(pbf_msg(3, ScriptNetModifyHeaderInfo)),
  responseHeaders: pbf_repeat(pbf_msg(4, ScriptNetModifyHeaderInfo))
})

export default ScriptNetRuleAction