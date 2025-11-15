import SabrContextValue from '@ext/custom/youtube/proto/gvs/common/sabr-context-value'
import { pbf_bol, pbf_i32, pbf_msg } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPSabrContextUpdate = createMessage({
  type: pbf_i32(1),
  scope: pbf_i32(2),
  value: pbf_msg(3, SabrContextValue),
  /*@__MANGLE_PROP__*/sendByDefault: pbf_bol(4),
  /*@__MANGLE_PROP__*/writePolicy: pbf_i32(5)
})

export default UMPSabrContextUpdate