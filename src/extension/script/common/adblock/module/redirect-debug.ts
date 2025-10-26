import { unsafePolicy } from '@ext/lib/dom'
import { Feature } from '@ext/lib/feature'

let debug: () => void
try {
  debug = eval.bind(null, unsafePolicy.createScript('debugger'))
} catch {
  debug = () => { }
}

export default class AdblockRedirectDebugModule extends Feature {
  public constructor() {
    super('redirect-debug')
  }

  protected activate(): boolean {
    window.addEventListener('beforeunload', debug, false)

    return true
  }

  protected deactivate(): boolean {
    window.removeEventListener('beforeunload', debug, false)

    return true
  }
}