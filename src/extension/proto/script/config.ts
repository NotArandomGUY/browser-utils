import { pbf_bol, pbf_i32, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptNetRule from '@ext/proto/script/net/rule'

export const enum ScriptRunAt {
  DOCUMENT_START = 0,
  DOCUMENT_END,
  DOCUMENT_IDLE
}

export const enum ScriptWorld {
  MAIN = 0,
  ISOLATED
}

const ScriptConfig = createMessage({
  // Metadata
  name: pbf_str(1),
  categories: pbf_repeat(pbf_str(2)),
  description: pbf_str(3),
  dependencies: pbf_repeat(pbf_str(4)),
  priority: pbf_i32(5),

  // Script rules (chrome.userScripts.RegisteredUserScript)
  allFrames: pbf_bol(10),
  excludeGlobs: pbf_repeat(pbf_str(11)),
  excludeMatches: pbf_repeat(pbf_str(12)),
  includeGlobs: pbf_repeat(pbf_str(13)),
  matches: pbf_repeat(pbf_str(14)),
  runAt: pbf_i32(15),
  world: pbf_i32(16),

  // Network rules
  networkRules: pbf_repeat(pbf_msg(30, ScriptNetRule))
})

export type IScriptConfig = Partial<Omit<InstanceType<typeof ScriptConfig>, 'serialize' | 'deserialize' | 'reset'>>
export default ScriptConfig