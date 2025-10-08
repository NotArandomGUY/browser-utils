import { pbf_bin, pbf_i32, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import BufferedRange from '@ext/site/youtube/api/proto/buffered-range'
import OnesieEncryptedInnertubeRequest from '@ext/site/youtube/api/proto/onesie/encrypted-innertube-request'

const OnesieRequest = createMessage({
  urls: pbf_repeat(pbf_str(1)),
  clientAbrState: pbf_bin(2),
  innertubeRequest: pbf_msg(3, OnesieEncryptedInnertubeRequest),
  onesieUstreamerConfig: pbf_bin(4),
  maxVp9Height: pbf_i32(5),
  clientDisplayHeight: pbf_i32(6),
  streamerContext: pbf_bin(10),
  requestTarget: pbf_i32(13),
  bufferedRanges: pbf_repeat(pbf_msg(14, BufferedRange)),
  reloadPlaybackParams: pbf_bin(15)
})

export default OnesieRequest