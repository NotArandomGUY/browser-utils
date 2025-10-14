import { pbf_i32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const enum ScriptNetHeaderOperation {
  APPEND = 0,
  SET,
  REMOVE
}

// chrome.declarativeNetRequest.ModifyHeaderInfo
const ScriptNetModifyHeaderInfo = createMessage({
  header: pbf_str(1),
  operation: pbf_i32(2),
  value: pbf_str(3)
})

export default ScriptNetModifyHeaderInfo