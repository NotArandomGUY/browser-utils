import { createMessage, ValueType } from '@ext/lib/protobuf/message'

const PlayerParams = createMessage({
  isInlinePlaybackMuted: [12, ValueType.BOOL],
  isInlinePlayback: [25, ValueType.BOOL],
  searchQuery: [89, ValueType.STRING]
})

export default PlayerParams