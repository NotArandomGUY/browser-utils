import BufferedRange from '@ext/custom/youtube/proto/buffered-range'
import OnesieEncryptedInnertubeRequest from '@ext/custom/youtube/proto/onesie/encrypted-innertube-request'
import { pbf_bin, pbf_i32, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const OnesieRequest = createMessage({
  urls: pbf_repeat(pbf_str(1)),
  /*@__MANGLE_PROP__*/clientAbrState: pbf_bin(2),
  /*@__MANGLE_PROP__*/innertubeRequest: pbf_msg(3, OnesieEncryptedInnertubeRequest),
  /*@__MANGLE_PROP__*/onesieUstreamerConfig: pbf_bin(4),
  /*@__MANGLE_PROP__*/maxVp9Height: pbf_i32(5),
  /*@__MANGLE_PROP__*/clientDisplayHeight: pbf_i32(6),
  /*@__MANGLE_PROP__*/streamerContext: pbf_bin(10),
  /*@__MANGLE_PROP__*/requestTarget: pbf_i32(13),
  /*@__MANGLE_PROP__*/bufferedRanges: pbf_repeat(pbf_msg(14, BufferedRange)),
  /*@__MANGLE_PROP__*/reloadPlaybackParams: pbf_bin(15)
})

export default OnesieRequest