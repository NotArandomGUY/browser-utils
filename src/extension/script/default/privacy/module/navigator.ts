import Logger from '@ext/lib/logger'

const logger = new Logger('PRIVACY-NAVIGATOR')

export default function initPrivacyNavigatorModule(): void {
  if (!('navigator' in window)) return

  Object.defineProperty(window.navigator, 'sendBeacon', {
    configurable: true,
    enumerable: false,
    value(url: string | URL, data?: BodyInit | null): boolean {
      logger.debug('intercepted send beacon:', url, data)
      return true
    }
  })
}