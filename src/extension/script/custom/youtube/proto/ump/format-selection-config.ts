import { pbf_i32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPFormatSelectionConfig = createMessage({
  videoId: pbf_str(3),
  unknown4: pbf_i32(4)
})

export default UMPFormatSelectionConfig