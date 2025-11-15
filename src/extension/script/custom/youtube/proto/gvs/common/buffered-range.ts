import TimeRange from '@ext/custom/youtube/proto/gvs/common/time-range'
import { pbf_i32, pbf_i64, pbf_msg } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const BufferedRange = createMessage({
  formatId: pbf_i32(1),
  startTimeMs: pbf_i64(2),
  durationMs: pbf_i64(3),
  startSegmentIndex: pbf_i32(4),
  endSegmentIndex: pbf_i32(5),
  timeRange: pbf_msg(6, TimeRange)
})

export default BufferedRange