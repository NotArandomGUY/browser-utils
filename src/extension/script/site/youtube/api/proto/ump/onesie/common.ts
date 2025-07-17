import { pbf_bin, pbf_bol, pbf_i32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const enum OnesieCompressionType {
  NONE = 0,
  GZIP = 1,
  BROTLI = 2
}

export const OnesieCryptoParams = createMessage({
  hmac: pbf_bin(4),
  iv: pbf_bin(5),
  compressionType: pbf_i32(6),
  isUnencrypted: pbf_bol(7)
})

export const OnesieHttpHeader = createMessage({
  name: pbf_str(1),
  value: pbf_str(2)
})