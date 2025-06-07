import Logger from '@ext/lib/logger'
import { YTEndpoint, YTSignalActionType } from '@ext/site/youtube/api/endpoint'
import { YTEndpointData } from '@ext/site/youtube/api/types/common'

const logger = new Logger('YT-ACTION')

export type YTActionHandler = (event: YTActionEvent) => void

export interface YTActionEvent {
  actionName: string
  optionalAction?: boolean
  args?: unknown[]
  returnValue?: unknown[]
}

let app: Element | null = null

const actionHandlerMap: Record<string, YTActionHandler> = {}

function getSignalActionName(signal: YTSignalActionType): string {
  return `yt-signal-action-${signal.toLowerCase().replace(/_/g, '-')}`
}

export function dispatchYTAction(action: YTActionEvent): void {
  app?.dispatchEvent(new CustomEvent<YTActionEvent>('yt-action', { detail: action }))
}

export function dispatchYTOpenPopupAction(data: YTEndpointData<YTEndpoint<'openPopupAction'>>): void {
  dispatchYTAction({
    actionName: 'yt-open-popup-action',
    args: [{ openPopupAction: data }, app],
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

export default function initYTActionModule(): void {
  window.addEventListener('load', () => {
    app = document.querySelector('ytd-app,yt-live-chat-app')
    if (app == null) {
      logger.warn('failed to obtain app instance')
      return
    }

    app.addEventListener('yt-action', event => {
      const { detail } = event as CustomEvent<YTActionEvent>
      actionHandlerMap[detail.actionName]?.(detail)
    })
  })
}