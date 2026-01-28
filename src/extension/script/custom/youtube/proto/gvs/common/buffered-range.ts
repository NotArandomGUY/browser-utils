import FormatId from '@ext/custom/youtube/proto/gvs/common/format-id'
import TimeRange from '@ext/custom/youtube/proto/gvs/common/time-range'
import { pbf_i32, pbf_i64, pbf_msg } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const BufferedRange = createMessage({
  /*@__MANGLE_PROP__*/formatId: pbf_msg(1, FormatId),
  startTimeMs: pbf_i64(2),
  durationMs: pbf_i64(3),
  /*@__MANGLE_PROP__*/startSegmentIndex: pbf_i32(4),
  /*@__MANGLE_PROP__*/endSegmentIndex: pbf_i32(5),
  /*@__MANGLE_PROP__*/timeRange: pbf_msg(6, TimeRange)
})

export default BufferedRange