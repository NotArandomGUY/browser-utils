import { YTEndpoint, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { YTKevlarMethodDefineCallback } from '@ext/custom/youtube/module/core/bootstrap'
import { defineProperty, values } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Hook, { CallContext, HookResult } from '@ext/lib/intercept/hook'
import { findMethodEntryByRegexp } from '@ext/lib/regexp'

const RESOLVE_COMMAND_REGEXP = /(navigate.*?handleServiceRequest.*?sendAction)|(\(this,[^(]+\)\.handled)/s
const BUILD_COMMAND_PAYLOAD_REGEXP = /function\s*\(\w+,\s*\w+\)\s*\{.*\w+\([\w,]+\s*\w+\)\s*\}/s

export type YTActionHandler = () => void

interface YTCommandResolver {
  buildCommandPayload(command: YTValueData<{ type: YTValueType.ENDPOINT }>, ...args: unknown[]): void
  resolveCommand(command: YTValueData<{ type: YTValueType.ENDPOINT }>, ...args: unknown[]): boolean
}

const IgnoreSignalActionSymbol = Symbol()

const signalActionHandlerMap = new Map<YTEndpoint.enums.SignalActionType, YTActionHandler>()
const commandQueue: Array<YTValueData<{ type: YTValueType.ENDPOINT }>> = []

let instance: YTCommandResolver | null = null

const handleCommand = (ctx: CallContext<unknown, [command: YTValueData<{ type: YTValueType.ENDPOINT }>, ...args: unknown[]], unknown>): HookResult => {
  const signalAction = ctx.args[0]?.signalAction

  if (signalAction != null && !(IgnoreSignalActionSymbol in signalAction)) {
    defineProperty(signalAction, IgnoreSignalActionSymbol, { configurable: true, enumerable: false, value: true })
    signalActionHandlerMap.get(signalAction.signal as YTEndpoint.enums.SignalActionType)?.()
  }

  return HookResult.EXECUTION_PASSTHROUGH
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

export const registerYTSignalActionHandler = (signal: YTEndpoint.enums.SignalActionType, handler: YTActionHandler): () => void => {
  signalActionHandlerMap.set(signal, handler)

  return () => {
    signalActionHandlerMap.delete(signal)
  }
}

export default class YTCoreCommandModule extends Feature {
  public constructor() {
    super('command')
  }

  protected activate(): boolean {
    YTKevlarMethodDefineCallback.registerCallback(kevlar => {
      if (instance != null) return

      values(kevlar).forEach(value => {
        const prototype = typeof value === 'function' ? value.prototype : null
        if (prototype == null) return

        const resolveMethod = prototype.resolveCommand as (...args: Parameters<YTCommandResolver['resolveCommand']>) => void
        if (typeof resolveMethod !== 'function' || !RESOLVE_COMMAND_REGEXP.test(String(resolveMethod))) return

        defineProperty(value, 'instance', {
          configurable: true,
          enumerable: true,
          get() { return instance },
          set(v: YTCommandResolver) {
            instance = v

            const buildMethodEntry = findMethodEntryByRegexp<YTCommandResolver, 'buildCommandPayload'>(instance, BUILD_COMMAND_PAYLOAD_REGEXP)
            if (buildMethodEntry != null) {
              instance[buildMethodEntry[0]] = new Hook(buildMethodEntry[1]).install(handleCommand).call
            }

            while (commandQueue.length > 0) executeYTCommand(commandQueue.shift()!)
          }
        })

        prototype.resolveCommand = new Hook(resolveMethod).install(handleCommand).call
      })
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}