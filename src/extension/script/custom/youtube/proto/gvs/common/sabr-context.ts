import { pbf_bin, pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const SabrContext = createMessage({
  type: pbf_i32(1),
  value: pbf_bin(2)
})

export default SabrContext