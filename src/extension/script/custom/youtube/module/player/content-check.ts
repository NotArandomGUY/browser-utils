import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { dispatchYTSignalAction, registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/command'
import { getYTConfigBool, registerYTConfigMenuItemGroup, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { Feature } from '@ext/lib/feature'

const CONTENT_CHECK_KEY = 'content-check'

const playerActionsQueue: NonNullable<YTValueData<YTResponse.Mapped<'player'>>['actions']>[] = []

const isHideContentCheck = (): boolean => {
  return getYTConfigBool(CONTENT_CHECK_KEY, false)
}

const updatePlayerResponse = (data: YTValueData<YTResponse.Mapped<'player'>>): void => {
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
                { signalAction: { signal: YTEndpoint.enums.SignalActionType.CONTENT_CHECK_COMPLETE } }
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
}

export default class YTPlayerContentCheckModule extends Feature {
  public constructor() {
    super('content-check')
  }

  protected activate(): boolean {
    registerYTValueProcessor(YTResponse.mapped.player, updatePlayerResponse)

    registerYTInnertubeRequestProcessor('player', request => {
      if (!isHideContentCheck()) return

      request.contentCheckOk = true
      request.racyCheckOk = true
    })

    registerYTSignalActionHandler(YTEndpoint.enums.SignalActionType.CONTENT_CHECK_COMPLETE, () => {
      // TODO: improve reliability by hooking into player internal events
      setTimeout(() => dispatchYTSignalAction(YTEndpoint.enums.SignalActionType.PLAY_PLAYER), 1e3)
    })

    registerYTConfigMenuItemGroup('general', [
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: CONTENT_CHECK_KEY,
        icon: YTRenderer.enums.IconType.WARNING,
        text: 'Hide Content Check',
        description: 'Hide basic age/content checks, usually only works when signed in'
      }
    ])

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}