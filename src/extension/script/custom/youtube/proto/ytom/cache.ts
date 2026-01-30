import HttpHeader from '@ext/custom/youtube/proto/gvs/common/http-header'
import { pbf_bin, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const YTOfflineMediaCache = createMessage({
  url: pbf_str(1),
  headers: pbf_repeat(pbf_msg(2, HttpHeader)),
  body: pbf_bin(3)
})

export default YTOfflineMediaCache