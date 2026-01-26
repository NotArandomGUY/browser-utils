import { pbf_i32, pbf_str, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const FormatId = createMessage({
  itag: pbf_i32(1),
  lmt: pbf_u64(2),
  xtags: pbf_str(3)
})

export default FormatId