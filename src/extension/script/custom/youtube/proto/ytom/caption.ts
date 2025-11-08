import { pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const YTOfflineMediaCaption = createMessage({
  metadata: pbf_str(1),
  trackData: pbf_str(2)
})

export default YTOfflineMediaCaption