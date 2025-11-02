import { pbf_bol, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const PlayerParams = createMessage({
  isInlinePlaybackMuted: pbf_bol(12),
  isInlinePlayback: pbf_bol(25),
  searchQuery: pbf_str(89)
})

export default PlayerParams