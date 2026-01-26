import { pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const ClientCapabilities = createMessage({
  defaultPolicy: pbf_i32(1),
  smooth: pbf_i32(2),
  visibility: pbf_i32(3),
  autonav: pbf_i32(4),
  performance: pbf_i32(5),
  speed: pbf_i32(6)
})

export default ClientCapabilities