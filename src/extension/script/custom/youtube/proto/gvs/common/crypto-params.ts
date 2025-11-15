import { pbf_bin, pbf_bol, pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const CryptoParams = createMessage({
  hmac: pbf_bin(4),
  iv: pbf_bin(5),
  /*@__MANGLE_PROP__*/compressionType: pbf_i32(6),
  /*@__MANGLE_PROP__*/isUnencrypted: pbf_bol(7)
})

export default CryptoParams