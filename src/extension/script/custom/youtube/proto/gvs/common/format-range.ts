import { pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const FormatRange = createMessage({
  start: pbf_i32(1),
  end: pbf_i32(2)
})

export default FormatRange