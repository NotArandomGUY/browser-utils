import { assign, defineProperty } from '@ext/global/object'

export const enum HookType {
  PRE,
  MAIN,
  POST
}

export const enum HookResult {
  EXECUTION_IGNORE = 0x01,
  EXECUTION_CONTINUE = 0x02,
  EXECUTION_RETURN = 0x04,
  EXECUTION_THROW = 0x08,
  ACTION_NONE = 0x00,
  ACTION_UNINSTALL = 0x10
}

export type OriginFn<T = unknown, A extends unknown[] = unknown[], R = unknown> = (this: T, ...args: A) => R
export type HookFn<T = unknown, A extends unknown[] = unknown[], R = unknown, U = unknown> = (ctx: CallContext<T, A, R, U>) => HookResult

type HookFnSet<T, A extends unknown[], R, U> = Set<HookFn<T, A, R, U>>

export interface CallContext<T, A extends unknown[], R, U = unknown> {
  origin: OriginFn<T, A, R>
  self: T
  args: A
  returnValue: R
  userData?: U
}

export const BoundTargetSymbol = Symbol()

const activeHookMap = new Map<OriginFn, { [K in HookType]: HookFnSet<any, any[], any, any> }>()

const invokeHooks = <T, A extends unknown[], R, U = unknown>(ctx: CallContext<T, A, R, U>, hooks: HookFnSet<T, A, R, U>, result: HookResult): HookResult => {
  if (hooks.size === 0 || (result & 0x0F) === HookResult.EXECUTION_THROW) return result

  for (const hook of hooks) {
    const hookResult = hook(ctx)
    const resultExecution = hookResult & 0x0F
    const resultAction = hookResult & 0xF0

    if (resultExecution & (HookResult.EXECUTION_CONTINUE | HookResult.EXECUTION_RETURN | HookResult.EXECUTION_THROW)) {
      result = resultExecution
    }

    switch (resultAction) {
      case HookResult.ACTION_NONE:
        break
      case HookResult.ACTION_UNINSTALL:
        hooks.delete(hook)
        break
      default:
        throw new Error('invalid hook action')
    }

    if (result & (HookResult.EXECUTION_RETURN | HookResult.EXECUTION_THROW)) break
  }

  return result
}

export default class Hook<T, A extends unknown[], R, U = unknown> {
  /// Public ///

  public readonly origin!: OriginFn<T, A, R>
  public readonly hooks!: { [K in HookType]: HookFnSet<T, A, R, U> }

  public constructor(origin: OriginFn<T, A, R>, isShared = true) {
    let hooks = isShared ? activeHookMap.get(origin as OriginFn) : null
    if (hooks == null) {
      hooks = { [HookType.PRE]: new Set(), [HookType.MAIN]: new Set(), [HookType.POST]: new Set() }
      if (isShared) activeHookMap.set(origin as OriginFn, hooks)
    }

    const { install, uninstall } = this

    assign(this, {
      origin,
      hooks,
      install: install.bind(this),
      uninstall: uninstall.bind(this),
      call: new Proxy(origin, {
        apply(origin, self: T, args: A) {
          const ctx: CallContext<T, A, R, U> = {
            origin,
            self,
            args,
            returnValue: undefined as R,
            userData: undefined
          }

          let result = invokeHooks(ctx, hooks[HookType.PRE], HookResult.EXECUTION_IGNORE)
          result = invokeHooks(ctx, hooks[HookType.MAIN], result)
          result = invokeHooks(ctx, hooks[HookType.POST], result)

          return result === HookResult.EXECUTION_IGNORE ? origin.apply(ctx.self, ctx.args) : ctx.returnValue
        }
      })
    })
  }

  public install(fn: HookFn<T, A, R, U>, type: HookType = HookType.MAIN): this {
    this.hooks[type].add(fn)
    return this
  }

  public uninstall(fn: HookFn<T, A, R, U>, type: HookType = HookType.MAIN): this {
    this.hooks[type].delete(fn)
    return this
  }

  public call(this: T, ...args: A): R
  public call(): unknown {
    throw new Error('not implemented')
  }
}

if (!activeHookMap.has(Function.prototype.bind as OriginFn)) {
  Function.prototype.bind = new Hook(Function.prototype.bind).install(ctx => { // NOSONAR
    const fn = ctx.origin.apply(ctx.self, ctx.args)
    defineProperty(fn, BoundTargetSymbol, { enumerable: false, value: ctx.self })
    ctx.returnValue = fn
    return HookResult.EXECUTION_CONTINUE
  }).call
}