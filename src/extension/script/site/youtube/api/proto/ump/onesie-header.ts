import { pbf_i32, pbf_i64, pbf_msg, pbf_str, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import { OnesieCryptoParams } from '@ext/site/youtube/api/proto/ump/onesie/common'

export const enum OnesieHeaderType {
  ENCRYPTED_PLAYER_RESPONSE = 0,
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
  cryptoParams: pbf_msg(4, OnesieCryptoParams),
  lmt: pbf_u64(5),
  expectedMediaSizeBytes: pbf_i64(7),
  restrictedFormats: pbf_str(11),
  xtags: pbf_str(15),
  sequenceNumber: pbf_i64(18),
})

export default UMPOnesieHeader