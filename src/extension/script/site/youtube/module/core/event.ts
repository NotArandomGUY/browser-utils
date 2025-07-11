import { Feature } from '@ext/lib/feature'
import { YTEndpoint, YTSignalActionType } from '@ext/site/youtube/api/endpoint'
import { YTEndpointData, YTValueData, YTValueType } from '@ext/site/youtube/api/types/common'
import { getYTAppElement } from '@ext/site/youtube/module/core/bootstrap'

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

function getSignalActionName(signal: YTSignalActionType): string {
  return `yt-signal-action-${signal.toLowerCase().replace(/_/g, '-')}`
}

export function dispatchYTAction(action: YTActionEvent): void {
  const appElement = getYTAppElement()
  if (appElement == null) {
    actionEventQueue.push(action)
    return
  }

  appElement.dispatchEvent(new CustomEvent('yt-action', { detail: action }))
}

export function dispatchYTNavigate(endpoint: YTValueData<{ type: YTValueType.ENDPOINT }>): void {
  const appElement = getYTAppElement()
  if (appElement == null) {
    navigateEventQueue.push(endpoint)
    return
  }

  appElement.dispatchEvent(new CustomEvent('yt-navigate', { detail: { endpoint } }))
}

export function dispatchYTOpenPopupAction(data: YTEndpointData<YTEndpoint<'openPopupAction'>>): void {
  dispatchYTAction({
    actionName: 'yt-open-popup-action',
    args: [{ openPopupAction: data }, getYTAppElement()],
    returnValue: []
  })
}

export function dispatchYTSignalAction(signal: YTSignalActionType): void {
  dispatchYTAction({ actionName: getSignalActionName(signal), optionalAction: true, args: [], returnValue: [] })
}

export function registerYTActionHandler(actionName: string, handler: YTActionHandler): void {
  actionHandlerMap[actionName] = handler
}

export function registerYTSignalActionHandler(signal: YTSignalActionType, handler: YTActionHandler): void {
  registerYTActionHandler(getSignalActionName(signal), handler)
}

export default class YTCoreEventModule extends Feature {
  public constructor() {
    super('core-event')
  }

  protected activate(): boolean {
    window.addEventListener('load', () => {
      const appElement = getYTAppElement()
      if (appElement == null) return

      appElement.addEventListener('yt-action', event => {
        getYTAppElement()
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