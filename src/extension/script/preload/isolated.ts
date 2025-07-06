import { ExtensionMessage, ExtensionMessageSource, getExtensionMessageSender, verifyExtensionMessage } from '@ext/lib/extension-message'
import Logger from '@ext/lib/logger'

const logger = new Logger('PRELOAD-ISOLATED')

const { sendMessageToWorker, sendMessageToMain } = getExtensionMessageSender(ExtensionMessageSource.ISOLATED)

function onMessage(message?: ExtensionMessage): void {
  if (message == null) return

  if (!verifyExtensionMessage(message)) {
    logger.debug('ignore message:', message)
    return
  }
  if (message.source === ExtensionMessageSource.ISOLATED) return

  switch (message.target) {
    case ExtensionMessageSource.WORKER:
      sendMessageToWorker(message.type, message.data)
      return
    case ExtensionMessageSource.MAIN:
      sendMessageToMain(message.type, message.data)
      return
    case ExtensionMessageSource.ISOLATED:
      break
    default:
      logger.warn('invalid target for message:', message)
      return
  }

  logger.debug('received message:', message)
}

chrome.runtime?.onMessage?.addListener(onMessage)
window.addEventListener('message', ({ data }: MessageEvent<ExtensionMessage>) => onMessage(data))