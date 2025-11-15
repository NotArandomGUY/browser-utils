import { pbf_bin, pbf_bol, pbf_i32, pbf_msg, pbf_repeat } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const AuthorizedFormat = createMessage({
  /*@__MANGLE_PROP__*/trackType: pbf_i32(1),
  /*@__MANGLE_PROP__*/isHdr: pbf_bol(2)
})

const PlaybackAuthorization = createMessage({
  /*@__MANGLE_PROP__*/authorizedFormats: pbf_repeat(pbf_msg(1, AuthorizedFormat)),
  /*@__MANGLE_PROP__*/sabrLicenseConstraint: pbf_bin(2)
})

export default PlaybackAuthorization