import { pbf_bin, pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const SabrContextValue = createMessage({
  content: pbf_bin(1),
  sign: pbf_bin(2),
  unknown: pbf_i32(5)
})

export default SabrContextValue