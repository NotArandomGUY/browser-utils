import { openOverlay, packageUpdateStatusOverlayState } from '@ext/common/preload/module/overlay'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { SignedMessage, verifyMessage } from '@ext/lib/message/crypto'
import { ExtensionMessage, ExtensionMessageSource, ExtensionMessageType, getExtensionMessageSender } from '@ext/lib/message/extension'
import { MESSAGE_KEY } from '@virtual/package'

const logger = new Logger('PRELOAD-MESSAGE')

const DMASK_SYNC_STORAGE_KEY = 'bufeature-dmask-sync'

const { sendMessageToWorker } = getExtensionMessageSender(MESSAGE_KEY, ExtensionMessageSource.MAIN)

const onMessage = (message?: SignedMessage<ExtensionMessage>): void => {
  if (message == null || message.source === ExtensionMessageSource.MAIN) return

  if (!verifyMessage(MESSAGE_KEY, message)) {
    logger.debug('ignore message:', message)
    return
  }

  if (message.target !== ExtensionMessageSource.MAIN) {
    logger.warn('invalid target for message:', message)
    return
  }

  logger.debug('received message:', message)

  switch (message.type) {
    case ExtensionMessageType.OVERLAY_OPEN:
      openOverlay()
      break
    case ExtensionMessageType.FEATURE_STATE:
      break
    case ExtensionMessageType.PACKAGE_UPDATE:
      packageUpdateStatusOverlayState.val = message.data.status ?? 'unknown'
      break
    default:
      logger.warn('invalid message type:', message.type)
      break
  }
}

const onMessageEvent = ({ data }: MessageEvent<SignedMessage<ExtensionMessage>>): void => {
  onMessage(data)
}

const onErrorEvent = ({ error }: ErrorEvent): void => {
  if (error == null || !(error instanceof Error)) return

  sendMessageToWorker(ExtensionMessageType.EVENT_ERROR, {
    name: error.name,
    message: error.message,
    stack: error.stack?.split('\n') ?? []
  })
}

export default class PreloadMessageModule extends Feature {
  public constructor() {
    super('message')
  }

  protected activate(): boolean {
    window.addEventListener('message', onMessageEvent)
    window.addEventListener('error', onErrorEvent)

    sendMessageToWorker(ExtensionMessageType.EVENT_RUN, undefined)

    return true
  }

  protected deactivate(): boolean {
    window.removeEventListener('message', onMessageEvent)
    window.removeEventListener('error', onErrorEvent)

    return true
  }
}