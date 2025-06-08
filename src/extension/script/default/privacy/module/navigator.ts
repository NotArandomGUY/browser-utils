import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'

const logger = new Logger('PRIVACY-NAVIGATOR')

export default class PrivacyNavigatorModule extends Feature {
  protected activate(): boolean {
    if (!('navigator' in window)) return false

    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      enumerable: false,
      value(url: string | URL, data?: BodyInit | null): boolean {
        logger.debug('intercepted send beacon:', url, data)
        return true
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}