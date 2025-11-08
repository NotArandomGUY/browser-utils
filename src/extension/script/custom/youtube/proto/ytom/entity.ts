import EntityKey from '@ext/custom/youtube/proto/entity-key'
import { pbf_i32, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const YTOfflineMediaEntity = createMessage({
  version: pbf_i32(1),
  key: pbf_msg(2, EntityKey),
  data: pbf_str(3)
})

export default YTOfflineMediaEntity