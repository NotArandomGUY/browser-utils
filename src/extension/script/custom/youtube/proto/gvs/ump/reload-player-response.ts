import { pbf_bol, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const ReloadPlaybackParams = createMessage({
  token: pbf_str(1)
})

const UMPReloadPlayerResponse = createMessage({
  /*@__MANGLE_PROP__*/reloadPlaybackParams: pbf_msg(1, ReloadPlaybackParams),
  b2: pbf_bol(2)
})

export default UMPReloadPlayerResponse