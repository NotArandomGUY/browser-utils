import { pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

// chrome.declarativeNetRequest.HeaderInfo
const ScriptNetHeaderInfo = createMessage({
  header: pbf_str(1),
  values: pbf_repeat(pbf_str(2)),
  excludedValues: pbf_repeat(pbf_str(3))
})

export default ScriptNetHeaderInfo