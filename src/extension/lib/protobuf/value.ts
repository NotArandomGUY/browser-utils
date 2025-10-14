import type { Message, MessageDefinition } from '@ext/lib/protobuf/message'
import { WireType } from '@ext/lib/protobuf/wiretag'

export const enum ValueType {
  DOUBLE,
  FLOAT,
  INT32,
  INT64,
  UINT32,
  UINT64,
  SINT32,
  SINT64,
  FIXED32,
  FIXED64,
  SFIXED32,
  SFIXED64,
  BOOL,
  STRING,
  BYTES,
  HEX, // extension of bytes
  MESSAGE
}

export type ValueData<T extends ValueType> = {
  [ValueType.DOUBLE]: number
  [ValueType.FLOAT]: number
  [ValueType.INT32]: number
  [ValueType.INT64]: bigint
  [ValueType.UINT32]: number
  [ValueType.UINT64]: bigint
  [ValueType.SINT32]: number
  [ValueType.SINT64]: bigint
  [ValueType.FIXED32]: number
  [ValueType.FIXED64]: bigint
  [ValueType.SFIXED32]: number
  [ValueType.SFIXED64]: bigint
  [ValueType.BOOL]: boolean
  [ValueType.STRING]: string
  [ValueType.BYTES]: Uint8Array,
  [ValueType.HEX]: string,
  [ValueType.MESSAGE]: Message<MessageDefinition>
}[T]

export const valueTypeToWireType = (valueType: ValueType): WireType => {
  switch (valueType) {
    case ValueType.INT32:
    case ValueType.INT64:
    case ValueType.UINT32:
    case ValueType.UINT64:
    case ValueType.SINT32:
    case ValueType.SINT64:
    case ValueType.BOOL:
      return WireType.VARINT
    case ValueType.FIXED64:
    case ValueType.SFIXED64:
    case ValueType.DOUBLE:
      return WireType.FIXED64
    case ValueType.STRING:
    case ValueType.BYTES:
    case ValueType.HEX:
    case ValueType.MESSAGE:
      return WireType.LENGTH_DELIMITED
    case ValueType.FIXED32:
    case ValueType.SFIXED32:
    case ValueType.FLOAT:
      return WireType.FIXED32
    default:
      throw new Error('Invalid value type')
  }
}