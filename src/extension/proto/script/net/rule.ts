import { pbf_msg, pbf_u32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptNetRuleAction from '@ext/proto/script/net/rule-action'
import ScriptNetRuleCondition from '@ext/proto/script/net/rule-condition'

// chrome.declarativeNetRequest.Rule
const ScriptNetRule = createMessage({
  action: pbf_msg(1, ScriptNetRuleAction),
  condition: pbf_msg(2, ScriptNetRuleCondition),
  priority: pbf_u32(3)
})

export default ScriptNetRule