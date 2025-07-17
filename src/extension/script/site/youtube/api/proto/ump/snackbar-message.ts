import { pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const UMPSnackbarMessage = createMessage({
  messageType: pbf_i32(1)
})

export default UMPSnackbarMessage