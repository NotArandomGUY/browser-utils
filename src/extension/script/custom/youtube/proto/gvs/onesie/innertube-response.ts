import HttpHeader from '@ext/custom/youtube/proto/gvs/common/http-header'
import { pbf_bin, pbf_i32, pbf_msg, pbf_repeat } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const OnesieInnertubeResponse = createMessage({
  /*@__MANGLE_PROP__*/onesiePorxyStatus: pbf_i32(1),
  /*@__MANGLE_PROP__*/httpStatus: pbf_i32(2),
  headers: pbf_repeat(pbf_msg(3, HttpHeader)),
  body: pbf_bin(4)
})

export default OnesieInnertubeResponse