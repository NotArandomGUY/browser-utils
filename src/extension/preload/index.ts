import { bufferFromString } from '@ext/lib/buffer'
import Logger from '@ext/lib/logger'
import { SignedMessage, verifyMessage } from '@ext/lib/message/crypto'
import { ExtensionMessage, ExtensionMessageSource, ExtensionMessageType, getExtensionMessageSender } from '@ext/lib/message/extension'
import { HANDSHAKE_KEY } from '@virtual/extension'

const logger = new Logger('PRELOAD-ISOLATED')

const MESSAGE_QUEUE_SIZE = 5

const messageQueue: SignedMessage<ExtensionMessage>[] = []

let { sendMessageToWorker, sendMessageToMain } = getExtensionMessageSender(HANDSHAKE_KEY, ExtensionMessageSource.ISOLATED)
let key: Uint8Array | null = null

const onHandshake = (message: SignedMessage<ExtensionMessage>): void => {
  switch (message.source) {
    case ExtensionMessageSource.WORKER:
      if (!verifyMessage(HANDSHAKE_KEY, message) || message.target !== ExtensionMessageSource.ISOLATED || message.type !== ExtensionMessageType.HANDSHAKE) {
        logger.debug('ignore pre handshake message:', message)
        return
      }

      if (message.data.key == null) {
        logger.warn('invalid package key')
        return
      }

      logger.debug('handshake received, queued:', messageQueue.length)

      key = bufferFromString(message.data.key, 'latin1');
      ({ sendMessageToWorker, sendMessageToMain } = getExtensionMessageSender(key, ExtensionMessageSource.ISOLATED))

      while (messageQueue.length > 0) onMessage(messageQueue.shift())
      return
    case ExtensionMessageSource.MAIN:
      logger.debug('queue message:', message)

      messageQueue.push(message)
      if (messageQueue.length > MESSAGE_QUEUE_SIZE) messageQueue.splice(0, messageQueue.length - MESSAGE_QUEUE_SIZE)

      sendMessageToWorker(ExtensionMessageType.HANDSHAKE, {})
      return
    default:
      logger.warn('invalid source for message', message)
      return
  }
}

const onMessage = (message?: SignedMessage<ExtensionMessage>): void => {
  if (message?.source == null || message.source === ExtensionMessageSource.ISOLATED) return

  if (key == null) return onHandshake(message)

  if (!verifyMessage(key, message)) {
    if (message.type === ExtensionMessageType.OVERLAY_OPEN && confirm('Reload required, continue?')) location.reload()

    logger.debug('ignore message:', message)
    return
  }

  switch (message.target) {
    case ExtensionMessageSource.WORKER:
      sendMessageToWorker?.(message.type, message.data)
      return
    case ExtensionMessageSource.MAIN:
      sendMessageToMain?.(message.type, message.data)
      return
    default:
      logger.warn('invalid target for message:', message)
      return
  }
}

const onMessageEvent = ({ data }: MessageEvent<SignedMessage<ExtensionMessage>>): void => {
  onMessage(data)
}

chrome.runtime?.onMessage?.addListener(onMessage)
window.addEventListener('message', onMessageEvent)