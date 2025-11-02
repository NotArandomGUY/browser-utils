import { pbf_i32, pbf_i64, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const FormatRange = createMessage({
  start: pbf_i32(1),
  end: pbf_i32(2)
})

const UMPFormatInitializationMetadata = createMessage({
  videoId: pbf_str(1),
  formatId: pbf_i32(2),
  endTimeMs: pbf_i32(3),
  endSegmentNumber: pbf_i64(4),
  mimeType: pbf_str(5),
  initRange: pbf_msg(6, FormatRange),
  indexRange: pbf_msg(7, FormatRange),
  unknown8: pbf_i32(8),
  durationMs: pbf_i32(9),
  unknown10: pbf_i32(10)
})

export default UMPFormatInitializationMetadata