import { pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const EntityKey = createMessage({
  key: pbf_str(2)
})

export default EntityKey