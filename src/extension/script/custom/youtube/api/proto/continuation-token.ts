import { pbf_bin, pbf_msg, pbf_str, pbf_u32, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const ContinuationTokenDataId = createMessage({
  m1: pbf_bin(1),
  m3: pbf_bin(3),
  b4: pbf_u32(4),
  b6: pbf_u32(6)
})

export const ContinuationTokenData = createMessage({
  id: pbf_str(3),
  n6: pbf_u32(6),
  m16: pbf_bin(16),
  n17: pbf_u32(17),
  timestamp: pbf_u64(20),
  n21: pbf_u32(21),
  b22: pbf_bin(22)
})

const ContinuationToken = createMessage({
  data: pbf_msg(119693434, ContinuationTokenData)
})

export default ContinuationToken