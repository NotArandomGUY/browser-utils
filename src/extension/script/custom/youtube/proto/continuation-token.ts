import { pbf_bin, pbf_bol, pbf_msg, pbf_str, pbf_u32, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const LiveChatContinuationToken = createMessage({
  params: pbf_str(3),
  /*@__MANGLE_PROP__*/streaming: pbf_bol(6),
  m16: pbf_bin(16),
  n17: pbf_u32(17),
  timestamp: pbf_u64(20),
  n21: pbf_u32(21),
  b22: pbf_bin(22)
})

export const LiveChatReplayContinuationToken = createMessage({
  params: pbf_str(3),
  /*@__MANGLE_PROP__*/streaming: pbf_bol(8),
  m14: pbf_bin(14),
  n15: pbf_u32(15)
})

const ContinuationToken = createMessage({
  // 112707711
  liveChatContinuation: pbf_msg(119693434, LiveChatContinuationToken),
  liveChatReplayContinuation: pbf_msg(156074452, LiveChatReplayContinuationToken)
})

export default ContinuationToken