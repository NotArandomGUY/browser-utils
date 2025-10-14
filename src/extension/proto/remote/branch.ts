import { pbf_bin, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const RemoteBranch = createMessage({
  id: pbf_str(1),
  url: pbf_str(2),
  encryptKey: pbf_bin(3),
  publicKey: pbf_bin(4),
  privateKey: pbf_bin(5)
})

export default RemoteBranch