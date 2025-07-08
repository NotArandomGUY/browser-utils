import { createMessage, ValueType } from '@ext/lib/protobuf/message'

const UMPMediaHeader = createMessage({
  headerId: [1, ValueType.UINT32],
  videoId: [2, ValueType.STRING],
  itag: [3, ValueType.INT32],
  lmt: [4, ValueType.UINT64],
  xtags: [5, ValueType.STRING],
  startRange: [6, ValueType.INT64],
  compressionAlgorithm: [7, ValueType.INT32],
  isInitSeg: [8, ValueType.BOOL],
  sequenceNumber: [9, ValueType.INT64],
  unknown10: [10, ValueType.INT64],
  startMs: [11, ValueType.INT64],
  durationMs: [12, ValueType.INT64],
  formatId: [13, ValueType.INT32],
  contentLength: [14, ValueType.INT64],
  timeRange: [15, ValueType.BYTES]
})

export default UMPMediaHeader