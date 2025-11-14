import BufferedRange from '@ext/custom/youtube/proto/buffered-range'
import { pbf_bin, pbf_i32, pbf_i64, pbf_msg, pbf_repeat } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const SabrRequest = createMessage({
  /*@__MANGLE_PROP__*/clientAbrState: pbf_bin(1),
  /*@__MANGLE_PROP__*/selectedFormatIds: pbf_repeat(pbf_i32(2)),
  /*@__MANGLE_PROP__*/bufferedRanges: pbf_repeat(pbf_msg(3, BufferedRange)),
  /*@__MANGLE_PROP__*/playerTimeMs: pbf_i64(4),
  /*@__MANGLE_PROP__*/videoPlaybackUstreamerConfig: pbf_bin(5),
  /*@__MANGLE_PROP__*/selectedAudioFormatIds: pbf_repeat(pbf_i32(16)),
  /*@__MANGLE_PROP__*/selectedVideoFormatIds: pbf_repeat(pbf_i32(17)),
  /*@__MANGLE_PROP__*/preferredSubtitleFormatIds: pbf_repeat(pbf_i32(18)),
  /*@__MANGLE_PROP__*/streamerContext: pbf_bin(19)
})

export default SabrRequest