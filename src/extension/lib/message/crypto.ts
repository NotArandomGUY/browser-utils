import { floor, max, random } from '@ext/global/math'

export type SignedMessage<T extends object = object> = T & {
  sign: number[]
}

const { Array, Date, JSON, Uint8Array } = globalThis // NOSONAR
const { now } = Date
const { stringify } = JSON
const encode = TextEncoder.prototype.encode.bind(new TextEncoder())

const enum Const {
  SEED_SIZE = 4, // uint32
  SEED_COUNT = 4,
  HASH_SEED_SIZE = SEED_SIZE * SEED_COUNT,
  HASH_DATA_SIZE = 32,
  HASH_SIZE = HASH_SEED_SIZE + HASH_DATA_SIZE
}

type Seed<N extends number = Const.SEED_COUNT, S extends number[] = []> = S['length'] extends N ? S : Seed<N, [...S, number]>

const globalSeed: Seed = [seed(), seed(), seed(), seed()]

function seed(): number {
  return ((floor(random() * 0x100000000) ^ now()) & 0xFFFFFFFF) >>> 0
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a |= 0; b |= 0; c |= 0; d |= 0
    let t = (a + b | 0) + d | 0
    d = d + 1 | 0
    a = b ^ b >>> 9
    b = c + (c << 3) | 0
    c = (c << 21 | c >>> 11)
    c = c + t | 0
    return t >>> 0
  }
}

function contentHash(key: Uint8Array, seed: Seed, content: Uint8Array): Uint8Array {
  const prng = sfc32(...seed)
  const hash = new Uint8Array(Const.HASH_SIZE)

  const ss = key[0]
  const klen = key.length
  const clen = content.length
  const hlen = hash.length

  for (let i = max(256, clen * 16), hs = prng(), cs = prng(), ks = prng(); i >= 0; i--) {
    hash[(ss + Const.HASH_SEED_SIZE + ((hs + i) % Const.HASH_DATA_SIZE)) % hlen] ^= prng() & 0xFF
    hash[(ss + Const.HASH_SEED_SIZE + ((hs + i + 1) % Const.HASH_DATA_SIZE)) % hlen] ^= content[(cs + i) % clen] ^ key[(ks + i) % klen]
    if (i % 8 === 0) {
      hs = (hs ^ prng() ^ ks) >>> 0
      cs = (cs ^ prng() ^ hs) >>> 0
      ks = (ks ^ prng() ^ cs) >>> 0
    }
  }

  for (let i = 0; i < Const.SEED_COUNT; i++) {
    const s = seed[i]
    hash[(ss + (i << 2)) % hlen] = (s & 0xFF) ^ key[hash[(ss + Const.HASH_SEED_SIZE + 1) % hlen] % klen]
    hash[(ss + (i << 2) + 1) % hlen] = ((s >> 8) & 0xFF) ^ key[hash[(ss + Const.HASH_SEED_SIZE + 3) % hlen] % klen]
    hash[(ss + (i << 2) + 2) % hlen] = ((s >> 16) & 0xFF) ^ key[hash[(ss + Const.HASH_SEED_SIZE + 3) % hlen] % klen]
    hash[(ss + (i << 2) + 3) % hlen] = ((s >> 24) & 0xFF) ^ key[hash[(ss + Const.HASH_SEED_SIZE + 7) % hlen] % klen]
  }

  return hash
}

export function signMessage<T extends object>(key: Uint8Array, message: T): SignedMessage<T> {
  if (key.length === 0) throw new Error('Invalid key')

  const content = encode(stringify({ ...message, sign: undefined }))

  for (let i = 0; i < Const.SEED_COUNT; i++) {
    globalSeed[i] ^= ((seed() << i) | (seed() >> i)) & 0xFFFFFFFF
    globalSeed[i] >>>= 0
  }

  return { ...message, sign: Array.from(contentHash(key, globalSeed, content).values()) }
}

export function verifyMessage(key: Uint8Array, message: SignedMessage): boolean {
  const { sign } = message

  if (key.length === 0 || sign?.length !== Const.HASH_SIZE) return false

  const content = encode(stringify({ ...message, sign: undefined }))
  const hash = new Uint8Array(sign)

  const ss = key[0]
  const klen = key.length
  const hlen = hash.length

  const seed = new Array(Const.SEED_COUNT).fill(0) as Seed
  for (let i = 0; i < Const.SEED_COUNT; i++) {
    let s = hash[(ss + (i << 2)) % hlen] ^ key[hash[(ss + Const.HASH_SEED_SIZE + 1) % hlen] % klen]
    s |= (hash[(ss + (i << 2) + 1) % hlen] ^ key[hash[(ss + Const.HASH_SEED_SIZE + 3) % hlen] % klen]) << 8
    s |= (hash[(ss + (i << 2) + 2) % hlen] ^ key[hash[(ss + Const.HASH_SEED_SIZE + 3) % hlen] % klen]) << 16
    s |= (hash[(ss + (i << 2) + 3) % hlen] ^ key[hash[(ss + Const.HASH_SEED_SIZE + 7) % hlen] % klen]) << 24
    seed[i] = s >>> 0
  }

  const actualHash = contentHash(key, seed, content)
  if (actualHash.length !== hlen) return false

  for (let i = 0; i < hlen; i++) {
    if (actualHash[i] !== hash[i]) return false
  }

  return true
}