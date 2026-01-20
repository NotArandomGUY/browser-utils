import { YTEndpoint, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { defineProperties, defineProperty, fromEntries, values } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'

const RESOLVE_COMMAND_REGEXP = /navigate.*?handleServiceRequest.*?sendAction/s

export type YTActionHandler = () => void

interface YTCommandResolver {
  resolveCommand(data: YTValueData<{ type: YTValueType.ENDPOINT }>): void
}

const signalActionHandlerMap = new Map<YTEndpoint.enums.SignalActionType, YTActionHandler>()
const commandQueue: Array<YTValueData<{ type: YTValueType.ENDPOINT }>> = []

let global: object | undefined = undefined
let instance: YTCommandResolver | null = null

const onCreateGlobalObject = (global: object): object => {
  return new Proxy(global, {
    set(target, p, newValue, receiver) {
      if (instance == null) {
        values(target).forEach(value => {
          const prototype = typeof value === 'function' ? value.prototype : null
          if (prototype == null) return

          const method = prototype.resolveCommand as (this: object, ...args: Parameters<YTCommandResolver['resolveCommand']>) => void
          if (typeof method !== 'function' || !RESOLVE_COMMAND_REGEXP.test(String(method))) return

          defineProperty(value, 'instance', {
            configurable: true,
            enumerable: true,
            get() { return instance },
            set(v) {
              instance = v
              while (commandQueue.length > 0) executeYTCommand(commandQueue.shift()!)
            }
          })

          prototype.resolveCommand = new Hook(method).install(ctx => {
            const { args: [command] } = ctx

            const signal = command?.signalAction?.signal
            if (signal != null) signalActionHandlerMap.get(signal as YTEndpoint.enums.SignalActionType)?.()

            return HookResult.EXECUTION_PASSTHROUGH
          }).call
        })
      }
      return Reflect.set(target, p, newValue, receiver)
    }
  })
}

export const executeYTCommand = (command: YTValueData<{ type: YTValueType.ENDPOINT }>): void => {
  if (instance == null) {
    commandQueue.push(command)
    return
  }

  instance.resolveCommand(command)
}

export const dispatchYTSignalAction = (signal: YTEndpoint.enums.SignalActionType): void => {
  executeYTCommand({ signalServiceEndpoint: { signal: 'CLIENT_SIGNAL', actions: [{ signalAction: { signal } }] } })
}

export const registerYTSignalActionHandler = (signal: YTEndpoint.enums.SignalActionType, handler: YTActionHandler): void => {
  signalActionHandlerMap.set(signal, handler)
}

export default class YTCoreCommandModule extends Feature {
  public constructor() {
    super('command')
  }

  protected activate(): boolean {
    defineProperties(window, fromEntries(['default_kevlar_base', '_yttv'].map(key => [key, {
      configurable: true,
      enumerable: true,
      get() { return global },
      set(v) { global = onCreateGlobalObject(v) }
    }])))

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}