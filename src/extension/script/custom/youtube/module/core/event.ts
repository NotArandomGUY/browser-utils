import { YTEndpoint, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { getYTAppElement } from '@ext/custom/youtube/module/core/bootstrap'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'

export type YTActionHandler = (event: YTActionEvent) => void

export interface YTActionEvent {
  actionName: string
  optionalAction?: boolean
  args?: unknown[]
  returnValue?: unknown[]
}

const actionHandlerMap: Record<string, YTActionHandler> = {}
const actionEventQueue: YTActionEvent[] = []
const navigateEventQueue: YTValueData<{ type: YTValueType.ENDPOINT }>[] = []

let resolveCommandProto: ((this: object, data: YTValueData<{ type: YTValueType.ENDPOINT }>) => void) | null = null
let resolveCommand: ((data: YTValueData<{ type: YTValueType.ENDPOINT }>) => void) | null = null

const getFunctionProp = <T extends object, K extends keyof T>(obj: T, key: K): T[K] extends Function ? T[K] : null => {
  const value = obj?.[key]

  return (typeof value === 'function' ? value : null) as ReturnType<typeof getFunctionProp>
}

const getSignalActionName = (signal: YTEndpoint.enums.SignalActionType): string => {
  return `yt-signal-action-${signal.toLowerCase().replace(/_/g, '-')}`
}

export const dispatchYTAction = (action: YTActionEvent): void => {
  const appElement = getYTAppElement()
  if (appElement == null) {
    actionEventQueue.push(action)
    return
  }

  appElement.dispatchEvent(new CustomEvent('yt-action', { detail: action }))
}

export const dispatchYTNavigate = (endpoint: YTValueData<{ type: YTValueType.ENDPOINT }>): void => {
  if (resolveCommand != null) return resolveCommand(endpoint)

  const appElement = getYTAppElement()
  if (appElement == null) {
    navigateEventQueue.push(endpoint)
    return
  }

  appElement.dispatchEvent(new CustomEvent('yt-navigate', { detail: { endpoint } }))
}

export const dispatchYTOpenPopupAction = (data: YTValueData<YTEndpoint.Mapped<'openPopupAction'>>): void => {
  if (resolveCommand != null) return resolveCommand({ openPopupAction: data })

  dispatchYTAction({
    actionName: 'yt-open-popup-action',
    args: [{ openPopupAction: data }, getYTAppElement()],
    returnValue: []
  })
}

export const dispatchYTSignalAction = (signal: YTEndpoint.enums.SignalActionType): void => {
  if (resolveCommand != null) return resolveCommand({ signalServiceEndpoint: { signal: 'CLIENT_SIGNAL', actions: [{ signalAction: { signal } }] } })

  dispatchYTAction({ actionName: getSignalActionName(signal), optionalAction: true, args: [], returnValue: [] })
}

export const registerYTActionHandler = (actionName: string, handler: YTActionHandler): void => {
  actionHandlerMap[actionName] = handler
}

export const registerYTSignalActionHandler = (signal: YTEndpoint.enums.SignalActionType, handler: YTActionHandler): void => {
  registerYTActionHandler(getSignalActionName(signal), handler)
}

export default class YTCoreEventModule extends Feature {
  public constructor() {
    super('event')
  }

  protected activate(): boolean {
    addEventListener('load', () => {
      const yttv = window._yttv
      if (yttv != null) {
        for (const key in yttv) {
          const proto = getFunctionProp(yttv, key)?.prototype
          if (proto == null || !('resolveCommand' in proto)) continue

          resolveCommandProto = getFunctionProp(proto, 'resolveCommand') as typeof resolveCommandProto
          if (resolveCommandProto == null) continue

          proto.resolveCommand = new Hook(resolveCommandProto).install(ctx => {
            const { self, args: [command] } = ctx

            if (resolveCommand == null && resolveCommandProto != null) {
              resolveCommand = resolveCommandProto.bind(self)
            }

            const signal = command?.signalAction?.signal
            if (signal != null) {
              const actionName = getSignalActionName(signal as YTEndpoint.enums.SignalActionType)
              actionHandlerMap[actionName]?.({ actionName })
            }

            return HookResult.EXECUTION_PASSTHROUGH
          }).call
          break
        }
      }

      const appElement = getYTAppElement()
      if (appElement == null) return

      appElement.addEventListener('yt-action', event => {
        const { detail } = event as CustomEvent<YTActionEvent>
        actionHandlerMap[detail.actionName]?.(detail)
      })

      while (true) {
        const action = actionEventQueue.shift()
        if (action == null) break

        dispatchYTAction(action)
      }

      while (true) {
        const endpoint = navigateEventQueue.shift()
        if (endpoint == null) break

        dispatchYTNavigate(endpoint)
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}