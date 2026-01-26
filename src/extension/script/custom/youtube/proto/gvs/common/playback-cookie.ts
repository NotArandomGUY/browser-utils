import FormatId from '@ext/custom/youtube/proto/gvs/common/format-id'
import { pbf_i32, pbf_msg } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const PlaybackCookie = createMessage({
  resolution: pbf_i32(1), // 999999 = manual/max available
  i2: pbf_i32(2),
  /*@__MANGLE_PROP__*/videoFmt: pbf_msg(7, FormatId),
  /*@__MANGLE_PROP__*/audioFmt: pbf_msg(8, FormatId),
  i28: pbf_i32(28)
})

export default PlaybackCookie