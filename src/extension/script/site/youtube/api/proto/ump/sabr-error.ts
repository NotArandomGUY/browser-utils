import { pbf_bin, pbf_i32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPSabrError = createMessage({
  type: pbf_str(1),
  code: pbf_i32(2),
  data: pbf_bin(3)
})

export default UMPSabrError