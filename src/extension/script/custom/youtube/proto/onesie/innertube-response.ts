import { OnesieHttpHeader } from '@ext/custom/youtube/proto/onesie/common'
import { pbf_bin, pbf_i32, pbf_msg, pbf_repeat } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const enum OnesieProxyStatus {
  UNKNOWN = 0,
  OK = 1,
  DECRYPTION_FAILED = 2,
  PARSING_FAILED = 3,
  MISSING_X_FORWARDED_FOR = 4,
  INVALID_X_FORWARDED_FOR = 5,
  INVALID_CONTENT_TYPE = 6,
  BACKEND_ERROR = 7,
  CLIENT_ERROR = 8,
  MISSING_CRYPTER = 9,
  RESPONSE_JSON_SERIALIZATION_FAILED = 10,
  DECOMPRESSION_FAILED = 11,
  JSON_PARSING_FAILED = 12,
  UNKNOWN_COMPRESSION_TYPE = 13
}

const OnesieInnertubeResponse = createMessage({
  /*@__MANGLE_PROP__*/onesiePorxyStatus: pbf_i32(1),
  /*@__MANGLE_PROP__*/httpStatus: pbf_i32(2),
  headers: pbf_repeat(pbf_msg(3, OnesieHttpHeader)),
  body: pbf_bin(4)
})

export default OnesieInnertubeResponse