import { bufferToString } from '@ext/lib/buffer'

const { CompressionStream, DecompressionStream } = globalThis

type SupportedCompressionFormat = CompressionFormat | 'lzw'

const LZW_BYTE_SIZE = 8
const LZW_BYTE_RANGE = 256
const LZW_DEFLATE_DICTIONARY = new Map(new Array(LZW_BYTE_RANGE).fill(null).map((_, i) => [lzwCreateKey([i]), i]))
const LZW_INFLATE_DICTIONARY = new Array(LZW_BYTE_RANGE).fill(null).map((_, i) => [i])

async function partsToBuffer(parts: BlobPart[]): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await new Blob(parts).arrayBuffer())
}

async function readStream(stream: ReadableStream): Promise<Uint8Array<ArrayBuffer>> {
  const reader = stream.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (value != null) chunks.push(value)
    if (done) break
  }

  return partsToBuffer(chunks)
}

function lzwCreateKey(bytes: number[], count = bytes.length): string {
  return bufferToString(new Uint8Array(bytes).slice(0, count))
}

function lzwDeflate(data: Uint8Array): Uint8Array<ArrayBuffer> { // NOSONAR
  // Populate the initial dictionary.
  const dictionary = new Map(LZW_DEFLATE_DICTIONARY)
  let dictlen = LZW_DEFLATE_DICTIONARY.size

  const compressed = new Uint8Array(data.length)
  let symbols: number[] = []
  let bits = 8
  let index = 0
  let available = LZW_BYTE_SIZE
  let key: string, value: number | undefined

  const emit = (code: number | undefined, bits: number): void => {
    if (code == null) throw new Error('Invalid compression code')

    let msbits: number

    while (bits > 0) {
      if (index >= compressed.length) throw new RangeError('Compression index out of range')

      if (bits > available) {
        msbits = code
        msbits >>>= bits - available
        compressed[index] |= (msbits & 0xff)

        bits -= available
        available = LZW_BYTE_SIZE
        ++index
      } else if (bits <= available) {
        msbits = code
        msbits <<= available - bits
        msbits &= 0xff
        msbits >>>= LZW_BYTE_SIZE - available
        compressed[index] |= (msbits & 0xff)

        available -= bits
        bits = 0

        if (available == 0) {
          available = LZW_BYTE_SIZE
          ++index
        }
      }
    }
  }

  for (const c of data) {
    symbols.push(c)

    key = lzwCreateKey(symbols)
    value = dictionary.get(key)
    if (value != null) continue

    const prevkey = lzwCreateKey(symbols, symbols.length - 1)
    const prevvalue = dictionary.get(prevkey)
    emit(prevvalue, bits)

    if (dictlen >> bits != 0) ++bits
    dictionary.set(key, dictlen++)

    symbols = [c]
  }

  if (symbols.length > 0) {
    key = lzwCreateKey(symbols)
    value = dictionary.get(key)
    emit(value, bits)
  }

  const length = (available < LZW_BYTE_SIZE) ? index + 1 : index
  return compressed.subarray(0, length)
}

function lzwInflate(data: Uint8Array, maxDeflateRatio: number): Uint8Array<ArrayBuffer> { // NOSONAR
  const dictionary = LZW_INFLATE_DICTIONARY.slice()

  let uncompressed = new Uint8Array(Math.ceil(data.length * 1.5))
  let codeIndex = 0
  let codeOffset = 0
  let bits = LZW_BYTE_SIZE
  let index = 0
  let nextIndex = 0
  let prevvalue: number[] = []

  while (codeIndex < data.length) {
    const bitsAvailable = (data.length - codeIndex) * LZW_BYTE_SIZE - codeOffset
    if (bitsAvailable < bits) break

    let code = 0
    let bitsDecoded = 0
    while (bitsDecoded < bits) {
      const bitlen = Math.min(bits - bitsDecoded, LZW_BYTE_SIZE - codeOffset)
      const msbits = ((data[codeIndex] << codeOffset) & 0xFF) >>> (LZW_BYTE_SIZE - bitlen)

      bitsDecoded += bitlen
      codeOffset += bitlen
      if (codeOffset == LZW_BYTE_SIZE) {
        codeOffset = 0
        ++codeIndex
      }

      code |= (msbits & 0xff) << (bits - bitsDecoded)
    }

    let value = dictionary[code]
    if (prevvalue.length == 0) {
      ++bits
    } else {
      if (value) {
        prevvalue.push(value[0])
      } else {
        prevvalue.push(prevvalue[0])
      }

      dictionary[dictionary.length] = prevvalue
      prevvalue = []

      if (dictionary.length == (1 << bits)) ++bits
      if (!value) value = dictionary[code]
    }

    nextIndex = index + value.length
    if (nextIndex > maxDeflateRatio * data.length) throw new Error(`Deflate ratio ${maxDeflateRatio} exceeded. Aborting uncompression`)
    if (nextIndex >= uncompressed.length) {
      const u = new Uint8Array(Math.ceil(nextIndex * 1.5))
      u.set(uncompressed)
      uncompressed = u
    }

    uncompressed.set(value, index)
    index = nextIndex
    prevvalue = prevvalue.concat(value)
  }

  return uncompressed.subarray(0, index)
}

export const isCompressionSupported = (): boolean => CompressionStream != null && DecompressionStream != null

export const compress = async (data: BlobPart, format: SupportedCompressionFormat): Promise<Uint8Array<ArrayBuffer>> => {
  switch (format) { // NOSONAR
    case 'lzw':
      return lzwDeflate(await partsToBuffer([data]))
    default:
      return await readStream(new Blob([data]).stream().pipeThrough(new CompressionStream(format)))
  }
}

export const decompress = async (data: BlobPart, format: SupportedCompressionFormat): Promise<Uint8Array<ArrayBuffer>> => {
  switch (format) { // NOSONAR
    case 'lzw':
      return lzwInflate(await partsToBuffer([data]), 200)
    default:
      return await readStream(new Blob([data]).stream().pipeThrough(new DecompressionStream(format)))
  }
}