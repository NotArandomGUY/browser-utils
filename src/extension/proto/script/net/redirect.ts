import { pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptNetURLTransform from '@ext/proto/script/net/url-transform'

// chrome.declarativeNetRequest.Redirect
const ScriptNetRedirect = createMessage({
  extensionPath: pbf_str(1),
  regexSubstitution: pbf_str(2),
  transform: pbf_msg(3, ScriptNetURLTransform),
  url: pbf_str(4)
})

export default ScriptNetRedirect