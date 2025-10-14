import { LogLevel } from '@ext/lib/logger'
import { signMessage } from '@ext/lib/message/crypto'
import { MessageData, MessageDataUnion } from '@ext/lib/message/type'

export const enum ExtensionMessageSource {
  WORKER,
  ISOLATED,
  MAIN
}

export const enum ExtensionMessageType {
  HANDSHAKE = 0x00,
  LOG,
  OVERLAY_OPEN = 0x10,
  EVENT_RUN = 0x20,
  EVENT_ERROR,
  FEATURE_ERROR = 0x30,
  FEATURE_STATE,
  PACKAGE_UPDATE = 0x40
}

type ExtensionMessageDataMap = {
  [ExtensionMessageType.HANDSHAKE]: { key?: string }
  [ExtensionMessageType.LOG]: { timestamp: number, level: LogLevel, prefix: string, message: string }
  [ExtensionMessageType.EVENT_ERROR]: { name: string, message: string, stack: string[] }
  [ExtensionMessageType.FEATURE_ERROR]: { groupId: string, featureId: number, error: ExtensionMessageDataMap[ExtensionMessageType.EVENT_ERROR] }
  [ExtensionMessageType.FEATURE_STATE]: { groupId: string, mask: number[] }
  [ExtensionMessageType.PACKAGE_UPDATE]: { status?: string }
}
export type ExtensionMessageData<T extends ExtensionMessageType> = MessageData<ExtensionMessageDataMap, T>
export type ExtensionMessage<T extends ExtensionMessageType = ExtensionMessageType> = {
  source: ExtensionMessageSource
  target: ExtensionMessageSource
  targetId?: number
} & MessageDataUnion<ExtensionMessageDataMap, T>
export type ExtensionMessageSender = <T extends ExtensionMessageType>(type: T, data: ExtensionMessageData<T>, targetId?: number) => void

function workerSender<T extends ExtensionMessageType>(key: Uint8Array, source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>, targetId?: number): void {
  if (source === target) return

  const message = signMessage(key, { source, target, type, data })

  if (targetId != null) {
    chrome.tabs.sendMessage(targetId, message)
    return
  }

  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(tabs => {
    return Promise.all(tabs.map(tab => tab.id == null || chrome.tabs.sendMessage(tab.id, message, { frameId: 0 })))
  }).catch(error => console.warn('worker sender error:', error))
}

function runtimeSender<T extends ExtensionMessageType>(key: Uint8Array, source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>): void {
  if (source === target) return

  chrome.runtime.sendMessage(signMessage(key, { source, target, type, data })).catch(error => console.warn('runtime sender error:', error))
}

function windowSender<T extends ExtensionMessageType>(key: Uint8Array, source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>): void {
  if (source === target) return

  window.postMessage(signMessage(key, { source, target, type, data }))
}

export function getExtensionMessageSender(key: Uint8Array, source: ExtensionMessageSource.WORKER): { sendMessageToIsolated: ExtensionMessageSender, sendMessageToMain: ExtensionMessageSender }
export function getExtensionMessageSender(key: Uint8Array, source: ExtensionMessageSource.ISOLATED): { sendMessageToWorker: ExtensionMessageSender, sendMessageToMain: ExtensionMessageSender }
export function getExtensionMessageSender(key: Uint8Array, source: ExtensionMessageSource.MAIN): { sendMessageToWorker: ExtensionMessageSender, sendMessageToIsolated: ExtensionMessageSender }
export function getExtensionMessageSender(key: Uint8Array, source: ExtensionMessageSource): Record<string, ExtensionMessageSender> {
  switch (source) {
    case ExtensionMessageSource.WORKER:
      return {
        sendMessageToIsolated: workerSender.bind(null, key, source, ExtensionMessageSource.ISOLATED),
        sendMessageToMain: workerSender.bind(null, key, source, ExtensionMessageSource.MAIN)
      }
    case ExtensionMessageSource.ISOLATED:
      return {
        sendMessageToWorker: runtimeSender.bind(null, key, source, ExtensionMessageSource.WORKER),
        sendMessageToMain: windowSender.bind(null, key, source, ExtensionMessageSource.MAIN)
      }
    case ExtensionMessageSource.MAIN:
      return {
        sendMessageToWorker: windowSender.bind(null, key, source, ExtensionMessageSource.WORKER),
        sendMessageToIsolated: windowSender.bind(null, key, source, ExtensionMessageSource.ISOLATED)
      }
    default:
      throw new Error('Invalid source')
  }
}