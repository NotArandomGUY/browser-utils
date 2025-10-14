import { pbf_bin, pbf_u32, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPSabrContextContentAds = createMessage({
  timestampMs: pbf_u64(1),
  backoffTimeMs: pbf_u32(2),
  info: pbf_bin(3)
})

export default UMPSabrContextContentAds