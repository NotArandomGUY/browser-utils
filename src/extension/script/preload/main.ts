import Logger from '@ext/lib/logger'
import { SignedMessage, verifyMessage } from '@ext/lib/message/crypto'
import { ExtensionMessage, ExtensionMessageSource, ExtensionMessageType, getExtensionMessageSender } from '@ext/lib/message/extension'
import Overlay from '@ext/overlay'
import { EMC_KEY } from '@virtual/emc-key'
import van from 'vanjs-core'

const DMASK_SYNC_STORAGE_KEY = 'bufeature-dmask-sync'

const logger = new Logger('PRELOAD-MAIN')

const { sendMessageToWorker } = getExtensionMessageSender(ExtensionMessageSource.MAIN)

let overlay: HTMLElement | null = null
let overlayIndex = 0

function onMessage(message?: SignedMessage<ExtensionMessage>): void {
  if (message == null) return

  if (!verifyMessage(EMC_KEY, message)) {
    logger.debug('ignore message:', message)
    return
  }
  if (message.source === ExtensionMessageSource.MAIN) return

  if (message.target !== ExtensionMessageSource.MAIN) {
    logger.warn('invalid target for message:', message)
    return
  }

  logger.debug('received message:', message)

  switch (message.type) {
    case ExtensionMessageType.OVERLAY_OPEN:
      if (overlay != null) break

      logger.info('open extension overlay')

      overlay = Overlay({
        initIndex: overlayIndex,
        onTabChange(index) {
          overlayIndex = index
        },
        onClose() {
          overlay?.parentNode?.removeChild(overlay)
          overlay = null
        }
      })
      van.add(document.body, overlay)
      break
    case ExtensionMessageType.FEATURE_STATE:
      break
    default:
      logger.warn('invalid message type:', message.type)
      break
  }
}

function onError(error?: Error): void {
  if (error == null) return

  sendMessageToWorker(ExtensionMessageType.EVENT_ERROR, {
    name: error.name,
    message: error.message,
    stack: error.stack?.split('\n') ?? []
  })
}

window.addEventListener('message', ({ data }: MessageEvent<SignedMessage<ExtensionMessage>>) => onMessage(data))
window.addEventListener('error', event => onError(event.error))

sendMessageToWorker(ExtensionMessageType.EVENT_RUN, undefined)