import BufferedRange from '@ext/custom/youtube/proto/gvs/common/buffered-range'
import ClientAbrState from '@ext/custom/youtube/proto/gvs/common/client-abr-state'
import FormatId from '@ext/custom/youtube/proto/gvs/common/format-id'
import StreamerContext from '@ext/custom/youtube/proto/gvs/common/streamer-context'
import OnesieEncryptedInnertubeRequest from '@ext/custom/youtube/proto/gvs/onesie/encrypted-innertube-request'
import { pbf_bin, pbf_i32, pbf_i64, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const InitPlaybackRequest = createMessage({
  urls: pbf_repeat(pbf_str(1)),
  /*@__MANGLE_PROP__*/clientAbrState: pbf_msg(2, ClientAbrState),
  /*@__MANGLE_PROP__*/innertubeRequest: pbf_msg(3, OnesieEncryptedInnertubeRequest),
  /*@__MANGLE_PROP__*/onesieUstreamerConfig: pbf_bin(4),
  /*@__MANGLE_PROP__*/maxVp9Height: pbf_i32(5),
  /*@__MANGLE_PROP__*/clientDisplayHeight: pbf_i32(6),
  /*@__MANGLE_PROP__*/streamerContext: pbf_bin(10),
  /*@__MANGLE_PROP__*/requestTarget: pbf_i32(13),
  /*@__MANGLE_PROP__*/bufferedRanges: pbf_repeat(pbf_msg(14, BufferedRange)),
  /*@__MANGLE_PROP__*/reloadPlaybackParams: pbf_bin(15)
})

export const VideoPlaybackRequest = createMessage({
  /*@__MANGLE_PROP__*/clientAbrState: pbf_msg(1, ClientAbrState),
  /*@__MANGLE_PROP__*/selectedFormatIds: pbf_repeat(pbf_msg(2, FormatId)),
  /*@__MANGLE_PROP__*/bufferedRanges: pbf_repeat(pbf_msg(3, BufferedRange)),
  /*@__MANGLE_PROP__*/playerTimeMs: pbf_i64(4),
  videoPlaybackUstreamerConfig: pbf_bin(5),
  /*@__MANGLE_PROP__*/unknownSegments: pbf_repeat(pbf_bin(6)), // Message
  /*@__MANGLE_PROP__*/preferredAudioFormatIds: pbf_repeat(pbf_msg(16, FormatId)),
  /*@__MANGLE_PROP__*/preferredVideoFormatIds: pbf_repeat(pbf_msg(17, FormatId)),
  /*@__MANGLE_PROP__*/preferredSubtitleFormatIds: pbf_repeat(pbf_msg(18, FormatId)),
  /*@__MANGLE_PROP__*/streamerContext: pbf_msg(19, StreamerContext),
  /*@__MANGLE_PROP__*/unknownSsdai: pbf_bin(21),
  /*@__MANGLE_PROP__*/unknown22: pbf_i32(22),
  /*@__MANGLE_PROP__*/unknown23: pbf_i32(23),
  /*@__MANGLE_PROP__*/unknownSsdaiRepeated: pbf_repeat(pbf_bin(24)),
  /*@__MANGLE_PROP__*/unknown25: pbf_bin(25),
  /*@__MANGLE_PROP__*/unknownClips: pbf_repeat(pbf_bin(1000)) // Message
})