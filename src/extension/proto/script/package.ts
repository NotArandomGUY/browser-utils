import { pbf_bin, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptEntry from '@ext/proto/script/entry'

const ScriptPackage = createMessage({
  version: pbf_str(1),
  sign: pbf_bin(2),
  entries: pbf_repeat(pbf_msg(3, ScriptEntry)),
  messageKey: pbf_bin(4)
})

export default ScriptPackage