import { createMessage, ValueType } from '@ext/lib/protobuf/message'

const UMPSabrError = createMessage({
  type: [1, ValueType.STRING],
  code: [2, ValueType.INT32],
  data: [3, ValueType.BYTES]
})

export default UMPSabrError