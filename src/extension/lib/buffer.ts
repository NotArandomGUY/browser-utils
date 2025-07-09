import { abs, floor, LN2, log, pow } from '@ext/global/math'

type Encoding = 'utf8' | 'ascii' | 'latin1'

const checkOffset = (buffer: Uint8Array, offset: number, ext: number): void => {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > buffer.length) throw new RangeError('Trying to access beyond buffer length')
}

const checkInt = (buffer: Uint8Array, value: number, offset: number, ext: number, max: number, min: number): void => {
  if (value > max || value < min) throw new RangeError('int "value" argument is out of bounds')
  if (offset < 0 || offset + ext > buffer.length) throw new RangeError('Index out of range')
}

const checkBigInt = (buffer: Uint8Array, value: bigint, offset: number, ext: number, max: bigint, min: bigint): void => {
  if (value > max || value < min) throw new RangeError('bigint "value" argument is out of bounds')
  if (offset < 0 || offset + ext > buffer.length) throw new RangeError('Index out of range')
}

const checkIEEE754 = (buffer: Uint8Array, value: number, offset: number, ext: number, max: number, min: number): void => {
  if (value > max || value < min) throw new RangeError('ieee754 "value" argument is out of bounds')
  if (offset < 0 || offset + ext > buffer.length) throw new RangeError('Index out of range')
}

/**
 * Read IEEE754 floating point numbers from a array.
 * @param buffer the buffer
 * @param offset offset into the buffer
 * @param isLE is little endian?
 * @param mLen mantissa length
 * @param nBytes number of bytes
 */
const ieee754Read = (
  buffer: Uint8Array,
  offset: number,
  isLE: boolean,
  mLen: number,
  nBytes: number,
): number => {
  let e: number
  let m: number
  const eLen: number = nBytes * 8 - mLen - 1
  const eMax: number = (1 << eLen) - 1
  const eBias: number = eMax >> 1
  let nBits = -7
  let i: number = isLE ? nBytes - 1 : 0
  const d: number = isLE ? -1 : 1
  let s: number = buffer[offset + i]

  i += d

  e = s & ((1 << -nBits) - 1)
  s >>= -nBits
  nBits += eLen
  while (nBits > 0) {
    e = e * 256 + buffer[offset + i]
    i += d
    nBits -= 8
  }

  m = e & ((1 << -nBits) - 1)
  e >>= -nBits
  nBits += mLen
  while (nBits > 0) {
    m = m * 256 + buffer[offset + i]
    i += d
    nBits -= 8
  }

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity
  } else {
    m = m + pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * pow(2, e - mLen)
}

/**
 * Write IEEE754 floating point numbers to a array.
 * @param buffer the buffer
 * @param value value to set
 * @param offset offset into the buffer
 * @param isLE is little endian?
 * @param mLen mantissa length
 * @param nBytes number of bytes
 */
const ieee754Write = (
  buffer: Uint8Array,
  value: number,
  offset: number,
  isLE: boolean,
  mLen: number,
  nBytes: number,
): void => {
  let e: number
  let m: number
  let c: number
  let eLen: number = nBytes * 8 - mLen - 1
  const eMax: number = (1 << eLen) - 1
  const eBias: number = eMax >> 1
  const rt: number = mLen === 23 ? pow(2, -24) - pow(2, -77) : 0
  let i: number = isLE ? 0 : nBytes - 1
  const d: number = isLE ? 1 : -1
  const s: number = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = floor(log(value) / LN2)
    if (value * (c = pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * pow(2, mLen)
      e = e + eBias
    } else {
      m = value * pow(2, eBias - 1) * pow(2, mLen)
      e = 0
    }
  }

  while (mLen >= 8) {
    buffer[offset + i] = m & 0xff
    i += d
    m /= 256
    mLen -= 8
  }

  e = (e << mLen) | m
  eLen += mLen
  while (eLen > 0) {
    buffer[offset + i] = e & 0xff
    i += d
    e /= 256
    eLen -= 8
  }

  buffer[offset + i - d] |= s * 128
}

const writeBigInt64LEImpl = (buffer: Uint8Array, value: bigint, offset: number, min: bigint, max: bigint): number => {
  checkBigInt(buffer, value, offset, 7, max, min)

  let lo = Number(value & 0xFFFFFFFFn)
  buffer[offset++] = lo
  lo = lo >> 8
  buffer[offset++] = lo
  lo = lo >> 8
  buffer[offset++] = lo
  lo = lo >> 8
  buffer[offset++] = lo
  let hi = Number(value >> 32n & 0xFFFFFFFFn)
  buffer[offset++] = hi
  hi = hi >> 8
  buffer[offset++] = hi
  hi = hi >> 8
  buffer[offset++] = hi
  hi = hi >> 8
  buffer[offset++] = hi

  return offset
}

const writeBigInt64BEImpl = (buffer: Uint8Array, value: bigint, offset: number, min: bigint, max: bigint): number => {
  checkBigInt(buffer, value, offset, 7, max, min)

  let lo = Number(value & 0xFFFFFFFFn)
  buffer[offset + 7] = lo
  lo = lo >> 8
  buffer[offset + 6] = lo
  lo = lo >> 8
  buffer[offset + 5] = lo
  lo = lo >> 8
  buffer[offset + 4] = lo
  let hi = Number(value >> 32n & 0xFFFFFFFFn)
  buffer[offset + 3] = hi
  hi = hi >> 8
  buffer[offset + 2] = hi
  hi = hi >> 8
  buffer[offset + 1] = hi
  hi = hi >> 8
  buffer[offset] = hi

  return offset + 8
}

const writeFloatImpl = (buffer: Uint8Array, value: number, offset: number, isLE: boolean): number => {
  value = +value
  offset = offset >>> 0
  checkIEEE754(buffer, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754Write(buffer, value, offset, isLE, 23, 4)
  return offset + 4
}

const writeDoubleImpl = (buffer: Uint8Array, value: number, offset: number, isLE: boolean): number => {
  value = +value
  offset = offset >>> 0
  checkIEEE754(buffer, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754Write(buffer, value, offset, isLE, 52, 8)
  return offset + 4
}

export const bufferReadIntLE = (buffer: Uint8Array, offset: number, byteLength: number): number => {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  checkOffset(buffer, offset, byteLength)

  let i = 0
  let mul = 1
  let val = buffer[offset]
  while (++i < byteLength && (mul *= 0x100)) {
    val += buffer[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= pow(2, 8 * byteLength)

  return val
}

export const bufferReadIntBE = (buffer: Uint8Array, offset: number, byteLength: number): number => {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  checkOffset(buffer, offset, byteLength)

  let i = byteLength
  let mul = 1
  let val = buffer[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += buffer[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= pow(2, 8 * byteLength)

  return val
}

export const bufferReadInt8 = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 1)
  const val = buffer[offset]
  if (!(val & 0x80)) return val
  return ((0xFF - val + 1) * -1)
}

export const bufferReadInt16LE = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 2)
  const val = buffer[offset] | (buffer[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

export const bufferReadInt16BE = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 2)
  const val = buffer[offset + 1] | (buffer[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

export const bufferReadInt32LE = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 4)

  return (buffer[offset]) |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16) |
    (buffer[offset + 3] << 24)
}

export const bufferReadInt32BE = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 4)

  return (buffer[offset] << 24) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    (buffer[offset + 3])
}

export const bufferReadBigInt64LE = (buffer: Uint8Array, offset: number): bigint => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 8)

  const lo = buffer[offset] +
    buffer[offset + 1] * 2 ** 8 +
    buffer[offset + 2] * 2 ** 16 +
    buffer[offset + 3] * 2 ** 24
  const hi = buffer[offset + 4] +
    buffer[offset + 5] * 2 ** 8 +
    buffer[offset + 6] * 2 ** 16 +
    (buffer[offset + 7] << 24) // Overflow

  return (BigInt(hi) << 32n) + BigInt(lo)
}

export const bufferReadBigInt64BE = (buffer: Uint8Array, offset: number): bigint => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 8)

  const hi = (buffer[offset] << 24) + // Overflow
    buffer[offset + 1] * 2 ** 16 +
    buffer[offset + 2] * 2 ** 8 +
    buffer[offset + 3]
  const lo = buffer[offset + 4] * 2 ** 24 +
    buffer[offset + 5] * 2 ** 16 +
    buffer[offset + 6] * 2 ** 8 +
    buffer[offset + 7]

  return (BigInt(hi) << 32n) + BigInt(lo)
}

export const bufferReadBigUInt64LE = (buffer: Uint8Array, offset: number): bigint => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 8)

  const lo = buffer[offset] +
    buffer[offset + 1] * 2 ** 8 +
    buffer[offset + 2] * 2 ** 16 +
    buffer[offset + 3] * 2 ** 24
  const hi = buffer[offset + 4] +
    buffer[offset + 5] * 2 ** 8 +
    buffer[offset + 6] * 2 ** 16 +
    buffer[offset + 7] * 2 ** 24

  return (BigInt(hi) << 32n) + BigInt(lo)
}

export const bufferReadUIntLE = (buffer: Uint8Array, offset: number, byteLength: number): number => {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  checkOffset(buffer, offset, byteLength)

  let i = 0
  let mul = 1
  let val = buffer[offset]
  while (++i < byteLength && (mul *= 0x100)) {
    val += buffer[offset + i] * mul
  }

  return val
}

export const bufferReadUIntBE = (buffer: Uint8Array, offset: number, byteLength: number): number => {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  checkOffset(buffer, offset, byteLength)

  let val = buffer[offset + --byteLength]
  let mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += buffer[offset + --byteLength] * mul
  }

  return val
}

export const bufferReadUInt8 = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 1)
  return buffer[offset]
}

export const bufferReadUInt16LE = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 2)
  return buffer[offset] | (buffer[offset + 1] << 8)
}

export const bufferReadUInt16BE = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 2)
  return (buffer[offset] << 8) | buffer[offset + 1]
}

export const bufferReadUInt32LE = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 4)

  return ((buffer[offset]) |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16)) +
    (buffer[offset + 3] * 0x1000000)
}

export const bufferReadUInt32BE = (buffer: Uint8Array, offset: number): number => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 4)

  return (buffer[offset] * 0x1000000) +
    ((buffer[offset + 1] << 16) |
      (buffer[offset + 2] << 8) |
      buffer[offset + 3])
}

export const bufferReadBigUInt64BE = (buffer: Uint8Array, offset: number): bigint => {
  offset = offset >>> 0
  checkOffset(buffer, offset, 8)

  const hi = (buffer[offset] * 2 ** 24) +
    buffer[offset + 1] * 2 ** 16 +
    buffer[offset + 2] * 2 ** 8 +
    buffer[offset + 3]
  const lo = buffer[offset + 4] * 2 ** 24 +
    buffer[offset + 5] * 2 ** 16 +
    buffer[offset + 6] * 2 ** 8 +
    buffer[offset + 7]

  return (BigInt(hi) << 32n) + BigInt(lo)
}

export const bufferReadFloatLE = (buffer: Uint8Array, offset: number): number => {
  offset >>>= 0
  checkOffset(buffer, offset, 4)
  return ieee754Read(buffer, offset, true, 23, 4)
}

export const bufferReadFloatBE = (buffer: Uint8Array, offset: number): number => {
  offset >>>= 0
  checkOffset(buffer, offset, 4)
  return ieee754Read(buffer, offset, false, 23, 4)
}

export const bufferReadDoubleLE = (buffer: Uint8Array, offset: number): number => {
  offset >>>= 0
  checkOffset(buffer, offset, 8)
  return ieee754Read(buffer, offset, true, 52, 8)
}

export const bufferReadDoubleBE = (buffer: Uint8Array, offset: number): number => {
  offset >>>= 0
  checkOffset(buffer, offset, 8)
  return ieee754Read(buffer, offset, false, 52, 8)
}

export const bufferWriteUIntLE = (buffer: Uint8Array, value: number, offset: number, byteLength: number): number => {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0

  const maxBytes = pow(2, 8 * byteLength) - 1
  checkInt(buffer, value, offset, byteLength, maxBytes, 0)

  let i = 0
  let mul = 1
  buffer[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    buffer[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

export const bufferWriteUIntBE = (buffer: Uint8Array, value: number, offset: number, byteLength: number): number => {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0

  const maxBytes = pow(2, 8 * byteLength) - 1
  checkInt(buffer, value, offset, byteLength, maxBytes, 0)

  let i = byteLength - 1
  let mul = 1
  buffer[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    buffer[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

export const bufferWriteUInt8 = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 1, 0xff, 0)
  buffer[offset] = value & 0xff
  return offset + 1
}

export const bufferWriteUInt16LE = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 2, 0xffff, 0)
  buffer[offset] = value & 0xff
  buffer[offset + 1] = value >>> 8
  return offset + 2
}

export const bufferWriteUInt16BE = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 2, 0xffff, 0)
  buffer[offset] = value >>> 8
  buffer[offset + 1] = value & 0xff
  return offset + 2
}

export const bufferWriteUInt32LE = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 4, 0xffffffff, 0)
  buffer[offset + 3] = value >>> 24
  buffer[offset + 2] = value >>> 16
  buffer[offset + 1] = value >>> 8
  buffer[offset] = value & 0xff
  return offset + 4
}

export const bufferWriteUInt32BE = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 4, 0xffffffff, 0)
  buffer[offset] = value >>> 24
  buffer[offset + 1] = value >>> 16
  buffer[offset + 2] = value >>> 8
  buffer[offset + 3] = value & 0xff
  return offset + 4
}

export const bufferWriteBigUInt64LE = (buffer: Uint8Array, value: bigint, offset: number = 0): number => {
  return writeBigInt64LEImpl(buffer, value, offset, 0n, 0xFFFFFFFFFFFFFFFFn)
}

export const bufferWriteBigUInt64BE = (buffer: Uint8Array, value: bigint, offset: number = 0): number => {
  return writeBigInt64BEImpl(buffer, value, offset, 0n, 0xFFFFFFFFFFFFFFFFn)
}

export const bufferWriteIntLE = (buffer: Uint8Array, value: number, offset: number, byteLength: number): number => {
  value = +value
  offset = offset >>> 0

  const limit = pow(2, (8 * byteLength) - 1)
  checkInt(buffer, value, offset, byteLength, limit - 1, -limit)

  let i = 0
  let mul = 1
  let sub = 0
  buffer[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && buffer[offset + i - 1] !== 0) {
      sub = 1
    }
    buffer[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

export const bufferWriteIntBE = (buffer: Uint8Array, value: number, offset: number, byteLength: number): number => {
  value = +value
  offset = offset >>> 0

  const limit = pow(2, (8 * byteLength) - 1)
  checkInt(buffer, value, offset, byteLength, limit - 1, -limit)

  let i = byteLength - 1
  let mul = 1
  let sub = 0
  buffer[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && buffer[offset + i + 1] !== 0) {
      sub = 1
    }
    buffer[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

export const bufferWriteInt8 = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  buffer[offset] = value & 0xff
  return offset + 1
}

export const bufferWriteInt16LE = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 2, 0x7fff, -0x8000)
  buffer[offset] = value & 0xff
  buffer[offset + 1] = value >>> 8
  return offset + 2
}

export const bufferWriteInt16BE = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 2, 0x7fff, -0x8000)
  buffer[offset] = value >>> 8
  buffer[offset + 1] = value & 0xff
  return offset + 2
}

export const bufferWriteInt32LE = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 4, 0x7fffffff, -0x80000000)
  buffer[offset] = value & 0xff
  buffer[offset + 1] = value >>> 8
  buffer[offset + 2] = value >>> 16
  buffer[offset + 3] = value >>> 24
  return offset + 4
}

export const bufferWriteInt32BE = (buffer: Uint8Array, value: number, offset: number): number => {
  value = +value
  offset = offset >>> 0
  checkInt(buffer, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  buffer[offset] = value >>> 24
  buffer[offset + 1] = value >>> 16
  buffer[offset + 2] = value >>> 8
  buffer[offset + 3] = value & 0xff
  return offset + 4
}

export const bufferWriteBigInt64LE = (buffer: Uint8Array, value: bigint, offset: number = 0): number => {
  return writeBigInt64LEImpl(buffer, value, offset, -0x8000000000000000n, 0x7FFFFFFFFFFFFFFFn)
}

export const bufferWriteBigInt64BE = (buffer: Uint8Array, value: bigint, offset: number = 0): number => {
  return writeBigInt64BEImpl(buffer, value, offset, -0x8000000000000000n, 0x7FFFFFFFFFFFFFFFn)
}

export const bufferWriteFloatLE = (buffer: Uint8Array, value: number, offset: number): number => {
  return writeFloatImpl(buffer, value, offset, true)
}

export const bufferWriteFloatBE = (buffer: Uint8Array, value: number, offset: number): number => {
  return writeFloatImpl(buffer, value, offset, false)
}

export const bufferWriteDoubleLE = (buffer: Uint8Array, value: number, offset: number): number => {
  return writeDoubleImpl(buffer, value, offset, true)
}

export const bufferWriteDoubleBE = (buffer: Uint8Array, value: number, offset: number): number => {
  return writeDoubleImpl(buffer, value, offset, false)
}

export const bufferFromString = (input: string, encoding: Encoding = 'utf8'): Uint8Array => {
  switch (encoding) {
    case 'ascii':
    case 'latin1':
      return new Uint8Array(input.split('').map((_, i) => input.charCodeAt(i) & 0xFF))
    case 'utf8':
    default:
      return new TextEncoder().encode(input)
  }
}

export const bufferToString = (input: BufferSource, encoding: Encoding = 'utf8'): string => {
  switch (encoding) {
    case 'latin1': {
      const buffer = ArrayBuffer.isView(input)
        ? new Uint8Array(input.buffer).subarray(input.byteOffset, input.byteOffset + input.byteLength)
        : new Uint8Array(input)
      return new Array(buffer.length).fill(0).map((_, i) => String.fromCharCode(buffer[i])).join('')
    }
    default:
      return new TextDecoder(encoding).decode(input)
  }
}

export const bufferConcat = (parts: Uint8Array[]): Uint8Array => {
  const concatParts = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))

  let offset = 0
  for (const part of parts) {
    concatParts.set(part, offset)
    offset += part.length
  }

  return concatParts
}