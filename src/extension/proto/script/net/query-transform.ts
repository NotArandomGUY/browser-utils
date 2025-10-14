import { pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptNetQueryKeyValue from '@ext/proto/script/net/query-key-value'

// chrome.declarativeNetRequest.QueryTransform
const ScriptNetQueryTransform = createMessage({
  addOrReplaceParams: pbf_repeat(pbf_msg(1, ScriptNetQueryKeyValue)),
  removeParams: pbf_repeat(pbf_str(2))
})

export default ScriptNetQueryTransform