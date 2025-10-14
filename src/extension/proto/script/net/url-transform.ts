import { pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptNetQueryTransform from '@ext/proto/script/net/query-transform'

// chrome.declarativeNetRequest.URLTransform
const ScriptNetURLTransform = createMessage({
  fragment: pbf_str(1),
  host: pbf_str(2),
  password: pbf_str(3),
  path: pbf_str(4),
  port: pbf_str(5),
  query: pbf_str(6),
  queryTransform: pbf_msg(7, ScriptNetQueryTransform),
  scheme: pbf_str(8),
  username: pbf_str(9),
})

export default ScriptNetURLTransform