import { pbf_bol, pbf_i32, pbf_str, pbf_u32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const enum OfflineStateAction {
  OK = 1
}

const OfflineState = createMessage({
  token: pbf_str(1),
  refreshInSeconds: pbf_u32(2),
  expiresInSeconds: pbf_u32(3),
  action: pbf_i32(5),
  isOfflineSharingAllowed: pbf_bol(8)
})

export default OfflineState