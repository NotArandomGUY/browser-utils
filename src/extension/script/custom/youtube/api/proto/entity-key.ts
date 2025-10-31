import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { pbf_i32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const EntityKey = createMessage({
  id: pbf_str(2),
  num: pbf_i32(4)
})

export const createEntityKey = (...args: ConstructorParameters<typeof EntityKey>): string => {
  return encodeURIComponent(btoa(bufferToString(new EntityKey(...args).serialize(), 'latin1')))
}

export const parseEntityKey = (entityKey: string): InstanceType<typeof EntityKey> => {
  return new EntityKey().deserialize(bufferFromString(atob(decodeURIComponent(entityKey)), 'latin1'))
}

export default EntityKey