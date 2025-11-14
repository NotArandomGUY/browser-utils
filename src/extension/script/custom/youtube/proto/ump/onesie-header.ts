import { OnesieCryptoParams } from '@ext/custom/youtube/proto/onesie/common'
import { pbf_i32, pbf_i64, pbf_msg, pbf_str, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const enum OnesieHeaderType {
  PLAYER_RESPONSE = 0,
  MEDIA = 1,
  MEDIA_DECRYPTION_KEY = 2,
  CLEAR_MEDIA = 3,
  CLEAR_INIT_SEGMENT = 4,
  ACK = 5,
  MEDIA_STREAMER_HOSTNAME = 6,
  MEDIA_SIZE_HINT = 7,
  PLAYER_SERVICE_RESPONSE_PUSH_URL = 8,
  LAST_HIGH_PRIORITY_HINT = 9,
  STREAM_METADATA = 16,
  ENCRYPTED_INNERTUBE_RESPONSE_PART = 25
}

const UMPOnesieHeader = createMessage({
  type: pbf_i32(1),
  videoId: pbf_str(2),
  itag: pbf_str(3),
  /*@__MANGLE_PROP__*/cryptoParams: pbf_msg(4, OnesieCryptoParams),
  lmt: pbf_u64(5),
  /*@__MANGLE_PROP__*/expectedMediaSizeBytes: pbf_i64(7),
  /*@__MANGLE_PROP__*/restrictedFormats: pbf_str(11),
  xtags: pbf_str(15),
  /*@__MANGLE_PROP__*/sequenceNumber: pbf_i64(18),
})

export default UMPOnesieHeader