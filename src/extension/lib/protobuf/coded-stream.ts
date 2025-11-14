import { max, min } from '@ext/global/math'
import { bufferFromString, bufferReadBigInt64LE, bufferReadBigUInt64LE, bufferReadDoubleLE, bufferReadFloatLE, bufferReadInt32LE, bufferReadUInt32LE, bufferToString, bufferWriteBigInt64LE, bufferWriteBigUInt64LE, bufferWriteDoubleLE, bufferWriteFloatLE, bufferWriteInt32LE, bufferWriteUInt32LE } from '@ext/lib/buffer'
import { varint32Decode, varint32Encode, varintDecode32, varintDecode64, varintEncode } from '@ext/lib/protobuf/varint'
import { getTagFieldNumber, getTagWireType, WireType } from '@ext/lib/protobuf/wiretag'

const INT32_MIN = 0x80000000
const INT64_MIN = 0x8000000000000000n
const UINT32_MAX = 0xFFFFFFFF
const UINT64_MAX = 0xFFFFFFFFFFFFFFFFn

function signed32(n: number): number {
  n &= UINT32_MAX
  return (n & INT32_MIN) === 0 ? n : -(((UINT32_MAX ^ n) >>> 0) + 1)
}

function signed64(n: bigint): bigint {
  n &= UINT64_MAX
  return (n & INT64_MIN) === 0n ? n : -((UINT64_MAX ^ n) + 1n)
}

function unsigned32(n: number): number {
  n &= UINT32_MAX
  return n >= 0 ? n : (((UINT32_MAX ^ -n) >>> 0) + 1)
}

function unsigned64(n: bigint): bigint {
  n &= UINT64_MAX
  return n >= 0 ? n : ((UINT64_MAX ^ -n) + 1n)
}

function decodeZigZag32(n: number): number {
  n &= UINT32_MAX
  return signed32(((n >> 1) ^ ((UINT32_MAX ^ (n & 1)) + 1)) >>> 0)
}

function decodeZigZag64(n: bigint): bigint {
  n &= UINT64_MAX
  return signed64((n >> 1n) ^ ((UINT64_MAX ^ (n & 1n)) + 1n))
}

function encodeZigZag32(n: number): number {
  n &= UINT32_MAX
  return (((n << 1) ^ (n >> 31)) >>> 0) & UINT32_MAX
}

function encodeZigZag64(n: bigint): bigint {
  n &= UINT64_MAX
  return ((n << 1n) ^ (n >> 63n)) & UINT64_MAX
}

export default class CodedStream {
  private buffer_: Uint8Array<ArrayBuffer>
  private position_: number

  public constructor(buffer?: Uint8Array<ArrayBuffer>) {
    this.buffer_ = buffer ?? new Uint8Array(0)
    this.position_ = 0
  }

  /*@__MANGLE_PROP__*/public get isEnd(): boolean {
    return this.position_ >= this.buffer_.length
  }

  /*@__MANGLE_PROP__*/public getReadBuffer(): Uint8Array<ArrayBuffer> {
    const { buffer_, position_ } = this

    return buffer_.slice(position_)
  }

  /*@__MANGLE_PROP__*/public getWriteBuffer(): Uint8Array<ArrayBuffer> {
    const { buffer_, position_ } = this

    return buffer_.slice(0, position_)
  }

  /*@__MANGLE_PROP__*/public getBuffer(): Uint8Array<ArrayBuffer> {
    return this.buffer_
  }

  /*@__MANGLE_PROP__*/public getPosition(): number {
    return this.position_
  }

  /*@__MANGLE_PROP__*/public getRemainSize(): number {
    const { buffer_, position_ } = this

    return buffer_.length - position_
  }

  /*@__MANGLE_PROP__*/public setBuffer(buffer: Uint8Array<ArrayBuffer>, position = 0): void {
    this.buffer_ = buffer
    this.position_ = min(position, buffer.length)
  }

  /*@__MANGLE_PROP__*/public setPosition(position: number): void {
    this.position_ = position
  }

  /*@__MANGLE_PROP__*/public readDouble(): number {
    return bufferReadDoubleLE(this.readRawBytes(8), 0)
  }

  /*@__MANGLE_PROP__*/public readFloat(): number {
    return bufferReadFloatLE(this.readRawBytes(4), 0)
  }

  /*@__MANGLE_PROP__*/public readInt32(): number {
    return signed32(this.readUInt32())
  }

  /*@__MANGLE_PROP__*/public readInt64(): bigint {
    return signed64(this.readUInt64())
  }

  /*@__MANGLE_PROP__*/public readVInt32(): number {
    return signed32(this.readVUInt32())
  }

  /*@__MANGLE_PROP__*/public readUInt32(): number {
    const { buffer_, position_ } = this

    const [value, nextPosition] = varintDecode32(buffer_, position_)
    this.position_ = nextPosition

    return value >>> 0
  }

  /*@__MANGLE_PROP__*/public readUInt64(): bigint {
    const { buffer_, position_ } = this

    const [value, nextPosition] = varintDecode64(buffer_, position_)
    this.position_ = nextPosition

    return value
  }

  /*@__MANGLE_PROP__*/public readVUInt32(): number {
    const { buffer_, position_ } = this

    const [value, nextPosition] = varint32Decode(buffer_, position_)
    this.position_ = nextPosition

    return value
  }

  /*@__MANGLE_PROP__*/public readSInt32(): number {
    return decodeZigZag32(this.readUInt32())
  }

  /*@__MANGLE_PROP__*/public readSInt64(): bigint {
    return decodeZigZag64(this.readUInt64())
  }

  /*@__MANGLE_PROP__*/public readFixed32(): number {
    return bufferReadUInt32LE(this.readRawBytes(4), 0)
  }

  /*@__MANGLE_PROP__*/public readFixed64(): bigint {
    return bufferReadBigUInt64LE(this.readRawBytes(8), 0)
  }

  /*@__MANGLE_PROP__*/public readSFixed32(): number {
    return bufferReadInt32LE(this.readRawBytes(4), 0)
  }

  /*@__MANGLE_PROP__*/public readSFixed64(): bigint {
    return bufferReadBigInt64LE(this.readRawBytes(8), 0)
  }

  /*@__MANGLE_PROP__*/public readBool(): boolean {
    return this.readUInt32() !== 0
  }

  /*@__MANGLE_PROP__*/public readString(): string {
    return bufferToString(this.readBytes())
  }

  /*@__MANGLE_PROP__*/public readBytes(): Uint8Array<ArrayBuffer> {
    return this.readRawBytes(this.readUInt32())
  }

  /*@__MANGLE_PROP__*/public readRawBytes(size: number): Uint8Array<ArrayBuffer> {
    const { buffer_, position_ } = this

    const nextPosition = position_ + size
    if (nextPosition > buffer_.length) throw new RangeError('Out of range')

    const bytes = buffer_.slice(position_, nextPosition)
    this.position_ = nextPosition

    return bytes
  }

  /*@__MANGLE_PROP__*/public writeDouble(value: number): this {
    this.ensureCapacity_(8)

    const { buffer_, position_ } = this

    bufferWriteDoubleLE(buffer_, value, position_)
    this.position_ += 8

    return this
  }

  /*@__MANGLE_PROP__*/public writeFloat(value: number): this {
    this.ensureCapacity_(4)

    const { buffer_, position_ } = this

    bufferWriteFloatLE(buffer_, value, position_)
    this.position_ += 4

    return this
  }

  /*@__MANGLE_PROP__*/public writeInt32(value: number): this {
    return this.writeRawBytes(varintEncode(unsigned32(value))[0])
  }

  /*@__MANGLE_PROP__*/public writeInt64(value: bigint): this {
    return this.writeRawBytes(varintEncode(unsigned64(value))[0])
  }

  /*@__MANGLE_PROP__*/public writeVInt32(value: number): this {
    return this.writeRawBytes(varint32Encode(unsigned32(value))[0])
  }

  /*@__MANGLE_PROP__*/public writeUInt32(value: number): this {
    return this.writeRawBytes(varintEncode(value & UINT32_MAX)[0])
  }

  /*@__MANGLE_PROP__*/public writeUInt64(value: bigint): this {
    return this.writeRawBytes(varintEncode(value & UINT64_MAX)[0])
  }

  /*@__MANGLE_PROP__*/public writeVUInt32(value: number): this {
    return this.writeRawBytes(varint32Encode(value & UINT32_MAX)[0])
  }

  /*@__MANGLE_PROP__*/public writeSInt32(value: number): this {
    return this.writeUInt32(encodeZigZag32(value))
  }

  /*@__MANGLE_PROP__*/public writeSInt64(value: bigint): this {
    return this.writeUInt64(encodeZigZag64(value))
  }

  /*@__MANGLE_PROP__*/public writeFixed32(value: number): this {
    this.ensureCapacity_(4)

    const { buffer_, position_ } = this

    bufferWriteUInt32LE(buffer_, value, position_)
    this.position_ += 4

    return this
  }

  /*@__MANGLE_PROP__*/public writeFixed64(value: bigint): this {
    this.ensureCapacity_(8)

    const { buffer_, position_ } = this

    bufferWriteBigUInt64LE(buffer_, value, position_)
    this.position_ += 8

    return this
  }

  /*@__MANGLE_PROP__*/public writeSFixed32(value: number): this {
    this.ensureCapacity_(4)

    const { buffer_, position_ } = this

    bufferWriteInt32LE(buffer_, value, position_)
    this.position_ += 4

    return this
  }

  /*@__MANGLE_PROP__*/public writeSFixed64(value: bigint): this {
    this.ensureCapacity_(8)

    const { buffer_, position_ } = this

    bufferWriteBigInt64LE(buffer_, value, position_)
    this.position_ += 8

    return this
  }

  /*@__MANGLE_PROP__*/public writeBool(value: boolean): this {
    return this.writeUInt32(value ? 1 : 0)
  }

  /*@__MANGLE_PROP__*/public writeString(value: string): this {
    return this.writeBytes(bufferFromString(value))
  }

  /*@__MANGLE_PROP__*/public writeBytes(bytes: Uint8Array): this {
    return this.writeUInt32(bytes.length).writeRawBytes(bytes)
  }

  /*@__MANGLE_PROP__*/public writeRawBytes(bytes: Uint8Array): this {
    const size = bytes.length
    this.ensureCapacity_(size)

    const { buffer_, position_ } = this

    buffer_.set(bytes, position_)
    this.position_ = position_ + size

    return this
  }

  /*@__MANGLE_PROP__*/public skipTag(tag: number, depth = 0): void {
    if (depth >= 64) throw new Error('Recursion limit exceeded')

    switch (getTagWireType(tag)) {
      case WireType.VARINT:
        this.readUInt64()
        break
      case WireType.FIXED64:
        this.position_ += 8
        break
      case WireType.LENGTH_DELIMITED: {
        const size = this.readUInt32()
        this.position_ += size
        break
      }
      case WireType.START_GROUP: {
        const startField = getTagFieldNumber(tag)

        while (true) {
          tag = this.readUInt32()
          if (tag === 0) throw new Error('Truncated message')

          if (getTagWireType(tag) == WireType.END_GROUP) break

          this.skipTag(tag, depth + 1)
        }

        const endField = getTagFieldNumber(tag)

        if (startField !== endField) throw new Error('Mismatched end-group tag')
        break
      }
      case WireType.END_GROUP:
        throw new Error('Corresponding start-group was missing')
      case WireType.FIXED32:
        this.position_ += 4
        break
    }
  }

  private ensureCapacity_(additionalBytes: number): void {
    const { buffer_, position_ } = this

    const requiredCapacity = position_ + additionalBytes
    if (requiredCapacity <= buffer_.length) return

    const newBuffer = new Uint8Array(max(buffer_.length * 2, requiredCapacity))
    newBuffer.set(buffer_)

    this.buffer_ = newBuffer
  }
}