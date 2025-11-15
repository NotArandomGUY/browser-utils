import { pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const HttpHeader = createMessage({
  name: pbf_str(1),
  value: pbf_str(2)
})

export default HttpHeader