import PlaybackCookie from '@ext/custom/youtube/proto/gvs/common/playback-cookie'
import { pbf_i32, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPNextRequestPolicy = createMessage({
  /*@__MANGLE_PROP__*/targetAudioReadaheadMs: pbf_i32(1),
  /*@__MANGLE_PROP__*/targetVideoReadaheadMs: pbf_i32(2),
  /*@__MANGLE_PROP__*/maxTimeSinceLastRequestMs: pbf_i32(3),
  /*@__MANGLE_PROP__*/backoffTimeMs: pbf_i32(4),
  /*@__MANGLE_PROP__*/minAudioReadaheadMs: pbf_i32(5),
  /*@__MANGLE_PROP__*/minVideoReadaheadMs: pbf_i32(6),
  /*@__MANGLE_PROP__*/playbackCookie: pbf_msg(7, PlaybackCookie),
  videoId: pbf_str(8)
})

export default UMPNextRequestPolicy