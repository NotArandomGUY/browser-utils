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
  private buffer: Uint8Array
  private position: number

  public constructor(buffer?: Uint8Array) {
    this.buffer = buffer ?? new Uint8Array(0)
    this.position = 0
  }

  public get isEnd(): boolean {
    return this.position >= this.buffer.length
  }

  public getReadBuffer(): Uint8Array {
    const { buffer, position } = this

    return buffer.slice(position)
  }

  public getWriteBuffer(): Uint8Array {
    const { buffer, position } = this

    return buffer.slice(0, position)
  }

  public getBuffer(): Uint8Array {
    return this.buffer
  }

  public getPosition(): number {
    return this.position
  }

  public getRemainSize(): number {
    const { buffer, position } = this

    return buffer.length - position
  }

  public setBuffer(buffer: Uint8Array): void {
    const { position } = this

    this.buffer = buffer
    this.position = min(position, buffer.length)
  }

  public setPosition(position: number): void {
    this.position = position
  }

  public readDouble(): number {
    return bufferReadDoubleLE(this.readRawBytes(8), 0)
  }

  public readFloat(): number {
    return bufferReadFloatLE(this.readRawBytes(4), 0)
  }

  public readInt32(): number {
    return signed32(this.readUInt32())
  }

  public readInt64(): bigint {
    return signed64(this.readUInt64())
  }

  public readVInt32(): number {
    return signed32(this.readVUInt32())
  }

  public readUInt32(): number {
    const { buffer, position } = this

    const [value, nextPosition] = varintDecode32(buffer, position)
    this.position = nextPosition

    return value >>> 0
  }

  public readUInt64(): bigint {
    const { buffer, position } = this

    const [value, nextPosition] = varintDecode64(buffer, position)
    this.position = nextPosition

    return value
  }

  public readVUInt32(): number {
    const { buffer, position } = this

    const [value, nextPosition] = varint32Decode(buffer, position)
    this.position = nextPosition

    return value
  }

  public readSInt32(): number {
    return decodeZigZag32(this.readUInt32())
  }

  public readSInt64(): bigint {
    return decodeZigZag64(this.readUInt64())
  }

  public readFixed32(): number {
    return bufferReadUInt32LE(this.readRawBytes(4), 0)
  }

  public readFixed64(): bigint {
    return bufferReadBigUInt64LE(this.readRawBytes(8), 0)
  }

  public readSFixed32(): number {
    return bufferReadInt32LE(this.readRawBytes(4), 0)
  }

  public readSFixed64(): bigint {
    return bufferReadBigInt64LE(this.readRawBytes(8), 0)
  }

  public readBool(): boolean {
    return this.readUInt32() !== 0
  }

  public readString(): string {
    return bufferToString(this.readBytes())
  }

  public readBytes(): Uint8Array {
    return this.readRawBytes(this.readUInt32())
  }

  public readRawBytes(size: number): Uint8Array {
    const { buffer, position } = this

    const nextPosition = position + size
    if (nextPosition > buffer.length) throw new RangeError('Out of range')

    const bytes = buffer.slice(position, nextPosition)
    this.position = nextPosition

    return bytes
  }

  public writeDouble(value: number): this {
    this.ensureCapacity(8)

    const { buffer, position } = this

    bufferWriteDoubleLE(buffer, value, position)
    this.position += 8

    return this
  }

  public writeFloat(value: number): this {
    this.ensureCapacity(4)

    const { buffer, position } = this

    bufferWriteFloatLE(buffer, value, position)
    this.position += 4

    return this
  }

  public writeInt32(value: number): this {
    return this.writeUInt32(unsigned32(value))
  }

  public writeInt64(value: bigint): this {
    return this.writeUInt64(unsigned64(value))
  }

  public writeVInt32(value: number): this {
    return this.writeVUInt32(unsigned32(value))
  }

  public writeUInt32(value: number): this {
    return this.writeRawBytes(varintEncode(value & UINT32_MAX)[0])
  }

  public writeUInt64(value: bigint): this {
    return this.writeRawBytes(varintEncode(value & UINT64_MAX)[0])
  }

  public writeVUInt32(value: number): this {
    return this.writeRawBytes(varint32Encode(value & UINT32_MAX)[0])
  }

  public writeSInt32(value: number): this {
    return this.writeUInt32(encodeZigZag32(value))
  }

  public writeSInt64(value: bigint): this {
    return this.writeUInt64(encodeZigZag64(value))
  }

  public writeFixed32(value: number): this {
    this.ensureCapacity(4)

    const { buffer, position } = this

    bufferWriteUInt32LE(buffer, value, position)
    this.position += 4

    return this
  }

  public writeFixed64(value: bigint): this {
    this.ensureCapacity(8)

    const { buffer, position } = this

    bufferWriteBigUInt64LE(buffer, value, position)
    this.position += 8

    return this
  }

  public writeSFixed32(value: number): this {
    this.ensureCapacity(4)

    const { buffer, position } = this

    bufferWriteInt32LE(buffer, value, position)
    this.position += 4

    return this
  }

  public writeSFixed64(value: bigint): this {
    this.ensureCapacity(8)

    const { buffer, position } = this

    bufferWriteBigInt64LE(buffer, value, position)
    this.position += 8

    return this
  }

  public writeBool(value: boolean): this {
    return this.writeUInt32(value ? 1 : 0)
  }

  public writeString(value: string): this {
    return this.writeBytes(bufferFromString(value))
  }

  public writeBytes(bytes: Uint8Array): this {
    this.writeUInt32(bytes.length)
    this.writeRawBytes(bytes)

    return this
  }

  public writeRawBytes(bytes: Uint8Array): this {
    const size = bytes.length
    this.ensureCapacity(size)

    const { buffer, position } = this

    buffer.set(bytes, position)
    this.position = position + size

    return this
  }

  public skipTag(tag: number, depth = 0): void {
    if (depth >= 64) throw new Error('Recursion limit exceeded')

    switch (getTagWireType(tag)) {
      case WireType.VARINT:
        this.readUInt64()
        break
      case WireType.FIXED64:
        this.position += 8
        break
      case WireType.LENGTH_DELIMITED: {
        const size = this.readUInt32()
        this.position += size
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
        this.position += 4
        break
    }
  }

  private ensureCapacity(additionalBytes: number): void {
    const { buffer, position } = this

    const requiredCapacity = position + additionalBytes
    if (requiredCapacity <= buffer.length) return

    const newBuffer = new Uint8Array(max(buffer.length * 2, requiredCapacity))
    newBuffer.set(buffer)

    this.buffer = newBuffer
  }
}