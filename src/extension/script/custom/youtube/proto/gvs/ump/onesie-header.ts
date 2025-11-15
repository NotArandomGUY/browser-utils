import CryptoParams from '@ext/custom/youtube/proto/gvs/common/crypto-params'
import { pbf_i32, pbf_i64, pbf_msg, pbf_str, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPOnesieHeader = createMessage({
  type: pbf_i32(1),
  videoId: pbf_str(2),
  itag: pbf_str(3),
  /*@__MANGLE_PROP__*/cryptoParams: pbf_msg(4, CryptoParams),
  lmt: pbf_u64(5),
  /*@__MANGLE_PROP__*/expectedMediaSizeBytes: pbf_i64(7),
  /*@__MANGLE_PROP__*/restrictedFormats: pbf_str(11),
  xtags: pbf_str(15),
  /*@__MANGLE_PROP__*/sequenceNumber: pbf_i64(18),
})

export default UMPOnesieHeader