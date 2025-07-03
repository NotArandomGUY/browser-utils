import { createMessage, ValueType } from '@ext/lib/protobuf/message'

const EntityKey = createMessage({
  key: [2, ValueType.STRING]
})

export default EntityKey