import CodedStream from '@ext/lib/protobuf/coded-stream'
import { makeTag, WireType } from '@ext/lib/protobuf/wiretag'

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
  BYTES
}

export type FieldDefinition<T extends ValueType = ValueType, R extends boolean = boolean> = [
  fieldNumber: number,
  type: T,
  defaultValue?: () => R extends true ? ValueData<T>[] : ValueData<T>,
  repeated?: R
]
export type MessageDefinition = { [name: string]: FieldDefinition }
export type Message<D extends MessageDefinition> = MessageBase<D> & MessageData<D>

type MessageKey<D extends MessageDefinition> = Extract<keyof D, string>

type NamedFieldDefinition<
  D extends MessageDefinition,
  N extends MessageKey<D> = MessageKey<D>,
  R extends boolean = boolean
> = [fieldName: N, ...FieldDefinition<D[N][1], R>]

type ValueData<T extends ValueType> = {
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
  [ValueType.BYTES]: Uint8Array
}[T]
type FieldData<D extends FieldDefinition> = D[3] extends true ? ValueData<D[1]>[] : ValueData<D[1]>
type MessageData<D extends MessageDefinition> = {
  [F in keyof D]: FieldData<D[F]>
}

function toWireType(valueType: ValueType): WireType {
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
      return WireType.LENGTH_DELIMITED
    case ValueType.FIXED32:
    case ValueType.SFIXED32:
    case ValueType.FLOAT:
      return WireType.FIXED32
    default:
      throw new Error('Invalid value type')
  }
}

function checkValueType<T extends ValueType = ValueType>(type: T, value: unknown): value is ValueData<T> {
  switch (type) {
    case ValueType.DOUBLE:
    case ValueType.FLOAT:
    case ValueType.INT32:
    case ValueType.UINT32:
    case ValueType.SINT32:
    case ValueType.FIXED32:
    case ValueType.SFIXED32:
      if (typeof value === 'number') break
      return false
    case ValueType.INT64:
    case ValueType.UINT64:
    case ValueType.SINT64:
    case ValueType.FIXED64:
    case ValueType.SFIXED64:
      if (typeof value === 'bigint') break
      return false
    case ValueType.BOOL:
      if (typeof value === 'boolean') break
      return false
    case ValueType.STRING:
      if (typeof value === 'string') break
      return false
    case ValueType.BYTES:
      if (value instanceof Uint8Array) break
      return false
    default:
      return false
  }

  return true
}

function getFieldDefault<
  M extends MessageDefinition,
  K extends MessageKey<M>,
  R extends boolean = boolean,
  F extends NamedFieldDefinition<M, K, R> = NamedFieldDefinition<M, K, R>
>(fieldDefinition: F): ReturnType<NonNullable<F[3]>> {
  const [, , type, defaultValue, repeated] = fieldDefinition

  if (defaultValue != null) return defaultValue() as ReturnType<NonNullable<F[3]>>
  if (repeated) return [] as ReturnType<NonNullable<F[3]>>

  let value: unknown
  switch (type) {
    case ValueType.DOUBLE:
    case ValueType.FLOAT:
    case ValueType.INT32:
    case ValueType.UINT32:
    case ValueType.SINT32:
    case ValueType.FIXED32:
    case ValueType.SFIXED32:
      value = 0
      break
    case ValueType.INT64:
    case ValueType.UINT64:
    case ValueType.SINT64:
    case ValueType.FIXED64:
    case ValueType.SFIXED64:
      value = 0n
      break
    case ValueType.BOOL:
      value = false
      break
    case ValueType.STRING:
      value = ''
      break
    case ValueType.BYTES:
      value = new Uint8Array()
      break
    default:
      throw new Error('Invalid value type')
  }

  return value as ReturnType<NonNullable<F[3]>>
}

function getField<D extends MessageDefinition, K extends MessageKey<D>>(
  message: MessageData<D>,
  fieldDefinition: NamedFieldDefinition<D, K>
): FieldData<D[K]> {
  const [fieldName, , type] = fieldDefinition

  const value = message[fieldName]
  if (!checkValueType(type, value)) throw new Error('Invalid value')

  return value
}

function setField<D extends MessageDefinition, K extends MessageKey<D>>(
  message: MessageData<D>,
  fieldDefinition: NamedFieldDefinition<D, K>,
  value: FieldData<D[K]>
): void {
  const [fieldName, , type] = fieldDefinition

  if (!checkValueType(type, value)) throw new Error('Invalid value')

  message[fieldName] = value
}

class MessageBase<D extends MessageDefinition> {
  private readonly fieldMap: Map<number, NamedFieldDefinition<D>>

  public constructor(messageDefinition: D, initData?: MessageData<D>) {
    this.fieldMap = new Map()

    const { fieldMap, reset, serialize, deserialize } = this

    for (const fieldName in messageDefinition) {
      const fieldDefinition = [fieldName, ...messageDefinition[fieldName] as FieldDefinition] as NamedFieldDefinition<D>
      const [, fieldNumber, type] = fieldDefinition

      fieldMap.set(makeTag(fieldNumber, toWireType(type)), fieldDefinition)
    }

    if (initData == null) {
      this.reset()
    } else {
      for (const [, fieldDefinition] of fieldMap) {
        const [fieldName] = fieldDefinition

        setField(this as Message<D>, fieldDefinition, initData[fieldName])
      }
    }

    Object.defineProperties(this, {
      fieldMap: { configurable: false, enumerable: false, value: fieldMap, writable: false },
      reset: { configurable: false, enumerable: false, value: reset.bind(this), writable: false },
      serialize: { configurable: false, enumerable: false, value: serialize.bind(this), writable: false },
      deserialize: { configurable: false, enumerable: false, value: deserialize.bind(this), writable: false }
    })
  }

  public reset(): void {
    const { fieldMap } = this

    Object.assign(this, Object.fromEntries(Array.from(fieldMap.values()).map(f => [f[0], getFieldDefault(f)])))
  }

  public serialize(): Uint8Array {
    const { fieldMap } = this

    const message = this as Message<D>
    const stream = new CodedStream()

    for (const [fieldTag, fieldDefinition] of fieldMap) {
      const value = getField(message, fieldDefinition)
      if (value === getFieldDefault(fieldDefinition)) continue

      stream.writeUInt32(fieldTag)
      switch (fieldDefinition[2]) {
        case ValueType.DOUBLE:
          stream.writeDouble(value as number)
          break
        case ValueType.FLOAT:
          stream.writeFloat(value as number)
          break
        case ValueType.INT32:
          stream.writeInt32(value as number)
          break
        case ValueType.INT64:
          stream.writeInt64(value as bigint)
          break
        case ValueType.UINT32:
          stream.writeUInt32(value as number)
          break
        case ValueType.UINT64:
          stream.writeUInt64(value as bigint)
          break
        case ValueType.SINT32:
          stream.writeSInt32(value as number)
          break
        case ValueType.SINT64:
          stream.writeSInt64(value as bigint)
          break
        case ValueType.FIXED32:
          stream.writeFixed32(value as number)
          break
        case ValueType.FIXED64:
          stream.writeFixed64(value as bigint)
          break
        case ValueType.SFIXED32:
          stream.writeSFixed32(value as number)
          break
        case ValueType.SFIXED64:
          stream.writeSFixed64(value as bigint)
          break
        case ValueType.BOOL:
          stream.writeBool(value as boolean)
          break
        case ValueType.STRING:
          stream.writeString(value as string)
          break
        case ValueType.BYTES:
          stream.writeBytes(value as Uint8Array)
          break
        default:
          throw new Error('Invalid value type')
      }
    }

    return stream.getWriteBuffer()
  }

  public deserialize(buffer: Uint8Array | CodedStream): this {
    this.reset()

    const { fieldMap } = this

    const message = this as Message<D>
    const stream = buffer instanceof CodedStream ? buffer : new CodedStream(buffer)

    while (!stream.isEnd) {
      const tag = stream.readUInt32()

      const fieldDefinition = fieldMap.get(tag)
      if (fieldDefinition == null) {
        stream.skipTag(tag)
        continue
      }

      const [, , type] = fieldDefinition

      switch (type) {
        case ValueType.DOUBLE:
          setField(message, fieldDefinition, stream.readDouble() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.FLOAT:
          setField(message, fieldDefinition, stream.readFloat() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.INT32:
          setField(message, fieldDefinition, stream.readInt32() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.INT64:
          setField(message, fieldDefinition, stream.readInt64() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.UINT32:
          setField(message, fieldDefinition, stream.readUInt32() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.UINT64:
          setField(message, fieldDefinition, stream.readUInt64() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.SINT32:
          setField(message, fieldDefinition, stream.readSInt32() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.SINT64:
          setField(message, fieldDefinition, stream.readSInt64() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.FIXED32:
          setField(message, fieldDefinition, stream.readFixed32() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.FIXED64:
          setField(message, fieldDefinition, stream.readFixed64() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.SFIXED32:
          setField(message, fieldDefinition, stream.readSFixed32() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.SFIXED64:
          setField(message, fieldDefinition, stream.readSFixed64() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.BOOL:
          setField(message, fieldDefinition, stream.readBool() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.STRING:
          setField(message, fieldDefinition, stream.readString() as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.BYTES:
          setField(message, fieldDefinition, stream.readBytes() as FieldData<D[MessageKey<D>]>)
          break
        default:
          throw new Error('Invalid value type')
      }
    }

    return this
  }
}

export function createMessage<D extends MessageDefinition>(definition: D): new (initData?: MessageData<D>) => Message<D> {
  return Function.bind.call<typeof MessageBase, [null, D], ReturnType<typeof createMessage<D>>>(MessageBase, null, definition)
}