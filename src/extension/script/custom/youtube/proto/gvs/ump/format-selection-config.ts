import { pbf_i32, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPFormatSelectionConfig = createMessage({
  itags: pbf_repeat(pbf_i32(2)),
  videoId: pbf_str(3),
  resolution: pbf_i32(4)
})

export default UMPFormatSelectionConfig