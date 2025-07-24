import { LogLevel } from '@ext/lib/logger'
import { signMessage } from '@ext/lib/message/crypto'
import { MessageData, MessageDataUnion } from '@ext/lib/message/type'
import { EMC_KEY } from '@virtual/emc-key'

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
export type ExtensionMessageData<T extends ExtensionMessageType> = MessageData<ExtensionMessageDataMap, T>
export type ExtensionMessage<T extends ExtensionMessageType = ExtensionMessageType> = {
  source: ExtensionMessageSource
  target: ExtensionMessageSource
  targetId?: number
} & MessageDataUnion<ExtensionMessageDataMap, T>
export type ExtensionMessageSender = <T extends ExtensionMessageType>(type: T, data: ExtensionMessageData<T>, targetId?: number) => void

function workerSender<T extends ExtensionMessageType>(source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>, targetId?: number): void {
  if (source === target) return

  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(tabs => {
    for (const tab of tabs) {
      if (tab.id == null || (targetId != null && tab.id !== targetId)) continue

      chrome.tabs.sendMessage(tab.id, signMessage(EMC_KEY, { source, target, type, data }), { frameId: 0 })
    }
  })
}

function runtimeSender<T extends ExtensionMessageType>(source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>): void {
  if (source === target) return

  chrome.runtime.sendMessage(signMessage(EMC_KEY, { source, target, type, data })).catch(error => console.warn('runtime sender error:', error))
}

function windowSender<T extends ExtensionMessageType>(source: ExtensionMessageSource, target: ExtensionMessageSource, type: T, data: ExtensionMessageData<T>): void {
  if (source === target) return

  window.postMessage(signMessage(EMC_KEY, { source, target, type, data }))
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