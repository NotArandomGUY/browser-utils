import { floor, max, random } from '@ext/global/math'
import { LogLevel } from '@ext/lib/logger'
import { EMC_KEY } from '@virtual/emc-key'

const { Date, JSON, Uint8Array } = globalThis // NOSONAR
const { now } = Date
const { stringify } = JSON

const encode = TextEncoder.prototype.encode.bind(new TextEncoder())
const key = EMC_KEY

export const enum ExtensionMessageSource {
  WORKER,
  ISOLATED,
  MAIN
}

export const enum ExtensionMessageType {
  OVERLAY_OPEN,
  EVENT_RUN,
  EVENT_ERROR,
  FEATURE_ERROR,
  FEATURE_STATE,
  LOG
}

type ExtensionMessageDataMap = {
  [ExtensionMessageType.EVENT_ERROR]: { name: string, message: string, stack: string[] },
  [ExtensionMessageType.FEATURE_ERROR]: { groupId: string, featureId: number, error: ExtensionMessageDataMap[ExtensionMessageType.EVENT_ERROR] },
  [ExtensionMessageType.FEATURE_STATE]: { groupId: string, mask: number[] },
  [ExtensionMessageType.LOG]: { timestamp: number, level: LogLevel, prefix: string, message: string }
}
type ExtensionMessageDataUnion<U extends ExtensionMessageType> = { [T in U]: { type: T, data: ExtensionMessageData<T> } }[U]

export type ExtensionMessageData<T extends ExtensionMessageType> = T extends keyof ExtensionMessageDataMap ? ExtensionMessageDataMap[T] : void

export type ExtensionMessage<T extends ExtensionMessageType = ExtensionMessageType> = {
  source: ExtensionMessageSource
  target: ExtensionMessageSource
  targetId?: number
  sign?: number[]
} & ExtensionMessageDataUnion<T>

export type ExtensionMessageSender = <T extends ExtensionMessageType>(type: T, data: ExtensionMessageData<T>, targetId?: number) => void

const globalSeeds: [number, number, number, number] = [seed(), seed(), seed(), seed()]

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

function contentHash(seeds: [number, number, number, number], content: Uint8Array): Uint8Array {
  const ss = key[0]
  const clen = content.length
  const klen = key.length

  const prng = sfc32(...seeds)
  const hash = new Uint8Array(48)

  for (let i = max(256, clen * 16), hs = prng(), cs = prng(), ks = prng(); i >= 0; i--) {
    hash[(ss + 16 + ((hs + i) % 32)) % 48] ^= prng() & 0xFF
    hash[(ss + 16 + ((hs + i + 1) % 32)) % 48] ^= content[(cs + i) % clen] ^ key[(ks + i) % klen]
    if (i % 8 === 0) {
      hs = (hs ^ prng() ^ ks) >>> 0
      cs = (cs ^ prng() ^ hs) >>> 0
      ks = (ks ^ prng() ^ cs) >>> 0
    }
  }

  for (let i = 0; i < 4; i++) {
    const seed = seeds[i]
    hash[(ss + (i << 2)) % 48] = (seed & 0xFF) ^ key[hash[(ss + 17) % 48]]
    hash[(ss + (i << 2) + 1) % 48] = ((seed >> 8) & 0xFF) ^ key[hash[(ss + 19) % 48]]
    hash[(ss + (i << 2) + 2) % 48] = ((seed >> 16) & 0xFF) ^ key[hash[(ss + 19) % 48]]
    hash[(ss + (i << 2) + 3) % 48] = ((seed >> 24) & 0xFF) ^ key[hash[(ss + 23) % 48]]
  }

  return hash
}

function signExtensionMessage<T extends ExtensionMessageType>(message: ExtensionMessage<T>): ExtensionMessage<T> {
  const content = encode(stringify({ ...message, sign: undefined }))

  for (let i = 0; i < 4; i++) {
    globalSeeds[i] ^= ((seed() << i) | (seed() >> i)) & 0xFFFFFFFF
    globalSeeds[i] >>>= 0
  }

  return { ...message, sign: Array.from(contentHash(globalSeeds, content).values()) }
}

export function verifyExtensionMessage(message: ExtensionMessage): boolean {
  const { source, target, type, sign } = message

  if (source == null || target == null || type == null || sign?.length !== 48) return false

  const content = encode(stringify({ ...message, sign: undefined }))
  const signHash = new Uint8Array(sign)

  const ss = key[0]
  const seeds: [number, number, number, number] = [0, 0, 0, 0]
  for (let i = 0; i < 4; i++) {
    let seed = signHash[(ss + (i << 2)) % 48] ^ key[signHash[(ss + 17) % 48]]
    seed |= (signHash[(ss + (i << 2) + 1) % 48] ^ key[signHash[(ss + 19) % 48]]) << 8
    seed |= (signHash[(ss + (i << 2) + 2) % 48] ^ key[signHash[(ss + 19) % 48]]) << 16
    seed |= (signHash[(ss + (i << 2) + 3) % 48] ^ key[signHash[(ss + 23) % 48]]) << 24
    seeds[i] = seed >>> 0
  }

  const hash = contentHash(seeds, content)
  for (let i = 0; i < hash.length; i++) {
    if (hash[i] !== signHash[i]) return false
  }

  return true
}

function workerSender<T extends ExtensionMessageType>(source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>, targetId?: number): void {
  if (source === target) return

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    for (const tab of tabs) {
      if (tab.id == null || (targetId != null && tab.id !== targetId)) continue

      chrome.tabs.sendMessage(tab.id, signExtensionMessage({ source, target, type, data }), { frameId: 0 })
    }
  })
}

function runtimeSender<T extends ExtensionMessageType>(source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>): void {
  if (source === target) return

  chrome.runtime.sendMessage(signExtensionMessage({ source, target, type, data })).catch(error => console.warn('runtime sender error:', error))
}

function windowSender<T extends ExtensionMessageType>(source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>): void {
  if (source === target) return

  window.postMessage(signExtensionMessage({ source, target, type, data }))
}

export function getExtensionMessageSender(source: ExtensionMessageSource.WORKER): { sendMessageToIsolated: ExtensionMessageSender, sendMessageToMain: ExtensionMessageSender }
export function getExtensionMessageSender(source: ExtensionMessageSource.ISOLATED): { sendMessageToWorker: ExtensionMessageSender, sendMessageToMain: ExtensionMessageSender }
export function getExtensionMessageSender(source: ExtensionMessageSource.MAIN): { sendMessageToWorker: ExtensionMessageSender, sendMessageToIsolated: ExtensionMessageSender }
export function getExtensionMessageSender(source: ExtensionMessageSource): Record<string, ExtensionMessageSender> {
  switch (source) {
    case ExtensionMessageSource.WORKER:
      return {
        sendMessageToIsolated: workerSender.bind(null, source, ExtensionMessageSource.ISOLATED),
        sendMessageToMain: workerSender.bind(null, source, ExtensionMessageSource.MAIN)
      }
    case ExtensionMessageSource.ISOLATED:
      return {
        sendMessageToWorker: runtimeSender.bind(null, source, ExtensionMessageSource.WORKER),
        sendMessageToMain: windowSender.bind(null, source, ExtensionMessageSource.MAIN)
      }
    case ExtensionMessageSource.MAIN:
      return {
        sendMessageToWorker: windowSender.bind(null, source, ExtensionMessageSource.WORKER),
        sendMessageToIsolated: windowSender.bind(null, source, ExtensionMessageSource.ISOLATED)
      }
    default:
      throw new Error('Invalid source')
  }
}