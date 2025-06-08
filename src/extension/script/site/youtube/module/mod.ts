import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { YTSignalActionType } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { YTIconType } from '@ext/site/youtube/api/types/icon'
import { YTSizeType } from '@ext/site/youtube/api/types/size'
import { dispatchYTSignalAction, registerYTSignalActionHandler } from '@ext/site/youtube/module/action'
import { isYTLoggedIn } from '@ext/site/youtube/module/bootstrap'

const logger = new Logger('YT-MOD')

interface YTIFrameMessage {
  'yt-live-chat-buy-flow-callback'?: unknown
  'yt-live-chat-close-buy-flow'?: true
  'yt-live-chat-forward-redux-action'?: unknown
  'yt-live-chat-set-dark-theme'?: unknown
  'yt-player-ad-start'?: string
  'yt-player-ad-end'?: true
  'yt-player-state-change'?: number
  'yt-player-video-progress'?: number
}

const playerActionsQueue: NonNullable<YTRendererData<YTRenderer<'playerResponse'>>['actions']>[] = []

let isShowShorts = true
let isShowLive = true
let isShowVideo = true

function processPlayerResponse(data: YTRendererData<YTRenderer<'playerResponse'>>): boolean {
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
        // Trigger delayed play player signal
        [
          {
            signalServiceEndpoint: {
              signal: 'CLIENT_SIGNAL',
              actions: [
                { signalAction: { signal: YTSignalActionType.BU_MOD_DELAYED_PLAY_PLAYER } }
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

function setDesktopTopbarRendererContent(data: YTRendererData<YTRenderer<'desktopTopbarRenderer'>>): boolean {
  data.topbarButtons ??= []
  data.topbarButtons.unshift({
    buttonRenderer: {
      style: 'STYLE_DEFAULT',
      size: YTSizeType.SIZE_DEFAULT,
      icon: { iconType: YTIconType.TROPHY_STAR },
      accessibility: { label: 'BU Menu' },
      accessibilityData: { accessibilityData: { label: 'BU Menu' } },
      tooltip: 'BU Menu',
      isDisabled: false,
      command: {
        openPopupAction: {
          popup: {
            menuPopupRenderer: {
              items: [
                {
                  menuServiceItemRenderer: {
                    icon: { iconType: YTIconType.REFRESH },
                    text: { simpleText: 'Full reload' },
                    serviceEndpoint: {
                      signalServiceEndpoint: {
                        signal: 'CLIENT_SIGNAL',
                        actions: [
                          { signalAction: { signal: YTSignalActionType.RELOAD_PAGE } }
                        ]
                      }
                    }
                  }
                },
                {
                  menuServiceItemRenderer: {
                    icon: { iconType: YTIconType.REFRESH },
                    text: { simpleText: 'Soft reload' },
                    serviceEndpoint: {
                      signalServiceEndpoint: {
                        signal: 'CLIENT_SIGNAL',
                        actions: [
                          { signalAction: { signal: YTSignalActionType.SOFT_RELOAD_PAGE } }
                        ]
                      }
                    }
                  }
                },
                {
                  toggleMenuServiceItemRenderer: {
                    defaultIcon: { iconType: YTIconType.YOUTUBE_SHORTS_BRAND_24 },
                    defaultText: { simpleText: 'Show Shorts' },
                    defaultServiceEndpoint: {
                      signalServiceEndpoint: {
                        signal: 'CLIENT_SIGNAL',
                        actions: [
                          { signalAction: { signal: YTSignalActionType.BU_MOD_SHORTS_SHOW } },
                          { signalAction: { signal: YTSignalActionType.RELOAD_PAGE } }
                        ]
                      }
                    },
                    toggledIcon: { iconType: YTIconType.YOUTUBE_SHORTS_BRAND_24 },
                    toggledText: { simpleText: 'Hide Shorts' },
                    toggledServiceEndpoint: {
                      signalServiceEndpoint: {
                        signal: 'CLIENT_SIGNAL',
                        actions: [
                          { signalAction: { signal: YTSignalActionType.BU_MOD_SHORTS_HIDE } },
                          { signalAction: { signal: YTSignalActionType.RELOAD_PAGE } }
                        ]
                      }
                    },
                    isToggled: isShowShorts
                  }
                },
                {
                  toggleMenuServiceItemRenderer: {
                    defaultIcon: { iconType: YTIconType.LIVE },
                    defaultText: { simpleText: 'Show Live' },
                    defaultServiceEndpoint: {
                      signalServiceEndpoint: {
                        signal: 'CLIENT_SIGNAL',
                        actions: [
                          { signalAction: { signal: YTSignalActionType.BU_MOD_LIVE_SHOW } },
                          { signalAction: { signal: YTSignalActionType.SOFT_RELOAD_PAGE } }
                        ]
                      }
                    },
                    toggledIcon: { iconType: YTIconType.LIVE },
                    toggledText: { simpleText: 'Hide Live' },
                    toggledServiceEndpoint: {
                      signalServiceEndpoint: {
                        signal: 'CLIENT_SIGNAL',
                        actions: [
                          { signalAction: { signal: YTSignalActionType.BU_MOD_LIVE_HIDE } },
                          { signalAction: { signal: YTSignalActionType.SOFT_RELOAD_PAGE } }
                        ]
                      }
                    },
                    isToggled: isShowLive
                  }
                },
                {
                  toggleMenuServiceItemRenderer: {
                    defaultIcon: { iconType: YTIconType.VIDEOS },
                    defaultText: { simpleText: 'Show Video' },
                    defaultServiceEndpoint: {
                      signalServiceEndpoint: {
                        signal: 'CLIENT_SIGNAL',
                        actions: [
                          { signalAction: { signal: YTSignalActionType.BU_MOD_VIDEO_SHOW } },
                          { signalAction: { signal: YTSignalActionType.SOFT_RELOAD_PAGE } }
                        ]
                      }
                    },
                    toggledIcon: { iconType: YTIconType.VIDEOS },
                    toggledText: { simpleText: 'Hide Video !!Dangerous!!' },
                    toggledServiceEndpoint: {
                      signalServiceEndpoint: {
                        signal: 'CLIENT_SIGNAL',
                        actions: [
                          { signalAction: { signal: YTSignalActionType.BU_MOD_VIDEO_HIDE } },
                          { signalAction: { signal: YTSignalActionType.SOFT_RELOAD_PAGE } }
                        ]
                      }
                    },
                    isToggled: isShowVideo
                  }
                }
              ]
            }
          },
          popupType: 'RESPONSIVE_DROPDOWN'
        }
      }
    }
  })

  return true
}

function setVideoPrimaryInfoRendererContent(data: YTRendererData<YTRenderer<'videoPrimaryInfoRenderer'>>): boolean {
  data.videoActions?.menuRenderer?.items?.push({
    menuServiceItemRenderer: {
      icon: {
        iconType: YTIconType.BUG_REPORT
      },
      serviceEndpoint: {
        signalServiceEndpoint: {
          signal: 'CLIENT_SIGNAL',
          actions: [
            { signalAction: { signal: YTSignalActionType.COPY_DEBUG_DATA } },
            {
              openPopupAction: {
                popup: {
                  notificationActionRenderer: {
                    responseText: { simpleText: 'Debug data copied to clipboard' }
                  }
                },
                popupType: 'TOAST'
              }
            }
          ]
        }
      },
      text: { runs: [{ text: 'Copy Debug Data' }] }
    }
  })

  return true
}

function setFeedNudgeRendererContent(data: YTRendererData<YTRenderer<'feedNudgeRenderer'>>): boolean {
  data.title = { simpleText: 'Oh hi!' }
  data.subtitle = {
    runs: [
      { text: 'Home feed has been disabled~\n' },
      { text: 'Sign in to use it!\n' },
      { text: 'P.S. let me know if it suddenly works, it should not' }
    ]
  }

  return true
}

function updateNextResponse(data: YTRendererData<YTRenderer<'nextResponse'>>): boolean {
  delete data.survey

  return true
}

function updateChannelRenderer(data: YTRendererData<YTRenderer<'channelRenderer' | 'gridChannelRenderer'>>): boolean {
  if (!isYTLoggedIn()) delete data.subscribeButton

  return true
}

function updateEmojiPickerRenderer(data: YTRendererData<YTRenderer<'emojiPickerRenderer'>>): boolean {
  // Replace upsell categories with noraml categories
  data.categories?.forEach(c => {
    if (c.emojiPickerUpsellCategoryRenderer == null) return

    const { categoryId, emojiIds, title } = c.emojiPickerUpsellCategoryRenderer

    c.emojiPickerCategoryRenderer = {
      categoryId,
      emojiIds,
      title
    }
    delete c.emojiPickerUpsellCategoryRenderer
  })

  return true
}

function updateVideoOwnerRenderer(data: YTRendererData<YTRenderer<'videoOwnerRenderer'>>): boolean {
  if (!isYTLoggedIn()) delete data.membershipButton

  return true
}

function updatePageHeaderViewModel(data: YTRendererData<YTRenderer<'pageHeaderViewModel'>>): boolean {
  if (!isYTLoggedIn()) delete data.actions

  return true
}

function filterGuideEntry(data: YTRendererData<YTRenderer<'guideEntryRenderer'>>): boolean {
  const browseId = data.navigationEndpoint?.browseEndpoint?.browseId ?? ''

  // Remove promotion
  if (browseId === 'SPunlimited' || data.navigationEndpoint?.urlEndpoint != null) return false

  // Remove shorts
  if (!isShowShorts && data.serviceEndpoint?.reelWatchEndpoint != null) return false

  // Items for logged in users only
  return isYTLoggedIn() || !['FEhistory', 'FElibrary', 'FEsubscriptions', 'SPaccount_overview', 'SPreport_history'].includes(browseId)
}

function filterMenuFlexibleItem(data: YTRendererData<YTRenderer<'menuFlexibleItemRenderer'>>): boolean {
  return isYTLoggedIn() || !['PLAYLIST_ADD'].includes(data.menuItem?.menuServiceItemRenderer?.icon?.iconType ?? '')
}

function filterShelf(data: YTRendererData<YTRenderer<'reelShelfRenderer' | 'richShelfRenderer'>>): boolean {
  return isShowShorts || !data.icon?.iconType?.includes('SHORTS')
}

function filterShorts(): boolean {
  return isShowShorts
}

function filterVideo(data: YTRendererData<YTRenderer<'compactVideoRenderer' | 'videoRenderer'>>): boolean {
  if (!isShowShorts && data.navigationEndpoint?.reelWatchEndpoint != null) return false

  const isLive = data.badges?.map(b => b.metadataBadgeRenderer?.icon?.iconType).find(b => b?.includes('LIVE')) != null
  if (!isShowLive && isLive) return false
  if (!isShowVideo && !isLive) return false

  return true
}

function postToLiveChatWindow(message: YTIFrameMessage): void {
  window.postMessage(message)
}

export default class YTModModule extends Feature {
  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], processPlayerResponse)

    registerYTRendererPreProcessor(YTRendererSchemaMap['desktopTopbarRenderer'], setDesktopTopbarRendererContent)
    registerYTRendererPreProcessor(YTRendererSchemaMap['feedNudgeRenderer'], setFeedNudgeRendererContent)
    registerYTRendererPreProcessor(YTRendererSchemaMap['videoPrimaryInfoRenderer'], setVideoPrimaryInfoRendererContent)

    registerYTRendererPreProcessor(YTRendererSchemaMap['nextResponse'], updateNextResponse)
    registerYTRendererPreProcessor(YTRendererSchemaMap['channelRenderer'], updateChannelRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['emojiPickerRenderer'], updateEmojiPickerRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['gridChannelRenderer'], updateChannelRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['pageHeaderViewModel'], updatePageHeaderViewModel)
    registerYTRendererPreProcessor(YTRendererSchemaMap['videoOwnerRenderer'], updateVideoOwnerRenderer)

    removeYTRendererPre(YTRendererSchemaMap['commentSimpleboxRenderer'], isYTLoggedIn)
    removeYTRendererPre(YTRendererSchemaMap['compactVideoRenderer'], filterVideo)
    removeYTRendererPre(YTRendererSchemaMap['guideEntryRenderer'], filterGuideEntry)
    removeYTRendererPre(YTRendererSchemaMap['guideSigninPromoRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['menuFlexibleItemRenderer'], filterMenuFlexibleItem)
    removeYTRendererPre(YTRendererSchemaMap['merchandiseShelfRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['productListHeaderRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['productListItemRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['reelShelfRenderer'], filterShelf)
    removeYTRendererPre(YTRendererSchemaMap['richShelfRenderer'], filterShelf)
    removeYTRendererPre(YTRendererSchemaMap['segmentedLikeDislikeButtonViewModel'], isYTLoggedIn)
    removeYTRendererPre(YTRendererSchemaMap['shortsLockupViewModel'], filterShorts)
    removeYTRendererPre(YTRendererSchemaMap['subscribeButtonRenderer'], isYTLoggedIn)
    removeYTRendererPre(YTRendererSchemaMap['videoRenderer'], filterVideo)

    isShowShorts = Number(localStorage.getItem('bu-show-shorts') ?? 1) !== 0
    isShowLive = Number(localStorage.getItem('bu-show-live') ?? 1) !== 0
    isShowVideo = Number(localStorage.getItem('bu-show-video') ?? 1) !== 0

    registerYTSignalActionHandler(YTSignalActionType.BU_MOD_DELAYED_PLAY_PLAYER, () => {
      // TODO: improve reliability by hooking into player internal events
      setTimeout(() => dispatchYTSignalAction(YTSignalActionType.PLAY_PLAYER), 1e3)
    })
    registerYTSignalActionHandler(YTSignalActionType.BU_MOD_SHORTS_HIDE, () => {
      isShowShorts = false
      localStorage.setItem('bu-show-shorts', '0')
    })
    registerYTSignalActionHandler(YTSignalActionType.BU_MOD_SHORTS_SHOW, () => {
      isShowShorts = true
      localStorage.setItem('bu-show-shorts', '1')
    })
    registerYTSignalActionHandler(YTSignalActionType.BU_MOD_LIVE_HIDE, () => {
      isShowLive = false
      localStorage.setItem('bu-show-live', '0')
    })
    registerYTSignalActionHandler(YTSignalActionType.BU_MOD_LIVE_SHOW, () => {
      isShowLive = true
      localStorage.setItem('bu-show-live', '1')
    })
    registerYTSignalActionHandler(YTSignalActionType.BU_MOD_VIDEO_HIDE, () => {
      isShowVideo = false
      localStorage.setItem('bu-show-video', '0')
    })
    registerYTSignalActionHandler(YTSignalActionType.BU_MOD_VIDEO_SHOW, () => {
      isShowVideo = true
      localStorage.setItem('bu-show-video', '1')
    })

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]

      if (node instanceof HTMLDivElement && node.classList.contains('ytp-pause-overlay')) {
        logger.debug('removed ytp-pause-overlay', node)
        return HookResult.EXECUTION_CONTINUE
      }

      return HookResult.EXECUTION_IGNORE
    })

    window.addEventListener('load', () => {
      if (location.pathname === '/live_chat_replay') {
        // Fire initial progress event to load chat immediately
        postToLiveChatWindow({ 'yt-player-video-progress': 0 })
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}