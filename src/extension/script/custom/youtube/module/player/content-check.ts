import { YTSignalActionType } from '@ext/custom/youtube/api/endpoint'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { YTIconType } from '@ext/custom/youtube/api/types/icon'
import { getYTConfigBool, registerYTConfigMenuItem, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { dispatchYTSignalAction, registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/event'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { Feature } from '@ext/lib/feature'

const CONTENT_CHECK_KEY = 'content-check'

const playerActionsQueue: NonNullable<YTRendererData<YTRenderer<'playerResponse'>>['actions']>[] = []

const isHideContentCheck = (): boolean => {
  return getYTConfigBool(CONTENT_CHECK_KEY, false)
}

const updatePlayerResponse = (data: YTRendererData<YTRenderer<'playerResponse'>>): boolean => {
  const { errorScreen, status } = data.playabilityStatus ?? {}

  switch (status) {
    case 'AGE_CHECK_REQUIRED':
    case 'CONTENT_CHECK_REQUIRED': {
      const playerErrorMessageRenderer = errorScreen?.playerErrorMessageRenderer
      if (playerErrorMessageRenderer == null) break

      let nextEndpoint = playerErrorMessageRenderer.proceedButton?.buttonRenderer?.serviceEndpoint
      if (nextEndpoint == null) break

      // Apparently you can skip verify age endpoint?
      nextEndpoint = nextEndpoint.verifyAgeEndpoint?.nextEndpoint ?? nextEndpoint

      playerActionsQueue.push(
        // Show popup & navigate to next endpoint
        [
          {
            openPopupAction: {
              durationHintMs: 5e3,
              popup: {
                notificationActionRenderer: {
                  responseText: playerErrorMessageRenderer.reason ?? { simpleText: status }
                },
                overlayToastRenderer: {
                  title: playerErrorMessageRenderer.reason ?? { simpleText: status }
                }
              },
              popupType: 'TOAST'
            }
          },
          nextEndpoint
        ],
        // Trigger content check complete signal
        [
          {
            signalServiceEndpoint: {
              signal: 'CLIENT_SIGNAL',
              actions: [
                { signalAction: { signal: YTSignalActionType.CONTENT_CHECK_COMPLETE } }
              ]
            }
          }
        ]
      )
      break
    }
  }

  const playerActions = playerActionsQueue.shift()
  if (playerActions != null) {
    data.actions ??= []
    data.actions.push(...playerActions)
  }

  return true
}

export default class YTPlayerContentCheckModule extends Feature {
  public constructor() {
    super('content-check')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)

    registerYTInnertubeRequestProcessor('player', request => {
      if (!isHideContentCheck()) return

      request.contentCheckOk = true
      request.racyCheckOk = true
    })

    registerYTSignalActionHandler(YTSignalActionType.CONTENT_CHECK_COMPLETE, () => {
      // TODO: improve reliability by hooking into player internal events
      setTimeout(() => dispatchYTSignalAction(YTSignalActionType.PLAY_PLAYER), 1e3)
    })

    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: CONTENT_CHECK_KEY,
      disabledIcon: YTIconType.WARNING,
      disabledText: 'Content Check: Default',
      enabledIcon: YTIconType.WARNING,
      enabledText: 'Content Check: Hide',
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE]
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}