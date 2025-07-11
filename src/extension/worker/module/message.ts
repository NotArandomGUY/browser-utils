import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { SignedMessage, verifyMessage } from '@ext/lib/message/crypto'
import { ExtensionMessage, ExtensionMessageSource, ExtensionMessageType, getExtensionMessageSender } from '@ext/lib/message/extension'
import { EMC_KEY } from '@virtual/emc-key'

const logger = new Logger('WORKER-MESSAGE')

const { sendMessageToMain } = getExtensionMessageSender(ExtensionMessageSource.WORKER)

function onMessage(message: SignedMessage<ExtensionMessage>, sender: chrome.runtime.MessageSender): void {
  if (message == null) return

  if (!verifyMessage(EMC_KEY, message)) {
    logger.debug('ignore message:', message)
    return
  }
  if (message.source === ExtensionMessageSource.WORKER) return

  if (message.target !== ExtensionMessageSource.WORKER) {
    logger.warn('invalid target for message:', message)
    return
  }

  switch (message.type) {
    case ExtensionMessageType.EVENT_RUN:
      logger.debug('page preload script run, sender:', sender)
      break
    case ExtensionMessageType.EVENT_ERROR:
      logger.debug('page error:', message.data, 'origin:', sender.origin)
      break
    case ExtensionMessageType.FEATURE_ERROR:
      logger.warn('feature error:', message.data, 'origin:', sender.origin)
      break
    case ExtensionMessageType.FEATURE_STATE:
      break
    default:
      logger.warn('invalid message type:', message.type)
      break
  }
}

function onActionIconCLick(): void {
  sendMessageToMain(ExtensionMessageType.OVERLAY_OPEN, undefined)
}

export default class WorkerMessageModule extends Feature {
  protected activate(): boolean {
    chrome.runtime.onMessage.addListener(onMessage)

    chrome.action.onClicked.addListener(onActionIconCLick)

    return true
  }

  protected deactivate(): boolean {
    chrome.runtime.onMessage.removeListener(onMessage)

    return true
  }
}