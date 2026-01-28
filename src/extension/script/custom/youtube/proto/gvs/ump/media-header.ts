import FormatId from '@ext/custom/youtube/proto/gvs/common/format-id'
import TimeRange from '@ext/custom/youtube/proto/gvs/common/time-range'
import { pbf_bol, pbf_i32, pbf_i64, pbf_msg, pbf_str, pbf_u32, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPMediaHeader = createMessage({
  /*@__MANGLE_PROP__*/headerId: pbf_u32(1),
  videoId: pbf_str(2),
  itag: pbf_i32(3),
  lmt: pbf_u64(4),
  xtags: pbf_str(5),
  /*@__MANGLE_PROP__*/startRange: pbf_i64(6),
  /*@__MANGLE_PROP__*/compressionAlgorithm: pbf_i32(7),
  /*@__MANGLE_PROP__*/isInitSeg: pbf_bol(8),
  /*@__MANGLE_PROP__*/sequenceNumber: pbf_i32(9),
  i10: pbf_i64(10),
  startMs: pbf_i64(11),
  durationMs: pbf_i64(12),
  /*@__MANGLE_PROP__*/formatId: pbf_msg(13, FormatId),
  contentLength: pbf_i64(14),
  /*@__MANGLE_PROP__*/timeRange: pbf_msg(15, TimeRange),
  /*@__MANGLE_PROP__*/sequenceLmt: pbf_i64(16),
  /*@__MANGLE_PROP__*/clipId: pbf_str(1000)
})

export default UMPMediaHeader