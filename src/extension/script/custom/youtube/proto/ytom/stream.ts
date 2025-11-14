import FormatRange from '@ext/custom/youtube/proto/format-range'
import { pbf_bin, pbf_i32, pbf_msg, pbf_str, pbf_u32, pbf_u64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export enum YTOfflineMediaStreamQuality {
  auto = 0,
  tiny = 144,
  small = 240,
  medium = 360,
  large = 480,
  hd720 = 720,
  hd1080 = 1080,
  hd1440 = 1440,
  hd2160 = 2160,
  hd2880 = 2880,
  highres = 4320
}

const YTOfflineMediaStream = createMessage({
  // 1-9: stream format info
  type: pbf_i32(1),
  lastModified: pbf_str(2),
  itag: pbf_i32(3),
  bitrate: pbf_i32(4),
  mimeType: pbf_str(5),
  initRange: pbf_msg(6, FormatRange),
  indexRange: pbf_msg(7, FormatRange),
  /*@__MANGLE_PROP__*/maxKnownEndTime: pbf_i32(8),
  /*@__MANGLE_PROP__*/averageByteRate: pbf_i32(9),

  // 10-19: stream content info
  contentLength: pbf_u64(10),
  /*@__MANGLE_PROP__*/chunkSize: pbf_u32(11),
  /*@__MANGLE_PROP__*/chunkKey: pbf_bin(12),
  /*@__MANGLE_PROP__*/chunkIv: pbf_bin(13),

  // 20-29: audio stream format info
  audioChannels: pbf_i32(20),
  audioSampleRate: pbf_i32(21),

  // 30-39: video stream format info
  fps: pbf_i32(30),
  width: pbf_i32(31),
  height: pbf_i32(32),
  quality: pbf_i32(33),
  qualityLabel: pbf_str(34)
})

export default YTOfflineMediaStream