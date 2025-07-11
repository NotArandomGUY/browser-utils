import Logger from '@ext/lib/logger'
import { SignedMessage, verifyMessage } from '@ext/lib/message/crypto'
import { ExtensionMessage, ExtensionMessageSource, getExtensionMessageSender } from '@ext/lib/message/extension'
import { EMC_KEY } from '@virtual/emc-key'

const logger = new Logger('PRELOAD-ISOLATED')

const { sendMessageToWorker, sendMessageToMain } = getExtensionMessageSender(ExtensionMessageSource.ISOLATED)

function onMessage(message?: SignedMessage<ExtensionMessage>): void {
  if (message == null) return

  if (!verifyMessage(EMC_KEY, message)) {
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
window.addEventListener('message', ({ data }: MessageEvent<SignedMessage<ExtensionMessage>>) => onMessage(data))