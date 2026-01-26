import { pbf_bin, pbf_bol, pbf_i32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const PlayerParams = createMessage({
  b1: pbf_bol(1),
  b2: pbf_bol(2),
  autoplay: pbf_bol(8),
  index: pbf_i32(9),
  /*@__MANGLE_PROP__*/isInlinePlaybackMuted: pbf_bol(12),
  /*@__MANGLE_PROP__*/isInlinePlayback: pbf_bol(25),
  b78: pbf_bol(78),
  b79: pbf_bol(79),
  /*@__MANGLE_PROP__*/searchQuery: pbf_str(89),
  sign: pbf_bin(100)
})

export default PlayerParams