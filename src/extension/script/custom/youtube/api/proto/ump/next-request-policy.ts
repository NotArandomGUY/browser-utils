import { pbf_bin, pbf_i32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPNextRequestPolicy = createMessage({
  targetAudioReadaheadMs: pbf_i32(1),
  targetVideoReadaheadMs: pbf_i32(2),
  backoffTimeMs: pbf_i32(4),
  playbackCookie: pbf_bin(7),
  videoId: pbf_str(8)
})

export default UMPNextRequestPolicy