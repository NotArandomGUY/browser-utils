import { defineProperty, getOwnPropertyDescriptor } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import ProxyChain from '@ext/lib/proxy/chain'

const MESSAGE_NAMESPACE = 'vpbf'

const logger = new Logger('VPBF-MESSAGE')

const { get: parentGet, set: parentSet, value: parentValue } = getOwnPropertyDescriptor(globalThis, 'parent') ?? {}

let parentOrigin: string = location.origin

const onMessage = ({ data }: MessageEvent): void => {
  if (data == null || typeof data !== 'object') return

  let type = String(data.type)
  if (!type.startsWith(`${MESSAGE_NAMESPACE}-`)) return
  type = type.slice(MESSAGE_NAMESPACE.length + 1)

  switch (type) {
    case 'load':
      logger.debug('browser frame load event:', data)

      if (typeof data.origin === 'string') parentOrigin = data.origin
      parent.postMessage({ type: 'ready' })
      break
    case 'keydown':
    case 'keypress':
    case 'keyup': {
      logger.debug('browser frame keyboard event:', data)

      const { key, code, keyCode } = data
      const target = document.activeElement ?? document

      target.dispatchEvent(new KeyboardEvent(type, { key, code, keyCode, bubbles: true, cancelable: true }))
      break
    }
  }
}

export default class VPBFMessage extends Feature {
  public constructor() {
    super('message')
  }

  protected activate(): boolean {
    addEventListener('message', onMessage)

    const parentProxy = new ProxyChain({
      target: parent,
      readonly: true,
      properties: {
        postMessage: {
          invoke: new Hook(parent.postMessage).install(ctx => {
            ctx.self = parentGet?.() ?? parentValue
            const message = ctx.args[0]
            if (message != null && typeof message === 'object' && typeof message.type === 'string') {
              message.type = `${MESSAGE_NAMESPACE}-${message.type}`
              ctx.args[1] = parentOrigin
            }
            return HookResult.EXECUTION_IGNORE
          }).call
        }
      }
    })

    defineProperty(globalThis, 'parent', {
      configurable: true,
      enumerable: true,
      get() { return parentProxy },
      set() { }
    })

    return true
  }

  protected deactivate(): boolean {
    removeEventListener('message', onMessage)

    defineProperty(globalThis, 'parent', {
      configurable: true,
      enumerable: true,
      get: parentGet ?? (() => parentValue),
      set: parentSet
    })

    return true
  }
}