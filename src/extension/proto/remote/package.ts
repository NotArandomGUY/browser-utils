import { pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import RemoteBranch from '@ext/proto/remote/branch'

const RemotePackage = createMessage({
  version: pbf_str(1),
  branches: pbf_repeat(pbf_msg(2, RemoteBranch))
})

export default RemotePackage