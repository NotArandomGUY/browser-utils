import { bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { SignedMessage, verifyMessage } from '@ext/lib/message/crypto'
import { ExtensionMessage, ExtensionMessageSource, ExtensionMessageType, getExtensionMessageSender } from '@ext/lib/message/extension'
import { getPackageMessageKey, updateScriptPackage } from '@ext/worker/module/package'
import { HANDSHAKE_KEY } from '@virtual/extension'

const logger = new Logger('WORKER-MESSAGE')

const onHandshake = async (message: SignedMessage<ExtensionMessage>, sender: chrome.runtime.MessageSender): Promise<void> => {
  if (!verifyMessage(HANDSHAKE_KEY, message) || message.source !== ExtensionMessageSource.ISOLATED || message.target !== ExtensionMessageSource.WORKER || message.type !== ExtensionMessageType.HANDSHAKE) {
    logger.debug('ignore pre handshake message:', message)
    return
  }

  logger.debug('handshake request, sender:', sender)

  const key = await getPackageMessageKey()
  if (key == null) {
    logger.warn('package key not available')
    return
  }

  // Send package key to preload script (signed with preload key)
  getExtensionMessageSender(HANDSHAKE_KEY, ExtensionMessageSource.WORKER).sendMessageToIsolated(ExtensionMessageType.HANDSHAKE, {
    key: bufferToString(key, 'latin1')
  }, sender.tab?.id)
}

const onMessage = async (message: SignedMessage<ExtensionMessage>, sender: chrome.runtime.MessageSender): Promise<void> => {
  if (message == null || message.source === ExtensionMessageSource.WORKER) return

  const key = await getPackageMessageKey()
  if (key == null || !verifyMessage(key, message)) return onHandshake(message, sender)

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
    case ExtensionMessageType.PACKAGE_UPDATE:
      updateScriptPackage()
      break
    default:
      logger.warn('invalid message type:', message.type)
      break
  }
}

const onActionIconClick = async (): Promise<void> => {
  const key = await getPackageMessageKey()
  if (key == null) return

  getExtensionMessageSender(key, ExtensionMessageSource.WORKER).sendMessageToMain(ExtensionMessageType.OVERLAY_OPEN, undefined)
}

export default class WorkerMessageModule extends Feature {
  protected activate(): boolean {
    chrome.action.onClicked.addListener(onActionIconClick)
    chrome.runtime.onMessage.addListener(onMessage)

    return true
  }

  protected deactivate(): boolean {
    chrome.action.onClicked.removeListener(onActionIconClick)
    chrome.runtime.onMessage.removeListener(onMessage)

    return true
  }
}