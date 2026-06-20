import { ytv_enp, ytv_ren } from '../define/extended'
import { ytv_arr, ytv_bol, ytv_num, ytv_sto, ytv_str, ytv_unk } from '../define/primitive'

import * as common from '../common'
import * as renderer from '../renderer'
import * as components from './components'
import * as enums from './enums'

// Outer
export const commandMetadata = ytv_sto({
  interactionLoggingCommandMetadata: components.interactionLoggingCommandMetadata,
  resolveUrlCommandMetadata: components.resolveUrlCommandMetadata,
  webCommandMetadata: components.webCommandMetadata
})
export const loggingUrls = ytv_arr(common.components.url)

// Action
export const addChatItemAction = ytv_enp(() => ({
  clientId: ytv_str(),
  item: ytv_ren(),
  stickinessParams: ytv_sto({
    dockAtTopDurationMs: ytv_num()
  })
}))
export const addLiveChatTextMessageFromTemplateAction = ytv_enp(() => ({
  template: ytv_ren()
}))
export const addLiveChatTickerItemAction = ytv_enp(() => ({
  durationSec: ytv_str(),
  item: ytv_ren()
}))
export const addToToastAction = ytv_enp(() => ({
  item: ytv_ren()
}))
export const appendContinuationItemsAction = ytv_enp(() => ({
  continuationItems: ytv_arr(ytv_ren()),
  targetId: ytv_str()
}))
export const changeEngagementPanelVisibilityAction = ytv_enp(() => ({
  targetId: ytv_str(),
  visibility: ytv_str(renderer.enums.EngagementPanelVisibility)
}))
export const getMultiPageMenuAction = ytv_enp(() => ({
  menu: ytv_ren()
}))
export const hideEnclosingAction = ytv_enp(() => ({
  notificationId: ytv_str()
}))
export const hideEngagementPanelScrimAction = ytv_enp(() => ({
  engagementPanelTargetId: ytv_str()
}))
export const openClientOverlayAction = ytv_enp(() => ({
  context: ytv_str(),
  type: ytv_str(['CLIENT_OVERLAY_TYPE_ADD_TO_PLAYLIST', 'CLIENT_OVERLAY_TYPE_AUDIO_OPTIONS', 'CLIENT_OVERLAY_TYPE_PLAYBACK_SETTINGS', 'CLIENT_OVERLAY_TYPE_SEND_FEEDBACK_SECONDARY', 'CLIENT_OVERLAY_TYPE_VIDEO_PLAYBACK_SPEED', 'CLIENT_OVERLAY_TYPE_VIDEO_QUALITY', 'CLIENT_OVERLAY_TYPE_VIDEO_REPORTING'])
}))
export const openPopupAction = ytv_enp(() => ({
  accessibilityData: common.components.accessibility,
  beReused: ytv_bol(),
  durationHintMs: ytv_num(),
  popup: ytv_ren(),
  popupType: ytv_str(['DIALOG', 'DROPDOWN', 'FULLSCREEN_OVERLAY', 'HINT', 'LOCKED_MODAL', 'MODAL', 'NOTIFICATION', 'RESPONSIVE_DROPDOWN', 'SURVEY', 'TOP_ALIGNED_DIALOG', 'TOAST']),
  replacePopup: ytv_bol(),
  uniqueId: ytv_str()
}))
export const removeChatItemAction = ytv_enp(() => ({
  targetItemId: ytv_str()
}))
export const replaceEnclosingAction = ytv_enp(() => ({
  groupDismissal: ytv_sto({
    behavior: ytv_str(['GROUP_DISMISSAL_BEHAVIOR_REMOVE_SUBSEQUENT_ITEMS']),
    targetGroupId: ytv_str()
  }),
  item: ytv_ren(),
  replaceParentSection: ytv_bol(),
  targetId: ytv_str()
}))
export const replayChatItemAction = ytv_enp(() => ({
  actions: ytv_arr(ytv_enp()),
  videoOffsetTimeMsec: ytv_str()
}))
export const sendFeedbackAction = ytv_enp(() => ({
  bucket: ytv_str()
}))
export const setActivePanelItemAction = ytv_enp(() => ({
  itemIndex: ytv_num(),
  panelTargetId: ytv_str()
}))
export const setLiveChatCollapsedStateAction = ytv_enp(() => ({
  collapsed: ytv_bol()
}))
export const showEngagementPanelScrimAction = ytv_enp(() => ({
  engagementPanelTargetId: ytv_str(),
  onClickCommands: ytv_arr(ytv_enp())
}))
export const showLiveChatChannelGuidelinesDialogAction = ytv_enp(() => ({
  dialog: ytv_ren()
}))
export const signalAction = ytv_enp(() => ({
  signal: ytv_str(enums.SignalActionType),
  targetId: ytv_str()
}))
export const undoFeedbackAction = ytv_enp(() => ({
  hack: ytv_bol(),
  targetId: ytv_str()
}))
export const updateBackstagePollAction = ytv_enp(() => ({
  commentId: ytv_str(),
  selectedChoiceIndex: ytv_num(),
  totalVotes: renderer.components.text,
  updatedPollStatus: ytv_str(common.enums.CommentPollStatus)
}))
export const updateCommentVoteAction = ytv_enp(() => ({
  postId: ytv_str(),
  voteCount: renderer.components.text,
  voteStatus: ytv_str(common.enums.LikeStatus)
}))
export const updateDateTextAction = ytv_enp(() => ({
  dateText: renderer.components.text
}))
export const updateDescriptionAction = ytv_enp(() => ({
  description: renderer.components.text
}))
export const updateLiveChatPollAction = ytv_enp(() => ({
  pollToUpdate: ytv_ren()
}))
export const updateNotificationsUnseenCountAction = ytv_enp(() => ({
  handlerData: ytv_str(),
  timeoutMs: ytv_num(),
  unseenCount: ytv_num()
}))
export const updateTitleAction = ytv_enp(() => ({
  title: renderer.components.text
}))
export const updateViewershipAction = ytv_enp(() => ({
  viewCount: ytv_ren()
}))

// Command
export const addBannerToLiveChatCommand = ytv_enp(() => ({
  bannerRenderer: ytv_ren()
}))
export const addToPlaylistCommand = ytv_enp(() => ({
  listType: ytv_str(['PLAYLIST_EDIT_LIST_TYPE_QUEUE']),
  onCreateListCommand: ytv_enp(),
  openListPanel: ytv_bol(),
  openMiniplayer: ytv_bol(),
  videoCommand: ytv_enp(),
  videoId: ytv_str(),
  videoIds: ytv_arr(ytv_str())
}))
export const adsControlFlowOpportunityReceivedCommand = ytv_enp(() => ({
  adSlotAndLayoutMetadata: ytv_arr(ytv_sto({
    adLayoutMetadata: ytv_arr(ytv_unk()),
    adSlotMetadata: ytv_sto({
      adSlotLoggingData: renderer.components.adSlotLoggingData,
      slotId: ytv_str(),
      slotPhysicalPosition: ytv_num(),
      slotType: ytv_str(renderer.enums.AdSlotType)
    })
  })),
  enablePacfLoggingWeb: ytv_bol(),
  isInitialLoad: ytv_bol(),
  opportunityType: ytv_str(['OPPORTUNITY_TYPE_ORGANIC_SEARCH_RESPONSE_RECEIVED', 'OPPORTUNITY_TYPE_REEL_WATCH_SEQUENCE_RESPONSE_RECEIVED'])
}))
export const authDeterminedCommand = ytv_enp(() => ({
  authenticatedCommand: ytv_enp(),
  unauthenticatedCommand: ytv_enp()
}))
export const authRequiredCommand = ytv_enp(() => ({
  hideInterstitial: ytv_bol(),
  identityActionContext: renderer.components.identityActionContext,
  startSignInCommand: ytv_enp()
}))
export const changeCreatorEndscreenVisibilityCommand = ytv_enp(() => ({
  hide: ytv_bol()
}))
export const changeMarkersVisibilityCommand = ytv_enp(() => ({
  entityKeys: ytv_arr(ytv_str()),
  isVisible: ytv_bol(),
  visibilityRestrictionMode: ytv_str(['CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_NOT_OVERWRITE_SAME_TYPE', 'CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_UNKNOWN'])
}))
export const changeTimelyActionVisibilityCommand = ytv_enp(() => ({
  id: ytv_str(),
  isVisible: ytv_bol()
}))
export const commandExecutorCommand = ytv_enp(() => ({
  commands: ytv_arr(ytv_enp())
}))
export const continuationCommand = ytv_enp(() => ({
  command: ytv_enp(),
  request: ytv_str(['CONTINUATION_REQUEST_TYPE_ACCOUNTS_LIST', 'CONTINUATION_REQUEST_TYPE_BROWSE', 'CONTINUATION_REQUEST_TYPE_COMMENTS_NOTIFICATION_MENU', 'CONTINUATION_REQUEST_TYPE_COMMENT_REPLIES', 'CONTINUATION_REQUEST_TYPE_GET_PANEL', 'CONTINUATION_REQUEST_TYPE_REEL_WATCH_SEQUENCE', 'CONTINUATION_REQUEST_TYPE_SEARCH', 'CONTINUATION_REQUEST_TYPE_WATCH_NEXT']),
  token: ytv_str()
}))
export const elementsCommand = ytv_enp()
export const entityUpdateCommand = ytv_enp(() => ({
  elementUpdate: ytv_arr(ytv_sto({
    resourceStatusInResponseCheck: ytv_sto({
      resourceStatuses: ytv_arr(ytv_sto({
        identifier: ytv_str(),
        status: ytv_str(['ELEMENTS_RESOURCE_STATUS_ATTACHED'])
      })),
      serverBuildLabel: ytv_str()
    }),
    templateUpdate: ytv_sto({
      dependencies: ytv_arr(ytv_str()),
      identifier: ytv_str(),
      serializedTemplateConfig: ytv_str(),
      templateType: ytv_str(['TEMPLATE_TYPE_EKO'])
    })
  })),
  entityBatchUpdate: ytv_sto({
    mutations: ytv_arr(components.entityMutation),
    timestamp: common.components.highResTime
  })
}))
export const getDownloadActionCommand = ytv_enp(() => ({
  isCrossDeviceDownload: ytv_bol(),
  offlineabilityEntityKey: ytv_str(),
  params: ytv_str(),
  videoId: ytv_str()
}))
export const getPdgBuyFlowCommand = ytv_enp(() => ({
  params: ytv_str()
}))
export const getSurveyCommand = ytv_enp(() => ({
  action: ytv_str(['SURVEY_TRIGGER_ACTION_AUTOPLAY_CANCEL', 'SURVEY_TRIGGER_ACTION_SMART_SKIP_JUMP_AHEAD']),
  endpoint: ytv_sto({
    watch: ytv_sto({
      hack: ytv_bol()
    })
  })
}))
export const handoffInitiateActionCommand = ytv_enp(() => ({
  lrDeviceState: ytv_sto({
    canCreateComments: ytv_bol(),
    isPauseCommentsEnabled: ytv_bol()
  }),
  type: ytv_str(['HANDOFF_FEATURE_TYPE_LR_COMMENTS'])
}))
export const hideItemSectionVideosByIdCommand = ytv_enp(() => ({
  videoId: ytv_str()
}))
export const innertubeCommand = ytv_enp()
export const liveChatReportModerationStateCommand = ytv_enp(() => ({}))
export const loadMarkersCommand = ytv_enp(() => ({
  entityKeys: ytv_arr(ytv_str()),
  visibleOnLoadKeys: ytv_arr(ytv_str())
}))
export const localWatchHistoryCommand = ytv_enp(() => ({
  localWatchHistoryCommandType: ytv_str(['LOCAL_WATCH_HISTORY_COMMAND_TYPE_REMOVE']),
  videoId: ytv_str()
}))
export const logFlowLoggingEventCommand = ytv_enp(() => ({
  flowEventMetadata: ytv_sto({
    pdgBuyFlowContext: ytv_sto({
      entryPointClickedContext: ytv_sto({
        superChatBuyFlowEntryPoint: ytv_str(['SUPER_CHAT_BUY_FLOW_ENTRY_POINT_TICKER_CHIP'])
      }),
      productType: ytv_str(['PRODUCT_TYPE_BUY_BUCKET'])
    }),
    sponsorshipsPurchaseContext: ytv_sto({
      joinMethod: ytv_str(['SPONSORSHIPS_JOIN_METHOD_CHANNEL_PAGE_BUTTON'])
    })
  }),
  flowEventNamespace: ytv_str(['FLOW_EVENT_NAMESPACE_PDG_BUY_FLOW', 'FLOW_EVENT_NAMESPACE_SPONSORSHIPS_PURCHASE']),
  flowEventType: ytv_num(),
  flowType: ytv_str(['FLOW_TYPE_PDG_BUY_FLOW', 'FLOW_TYPE_SPONSORSHIPS_PURCHASE'])
}))
export const logGestureCommand = ytv_ren(() => ({
  gestureType: ytv_str(['GESTURE_EVENT_TYPE_LOG_GENERIC_CLICK'])
}))
export const logLyricEventCommand = ytv_enp(() => ({
  serializedLyricInfo: ytv_str()
}))
export const logYpcFlowStartCommand = ytv_enp(() => ({
  flowAttribute: ytv_str(['FLOW_ATTRIBUTE_INITIATE_SIGNED_OUT_SECOND_SCREEN']),
  serializedTransactionFlowLoggingParams: ytv_str()
}))
export const loopCommand = ytv_enp(() => ({
  loop: ytv_bol()
}))
export const openSuperStickerBuyFlowCommand = ytv_enp(() => ({
  params: ytv_str()
}))
export const parallelCommand = ytv_enp(() => ({ // Same as commandExecutorCommand
  commands: ytv_arr(ytv_enp())
}))
export const performOnceCommand = ytv_enp(() => ({
  identifier: ytv_str(),
  command: ytv_enp()
}))
export const prefetchWatchCommand = ytv_enp(() => ({
  index: ytv_num(),
  playerParams: ytv_str(),
  prebufferConfig: ytv_sto({
    millisecondsToFetch: ytv_num()
  }),
  prefetchPlaybackContext: ytv_sto({
    isAutonav: ytv_bol(),
    isAutoplay: ytv_bol()
  }),
  taskId: ytv_str(),
  ustreamerConfig: ytv_str(),
  videoId: ytv_str(),
  watchEndpointSupportedOnesieConfig: components.watchEndpointSupportedOnesieConfig
}))
export const registerTasksCommand = ytv_enp(() => ({
  tasks: ytv_arr(ytv_ren({
    cancelOn: ytv_sto({
      screenExit: ytv_sto({
        screen: ytv_str(['SCREEN_WATCH_PAGE'])
      })
    }),
    id: ytv_str(),
    prefetchConfig: ytv_sto({
      fetchAction: ytv_str(['LATENCY_ACTION_WATCH']),
      prefetchAction: ytv_str(['LATENCY_ACTION_PREBUFFER_VIDEO']),
      priority: ytv_str(['PREFETCH_PRIORITY_HIGH'])
    }),
    triggerOn: ytv_sto({
      taskRegistered: ytv_sto({})
    })
  }))
}))
export const relatedChipCommand = ytv_enp(() => ({
  contents: ytv_arr(ytv_ren()),
  loadCached: ytv_bol(),
  targetSectionIdentifier: ytv_str()
}))
export const reloadContinuationItemsCommand = ytv_enp(() => ({
  continuationItems: ytv_arr(ytv_ren()),
  slot: ytv_str(['RELOAD_CONTINUATION_SLOT_BODY', 'RELOAD_CONTINUATION_SLOT_HEADER']),
  targetId: ytv_str()
}))
export const repeatChapterCommand = ytv_enp(() => ({
  endTimeMs: ytv_str(),
  repeat: ytv_str(['REPEAT_CHAPTER_TYPE_ENABLE_REPEAT', 'REPEAT_CHAPTER_TYPE_DISABLE_REPEAT']),
  repeatStateEntityKey: ytv_str(),
  startTimeMs: ytv_str()
}))
export const resetChannelUnreadCountCommand = ytv_enp(() => ({
  channelId: ytv_str()
}))
export const runAttestationCommand = ytv_enp(() => ({
  engagementType: ytv_str(common.enums.EngagementType),
  ids: ytv_arr(ytv_unk())
}))
export const seekToVideoTimestampCommand = ytv_enp(() => ({
  offsetFromVideoStartMilliseconds: ytv_str(),
  videoId: ytv_str()
}))
export const selectSubtitlesTrackCommand = ytv_enp(() => ({
  useDefaultTrack: ytv_bol()
}))
export const serialCommand = ytv_enp(() => ({ // Same as commandExecutorCommand
  commands: ytv_arr(ytv_enp())
}))
export const setAppBackgroundCommand = ytv_enp(() => ({
  image: renderer.components.thumbnail,
  scrimStyle: ytv_str(['SCRIM_STYLE_CAROUSEL']),
  target: ytv_str(['APP_BACKGROUND_TARGET_ACCOUNTS', 'APP_BACKGROUND_TARGET_BROWSE', 'APP_BACKGROUND_TARGET_OVERLAY', 'APP_BACKGROUND_TARGET_SEARCH', 'APP_BACKGROUND_TARGET_WATCH_SQUEEZEBACK', 'APP_BACKGROUND_TARGET_WELCOME'])
}))
export const setEntityCommand = ytv_enp(() => ({
  entity: ytv_str(),
  identifier: ytv_str()
}))
export const scrollToEngagementPanelCommand = ytv_enp(() => ({
  panelIdentifier: renderer.components.engagementPanelIdentifier,
  targetId: ytv_str()
}))
export const showAudioTrackPickerActionCommand = ytv_enp(() => ({}))
export const showCaptionLanguageSelectActionCommand = ytv_enp(() => ({}))
export const showDialogCommand = ytv_enp(() => ({
  panelLoadingStrategy: components.panelLoadingStrategy
}))
export const showFullscreenPlayerControlsCommand = ytv_enp(() => ({}))
export const showHintCommand = ytv_enp(() => ({
  shouldShowHint: ytv_bol()
}))
export const showLiveChatTooltipCommand = ytv_enp(() => ({
  tooltip: ytv_ren()
}))
export const showMenuCommand = ytv_enp(() => ({
  contentId: ytv_str(),
  menu: ytv_ren(),
  subtitle: renderer.components.text,
  thumbnail: renderer.components.thumbnail,
  title: renderer.components.text
}))
export const showMiniplayerCommand = ytv_enp(() => ({
  miniplayerCommand: ytv_enp(),
  showPremiumBranding: ytv_bol()
}))
export const showReloadUiCommand = ytv_enp(() => ({
  content: ytv_ren(),
  targetId: ytv_str()
}))
export const showSheetCommand = ytv_enp(() => ({
  contextualSheetPresentationConfig: ytv_sto({
    expandToFullWidth: ytv_bol(),
    hoverConfig: ytv_sto({
      hideDelayMs: ytv_num(),
      preventCloseWhileHovered: ytv_bol(),
      showDelayMs: ytv_num()
    }),
    position: ytv_str(['SHEET_POSITION_BOTTOM_LEFT', 'SHEET_POSITION_RIGHT'])
  }),
  panelLoadingStrategy: components.panelLoadingStrategy
}))
export const showSponsorshipsGiftOfferDialogCommand = ytv_enp(() => ({
  contentCommand: ytv_enp()
}))
export const showTransientPlayerScrimOverlayCommand = ytv_enp(() => ({
  durationMs: ytv_num(),
  fadeInDurationMs: ytv_num(),
  fadeOutDurationMs: ytv_num(),
  overlayRenderer: ytv_ren()
}))
export const startAccountSelectorCommand = ytv_enp(() => ({}))
export const startSignInCommand = ytv_enp(() => ({
  identityActionContext: renderer.components.identityActionContext,
  signInType: ytv_str(['SIGN_IN_METHOD_TYPE_DIRECT'])
}))
export const toggleLiveReactionsMuteCommand = ytv_enp(() => ({
  hack: ytv_bol()
}))
export const transformEntityCommand = ytv_enp(() => ({
  identifier: ytv_str(),
  transform: ytv_sto({
    types: ytv_arr(ytv_sto({
      fieldType: ytv_str(['EKO_FIELD_TYPE_BOOL']),
      typeId: ytv_num()
    })),
    variables: ytv_arr(ytv_sto({
      variableId: ytv_num(),
      variableType: ytv_str(['EKO_VARIABLE_TYPE_INPUT', 'EKO_VARIABLE_TYPE_OUTPUT'])
    }))
  })
}))
export const updateCarouselHeaderCommand = ytv_enp(() => ({
  spotlight: ytv_ren()
}))
export const updateEngagementPanelContentCommand = ytv_enp(() => ({
  contentSourcePanelIdentifier: renderer.components.engagementPanelIdentifier,
  globalConfiguration: ytv_sto({
    params: ytv_str()
  }),
  targetPanelIdentifier: renderer.components.engagementPanelIdentifier
}))
export const updateEntityButtonDetailsCommand = ytv_enp(() => ({
  selectedIndex: ytv_num()
}))
export const updateTimedMarkersSyncObserverCommand = ytv_enp(() => ({
  isEnabled: ytv_bol(),
  panelSyncEntityKey: ytv_str(),
  timedSyncEntityKey: ytv_str()
}))
export const updateToggleButtonStateCommand = ytv_enp(() => ({
  buttonId: ytv_str(),
  toggled: ytv_bol()
}))

// Endpoint
export const addToPlaylistServiceEndpoint = ytv_enp(() => ({
  params: ytv_str(),
  videoId: ytv_str()
}))
export const addUpcomingEventReminderEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const applicationSettingsEndpoint = ytv_enp(() => ({
  hack: ytv_bol()
}))
export const browseEndpoint = ytv_enp(() => ({
  browseEndpointContextSupportedConfigs: ytv_sto({
    browseEndpointContextMusicConfig: ytv_sto({
      pageType: ytv_str(['MUSIC_PAGE_TYPE_ALBUM', 'MUSIC_PAGE_TYPE_PLAYLIST'])
    })
  }),
  browseId: ytv_str(),
  canonicalBaseUrl: ytv_str(),
  params: ytv_str()
}))
export const captionPickerEndpoint = ytv_enp(() => ({
  videoId: ytv_str()
}))
export const channelCreationFormEndpoint = ytv_enp(() => ({
  channelCreationToken: ytv_str(),
  source: ytv_str(['COMMENT_CHANNEL_CREATION_SOURCE'])
}))
export const confirmDialogEndpoint = ytv_enp(() => ({
  content: ytv_ren()
}))
export const createBackstagePostEndpoint = ytv_enp(() => ({
  createBackstagePostParams: ytv_str()
}))
export const createCommentEndpoint = ytv_enp(() => ({
  createCommentParams: ytv_str(),
}))
export const createCommentReplyDialogEndpoint = ytv_enp(() => ({
  dialog: ytv_ren()
}))
export const createCommentReplyEndpoint = ytv_enp(() => ({
  createReplyParams: ytv_str()
}))
export const createPlaylistServiceEndpoint = ytv_enp(() => ({
  params: ytv_str(),
  videoIds: ytv_arr(ytv_str())
}))
export const feedbackEndpoint = ytv_enp(() => ({
  actions: ytv_arr(ytv_enp()),
  contentId: ytv_str(),
  feedbackToken: ytv_str(),
  onFailureAction: ytv_enp(),
  uiActions: ytv_sto({
    hideEnclosingContainer: ytv_bol()
  })
}))
export const flagEndpoint = ytv_enp(() => ({
  flagAction: ytv_str()
}))
export const getReportFormEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const getTranscriptEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const handoffEndpoint = ytv_enp(() => ({
  handoffParams: ytv_sto({
    actionType: ytv_str(['HANDOFF_FEATURE_TYPE_YTC_LR_PURCHASE']),
    callType: ytv_str(['HANDOFF_CALL_TYPE_INITIATE_ACTION']),
    featureData: ytv_sto({
      ytcPurchaseData: ytv_sto({
        urlPath: ytv_str(),
        ytDeeplinkPurchaseParams: ytv_str()
      })
    })
  })
}))
export const hideEngagementPanelEndpoint = ytv_enp(() => ({
  identifier: renderer.components.engagementPanelIdentifier,
  panelIdentifier: ytv_str()
}))
export const likeEndpoint = ytv_enp(() => ({
  dislikeParams: ytv_str(),
  likeParams: ytv_str(),
  removeLikeParams: ytv_str(),
  status: ytv_str(common.enums.LikeStatus),
  target: ytv_sto({
    playlistId: ytv_str(),
    videoId: ytv_str()
  })
}))
export const liveChatActionEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const liveChatDialogEndpoint = ytv_enp(() => ({
  content: ytv_ren()
}))
export const liveChatItemContextMenuEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const liveChatPurchaseMessageEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const menuEndpoint = ytv_enp(() => ({
  menu: ytv_ren()
}))
export const modalEndpoint = ytv_enp(() => ({
  modal: ytv_ren()
}))
export const modifyChannelNotificationPreferenceEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const notificationOptOutEndpoint = ytv_enp(() => ({
  optOutText: renderer.components.text,
  serializedOptOut: ytv_str(),
  serializedRecordInteractionsRequest: ytv_str()
}))
export const offlinePlaylistEndpoint = ytv_enp(() => ({
  action: ytv_str(['ACTION_ADD']),
  actionParams: ytv_sto({
    formatType: ytv_str(common.enums.OfflineFormatType),
    settingsAction: ytv_str(['DOWNLOAD_QUALITY_SETTINGS_ACTION_ALREADY_SAVED', 'DOWNLOAD_QUALITY_SETTINGS_ACTION_DONT_SAVE', 'DOWNLOAD_QUALITY_SETTINGS_ACTION_EXPIRING_SAVE', 'DOWNLOAD_QUALITY_SETTINGS_ACTION_SAVE'])
  }),
  onAddCommand: ytv_enp(),
  playlistId: ytv_str()
}))
export const offlineVideoEndpoint = ytv_enp(() => ({
  action: ytv_str(['ACTION_ADD']),
  actionParams: ytv_sto({
    formatType: ytv_str(common.enums.OfflineFormatType),
    settingsAction: ytv_str(['DOWNLOAD_QUALITY_SETTINGS_ACTION_ALREADY_SAVED', 'DOWNLOAD_QUALITY_SETTINGS_ACTION_DONT_SAVE', 'DOWNLOAD_QUALITY_SETTINGS_ACTION_EXPIRING_SAVE', 'DOWNLOAD_QUALITY_SETTINGS_ACTION_SAVE'])
  }),
  onAddCommand: ytv_enp(),
  videoId: ytv_str()
}))
export const performCommentActionEndpoint = ytv_enp(() => ({
  action: ytv_str(),
  clientActions: ytv_arr(ytv_enp())
}))
export const pingingEndpoint = ytv_enp(() => ({
  hack: ytv_bol()
}))
export const playlistEditEndpoint = ytv_enp(() => ({
  actions: ytv_arr(ytv_sto({
    action: ytv_str(['ACTION_ADD_VIDEO', 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID']),
    addedVideoId: ytv_str(),
    removedVideoId: ytv_str()
  })),
  playlistId: ytv_str()
}))
export const popoutLiveChatEndpoint = ytv_enp(() => ({
  url: ytv_str()
}))
export const recordNotificationInteractionsEndpoint = ytv_enp(() => ({
  actions: ytv_arr(ytv_enp()),
  serializedInteractionsRequest: ytv_str()
}))
export const reelWatchEndpoint = ytv_enp(() => ({
  accessibilityRenderer: ytv_ren(),
  adClientParams: ytv_sto({
    isAd: ytv_bol()
  }),
  identifier: ytv_str(),
  inputType: ytv_str(['REEL_WATCH_INPUT_TYPE_SEEDLESS']),
  loggingContext: components.watchEndpointLoggingContext,
  overlay: ytv_ren(),
  params: ytv_str(),
  playerParams: ytv_str(),
  sequenceParams: ytv_str(),
  sequenceProvider: ytv_str(['REEL_WATCH_SEQUENCE_PROVIDER_RPC']),
  thumbnail: renderer.components.thumbnail,
  unserializedPrefetchData: ytv_sto({
    playerResponse: ytv_unk(),
    reelItemWatchResponse: ytv_unk()
  }),
  updateKey: ytv_str(),
  ustreamerConfig: ytv_str(),
  videoId: ytv_str(),
  videoType: ytv_str(['REEL_VIDEO_TYPE_VIDEO']),
  watchEndpointSource: ytv_str(['REEL_WATCH_ENDPOINT_SOURCE_SEARCH', 'REEL_WATCH_ENDPOINT_SOURCE_SHORTS_PIVOT_BAR_RESUME_TO_SHORTS']),
  watchEndpointSupportedOnesieConfig: components.watchEndpointSupportedOnesieConfig
}))
export const removeUpcomingEventReminderEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const searchEndpoint = ytv_enp(() => ({
  params: ytv_str(),
  query: ytv_str()
}))
export const sendLiveChatMessageEndpoint = ytv_enp(() => ({
  actions: ytv_arr(ytv_enp()),
  clientIdPrefix: ytv_str(),
  params: ytv_str()
}))
export const sendLiveChatVoteEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const setClientSettingEndpoint = ytv_enp(() => ({
  settingDatas: ytv_arr(ytv_sto({
    boolValue: ytv_bol(),
    clientSettingEnum: ytv_sto({
      item: ytv_str(['USER_AUDIO_51_PREFERENCE'])
    })
  }))
}))
export const setSettingEndpoint = ytv_enp(() => ({
  boolValue: ytv_bol(),
  settingItemId: ytv_str(),
  settingItemIdForClient: ytv_str(['AUTONAV_FOR_DESKTOP', 'AUTONAV_FOR_SIGN_OUT'])
}))
export const shareEntityEndpoint = ytv_enp(() => ({
  serializedShareEntity: ytv_str(),
  sharePanelType: ytv_str(['SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL'])
}))
export const shareEntityServiceEndpoint = ytv_enp(() => ({
  commands: ytv_arr(ytv_enp()),
  serializedShareEntity: ytv_str()
}))
export const showEngagementPanelEndpoint = ytv_enp(() => ({
  engagementPanel: ytv_ren(),
  engagementPanelExtras: ytv_sto({
    sectionListEngagementPanelExtras: ytv_sto({
      scrollToItemSectionIdentifier: ytv_str(),
      scrollToItemSectionOffsetDistance: ytv_num()
    })
  }),
  engagementPanelPresentationConfigs: ytv_sto({
    engagementPanelPopupPresentationConfig: ytv_sto({
      popupType: ytv_str(['PANEL_POPUP_TYPE_DIALOG'])
    })
  }),
  forcePortrait: ytv_bol(),
  globalConfiguration: ytv_sto({
    initialState: ytv_ren(),
    params: ytv_str()
  }),
  identifier: renderer.components.engagementPanelIdentifier,
  panelIdentifier: ytv_str(),
  sourcePanelIdentifier: ytv_str()
}))
export const showLiveChatItemEndpoint = ytv_enp(() => ({
  renderer: ytv_ren(),
  trackingParams: ytv_str() // What??
}))
export const showLiveChatParticipantsEndpoint = ytv_enp(() => ({
  hack: ytv_bol()
}))
export const signInEndpoint = ytv_enp(() => ({
  continueAction: ytv_str(),
  hack: ytv_bol(),
  idamTag: ytv_str(),
  nextEndpoint: ytv_enp()
}))
export const signalNavigationEndpoint = ytv_enp(() => ({
  signal: ytv_str(['ACCOUNT_SETTINGS', 'LIVE_CONTROL_ROOM'])
}))
export const signalServiceEndpoint = ytv_enp(() => ({
  actions: ytv_arr(ytv_enp()),
  signal: ytv_str(['CLIENT_SIGNAL', 'GET_ACCOUNT_MENU', 'GET_NOTIFICATIONS_MENU', 'GET_NOTIFICATIONS_INBOX', 'GET_UNSEEN_NOTIFICATION_COUNT', 'GET_USER_MENTION_SUGGESTIONS', 'LOAD_GUIDE', 'SUBMIT_FEEDBACK'])
}))
export const subscribeEndpoint = ytv_enp(() => ({
  channelIds: ytv_arr(ytv_str()),
  params: ytv_str()
}))
export const toggleLiveChatTimestampsEndpoint = ytv_enp(() => ({
  hack: ytv_bol()
}))
export const undoFeedbackEndpoint = ytv_enp(() => ({
  actions: ytv_arr(ytv_enp()),
  contentId: ytv_str(),
  undoToken: ytv_str()
}))
export const unsubscribeEndpoint = ytv_enp(() => ({
  channelIds: ytv_arr(ytv_str()),
  params: ytv_str()
}))
export const updatedMetadataEndpoint = ytv_enp(() => ({
  initialDelayMs: ytv_num(),
  params: ytv_str(),
  videoId: ytv_str()
}))
export const uploadEndpoint = ytv_enp(() => ({
  hack: ytv_bol()
}))
export const urlEndpoint = ytv_enp(() => ({
  attributionSrcMode: ytv_str(['ATTRIBUTION_SRC_MODE_LABEL_CHROME']),
  grwOpenInOverride: ytv_str(['GRW_OPEN_IN_OVERRIDE_USE_PREFERRED_APP_NO_PROMPT']),
  nofollow: ytv_bol(),
  target: ytv_str(['TARGET_NEW_WINDOW']),
  url: ytv_str()
}))
export const verifyAgeEndpoint = ytv_enp(() => ({
  nextEndpoint: ytv_enp()
}))
export const userFeedbackEndpoint = ytv_enp(() => ({
  additionalDatas: ytv_arr(ytv_sto({
    userFeedbackEndpointProductSpecificValueData: ytv_sto({
      key: ytv_str(),
      value: ytv_str()
    })
  })),
  bucketIdentifier: ytv_str(),
  hack: ytv_bol()
}))
export const watchEndpoint = ytv_enp(() => ({
  continuePlayback: ytv_bol(),
  index: ytv_num(),
  nofollow: ytv_bol(),
  loggingContext: components.watchEndpointLoggingContext,
  params: ytv_str(),
  playerExtraUrlParams: ytv_arr(ytv_sto({
    key: ytv_str(),
    value: ytv_str()
  })),
  playerParams: ytv_str(),
  playlistId: ytv_str(),
  playlistSetVideoId: ytv_str(),
  prefetchTaskId: ytv_str(),
  replayIfSameVideo: ytv_bol(),
  startTimeSeconds: ytv_num(),
  ustreamerConfig: ytv_str(),
  videoId: ytv_str(),
  watchEndpointMdxConfig: ytv_sto({
    mdxPlaybackSourceContext: ytv_sto({})
  }),
  watchEndpointMusicSupportedConfigs: ytv_sto({
    watchEndpointMusicConfig: ytv_sto({
      musicVideoType: ytv_str(common.enums.MusicVideoType)
    })
  }),
  watchEndpointSupportedOnesieConfig: components.watchEndpointSupportedOnesieConfig,
  watchEndpointSupportedPrefetchConfig: ytv_sto({
    prefetchHintConfig: ytv_sto({
      countdownUiRelativeSecondsPrefetchCondition: ytv_num(),
      playbackRelativeSecondsPrefetchCondition: ytv_num(),
      prefetchPriority: ytv_num()
    }),
    sabrPrefetchEndpointConfig: ytv_sto({
      disablePrefetch: ytv_bol(),
      maximumAllowableTimeMsBeforePlaybackToPrefetch: ytv_num()
    })
  })
}))
export const watchPlaylistEndpoint = ytv_enp(() => ({
  index: ytv_num(),
  params: ytv_str(),
  playlistId: ytv_str()
}))
export const webPlayerShareEntityServiceEndpoint = ytv_enp(() => ({
  serializedShareEntity: ytv_str()
}))
export const ypcGetOffersEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))
export const ypcOffersEndpoint = ytv_enp(() => ({
  params: ytv_str()
}))