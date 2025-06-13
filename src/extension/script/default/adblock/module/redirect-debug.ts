import { Feature } from '@ext/lib/feature'

let debug: () => void
try {
  const trusted = window.trustedTypes?.createPolicy('debug', { createScript: (input) => input })
  debug = eval.bind(null, trusted?.createScript('debugger') as unknown as string ?? 'debugger')
} catch {
  debug = () => { }
}

export default class AdblockRedirectDebugModule extends Feature {
  protected activate(): boolean {
    window.addEventListener('beforeunload', debug, false)

    return true
  }

  protected deactivate(): boolean {
    window.removeEventListener('beforeunload', debug, false)

    return true
  }
}