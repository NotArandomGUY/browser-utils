import { pbf_bin, pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const OnesieEncryptedInnertubeResponse = createMessage({
  encryptedContent: pbf_bin(1),
  hmac: pbf_bin(2),
  iv: pbf_bin(3),
  compressionType: pbf_i32(4)
})

export default OnesieEncryptedInnertubeResponse