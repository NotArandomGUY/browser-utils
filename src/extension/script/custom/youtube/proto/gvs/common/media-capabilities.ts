import { pbf_bol, pbf_i32, pbf_msg, pbf_repeat } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const VideoFormatCapability = createMessage({
  /*@__MANGLE_PROP__*/videoCodec: pbf_i32(1),
  /*@__MANGLE_PROP__*/maxHeight: pbf_i32(3),
  /*@__MANGLE_PROP__*/maxWidth: pbf_i32(4),
  /*@__MANGLE_PROP__*/maxFramerate: pbf_i32(11),
  /*@__MANGLE_PROP__*/maxBitrateBps: pbf_i32(12),
  /*@__MANGLE_PROP__*/is10BitSupported: pbf_bol(15)
})

export const AudioFormatCapability = createMessage({
  /*@__MANGLE_PROP__*/audioCodec: pbf_i32(1),
  /*@__MANGLE_PROP__*/numChannels: pbf_i32(2),
  /*@__MANGLE_PROP__*/maxBitrateBps: pbf_i32(3),
  /*@__MANGLE_PROP__*/spatialCapabilityBitmask: pbf_i32(6)
})

const MediaCapabilities = createMessage({
  /*@__MANGLE_PROP__*/videoFormatCapabilities: pbf_repeat(pbf_msg(1, VideoFormatCapability)),
  /*@__MANGLE_PROP__*/audioFormatCapabilities: pbf_repeat(pbf_msg(2, AudioFormatCapability)),
  /*@__MANGLE_PROP__*/hdrModeBitmask: pbf_i32(5)
})

export default MediaCapabilities