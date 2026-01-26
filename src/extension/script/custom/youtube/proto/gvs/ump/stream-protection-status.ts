import { pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPStreamProtectionStatus = createMessage({
  status: pbf_i32(1),
  maxRetries: pbf_i32(2)
})

export default UMPStreamProtectionStatus