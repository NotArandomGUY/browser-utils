import ClientInfo from '@ext/custom/youtube/proto/gvs/common/client-info'
import SabrContext from '@ext/custom/youtube/proto/gvs/common/sabr-context'
import { pbf_bin, pbf_i32, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const StreamerContext = createMessage({
  /*@__MANGLE_PROP__*/clientInfo: pbf_msg(1, ClientInfo),
  /*@__MANGLE_PROP__*/poToken: pbf_bin(2),
  /*@__MANGLE_PROP__*/playbackCookie: pbf_bin(3),
  field4: pbf_bin(4),
  /*@__MANGLE_PROP__*/sabrContexts: pbf_repeat(pbf_msg(5, SabrContext)),
  /*@__MANGLE_PROP__*/unsentSabrContexts: pbf_repeat(pbf_i32(6)),
  field7: pbf_str(7),
  field8: pbf_bin(8)
})

export default StreamerContext