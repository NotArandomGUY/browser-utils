import { pbf_i32, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const ReadaheadPolicy = createMessage({
  minBandwidthBytesPerSec: pbf_i32(1),
  minReadaheadMs: pbf_i32(2)
})

const UMPPlaybackStartPolicy = createMessage({
  startMinReadaheadPolicy: pbf_msg(1, ReadaheadPolicy),
  resumeMinReadaheadPolicy: pbf_msg(2, ReadaheadPolicy),
  videoId: pbf_str(3)
})

export default UMPPlaybackStartPolicy