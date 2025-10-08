import { pbf_bin, pbf_bol, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import OnesieInnertubeRequest from '@ext/site/youtube/api/proto/onesie/innertube-request'

const OnesieEncryptedInnertubeRequest = createMessage({
  context: pbf_bin(1),
  encryptedOnesieInnertubeRequest: pbf_bin(2),
  encryptedClientKey: pbf_bin(5),
  iv: pbf_bin(6),
  hmac: pbf_bin(7),
  reverseProxyConfig: pbf_str(9),
  serializeResponseAsJson: pbf_bol(10),
  enableAdPlacementsPreroll: pbf_bol(13),
  enableCompression: pbf_bol(14),
  ustreamerFlags: pbf_bin(15),
  unencryptedOnesieInnertubeRequest: pbf_msg(16, OnesieInnertubeRequest),
  useJsonformatterToParsePlayerResponse: pbf_bol(17)
})

export default OnesieEncryptedInnertubeRequest