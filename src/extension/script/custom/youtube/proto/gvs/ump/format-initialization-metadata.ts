import FormatId from '@ext/custom/youtube/proto/gvs/common/format-id'
import FormatRange from '@ext/custom/youtube/proto/gvs/common/format-range'
import { pbf_i64, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPFormatInitializationMetadata = createMessage({
  videoId: pbf_str(1),
  formatId: pbf_msg(2, FormatId),
  endTimeMs: pbf_i64(3),
  /*@__MANGLE_PROP__*/endSegmentNumber: pbf_i64(4),
  mimeType: pbf_str(5),
  initRange: pbf_msg(6, FormatRange),
  indexRange: pbf_msg(7, FormatRange),
  i8: pbf_i64(8),
  /*@__MANGLE_PROP__*/durationUnits: pbf_i64(9),
  /*@__MANGLE_PROP__*/durationTimescale: pbf_i64(10)
})

export default UMPFormatInitializationMetadata