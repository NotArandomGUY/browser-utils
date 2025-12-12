import { defineProperty } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'

export default class VPBFLeanbackShell extends Feature {
  public constructor() {
    super('lbshell')
  }

  protected activate(): boolean {
    defineProperty(window, 'h5vcc', {
      configurable: true,
      writable: false,
      value: {
        system: {
          userOnExitStrategy: 0,
          exit: () => parent.postMessage({ type: 'exit' })
        }
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}