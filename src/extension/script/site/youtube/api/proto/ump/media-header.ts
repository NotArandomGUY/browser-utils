import { pbf_bin, pbf_bol, pbf_i32, pbf_i64, pbf_str, pbf_u32, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

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
  timeRange: pbf_bin(15)
})

export default UMPMediaHeader