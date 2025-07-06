import { min, pow } from '@ext/global/math'

export const MaxUInt64 = 18446744073709551615n
export const MaxVarIntLen64 = 10
export const MaxVarIntLen32 = 5

const MSB = 0x80
const REST = 0x7f
const SHIFT = 7
const MSBN = 0x80n
const SHIFTN = 7n

export function varintDecode64(buffer: Uint8Array, offset = 0): [value: bigint, offset: number] {
  const len = min(buffer.length, offset + MaxVarIntLen64)

  for (let i = offset, shift = 0, decoded = 0n; i < len; i += 1, shift += SHIFT) {
    const byte = buffer[i]
    decoded += BigInt((byte & REST) * pow(2, shift))
    if (!(byte & MSB) && decoded > MaxUInt64) throw new RangeError('overflow varint')
    if (!(byte & MSB)) return [decoded, i + 1]
  }

  throw new RangeError('malformed or overflow varint')
}

export function varintDecode32(buffer: Uint8Array, offset = 0): [value: number, offset: number] {
  const len = min(buffer.length, offset + MaxVarIntLen32)

  for (let i = offset, shift = 0, decoded = 0; i <= len; i += 1, shift += SHIFT) {
    const byte = buffer[i]
    decoded += (byte & REST) * pow(2, shift)
    if (!(byte & MSB)) return [decoded, i + 1]
  }

  throw new RangeError('malformed or overflow varint')
}

export function varintEncode(value: bigint | number, buffer: Uint8Array = new Uint8Array(MaxVarIntLen64), offset = 0): [buffer: Uint8Array, offset: number] {
  value = BigInt(value)
  if (value < 0n) throw new RangeError('signed input given')

  for (let i = offset, len = min(buffer.length, MaxVarIntLen64); i <= len; i++) {
    if (value < MSBN) {
      buffer[i++] = Number(value) // NOSONAR
      return [buffer.slice(offset, i), i]
    }
    buffer[i] = Number((value & 0xFFn) | MSBN)
    value >>= SHIFTN
  }

  throw new RangeError(`${value} overflows uint64`)
}

export function varint32Decode(buffer: Uint8Array, offset = 0): [value: number, offset: number] {
  if (offset < 0 || offset >= buffer.length) throw new RangeError('offset out of bounds')

  const byte = buffer[offset]

  let size = 0
  for (let shift = 0; shift < 5; shift++) {
    if ((byte & (MSB >> shift)) === 0) {
      size = shift + 1
      break
    }
  }
  if (buffer.length < offset + size) throw new RangeError('overflow varint32')

  let value: number

  switch (size) {
    case 1:
      value = byte
      break
    case 2:
      value = (buffer[offset + 1] << 6) | (byte & 0x3F)
      break
    case 3:
      value = (buffer[offset + 2] << 13) | (buffer[offset + 1] << 5) | (byte & 0x1F)
      break
    case 4:
      value = (buffer[offset + 3] << 20) | (buffer[offset + 2] << 12) | (buffer[offset + 1] << 4) | (byte & 0x0F)
      break
    case 5:
      value = ((buffer[offset + 4] << 24) >>> 0) | (buffer[offset + 3] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 1]
      break
    default:
      throw new RangeError('malformed varint32')
  }

  return [value, offset + size]
}

export function varint32Encode(value: number, buffer: Uint8Array = new Uint8Array(MaxVarIntLen32), offset = 0): [buffer: Uint8Array, offset: number] {
  if (value < 0) throw new RangeError('signed input given')

  let size = 5
  for (let shift = 0; shift <= 21; shift += 7) {
    if (value < (MSB << shift)) {
      size = (shift / 7) + 1
      break
    }
  }
  size = min(size, buffer.length)

  switch (size) {
    case 1:
      buffer[offset] = value
      break
    case 2:
      buffer[offset] = 0x80 | (value & 0x3F)
      buffer[offset + 1] = (value >> 6) & 0xFF
      break
    case 3:
      buffer[offset] = 0xC0 | (value & 0x1F)
      buffer[offset + 1] = (value >> 5) & 0xFF
      buffer[offset + 2] = (value >> 13) & 0xFF
      break
    case 4:
      buffer[offset] = 0xE0 | (value & 0x0F)
      buffer[offset + 1] = (value >> 4) & 0xFF
      buffer[offset + 2] = (value >> 12) & 0xFF
      buffer[offset + 3] = (value >> 20) & 0xFF
      break
    case 5:
      buffer[offset] = 0xF0
      buffer[offset + 1] = value & 0xFF
      buffer[offset + 2] = (value >> 8) & 0xFF
      buffer[offset + 3] = (value >> 16) & 0xFF
      buffer[offset + 4] = (value >> 24) & 0xFF
      break
    default:
      throw new RangeError(`${value} overflows uint32`)
  }

  return [buffer.slice(offset, offset + size), offset + size]
}