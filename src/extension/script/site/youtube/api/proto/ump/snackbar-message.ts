import { createMessage, ValueType } from '@ext/lib/protobuf/message'

const UMPSnackbarMessage = createMessage({
  messageType: [1, ValueType.INT32]
})

export default UMPSnackbarMessage