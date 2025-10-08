import { pbf_bol, pbf_i32, pbf_i64, pbf_msg, pbf_str, pbf_u32, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import TimeRange from '@ext/site/youtube/api/proto/time-range'

const UMPMediaHeader = createMessage({
  headerId: pbf_u32(1),
  videoId: pbf_str(2),
  itag: pbf_i32(3),
  lmt: pbf_u64(4),
  xtags: pbf_str(5),
  startRange: pbf_i64(6),
  compressionAlgorithm: pbf_i32(7),
  isInitSeg: pbf_bol(8),
  sequenceNumber: pbf_i64(9),
  unknown10: pbf_i64(10),
  startMs: pbf_i64(11),
  durationMs: pbf_i64(12),
  formatId: pbf_i32(13),
  contentLength: pbf_i64(14),
  timeRange: pbf_msg(15, TimeRange),
  clipId: pbf_str(1000)
})

export default UMPMediaHeader