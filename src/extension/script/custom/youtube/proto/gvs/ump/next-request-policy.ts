import { pbf_bin, pbf_i32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPNextRequestPolicy = createMessage({
  /*@__MANGLE_PROP__*/targetAudioReadaheadMs: pbf_i32(1),
  /*@__MANGLE_PROP__*/targetVideoReadaheadMs: pbf_i32(2),
  /*@__MANGLE_PROP__*/backoffTimeMs: pbf_i32(4),
  /*@__MANGLE_PROP__*/playbackCookie: pbf_bin(7),
  videoId: pbf_str(8)
})

export default UMPNextRequestPolicy