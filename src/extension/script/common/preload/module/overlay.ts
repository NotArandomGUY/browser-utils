import Overlay from '@ext/common/preload/overlay'
import { Feature } from '@ext/lib/feature'
import { ExtensionMessageSource, ExtensionMessageType, getExtensionMessageSender } from '@ext/lib/message/extension'
import { MESSAGE_KEY } from '@virtual/package'
import van from 'vanjs-core'

const { sendMessageToWorker } = getExtensionMessageSender(MESSAGE_KEY, ExtensionMessageSource.MAIN)

export const packageUpdateStatusOverlayState = van.state<string>('unknown')

let overlay: HTMLElement | null = null

const createOverlay = (): void => {
  overlay = Overlay({
    packageProps: {
      updateStatus: packageUpdateStatusOverlayState,
      onUpdateClick() { sendMessageToWorker(ExtensionMessageType.PACKAGE_UPDATE, {}) }
    },
    onClose() { overlay?.remove() }
  })
}

const destroyOverlay = (): void => {
  overlay?.remove()
  overlay = null
}

export const openOverlay = (): void => {
  if (overlay == null || overlay.parentNode === document.body) return

  overlay.remove()
  van.add(document.body, overlay)
}

export default class PreloadOverlayModule extends Feature {
  public constructor() {
    super('overlay')
  }

  protected activate(): boolean {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createOverlay, { once: true })
    } else {
      createOverlay()
    }

    return true
  }

  protected deactivate(): boolean {
    destroyOverlay()

    return true
  }
}