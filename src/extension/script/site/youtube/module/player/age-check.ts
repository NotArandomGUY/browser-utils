import { Feature } from '@ext/lib/feature'
import { YTSignalActionType } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { YTIconType } from '@ext/site/youtube/api/types/icon'
import { getYTConfigInt, registerYTConfigMenuItem, YTConfigMenuItemType } from '@ext/site/youtube/module/core/config'
import { dispatchYTSignalAction, registerYTSignalActionHandler } from '@ext/site/youtube/module/core/event'
import { registerYTInnertubeRequestProcessor } from '@ext/site/youtube/module/core/network'

const AGE_CHECK_KEY = 'age-check'

const playerActionsQueue: NonNullable<YTRendererData<YTRenderer<'playerResponse'>>['actions']>[] = []

const isHideWarning = (): boolean => {
  return getYTConfigInt(AGE_CHECK_KEY, 0) === 1
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
                }
              },
              popupType: 'TOAST'
            }
          },
          nextEndpoint
        ],
        // Trigger age check complete signal
        [
          {
            signalServiceEndpoint: {
              signal: 'CLIENT_SIGNAL',
              actions: [
                { signalAction: { signal: YTSignalActionType.AGE_CHECK_COMPLETE } }
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

export default class YTPlayerAgeCheckModule extends Feature {
  public constructor() {
    super('age-check')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)

    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: AGE_CHECK_KEY,
      disabledIcon: YTIconType.WARNING,
      disabledText: 'Age Check: Default',
      enabledIcon: YTIconType.WARNING,
      enabledText: 'Age Check: Hide',
      defaultValue: false,
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE]
    })

    registerYTInnertubeRequestProcessor('player', request => {
      if (!isHideWarning()) return

      request.contentCheckOk = true
      request.racyCheckOk = true
    })

    registerYTSignalActionHandler(YTSignalActionType.AGE_CHECK_COMPLETE, () => {
      // TODO: improve reliability by hooking into player internal events
      setTimeout(() => dispatchYTSignalAction(YTSignalActionType.PLAY_PLAYER), 1e3)
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}