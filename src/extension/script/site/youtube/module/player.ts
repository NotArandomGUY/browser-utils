import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const LOGGER_OVERRIDE_ID = `logovr-${Date.now()}`

function overridePlayerLogger(instance: object): void {
  const proto = Object.getPrototypeOf(instance)

  if (proto[LOGGER_OVERRIDE_ID]) return
  proto[LOGGER_OVERRIDE_ID] = true

  // Override logger methods
  Object.getOwnPropertyNames(proto).forEach(m => {
    if (m === 'constructor') return

    const method = Logger.prototype[m as keyof typeof Logger.prototype] ?? Logger.prototype.debug
    proto[m] = function (...args: unknown[]): void {
      let instance = this.instance
      if (instance == null) {
        instance = new Logger(`YT-PLAYER-<${this.tag ?? 'unknown'}>`, true)
        this.instance = instance
      }
      method.apply(instance, args)
    }
  })
}

export default function initYTPlayerModule(): void {
  // Override player internal logger
  Object.prototype.hasOwnProperty = new Hook(Object.prototype.hasOwnProperty).install(ctx => { // NOSONAR
    if (ctx.self instanceof HTMLDivElement && (ctx.self.id === 'player-api' || ctx.self.classList.contains('ytd-player'))) {
      Function.prototype.call = new Hook(Function.prototype.call).install(ctx => { // NOSONAR
        const target = ctx.args[0]
        const oldKeys = Object.keys(target).length
        ctx.returnValue = ctx.origin.apply(ctx.self, ctx.args)
        const newKeys = Object.keys(target).length

        if (oldKeys === newKeys) return HookResult.EXECUTION_CONTINUE

        Object.defineProperty(target, 'logger', {
          configurable: true,
          set(v) {
            overridePlayerLogger(v)
            Object.defineProperty(target, 'logger', {
              configurable: true,
              writable: true,
              value: v
            })
          },
        })

        Function.prototype.call = ctx.origin // NOSONAR
        return HookResult.ACTION_UNINSTALL | HookResult.EXECUTION_CONTINUE
      }).call
    }

    return HookResult.EXECUTION_IGNORE
  }).call
}