import { createMessage, ValueType } from '@ext/lib/protobuf/message'

const UMPContentAdsSabrContext = createMessage({
  timestampMs: [1, ValueType.UINT64],
  backoffTimeMs: [2, ValueType.UINT32],
  info: [3, ValueType.BYTES]
})

export default UMPContentAdsSabrContext