import { pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const PlaybackCookie = createMessage({
  resolution: pbf_i32(1),
  i2: pbf_i32(2),
  /*@__MANGLE_PROP__*/videoFmt: pbf_i32(7),
  /*@__MANGLE_PROP__*/audioFmt: pbf_i32(8)
})

export default PlaybackCookie