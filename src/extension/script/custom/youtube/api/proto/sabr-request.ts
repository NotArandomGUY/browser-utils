import BufferedRange from '@ext/custom/youtube/api/proto/buffered-range'
import { pbf_bin, pbf_i32, pbf_i64, pbf_msg, pbf_repeat } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const SabrRequest = createMessage({
  clientAbrState: pbf_bin(1),
  selectedFormatIds: pbf_repeat(pbf_i32(2)),
  bufferedRanges: pbf_repeat(pbf_msg(3, BufferedRange)),
  playerTimeMs: pbf_i64(4),
  videoPlaybackUstreamerConfig: pbf_bin(5),
  selectedAudioFormatIds: pbf_repeat(pbf_i32(16)),
  selectedVideoFormatIds: pbf_repeat(pbf_i32(17)),
  preferredSubtitleFormatIds: pbf_repeat(pbf_i32(18)),
  streamerContext: pbf_bin(19)
})

export default SabrRequest