import { pbf_bin, pbf_msg, pbf_str, pbf_u32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const LiveChatQueryContent = createMessage({
  channelId: pbf_str(1),
  videoId: pbf_str(2)
})

export const LiveChatQuery = createMessage({
  content: pbf_msg(5, LiveChatQueryContent)
})

const LiveChatParams = createMessage({
  query: pbf_msg(1, LiveChatQuery),
  m3: pbf_bin(3),
  b4: pbf_u32(4),
  b6: pbf_u32(6)
})

export default LiveChatParams