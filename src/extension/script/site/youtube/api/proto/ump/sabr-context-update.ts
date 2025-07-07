import { createMessage, ValueType } from '@ext/lib/protobuf/message'

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
  content: [1, ValueType.BYTES],
  sign: [2, ValueType.BYTES],
  unknown: [5, ValueType.INT32]
})

const UMPSabrContextUpdate = createMessage({
  type: [1, ValueType.INT32],
  scope: [2, ValueType.INT32],
  value: [3, ValueType.BYTES],
  sendByDefault: [4, ValueType.BOOL],
  writePolicy: [5, ValueType.INT32]
})

export default UMPSabrContextUpdate