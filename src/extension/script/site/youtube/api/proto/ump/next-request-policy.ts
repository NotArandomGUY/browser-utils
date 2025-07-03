import { createMessage, ValueType } from '@ext/lib/protobuf/message'

const UMPNextRequestPolicy = createMessage({
  targetAudioReadaheadMs: [1, ValueType.INT32],
  targetVideoReadaheadMs: [2, ValueType.INT32],
  backoffTimeMs: [4, ValueType.INT32],
  playbackCookie: [7, ValueType.BYTES],
  videoId: [8, ValueType.STRING]
})

export default UMPNextRequestPolicy