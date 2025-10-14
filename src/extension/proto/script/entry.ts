import { pbf_bin, pbf_hex, pbf_msg } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptConfig from '@ext/proto/script/config'

const ScriptEntry = createMessage({
  id: pbf_hex(1),
  config: pbf_msg(2, ScriptConfig),
  code: pbf_bin(3)
})

export type IScriptEntry = Partial<Omit<InstanceType<typeof ScriptEntry>, 'serialize' | 'deserialize' | 'reset'>>
export default ScriptEntry