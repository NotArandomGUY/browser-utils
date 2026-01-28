import { pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const ClientCapabilities = createMessage({
  /*@__MANGLE_PROP__*/defaultPolicy: pbf_i32(1),
  /*@__MANGLE_PROP__*/smooth: pbf_i32(2),
  visibility: pbf_i32(3),
  /*@__MANGLE_PROP__*/autonav: pbf_i32(4),
  /*@__MANGLE_PROP__*/performance: pbf_i32(5),
  /*@__MANGLE_PROP__*/speed: pbf_i32(6)
})

export default ClientCapabilities