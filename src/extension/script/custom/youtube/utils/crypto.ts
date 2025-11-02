import { OnesieCompressionType, OnesieCryptoParams } from '@ext/custom/youtube/proto/onesie/common'
import { floor, random } from '@ext/global/math'
import { bufferConcat } from '@ext/lib/buffer'
import { compress, decompress, isCompressionSupported } from '@ext/lib/compression'
const { getRandomValues, subtle } = globalThis.crypto ?? {}

const CHARS_A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const CHARS_N = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
const AES_PARAMS = { name: 'AES-CTR' } satisfies AlgorithmIdentifier
const HMAC_PARAMS = { name: 'HMAC', hash: 'SHA-256' } satisfies HmacKeyGenParams
const CRYPTO_API_ERROR = new Error('crypto api not available')
const CRYPTO_KEY_ERROR = new Error('no key available')
const COMPRESSION_API_ERROR = new Error('compression api not available')

type CryptoParams = Partial<Omit<InstanceType<typeof OnesieCryptoParams>, 'serialize' | 'deserialize' | 'reset'>>

const getRandomValuesArray = (size: number, key?: string): number[] => {
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

const swap = <T>(array: Array<T>, indexL: number, indexR: number): void => {
  if (array.length === 0) return

  indexL %= array.length
  indexR %= array.length

  const v = array[indexL]
  array[indexL] = array[indexR]
  array[indexR] = v
}

const rotateLeft = <T>(amount: number, array: Array<T>): void => {
  array.splice(0, amount % array.length).forEach(v => array.push(v))
}

const rotateRight = <T>(amount: number, array: Array<T>): void => {
  array.splice(-(amount % array.length)).reverse().forEach(v => array.unshift(v))
}

const decode = (key: string, chars: string, data: string[]): void => {
  const temp = key.split('')
  data.forEach((char, i) => {
    char = chars[(chars.indexOf(char) - chars.indexOf(temp[i]) + chars.length) % chars.length]
    temp.push(char)
    data[i] = char
  })
}

const encode = (key: string, chars: string, data: string[]): void => {
  const temp = key.split('')
  data.forEach((char, i) => {
    temp.push(char)
    char = chars[(chars.indexOf(char) + chars.indexOf(temp[i])) % chars.length]
    data[i] = char
  })
}

export const getNonce = (size: number): string => {
  return getRandomValuesArray(size).map(v => CHARS_A[v % CHARS_A.length]).join('')
}

export const decodeTrackingParam = (trackingParam: string): string => {
  const data = trackingParam.split('')
  data.reverse()
  swap(data, 0, 15)
  rotateRight(12, data)
  decode('continuation', CHARS_A, data)
  decode('response', CHARS_N, data)
  return data.join('')
}

export const encodeTrackingParam = (trackingParam: string): string => {
  const data = trackingParam.split('')
  encode('response', CHARS_N, data)
  encode('continuation', CHARS_A, data)
  rotateLeft(12, data)
  swap(data, 0, 15)
  data.reverse()
  return data.join('')
}

export const decryptOnesie = async (content: Uint8Array<ArrayBuffer>, keys: Uint8Array[], params: CryptoParams | null): Promise<[Uint8Array<ArrayBuffer>, Uint8Array | null]> => {
  const { hmac, iv, compressionType, isUnencrypted } = params ?? {}

  let validKey: Uint8Array | null = null

  if (!isUnencrypted && iv != null) {
    if (subtle == null) throw CRYPTO_API_ERROR
    if (keys.length === 0) throw CRYPTO_KEY_ERROR

    for (const key of keys) {
      const aesKey = await subtle.importKey('raw', key.slice(0, 16), AES_PARAMS, false, ['decrypt'])
      const hmacKey = await subtle.importKey('raw', key.slice(16), HMAC_PARAMS, false, ['verify'])

      if (hmac != null && !await subtle.verify(HMAC_PARAMS, hmacKey, hmac, bufferConcat([content, iv]))) continue

      content = new Uint8Array(await subtle.decrypt({ ...AES_PARAMS, counter: iv, length: 128 }, aesKey, content))
      validKey = key
      break
    }
  }

  if (!isCompressionSupported()) throw COMPRESSION_API_ERROR

  switch (compressionType) {
    case OnesieCompressionType.GZIP:
      content = await decompress(content, 'gzip')
      break
    case OnesieCompressionType.BROTLI:
      throw COMPRESSION_API_ERROR
  }

  return [content, validKey]
}

export const encryptOnesie = async (content: Uint8Array<ArrayBuffer>, key: Uint8Array | null, params: CryptoParams | null): Promise<Uint8Array<ArrayBuffer>> => {
  const { iv, compressionType, isUnencrypted } = params ?? {}

  if (!isCompressionSupported()) throw COMPRESSION_API_ERROR

  switch (compressionType) {
    case OnesieCompressionType.GZIP:
      content = await compress(content, 'gzip')
      break
    case OnesieCompressionType.BROTLI:
      throw COMPRESSION_API_ERROR
  }

  if (!isUnencrypted && iv != null) {
    if (subtle == null) throw CRYPTO_API_ERROR
    if (key == null) throw CRYPTO_KEY_ERROR

    const aesKey = await subtle.importKey('raw', key.slice(0, 16), AES_PARAMS, false, ['encrypt'])
    const hmacKey = await subtle.importKey('raw', key.slice(16), HMAC_PARAMS, false, ['sign'])

    content = new Uint8Array(await subtle.encrypt({ ...AES_PARAMS, counter: iv, length: 128 }, aesKey, content))

    if (params != null) params.hmac = new Uint8Array(await subtle.sign(HMAC_PARAMS, hmacKey, bufferConcat([content, iv])))
  }

  return content
}