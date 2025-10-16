import { assign, defineProperties, fromEntries } from '@ext/global/object'
import CodedStream from '@ext/lib/protobuf/coded-stream'
import type { FieldData, FieldDefinition, NonRepeatedFieldData } from '@ext/lib/protobuf/field'
import { ValueType, valueTypeToWireType } from '@ext/lib/protobuf/value'
import { makeTag } from '@ext/lib/protobuf/wiretag'

export type MessageDefinition = { [name: string]: FieldDefinition }
export type Message<D extends MessageDefinition> = MessageBase<D> & MessageData<D>

type MessageKey<D extends MessageDefinition> = Extract<keyof D, string>

type NamedFieldDefinition<
  M extends MessageDefinition,
  K extends MessageKey<M> = MessageKey<M>
> = M[K] extends FieldDefinition<infer T, infer R, infer D> ? (
  FieldDefinition<T, R, D> & { fn: K }
) : never

type MessageData<D extends MessageDefinition> = {
  -readonly [F in keyof D]: FieldData<D[F]> | null
}

const checkFieldType = <F extends FieldDefinition>(fieldDefinition: F, value: unknown): value is FieldData<F> => {
  const { ft, fr } = fieldDefinition

  if (fr) return Array.isArray(value)

  switch (ft) {
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
    case ValueType.HEX:
      if (typeof value === 'string') break
      return false
    case ValueType.BYTES:
      if (value instanceof Uint8Array) break
      return false
    case ValueType.MESSAGE:
      if (value instanceof MessageBase) break
      return false
    default:
      return false
  }

  return true
}

const getFieldDefault = <D extends MessageDefinition, K extends MessageKey<D>>(fieldDefinition: D[K]): FieldData<D[K]> => {
  const { ft, fr, fd } = fieldDefinition

  if (fd != null) return fd() as FieldData<D[K]>
  if (fr) return [] as FieldData<D[K] & { fr: true }>

  let value: unknown
  switch (ft) {
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
    case ValueType.HEX:
      value = ''
      break
    case ValueType.BYTES:
      value = new Uint8Array()
      break
    case ValueType.MESSAGE:
      value = new (fieldDefinition as FieldDefinition<ValueType.MESSAGE>).fm()
      break
    default:
      throw new Error('Invalid value type')
  }

  return value as FieldData<D[K]>
}

const getField = <D extends MessageDefinition, K extends MessageKey<D>>(message: MessageData<D>, fieldDefinition: NamedFieldDefinition<D, K>): FieldData<D[K]> | null => {
  const value = message[fieldDefinition.fn]
  if (value != null && !checkFieldType(fieldDefinition, value)) throw new Error('Invalid value')

  return value
}

const setField = <D extends MessageDefinition, K extends MessageKey<D>>(message: MessageData<D>, fieldDefinition: NamedFieldDefinition<D, K>, value: FieldData<D[K]> | null): void => {
  const { fn, fr } = fieldDefinition

  if (value != null && !checkFieldType({ ...fieldDefinition, fr: fr && Array.isArray(value) }, value)) throw new Error('Invalid value')

  if (fr && !Array.isArray(value)) {
    if (value == null) return

    let array = message[fn] as FieldData<D[K] & { fr: true }>
    if (!Array.isArray(array)) {
      array = []
      message[fn] = array
    }
    array.push(value as NonRepeatedFieldData<D[K] & { fr: true }>)
  } else {
    message[fn] = value
  }
}

const serializeField = <D extends FieldDefinition>(stream: CodedStream, tag: number, type: D['ft'], value: FieldData<D>): void => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      serializeField(stream, tag, type, entry)
    }
    return
  }

  stream.writeUInt32(tag)
  switch (type) {
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
    case ValueType.HEX:
      stream.writeBytes(Uint8Array.from(String(value).match(/.{1,2}/g)?.map(b => parseInt(b, 16)) ?? []))
      break
    case ValueType.MESSAGE:
      stream.writeBytes((value as MessageBase<MessageDefinition>).serialize())
      break
    default:
      throw new Error('Invalid value type')
  }
}

class MessageBase<D extends MessageDefinition> {
  private readonly fieldMap: Map<number, NamedFieldDefinition<D>>
  private readonly skippedTags: [number, Uint8Array][]

  public constructor(messageDefinition: D, initData?: Partial<MessageData<D>>) {
    this.fieldMap = new Map()
    this.skippedTags = []

    const { fieldMap, skippedTags, reset, serialize, deserialize } = this

    for (const fieldName in messageDefinition) {
      const fieldDefinition = {
        fn: fieldName,
        ...messageDefinition[fieldName]
      } as unknown as NamedFieldDefinition<D, typeof fieldName>

      fieldMap.set(makeTag(fieldDefinition.fi, valueTypeToWireType(fieldDefinition.ft)), fieldDefinition)
    }

    if (initData == null) {
      this.reset()
    } else {
      for (const [, fieldDefinition] of fieldMap) {
        setField(this as Message<D>, fieldDefinition, initData[fieldDefinition.fn] ?? null)
      }
    }

    defineProperties(this, {
      fieldMap: { configurable: false, enumerable: false, value: fieldMap, writable: false },
      skippedTags: { configurable: false, enumerable: false, value: skippedTags, writable: false },
      reset: { configurable: false, enumerable: false, value: reset.bind(this), writable: false },
      serialize: { configurable: false, enumerable: false, value: serialize.bind(this), writable: false },
      deserialize: { configurable: false, enumerable: false, value: deserialize.bind(this), writable: false }
    })
  }

  public reset(isOptional = false): void {
    const { fieldMap, skippedTags } = this

    assign(this, fromEntries(Array.from(fieldMap.values()).map(f => [f.fn, isOptional ? null : getFieldDefault(f)])))
    skippedTags.splice(0)
  }

  public serialize(): Uint8Array {
    const { fieldMap, skippedTags } = this

    const message = this as Message<D>
    const stream = new CodedStream()

    for (const [fieldTag, fieldDefinition] of fieldMap) {
      const value = getField(message, fieldDefinition)
      if (value == null) continue

      serializeField(stream, fieldTag, fieldDefinition.ft, value)
    }

    for (const [tag, value] of skippedTags) {
      stream.writeUInt32(tag)
      stream.writeRawBytes(value)
    }

    return stream.getWriteBuffer()
  }

  public deserialize(buffer: Uint8Array | CodedStream, isOptional = true): this {
    this.reset(isOptional)

    const { fieldMap, skippedTags } = this

    const message = this as Message<D>
    const stream = buffer instanceof CodedStream ? buffer : new CodedStream(buffer)

    while (!stream.isEnd) {
      const tag = stream.readUInt32()

      const fieldDefinition = fieldMap.get(tag)
      if (fieldDefinition == null) {
        const begin = stream.getPosition()
        stream.skipTag(tag)
        skippedTags.push([tag, stream.getBuffer().slice(begin, stream.getPosition())])
        continue
      }

      switch (fieldDefinition.ft) {
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
        case ValueType.HEX:
          setField(message, fieldDefinition, stream.readBytes().reduce<string>((h, b) => h + b.toString(16).padStart(2, '0'), '') as FieldData<D[MessageKey<D>]>)
          break
        case ValueType.MESSAGE:
          setField(message, fieldDefinition, new (fieldDefinition as FieldDefinition<ValueType.MESSAGE>).fm().deserialize(stream.readBytes(), isOptional) as FieldData<D[MessageKey<D>]>)
          break
        default:
          throw new Error('Invalid value type')
      }
    }

    return this
  }
}

export const createMessage = <const D extends MessageDefinition>(definition: D): (new (initData?: Partial<MessageData<D>>) => Message<D>) => {
  return Function.bind.call<typeof MessageBase, [null, D], ReturnType<typeof createMessage<D>>>(MessageBase, null, definition)
}