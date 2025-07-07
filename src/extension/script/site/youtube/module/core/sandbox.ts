import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const { defineProperties, defineProperty } = Object

const logger = new Logger('YTCORE-SANDBOX')

export default class YTCoreSandboxModule extends Feature {
  public constructor() {
    super('core-sandbox')
  }

  protected activate(): boolean {
    const { top } = window
    if (top == null || window === top) return false

    try {
      const { fetch, XMLHttpRequest } = top as Window & typeof globalThis

      defineProperties(window, {
        fetch: {
          configurable: false,
          enumerable: true,
          get() {
            return fetch
          },
          set() {
            logger.debug('ignore override fetch')
          }
        },
        XMLHttpRequest: {
          configurable: false,
          enumerable: false,
          get() {
            return XMLHttpRequest
          },
          set() {
            logger.debug('ignore override xhr')
          }
        }
      })

      const definePropertiesHook = new Hook(defineProperties).install(ctx => {
        const [object, props] = ctx.args
        if (object == null || props == null || typeof props !== 'object') return HookResult.EXECUTION_IGNORE

        for (const prop in props) {
          try {
            const value = object[prop as keyof typeof object]
            if (!defineIgnoreList.includes(value)) continue
          } catch {
            continue
          }

          logger.trace('ignore redefine property:', prop, props[prop])

          return HookResult.EXECUTION_CONTINUE
        }

        return HookResult.EXECUTION_IGNORE
      }).call
      const definePropertyHook = new Hook(defineProperty).install(ctx => {
        const [object, prop, attributes] = ctx.args

        definePropertiesHook(object, { [prop]: attributes })

        return HookResult.EXECUTION_CONTINUE
      }).call

      const defineIgnoreList = [fetch, XMLHttpRequest, definePropertiesHook, definePropertyHook]

      defineProperties(Object, {
        defineProperties: {
          configurable: false,
          enumerable: false,
          get() {
            return definePropertiesHook
          },
          set() {
            logger.debug('ignore override define properties')
          }
        },
        defineProperty: {
          configurable: false,
          enumerable: false,
          get() {
            return definePropertyHook
          },
          set() {
            logger.debug('ignore override define property')
          }
        }
      })

      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') {
        logger.debug('ignore security error:', error)
        return false
      }

      throw error
    }
  }

  protected deactivate(): boolean {
    return false
  }
}