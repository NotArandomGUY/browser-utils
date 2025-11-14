import OnesieInnertubeRequest from '@ext/custom/youtube/proto/onesie/innertube-request'
import { pbf_bin, pbf_bol, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const OnesieEncryptedInnertubeRequest = createMessage({
  context: pbf_bin(1),
  /*@__MANGLE_PROP__*/encryptedOnesieInnertubeRequest: pbf_bin(2),
  /*@__MANGLE_PROP__*/encryptedClientKey: pbf_bin(5),
  iv: pbf_bin(6),
  hmac: pbf_bin(7),
  /*@__MANGLE_PROP__*/reverseProxyConfig: pbf_str(9),
  /*@__MANGLE_PROP__*/serializeResponseAsJson: pbf_bol(10),
  /*@__MANGLE_PROP__*/enableAdPlacementsPreroll: pbf_bol(13),
  /*@__MANGLE_PROP__*/enableCompression: pbf_bol(14),
  /*@__MANGLE_PROP__*/ustreamerFlags: pbf_bin(15),
  /*@__MANGLE_PROP__*/unencryptedOnesieInnertubeRequest: pbf_msg(16, OnesieInnertubeRequest),
  /*@__MANGLE_PROP__*/useJsonformatterToParsePlayerResponse: pbf_bol(17)
})

export default OnesieEncryptedInnertubeRequest