import { pbf_bin, pbf_bol, pbf_i32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const enum UMPSabrContextScope {
  SABR_CONTEXT_SCOPE_UNKNOWN = 0,
  SABR_CONTEXT_SCOPE_PLAYBACK = 1,
  SABR_CONTEXT_SCOPE_REQUEST = 2,
  SABR_CONTEXT_SCOPE_WATCH_ENDPOINT = 3,
  SABR_CONTEXT_SCOPE_CONTENT_ADS = 4
}

export const enum UMPSabrContextWritePolicy {
  SABR_CONTEXT_WRITE_POLICY_UNSPECIFIED = 0,
  SABR_CONTEXT_WRITE_POLICY_OVERWRITE = 1,
  SABR_CONTEXT_WRITE_POLICY_KEEP_EXISTING = 2
}

export const UMPSabrContextValue = createMessage({
  content: pbf_bin(1),
  sign: pbf_bin(2),
  unknown: pbf_i32(5)
})

const UMPSabrContextUpdate = createMessage({
  type: pbf_i32(1),
  scope: pbf_i32(2),
  value: pbf_bin(3),
  sendByDefault: pbf_bol(4),
  writePolicy: pbf_i32(5)
})

export default UMPSabrContextUpdate