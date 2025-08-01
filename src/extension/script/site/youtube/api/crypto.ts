import { floor, random } from '@ext/global/math'
import { bufferConcat } from '@ext/lib/buffer'
import Logger from '@ext/lib/logger'
import { OnesieCompressionType, OnesieCryptoParams } from '@ext/site/youtube/api/proto/ump/onesie/common'

const { crypto, CompressionStream, DecompressionStream } = globalThis
const { getRandomValues, subtle } = crypto ?? {}

const CHARS_A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const CHARS_N = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
const AES_PARAMS = { name: 'AES-CTR' } satisfies AlgorithmIdentifier
const HMAC_PARAMS = { name: 'HMAC', hash: 'SHA-256' } satisfies HmacKeyGenParams
const CRYPTO_API_ERROR = new Error('crypto api not available')
const COMPRESSION_API_ERROR = new Error('compression api not available')

const logger = new Logger('YT-CRYPTO')

async function readStream(stream: ReadableStream): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (value != null) chunks.push(value)
    if (done) break
  }

  return new Uint8Array(await new Blob(chunks).arrayBuffer())
}

function getRandomValuesArray(size: number, key?: string): number[] {
  const rand = new Uint8Array(size)

  if (getRandomValues != null) {
    try {
      getRandomValues(rand)
      return Array.from(rand)
    } catch { }
  }

  for (let i = 0; i < size; i++) {
    const now = Date.now()
    for (let j = 0; j < now % 23; j++) random() // NOSONAR
    rand[i] = floor(random() * 256)
  }

  if (key) {
    for (let ri = 1, ki = 0; ki < key.length; ri++, ki++) {
      rand[ri % size] ^= (rand[(ri - 1) % size] / 4) ^ key.charCodeAt(ki)
    }
  }

  return Array.from(rand)
}

function swap<T>(array: Array<T>, indexL: number, indexR: number): void {
  if (array.length === 0) return

  indexL %= array.length
  indexR %= array.length

  const v = array[indexL]
  array[indexL] = array[indexR]
  array[indexR] = v
}

function rotateLeft<T>(amount: number, array: Array<T>): void {
  array.splice(0, amount % array.length).forEach(v => array.push(v))
}

function rotateRight<T>(amount: number, array: Array<T>): void {
  array.splice(-(amount % array.length)).reverse().forEach(v => array.unshift(v))
}

function decode(key: string, chars: string, data: string[]): void {
  const temp = key.split('')
  data.forEach((char, i) => {
    char = chars[(chars.indexOf(char) - chars.indexOf(temp[i]) + chars.length) % chars.length]
    temp.push(char)
    data[i] = char
  })
}

function encode(key: string, chars: string, data: string[]): void {
  const temp = key.split('')
  data.forEach((char, i) => {
    temp.push(char)
    char = chars[(chars.indexOf(char) + chars.indexOf(temp[i])) % chars.length]
    data[i] = char
  })
}

export function getNonce(size: number): string {
  return getRandomValuesArray(size).map(v => CHARS_A[v % CHARS_A.length]).join('')
}

export function decodeTrackingParam(trackingParam: string): string {
  const data = trackingParam.split('')
  data.reverse()
  swap(data, 0, 15)
  rotateRight(12, data)
  decode('continuation', CHARS_A, data)
  decode('response', CHARS_N, data)
  return data.join('')
}

export function encodeTrackingParam(trackingParam: string): string {
  const data = trackingParam.split('')
  encode('response', CHARS_N, data)
  encode('continuation', CHARS_A, data)
  rotateLeft(12, data)
  swap(data, 0, 15)
  data.reverse()
  return data.join('')
}

export async function decryptOnesie(content: Uint8Array, key: Uint8Array, params: InstanceType<typeof OnesieCryptoParams> | null): Promise<Uint8Array | null> {
  const { hmac, iv, compressionType, isUnencrypted } = params ?? {}

  if (!isUnencrypted) {
    if (subtle == null) throw CRYPTO_API_ERROR

    const aesKey = await subtle.importKey('raw', key.slice(0, 16).buffer, AES_PARAMS, false, ['decrypt'])
    const hmacKey = await subtle.importKey('raw', key.slice(16).buffer, HMAC_PARAMS, false, ['verify'])

    if (iv != null) {
      if (hmac != null && !await subtle.verify(HMAC_PARAMS, hmacKey, hmac, bufferConcat([content, iv]))) {
        logger.warn('onesie hmac verify failed')
      }

      content = new Uint8Array(await subtle.decrypt({ ...AES_PARAMS, counter: iv, length: 128 }, aesKey, content))
    }
  }

  if (DecompressionStream == null) throw COMPRESSION_API_ERROR

  switch (compressionType) {
    case OnesieCompressionType.GZIP:
      content = await readStream(new Blob([content]).stream().pipeThrough(new DecompressionStream('gzip')))
      break
    case OnesieCompressionType.BROTLI:
      throw COMPRESSION_API_ERROR
  }

  return content
}

export async function encryptOnesie(content: Uint8Array, key: Uint8Array, params: InstanceType<typeof OnesieCryptoParams> | null): Promise<Uint8Array> {
  const { iv, compressionType, isUnencrypted } = params ?? {}

  if (CompressionStream == null) throw COMPRESSION_API_ERROR

  switch (compressionType) {
    case OnesieCompressionType.GZIP:
      content = await readStream(new Blob([content]).stream().pipeThrough(new CompressionStream('gzip')))
      break
    case OnesieCompressionType.BROTLI:
      throw COMPRESSION_API_ERROR
  }

  if (!isUnencrypted) {
    if (subtle == null) throw CRYPTO_API_ERROR

    const aesKey = await subtle.importKey('raw', key.slice(0, 16).buffer, AES_PARAMS, false, ['encrypt'])
    const hmacKey = await subtle.importKey('raw', key.slice(16).buffer, HMAC_PARAMS, false, ['sign'])

    if (iv != null) {
      content = new Uint8Array(await subtle.encrypt({ ...AES_PARAMS, counter: iv, length: 128 }, aesKey, content))

      if (params != null) params.hmac = new Uint8Array(await subtle.sign(HMAC_PARAMS, hmacKey, bufferConcat([content, iv])))
    }
  }

  return content
}