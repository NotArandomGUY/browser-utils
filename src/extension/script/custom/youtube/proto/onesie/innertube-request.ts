import { OnesieHttpHeader } from '@ext/custom/youtube/proto/onesie/common'
import { pbf_bin, pbf_bol, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const OnesieInnertubeRequest = createMessage({
  urls: pbf_repeat(pbf_str(1)),
  headers: pbf_repeat(pbf_msg(2, OnesieHttpHeader)),
  body: pbf_bin(3),
  proxiedByTrustedBandaid: pbf_bol(4),
  skipResponseEncryption: pbf_bol(6)
})

export default OnesieInnertubeRequest