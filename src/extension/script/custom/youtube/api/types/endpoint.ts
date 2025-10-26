import { YTAccessibilitySchema, YTAdSlotLoggingDataSchema, YTEndpointSchema, YTEngagementPanelIdentifier, YTEngagementPanelVisibility, YTLikeStatus, YTLoggingDirectivesSchema, YTMusicVideoType, YTObjectData, YTObjectSchema, YTOfflineabilityRendererSchema, YTTextSchema, YTThumbnailSchema, YTUrlSchema, ytv_arr, ytv_bol, ytv_enp, ytv_num, ytv_obj, ytv_ren, ytv_sch, ytv_str, ytv_unk } from './common'
import { YTIconType } from './icon'

export enum YTSignalActionType {
  ACK_POST_AADC_NOTICE = 'ACK_POST_AADC_NOTICE',
  ACKNOWLEDGE_YOUTHERE = 'ACKNOWLEDGE_YOUTHERE',
  AUDIO_MODE = 'AUDIO_MODE',
  CANCEL_AUTONAV = 'CANCEL_AUTONAV',
  CANCEL_HANDOFF_AUTOCONNECT = 'CANCEL_HANDOFF_AUTOCONNECT',
  CANCEL_HANDOFF_COMMENTS = 'CANCEL_HANDOFF_COMMENTS',
  CLOSE_PDG_BUY_FLOW = 'CLOSE_PDG_BUY_FLOW',
  CLOSE_POPUP = 'CLOSE_POPUP',
  CLOSE_WINDOW = 'CLOSE_WINDOW',
  CONFIRM_MENTIONS_EDU = 'CONFIRM_MENTIONS_EDU',
  COPY_DEBUG_DATA = 'COPY_DEBUG_DATA',
  COPY_SHARE_EMBED_URL = 'COPY_SHARE_EMBED_URL',
  COPY_SHARE_URL = 'COPY_SHARE_URL',
  COPY_TRANSCRIPT = 'COPY_TRANSCRIPT',
  DELETE_ALL_DOWNLOADS = 'DELETE_ALL_DOWNLOADS',
  DELETE_ALL_DOWNLOADS_PROMPT = 'DELETE_ALL_DOWNLOADS_PROMPT',
  DELETE_DOWNLOAD = 'DELETE_DOWNLOAD',
  DELETE_PLAYLIST_DOWNLOAD = 'DELETE_PLAYLIST_DOWNLOAD',
  ENABLE_CHROME_NOTIFICATIONS = 'ENABLE_CHROME_NOTIFICATIONS',
  HELP = 'HELP',
  HIDE_LIVE_CHAT = 'HIDE_LIVE_CHAT',
  HISTORY_BACK = 'HISTORY_BACK',
  HISTORY_FORWARD = 'HISTORY_FORWARD',
  MINI_APP_TOGGLE_THEATRE_MODE_OFF = 'MINI_APP_TOGGLE_THEATRE_MODE_OFF',
  MINI_APP_TOGGLE_THEATRE_MODE_ON = 'MINI_APP_TOGGLE_THEATRE_MODE_ON',
  INSTALL_PWA = 'INSTALL_PWA',
  OPEN_POST_COMMENT_DIALOG = 'OPEN_POST_COMMENT_DIALOG',
  PAUSE_PLAYER = 'PAUSE_PLAYER',
  PLAY_PLAYER = 'PLAY_PLAYER',
  PLAYER_LOOP_OFF = 'PLAYER_LOOP_OFF',
  PLAYER_LOOP_VIDEO = 'PLAYER_LOOP_VIDEO',
  PLAYER_PLAY_NEXT = 'PLAYER_PLAY_NEXT',
  PLAYER_PLAY_PREVIOUS = 'PLAYER_PLAY_PREVIOUS',
  POPUP_BACK = 'POPUP_BACK',
  RECORD_MENTIONS_EDU_IMPRESSION = 'RECORD_MENTIONS_EDU_IMPRESSION',
  REFRESH_DOWNLOADS = 'REFRESH_DOWNLOADS',
  RELOAD_PAGE = 'RELOAD_PAGE',
  REQUEST_PERSISTENT_STORAGE = 'REQUEST_PERSISTENT_STORAGE',
  RESET_WARM_LOADS = 'RESET_WARM_LOADS',
  SCROLL_TO_COMMENTS = 'SCROLL_TO_COMMENTS',
  SEND_FEEDBACK = 'SEND_FEEDBACK',
  SHOW_ACCOUNT_LINK_DIALOG = 'SHOW_ACCOUNT_LINK_DIALOG',
  SHOW_DMA_CONSENT_FORM = 'SHOW_DMA_CONSENT_FORM',
  SHOW_KEYBOARD_SHORTCUT_DIALOG = 'SHOW_KEYBOARD_SHORTCUT_DIALOG',
  SHOW_PREVIOUS_FAMILY_DIALOG = 'SHOW_PREVIOUS_FAMILY_DIALOG',
  SKIP_NAVIGATION = 'SKIP_NAVIGATION',
  SOFT_RELOAD_PAGE = 'SOFT_RELOAD_PAGE',
  SUBMIT_FORM = 'SUBMIT_FORM',
  SUBMIT_NOTIFICATION_OPTIONS_FORM = 'SUBMIT_NOTIFICATION_OPTIONS_FORM',
  SUBMIT_POPUP_FORM_FIELDS = 'SUBMIT_POPUP_FORM_FIELDS',
  TELL_US_WHY = 'TELL_US_WHY',
  TOGGLE_CINEMATIC_SHORTS_OFF = 'TOGGLE_CINEMATIC_SHORTS_OFF',
  TOGGLE_CINEMATIC_SHORTS_ON = 'TOGGLE_CINEMATIC_SHORTS_ON',
  TOGGLE_DARK_THEME_DEVICE = 'TOGGLE_DARK_THEME_DEVICE',
  TOGGLE_DARK_THEME_OFF = 'TOGGLE_DARK_THEME_OFF',
  TOGGLE_DARK_THEME_ON = 'TOGGLE_DARK_THEME_ON',
  TOGGLE_LOOP_SHORTS_OFF = 'TOGGLE_LOOP_SHORTS_OFF',
  TOGGLE_LOOP_SHORTS_ON = 'TOGGLE_LOOP_SHORTS_ON',
  TOGGLE_RESTRICTED_MODE_OFF = 'TOGGLE_RESTRICTED_MODE_OFF',
  TOGGLE_RESTRICTED_MODE_ON = 'TOGGLE_RESTRICTED_MODE_ON',
  TOGGLE_STABLE_VOLUME = 'TOGGLE_STABLE_VOLUME',
  TOGGLE_TRANSACTION_TIMESTAMPS = 'TOGGLE_TRANSACTION_TIMESTAMPS',
  TOGGLE_TRANSCRIPT_TIMESTAMPS = 'TOGGLE_TRANSCRIPT_TIMESTAMPS',
  TOGGLE_VIDEO_INFO = 'TOGGLE_VIDEO_INFO',
  UNDO_DELETE_DOWNLOAD = 'UNDO_DELETE_DOWNLOAD',
  VIDEO_MODE = 'VIDEO_MODE',

  CONFIG_VALUE_SET = 'CONFIG_VALUE_SET',
  CONTENT_CHECK_COMPLETE = 'CONTENT_CHECK_COMPLETE'
}

export enum YTWebPageType {
  WEB_PAGE_TYPE_UNKNOWN = 'WEB_PAGE_TYPE_UNKNOWN',
  WEB_PAGE_TYPE_SEARCH = 'WEB_PAGE_TYPE_SEARCH',
  WEB_PAGE_TYPE_SHORTS = 'WEB_PAGE_TYPE_SHORTS',
  WEB_PAGE_TYPE_CHANNEL = 'WEB_PAGE_TYPE_CHANNEL',
  WEB_PAGE_TYPE_SETTINGS = 'WEB_PAGE_TYPE_SETTINGS',
  WEB_PAGE_TYPE_PLAYLIST = 'WEB_PAGE_TYPE_PLAYLIST',
  WEB_PAGE_TYPE_OPEN_IN_APP = 'WEB_PAGE_TYPE_OPEN_IN_APP',
  WEB_PAGE_TYPE_MINI_APP = 'WEB_PAGE_TYPE_MINI_APP',
  WEB_PAGE_TYPE_WATCH = 'WEB_PAGE_TYPE_WATCH',
  WEB_PAGE_TYPE_BROWSE = 'WEB_PAGE_TYPE_BROWSE'
}

export const YTInteractionLoggingCommandMetadataSchema = {
  loggingExpectations: ytv_sch({
    screenCreatedLoggingExpectations: ytv_sch({
      expectedParentScreens: ytv_arr(ytv_sch({
        screenVeType: ytv_num()
      }))
    })
  })
} satisfies YTEndpointSchema

export const YTWebCommandMetadataSchema = {
  apiUrl: ytv_str(),
  ignoreNavigation: ytv_bol(),
  rootVe: ytv_num(),
  sendPost: ytv_bol(),
  url: ytv_str(),
  webPageType: ytv_str(YTWebPageType)
} satisfies YTEndpointSchema

export const YTCommandMetadataSchema = {
  interactionLoggingCommandMetadata: ytv_enp(YTInteractionLoggingCommandMetadataSchema),
  webCommandMetadata: ytv_enp(YTWebCommandMetadataSchema)
} satisfies YTEndpointSchema

export const YTEnvironmentSchema = {
  formFactor: ytv_str(['SMALL_FORM_FACTOR']),
  platformName: ytv_str(['PLATFORM_NAME_IOS'])
} satisfies YTObjectSchema

export const YTEntityMutationOptionSchema = {
  persistenceOption: ytv_str(['ENTITY_PERSISTENCE_OPTION_INMEMORY_AND_PERSIST'])
} satisfies YTObjectSchema

export const YTEntityMutationPayloadSchema = {
  booleanEntity: ytv_sch({
    key: ytv_str(),
    value: ytv_bol()
  }),
  commentEntityPayload: ytv_sch({
    author: ytv_unk(),
    avatar: ytv_unk(),
    isTranslationAvailable: ytv_bol(),
    key: ytv_str(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    properties: ytv_sch({
      authorButtonA11y: ytv_str(),
      commentId: ytv_str(),
      content: /*ytv_ren(YTTextViewModelSchema)*/ytv_unk(),
      imageAttachmentMaxHeight: ytv_num(),
      publishedTime: ytv_str(),
      replyLevel: ytv_num(),
      toolbarStateKey: ytv_str(),
      translateButtonEntityKey: ytv_str()
    }),
    readMoreLogging: ytv_ren({
      loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
    }),
    toolbar: ytv_sch({
      creatorThumbnailUrl: ytv_str(),
      dislikeActiveTooltip: ytv_str(),
      dislikeInactiveTooltip: ytv_str(),
      engagementToolbarStyle: ytv_sch({
        value: ytv_str(['ENGAGEMENT_TOOLBAR_STYLE_VALUE_DEFAULT'])
      }),
      heartActiveTooltip: ytv_str(),
      likeActiveTooltip: ytv_str(),
      likeButtonA11y: ytv_str(),
      likeCountA11y: ytv_str(),
      likeCountLiked: ytv_str(),
      likeCountNotliked: ytv_str(),
      likeInactiveTooltip: ytv_str(),
      replyCount: ytv_str(),
      replyCountA11y: ytv_str()
    }),
    translateData: ytv_sch({
      text: ytv_str(),
      translateComment: ytv_enp()
    })
  }),
  commentSharedEntityPayload: ytv_sch({
    key: ytv_str(),
    strings: ytv_sch({
      collapseText: ytv_str(),
      discardDialogAction: ytv_str(),
      discardDialogCancel: ytv_str(),
      discardDialogTitle: ytv_str(),
      expandText: ytv_str(),
      replyButtonText: ytv_str(),
      seeOriginalText: ytv_str(),
      shortReplyThumbnailA11y: ytv_str(),
      smartRepliesAiDisclaimer: ytv_str(),
      translatingText: ytv_str(),
      viewAllRepliesButtonA11y: ytv_str()
    }),
    toolbarShared: ytv_sch({
      approveButtonA11y: ytv_str(),
      blockButtonA11y: ytv_str(),
      cancelButtonLabel: ytv_str(),
      dislikeCommentButtonA11y: ytv_str(),
      dislikeReplyButtonA11y: ytv_str(),
      heartButtonA11y: ytv_str(),
      heartedTooltipA11y: ytv_str(),
      heartedTooltipCommand: ytv_sch({
        tooltipCommand: ytv_ren()
      }),
      menuButtonA11y: ytv_str(),
      removeButtonA11y: ytv_str(),
      replyButtonA11y: ytv_str(),
      spamButtonA11y: ytv_str(),
      undislikeButtonA11y: ytv_str(),
      unheartButtonA11y: ytv_str(),
      unlikeButtonA11y: ytv_str()
    }),
    capabilities: ytv_obj(ytv_str(), ytv_unk()),
    clientName: ytv_str(['WEB']),
    commentEnvironment: ytv_sch(YTEnvironmentSchema),
    environment: ytv_sch(YTEnvironmentSchema),
    experiments: ytv_obj(ytv_str(), ytv_unk())
  }),
  commentSurfaceEntityPayload: ytv_sch({
    commentBackgroundColor: ytv_num(),
    commentClickCommand: ytv_enp(),
    commentClickOpensComposer: ytv_bol(),
    composerDraftEntityKey: ytv_str(),
    inlineReadMoreButton: ytv_sch({
      isExpanded: ytv_bol()
    }),
    key: ytv_str(),
    logTapCommand: ytv_enp(),
    pdgCommentChip: ytv_ren(),
    publishedTimeCommand: ytv_enp(),
    viewRepliesTooltipData: ytv_sch({
      tooltipCommand: ytv_sch({
        tooltipCommand: ytv_ren()
      }),
      viewRepliesTooltipIdentifier: ytv_str()
    })
  }),
  emojiFountainDataEntity: ytv_sch({
    key: ytv_str(),
    reactionBuckets: ytv_arr(ytv_sch({
      duration: ytv_sch({
        seconds: ytv_str()
      }),
      intensityScore: ytv_num(),
      reactionsData: ytv_arr(ytv_sch({
        reactionCount: ytv_num(),
        unicodeEmojiId: ytv_str()
      })),
      totalReactions: ytv_num()
    })),
    updateTimeUsec: ytv_str()
  }),
  engagementToolbarStateEntityPayload: ytv_sch({
    heartState: ytv_str(['TOOLBAR_HEART_STATE_HEARTED', 'TOOLBAR_HEART_STATE_UNHEARTED']),
    key: ytv_str(),
    likeState: ytv_str(['TOOLBAR_LIKE_STATE_INDIFFERENT'])
  }),
  engagementToolbarSurfaceEntityPayload: ytv_sch({
    dislikeCommand: ytv_enp(),
    isEngagementToolbar: ytv_bol(),
    key: ytv_str(),
    likeCommand: ytv_enp(),
    menuCommand: ytv_enp(),
    prepareAccountCommand: ytv_enp(),
    replyCommand: ytv_enp(),
    undislikeCommand: ytv_enp(),
    unlikeCommand: ytv_enp()
  }),
  flowStateEntity: ytv_sch({
    currentStepId: ytv_str(),
    key: ytv_str()
  }),
  likeCountEntity: ytv_unk(),
  likeStatusEntity: ytv_sch({
    key: ytv_str(),
    likeStatus: ytv_str(YTLikeStatus)
  }),
  liveChatPollStateEntity: ytv_sch({
    collapsedMetadataText: ytv_sch(YTTextSchema),
    key: ytv_str(),
    metadataText: ytv_sch(YTTextSchema),
    pollChoiceStates: ytv_arr(ytv_sch({
      key: ytv_num(),
      value: ytv_sch({
        votePercentage: ytv_sch(YTTextSchema),
        voteRatio: ytv_num()
      })
    })),
    postVoteCountText: ytv_str(),
    preVoteCountText: ytv_str()
  }),
  liveViewerLeaderboardChatEntryPointStateEntity: ytv_sch({
    key: ytv_str(),
    state: ytv_str(['LIVE_VIEWER_LEADERBOARD_CHAT_ENTRY_POINT_STATE_POINTS_AVAILABLE'])
  }),
  liveViewerLeaderboardPointsEntity: ytv_sch({
    key: ytv_str(),
    pointsCompactText: ytv_str(),
    pointsValue: ytv_num()
  }),
  macroMarkersListEntity: ytv_sch({
    externalVideoId: ytv_str(),
    key: ytv_str(),
    markersList: ytv_sch({
      markerType: ytv_str(['MARKER_TYPE_HEATMAP', 'MARKER_TYPE_TIMESTAMPS']),
      markers: ytv_arr(ytv_sch({
        durationMillis: ytv_str(),
        intensityScoreNormalized: ytv_num(),
        sourceType: ytv_str(['SOURCE_TYPE_SMART_SKIP']),
        startMillis: ytv_str()
      })),
      markersDecoration: ytv_sch({
        timedMarkerDecorations: ytv_arr(ytv_sch({
          badge: ytv_ren(),
          decorationTimeMillis: ytv_num(),
          icon: ytv_str(YTIconType),
          label: ytv_sch(YTTextSchema),
          visibleTimeRangeEndMillis: ytv_num(),
          visibleTimeRangeStartMillis: ytv_num()
        }))
      }),
      markersMetadata: ytv_sch({
        heatmapMetadata: ytv_sch({
          maxHeightDp: ytv_num(),
          minHeightDp: ytv_num(),
          showHideAnimationDurationMillis: ytv_num()
        }),
        timestampMarkerMetadata: ytv_sch({
          snappingData: ytv_arr(ytv_sch({
            endMediaTimeMs: ytv_num(),
            maxSnappingCount: ytv_num(),
            onSnappingAriaLabel: ytv_str(),
            onSnappingCommand: ytv_enp(),
            overseekAllowanceMediaTimeMs: ytv_num(),
            snappingLingeringTimeoutMs: ytv_num(),
            startMediaTimeMs: ytv_num(),
            targetMediaTimeMs: ytv_num()
          }))
        })
      })
    })
  }),
  offlineabilityEntity: ytv_ren(YTOfflineabilityRendererSchema),
  playlistLoopStateEntity: ytv_sch({
    key: ytv_str(),
    state: ytv_str(['PLAYLIST_LOOP_STATE_ALL', 'PLAYLIST_LOOP_STATE_NONE', 'PLAYLIST_LOOP_STATE_ONE'])
  }),
  replyCountEntity: ytv_sch({
    key: ytv_str(),
    replyButtonAccessibilityText: ytv_str(),
    replyCount: ytv_unk(), // YTTextViewModelSchema
    replyCountNumber: ytv_str()
  }),
  subscriptionNotificationStateEntity: ytv_sch({
    key: ytv_str(),
    state: ytv_str(['SUBSCRIPTION_NOTIFICATION_STATE_OCCASIONAL'])
  }),
  subscriptionStateEntity: ytv_sch({
    key: ytv_str(),
    subscribed: ytv_bol()
  }),
  triStateButtonStateEntityPayload: ytv_sch({
    key: ytv_str(),
    stateIdentifier: ytv_str(['TRI_STATE_IDENTIFIER_UNTOGGLED_STATE'])
  }),
  videoActionButtonEnablementEntity: ytv_sch({
    enabled: ytv_bol(),
    videoActionButtonEnablementEntityKey: ytv_str()
  }),
  viewCountEntity: ytv_sch({
    extraShortViewCount: ytv_sch(YTTextSchema),
    key: ytv_str(),
    unlabeledViewCountValue: ytv_sch(YTTextSchema),
    viewCount: ytv_sch(YTTextSchema),
    viewCountLabel: ytv_sch(YTTextSchema),
    viewCountLength: ytv_num(),
    viewCountNumber: ytv_str()
  })
} satisfies YTObjectSchema

export const YTEntityMutationSchema = {
  entityKey: ytv_str(),
  options: ytv_sch(YTEntityMutationOptionSchema),
  payload: ytv_sch(YTEntityMutationPayloadSchema),
  type: ytv_str(['ENTITY_MUTATION_TYPE_DELETE', 'ENTITY_MUTATION_TYPE_REPLACE'])
} satisfies YTObjectSchema

export const YTWatchEndpointLoggingContextSchema = {
  qoeLoggingContext: ytv_sch({
    serializedContextData: ytv_str()
  }),
  vssLoggingContext: ytv_sch({
    serializedContextData: ytv_str()
  })
} satisfies YTObjectSchema

export const YTEndpointSchemaMap = {
  // Action
  addChatItemAction: {
    clientId: ytv_str(),
    item: ytv_ren(),
    stickinessParams: ytv_sch({
      dockAtTopDurationMs: ytv_num()
    })
  },
  addLiveChatTextMessageFromTemplateAction: {
    template: ytv_ren()
  },
  addLiveChatTickerItemAction: {
    durationSec: ytv_str(),
    item: ytv_ren()
  },
  appendContinuationItemsAction: {
    continuationItems: ytv_arr(ytv_ren()),
    targetId: ytv_str()
  },
  changeEngagementPanelVisibilityAction: {
    targetId: ytv_str(),
    visibility: ytv_str(YTEngagementPanelVisibility)
  },
  hideEngagementPanelScrimAction: {
    engagementPanelTargetId: ytv_str()
  },
  openClientOverlayAction: {
    context: ytv_str(),
    type: ytv_str(['CLIENT_OVERLAY_TYPE_ADD_TO_PLAYLIST', 'CLIENT_OVERLAY_TYPE_AUDIO_OPTIONS', 'CLIENT_OVERLAY_TYPE_PLAYBACK_SETTINGS', 'CLIENT_OVERLAY_TYPE_SEND_FEEDBACK_SECONDARY', 'CLIENT_OVERLAY_TYPE_VIDEO_PLAYBACK_SPEED', 'CLIENT_OVERLAY_TYPE_VIDEO_QUALITY', 'CLIENT_OVERLAY_TYPE_VIDEO_REPORTING'])
  },
  openPopupAction: {
    accessibilityData: ytv_sch(YTAccessibilitySchema),
    beReused: ytv_bol(),
    durationHintMs: ytv_num(),
    popup: ytv_ren(),
    popupType: ytv_str(['DIALOG', 'DROPDOWN', 'FULLSCREEN_OVERLAY', 'HINT', 'LOCKED_MODAL', 'MODAL', 'NOTIFICATION', 'RESPONSIVE_DROPDOWN', 'SURVEY', 'TOP_ALIGNED_DIALOG', 'TOAST']),
    replacePopup: ytv_bol()
  },
  removeChatItemAction: {
    targetItemId: ytv_str()
  },
  replaceEnclosingAction: {
    groupDismissal: ytv_sch({
      behavior: ytv_str(['GROUP_DISMISSAL_BEHAVIOR_REMOVE_SUBSEQUENT_ITEMS']),
      targetGroupId: ytv_str()
    }),
    item: ytv_ren(),
    replaceParentSection: ytv_bol(),
    targetId: ytv_str()
  },
  replayChatItemAction: {
    actions: ytv_arr(ytv_enp()),
    videoOffsetTimeMsec: ytv_str()
  },
  sendFeedbackAction: {
    bucket: ytv_str()
  },
  setLiveChatCollapsedStateAction: {},
  showEngagementPanelScrimAction: {
    engagementPanelTargetId: ytv_str(),
    onClickCommands: ytv_arr(ytv_enp())
  },
  signalAction: {
    signal: ytv_str(YTSignalActionType),
    targetId: ytv_str()
  },
  undoFeedbackAction: {
    hack: ytv_bol(),
    targetId: ytv_str()
  },
  updateCommentVoteAction: {
    voteCount: ytv_sch(YTTextSchema),
    voteStatus: ytv_str(YTLikeStatus)
  },
  updateDateTextAction: {
    dateText: ytv_sch(YTTextSchema)
  },
  updateDescriptionAction: {
    description: ytv_sch(YTTextSchema)
  },
  updateLiveChatPollAction: {
    pollToUpdate: ytv_ren()
  },
  updateTitleAction: {
    title: ytv_sch(YTTextSchema)
  },
  updateViewershipAction: {
    viewCount: ytv_ren()
  },

  // Command
  addBannerToLiveChatCommand: {
    bannerRenderer: ytv_ren()
  },
  addToPlaylistCommand: {
    listType: ytv_str(['PLAYLIST_EDIT_LIST_TYPE_QUEUE']),
    onCreateListCommand: ytv_enp(),
    openListPanel: ytv_bol(),
    openMiniplayer: ytv_bol(),
    videoCommand: ytv_enp(),
    videoId: ytv_str(),
    videoIds: ytv_arr(ytv_str())
  },
  adsControlFlowOpportunityReceivedCommand: {
    adSlotAndLayoutMetadata: ytv_arr(ytv_sch({
      adLayoutMetadata: ytv_arr(ytv_unk()),
      adSlotMetadata: ytv_sch({
        adSlotLoggingData: ytv_sch(YTAdSlotLoggingDataSchema),
        slotId: ytv_str(),
        slotPhysicalPosition: ytv_num(),
        slotType: ytv_str(['SLOT_TYPE_IN_FEED'])
      })
    })),
    enablePacfLoggingWeb: ytv_bol(),
    isInitialLoad: ytv_bol(),
    opportunityType: ytv_str(['OPPORTUNITY_TYPE_ORGANIC_SEARCH_RESPONSE_RECEIVED', 'OPPORTUNITY_TYPE_REEL_WATCH_SEQUENCE_RESPONSE_RECEIVED'])
  },
  authDeterminedCommand: {
    authenticatedCommand: ytv_enp(),
    unauthenticatedCommand: ytv_enp()
  },
  authRequiredCommand: {
    identityActionContext: ytv_sch({
      eventTrigger: ytv_str(['ACCOUNT_EVENT_TRIGGER_LIKE_DISLIKE', 'ACCOUNT_EVENT_TRIGGER_SAVE_VIDEO', 'ACCOUNT_EVENT_TRIGGER_SUBSCRIBE']),
      nextEndpoint: ytv_enp()
    })
  },
  changeMarkersVisibilityCommand: {
    entityKeys: ytv_arr(ytv_str()),
    isVisible: ytv_bol(),
    visibilityRestrictionMode: ytv_str(['CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_NOT_OVERWRITE_SAME_TYPE', 'CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_UNKNOWN'])
  },
  changeTimelyActionVisibilityCommand: {
    id: ytv_str(),
    isVisible: ytv_bol()
  },
  commandExecutorCommand: {
    commands: ytv_arr(ytv_enp())
  },
  continuationCommand: {
    command: ytv_enp(),
    request: ytv_str(['CONTINUATION_REQUEST_TYPE_ACCOUNTS_LIST', 'CONTINUATION_REQUEST_TYPE_BROWSE', 'CONTINUATION_REQUEST_TYPE_COMMENTS_NOTIFICATION_MENU', 'CONTINUATION_REQUEST_TYPE_COMMENT_REPLIES', 'CONTINUATION_REQUEST_TYPE_GET_PANEL', 'CONTINUATION_REQUEST_TYPE_REEL_WATCH_SEQUENCE', 'CONTINUATION_REQUEST_TYPE_SEARCH', 'CONTINUATION_REQUEST_TYPE_WATCH_NEXT']),
    token: ytv_str()
  },
  elementsCommand: {
    setEntityCommand: ytv_sch({
      entity: ytv_str(),
      identifier: ytv_str()
    })
  },
  entityUpdateCommand: {
    elementUpdate: ytv_arr(ytv_sch({
      resourceStatusInResponseCheck: ytv_sch({
        resourceStatuses: ytv_arr(ytv_sch({
          identifier: ytv_str(),
          status: ytv_str(['ELEMENTS_RESOURCE_STATUS_ATTACHED'])
        })),
        serverBuildLabel: ytv_str()
      }),
      templateUpdate: ytv_sch({
        dependencies: ytv_arr(ytv_str()),
        identifier: ytv_str(),
        serializedTemplateConfig: ytv_str(),
        templateType: ytv_str(['TEMPLATE_TYPE_EKO'])
      })
    })),
    entityBatchUpdate: ytv_sch({
      mutations: ytv_arr(ytv_sch(YTEntityMutationSchema)),
      timestamp: ytv_sch({
        nanos: ytv_num(),
        seconds: ytv_str()
      })
    })
  },
  getDownloadActionCommand: {
    offlineabilityEntityKey: ytv_str(),
    params: ytv_str(),
    videoId: ytv_str()
  },
  getPdgBuyFlowCommand: {
    params: ytv_str()
  },
  getSurveyCommand: {
    action: ytv_str(['SURVEY_TRIGGER_ACTION_AUTOPLAY_CANCEL', 'SURVEY_TRIGGER_ACTION_SMART_SKIP_JUMP_AHEAD']),
    endpoint: ytv_sch({
      watch: ytv_sch({
        hack: ytv_bol()
      })
    })
  },
  handoffInitiateActionCommand: {
    lrDeviceState: ytv_sch({
      canCreateComments: ytv_bol(),
      isPauseCommentsEnabled: ytv_bol()
    }),
    type: ytv_str(['HANDOFF_FEATURE_TYPE_LR_COMMENTS'])
  },
  hideItemSectionVideosByIdCommand: {
    videoId: ytv_str()
  },
  liveChatReportModerationStateCommand: {},
  loadMarkersCommand: {
    entityKeys: ytv_arr(ytv_str()),
    visibleOnLoadKeys: ytv_arr(ytv_str())
  },
  localWatchHistoryCommand: {
    localWatchHistoryCommandType: ytv_str(['LOCAL_WATCH_HISTORY_COMMAND_TYPE_REMOVE']),
    videoId: ytv_str()
  },
  loopCommand: {
    loop: ytv_bol()
  },
  openSuperStickerBuyFlowCommand: {
    params: ytv_str()
  },
  parallelCommand: { // Same as commandExecutorCommand
    commands: ytv_arr(ytv_enp())
  },
  performOnceCommand: {
    identifier: ytv_str(),
    command: ytv_enp()
  },
  relatedChipCommand: {
    contents: ytv_arr(ytv_ren()),
    loadCached: ytv_bol(),
    targetSectionIdentifier: ytv_str()
  },
  reloadContinuationItemsCommand: {
    continuationItems: ytv_arr(ytv_ren()),
    slot: ytv_str(['RELOAD_CONTINUATION_SLOT_BODY', 'RELOAD_CONTINUATION_SLOT_HEADER']),
    targetId: ytv_str()
  },
  repeatChapterCommand: {
    endTimeMs: ytv_str(),
    repeat: ytv_str(['REPEAT_CHAPTER_TYPE_ENABLE_REPEAT', 'REPEAT_CHAPTER_TYPE_DISABLE_REPEAT']),
    repeatStateEntityKey: ytv_str(),
    startTimeMs: ytv_str()
  },
  resetChannelUnreadCountCommand: {
    channelId: ytv_str()
  },
  seekToVideoTimestampCommand: {
    offsetFromVideoStartMilliseconds: ytv_str(),
    videoId: ytv_str()
  },
  selectSubtitlesTrackCommand: {
    useDefaultTrack: ytv_bol()
  },
  serialCommand: { // Same as commandExecutorCommand
    commands: ytv_arr(ytv_enp())
  },
  setAppBackgroundCommand: {
    image: ytv_sch(YTThumbnailSchema),
    scrimStyle: ytv_str(['SCRIM_STYLE_CAROUSEL']),
    target: ytv_str(['APP_BACKGROUND_TARGET_ACCOUNTS', 'APP_BACKGROUND_TARGET_BROWSE', 'APP_BACKGROUND_TARGET_OVERLAY', 'APP_BACKGROUND_TARGET_SEARCH', 'APP_BACKGROUND_TARGET_WATCH_SQUEEZEBACK', 'APP_BACKGROUND_TARGET_WELCOME'])
  },
  scrollToEngagementPanelCommand: {
    panelIdentifier: ytv_sch(YTEngagementPanelIdentifier),
    targetId: ytv_str()
  },
  showDialogCommand: {
    panelLoadingStrategy: ytv_sch({
      inlineContent: ytv_ren()
    })
  },
  showHintCommand: {
    shouldShowHint: ytv_bol()
  },
  showMenuCommand: {
    contentId: ytv_str(),
    menu: ytv_ren(),
    subtitle: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema)
  },
  showMiniplayerCommand: {
    miniplayerCommand: ytv_enp(),
    showPremiumBranding: ytv_bol()
  },
  showReloadUiCommand: {
    targetId: ytv_str()
  },
  showSheetCommand: {
    panelLoadingStrategy: ytv_sch({
      inlineContent: ytv_ren()
    })
  },
  showSponsorshipsGiftOfferDialogCommand: {
    contentCommand: ytv_enp()
  },
  showTransientPlayerScrimOverlayCommand: {
    durationMs: ytv_num(),
    fadeInDurationMs: ytv_num(),
    fadeOutDurationMs: ytv_num(),
    overlayRenderer: ytv_ren()
  },
  startAccountSelectorCommand: {},
  toggleLiveReactionsMuteCommand: {
    hack: ytv_bol()
  },
  updateCarouselHeaderCommand: {
    spotlight: ytv_ren()
  },
  updateEngagementPanelContentCommand: {
    contentSourcePanelIdentifier: ytv_sch(YTEngagementPanelIdentifier),
    targetPanelIdentifier: ytv_sch(YTEngagementPanelIdentifier)
  },
  updateTimedMarkersSyncObserverCommand: {
    isEnabled: ytv_bol(),
    panelSyncEntityKey: ytv_str(),
    timedSyncEntityKey: ytv_str()
  },
  updateToggleButtonStateCommand: {
    buttonId: ytv_str(),
    toggled: ytv_bol()
  },

  // Endpoint
  addToPlaylistServiceEndpoint: {
    params: ytv_str(),
    videoId: ytv_str()
  },
  addUpcomingEventReminderEndpoint: {
    params: ytv_str()
  },
  applicationSettingsEndpoint: {
    hack: ytv_bol()
  },
  browseEndpoint: {
    browseEndpointContextSupportedConfigs: ytv_sch({
      browseEndpointContextMusicConfig: ytv_sch({
        pageType: ytv_str(['MUSIC_PAGE_TYPE_ALBUM', 'MUSIC_PAGE_TYPE_PLAYLIST'])
      })
    }),
    browseId: ytv_str(),
    canonicalBaseUrl: ytv_str(),
    params: ytv_str()
  },
  captionPickerEndpoint: {
    videoId: ytv_str()
  },
  confirmDialogEndpoint: {
    content: ytv_ren()
  },
  createBackstagePostEndpoint: {
    createBackstagePostParams: ytv_str()
  },
  createCommentEndpoint: {
    createCommentParams: ytv_str(),
  },
  createCommentReplyDialogEndpoint: {
    dialog: ytv_ren()
  },
  createCommentReplyEndpoint: {
    createReplyParams: ytv_str()
  },
  createPlaylistServiceEndpoint: {
    params: ytv_str(),
    videoIds: ytv_arr(ytv_str())
  },
  feedbackEndpoint: {
    actions: ytv_arr(ytv_enp()),
    contentId: ytv_str(),
    feedbackToken: ytv_str(),
    onFailureAction: ytv_enp(),
    uiActions: ytv_sch({
      hideEnclosingContainer: ytv_bol()
    })
  },
  flagEndpoint: {
    flagAction: ytv_str()
  },
  getReportFormEndpoint: {
    params: ytv_str()
  },
  getTranscriptEndpoint: {
    params: ytv_str()
  },
  hideEngagementPanelEndpoint: {
    identifier: ytv_sch(YTEngagementPanelIdentifier),
    panelIdentifier: ytv_str()
  },
  likeEndpoint: {
    dislikeParams: ytv_str(),
    likeParams: ytv_str(),
    removeLikeParams: ytv_str(),
    status: ytv_str(YTLikeStatus),
    target: ytv_sch({
      playlistId: ytv_str(),
      videoId: ytv_str()
    })
  },
  liveChatActionEndpoint: {
    params: ytv_str()
  },
  liveChatDialogEndpoint: {
    content: ytv_ren()
  },
  liveChatItemContextMenuEndpoint: {
    params: ytv_str()
  },
  liveChatPurchaseMessageEndpoint: {
    params: ytv_str()
  },
  menuEndpoint: {
    menu: ytv_ren()
  },
  modalEndpoint: {
    modal: ytv_ren()
  },
  modifyChannelNotificationPreferenceEndpoint: {
    params: ytv_str()
  },
  offlineVideoEndpoint: {
    onAddCommand: ytv_enp(),
    videoId: ytv_str()
  },
  performCommentActionEndpoint: {
    action: ytv_str(),
    clientActions: ytv_arr(ytv_enp())
  },
  pingingEndpoint: {
    hack: ytv_bol()
  },
  playlistEditEndpoint: {
    actions: ytv_arr(ytv_sch({
      action: ytv_str(['ACTION_ADD_VIDEO', 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID']),
      addedVideoId: ytv_str(),
      removedVideoId: ytv_str()
    })),
    playlistId: ytv_str()
  },
  popoutLiveChatEndpoint: {
    url: ytv_str()
  },
  reelWatchEndpoint: {
    adClientParams: ytv_sch({
      isAd: ytv_bol()
    }),
    identifier: ytv_str(),
    inputType: ytv_str(['REEL_WATCH_INPUT_TYPE_SEEDLESS']),
    loggingContext: ytv_sch(YTWatchEndpointLoggingContextSchema),
    overlay: ytv_ren(),
    params: ytv_str(),
    playerParams: ytv_str(),
    sequenceParams: ytv_str(),
    sequenceProvider: ytv_str(['REEL_WATCH_SEQUENCE_PROVIDER_RPC']),
    thumbnail: ytv_sch(YTThumbnailSchema),
    updateKey: ytv_str(),
    ustreamerConfig: ytv_str(),
    videoId: ytv_str()
  },
  removeUpcomingEventReminderEndpoint: {
    params: ytv_str()
  },
  searchEndpoint: {
    params: ytv_str(),
    query: ytv_str()
  },
  sendLiveChatMessageEndpoint: {
    actions: ytv_arr(ytv_enp()),
    clientIdPrefix: ytv_str(),
    params: ytv_str()
  },
  sendLiveChatVoteEndpoint: {
    params: ytv_str()
  },
  setClientSettingEndpoint: {
    settingDatas: ytv_arr(ytv_sch({
      boolValue: ytv_bol(),
      clientSettingEnum: ytv_sch({
        item: ytv_str(['USER_AUDIO_51_PREFERENCE'])
      })
    }))
  },
  setSettingEndpoint: {
    boolValue: ytv_bol(),
    settingItemId: ytv_str(),
    settingItemIdForClient: ytv_str(['AUTONAV_FOR_DESKTOP', 'AUTONAV_FOR_SIGN_OUT'])
  },
  shareEntityEndpoint: {
    serializedShareEntity: ytv_str(),
    sharePanelType: ytv_str(['SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL'])
  },
  shareEntityServiceEndpoint: {
    commands: ytv_arr(ytv_enp()),
    serializedShareEntity: ytv_str()
  },
  showEngagementPanelEndpoint: {
    engagementPanel: ytv_ren(),
    engagementPanelExtras: ytv_sch({
      sectionListEngagementPanelExtras: ytv_sch({
        scrollToItemSectionIdentifier: ytv_str(),
        scrollToItemSectionOffsetDistance: ytv_num()
      })
    }),
    engagementPanelPresentationConfigs: ytv_sch({
      engagementPanelPopupPresentationConfig: ytv_sch({
        popupType: ytv_str(['PANEL_POPUP_TYPE_DIALOG'])
      })
    }),
    forcePortrait: ytv_bol(),
    globalConfiguration: ytv_sch({
      initialState: ytv_ren(),
      params: ytv_str()
    }),
    identifier: ytv_sch(YTEngagementPanelIdentifier),
    panelIdentifier: ytv_str(),
    sourcePanelIdentifier: ytv_str()
  },
  showLiveChatItemEndpoint: {
    renderer: ytv_ren(),
    trackingParams: ytv_str() // What??
  },
  showLiveChatParticipantsEndpoint: {
    hack: ytv_bol()
  },
  signInEndpoint: {
    continueAction: ytv_str(),
    hack: ytv_bol(),
    idamTag: ytv_str(),
    nextEndpoint: ytv_enp()
  },
  signalNavigationEndpoint: {
    signal: ytv_str(['ACCOUNT_SETTINGS', 'LIVE_CONTROL_ROOM'])
  },
  signalServiceEndpoint: {
    actions: ytv_arr(ytv_enp()),
    signal: ytv_str(['CLIENT_SIGNAL', 'GET_ACCOUNT_MENU', 'GET_NOTIFICATIONS_MENU', 'GET_NOTIFICATIONS_INBOX', 'GET_UNSEEN_NOTIFICATION_COUNT', 'GET_USER_MENTION_SUGGESTIONS', 'LOAD_GUIDE', 'SUBMIT_FEEDBACK'])
  },
  subscribeEndpoint: {
    channelIds: ytv_arr(ytv_str()),
    params: ytv_str()
  },
  toggleLiveChatTimestampsEndpoint: {
    hack: ytv_bol()
  },
  undoFeedbackEndpoint: {
    actions: ytv_arr(ytv_enp()),
    contentId: ytv_str(),
    undoToken: ytv_str()
  },
  unsubscribeEndpoint: {
    channelIds: ytv_arr(ytv_str()),
    params: ytv_str()
  },
  updatedMetadataEndpoint: {
    initialDelayMs: ytv_num(),
    params: ytv_str(),
    videoId: ytv_str()
  },
  uploadEndpoint: {
    hack: ytv_bol()
  },
  urlEndpoint: {
    attributionSrcMode: ytv_str(['ATTRIBUTION_SRC_MODE_LABEL_CHROME']),
    nofollow: ytv_bol(),
    target: ytv_str(['TARGET_NEW_WINDOW']),
    url: ytv_str()
  },
  verifyAgeEndpoint: {
    nextEndpoint: ytv_enp()
  },
  userFeedbackEndpoint: {
    additionalDatas: ytv_arr(ytv_sch({
      userFeedbackEndpointProductSpecificValueData: ytv_sch({
        key: ytv_str(),
        value: ytv_str()
      })
    })),
    bucketIdentifier: ytv_str(),
    hack: ytv_bol()
  },
  watchEndpoint: {
    continuePlayback: ytv_bol(),
    index: ytv_num(),
    nofollow: ytv_bol(),
    loggingContext: ytv_sch(YTWatchEndpointLoggingContextSchema),
    params: ytv_str(),
    playerExtraUrlParams: ytv_arr(ytv_sch({
      key: ytv_str(),
      value: ytv_str()
    })),
    playerParams: ytv_str(),
    playlistId: ytv_str(),
    playlistSetVideoId: ytv_str(),
    replayIfSameVideo: ytv_bol(),
    startTimeSeconds: ytv_num(),
    ustreamerConfig: ytv_str(),
    videoId: ytv_str(),
    watchEndpointMdxConfig: ytv_sch({
      mdxPlaybackSourceContext: ytv_sch({})
    }),
    watchEndpointMusicSupportedConfigs: ytv_sch({
      watchEndpointMusicConfig: ytv_sch({
        musicVideoType: ytv_str(YTMusicVideoType)
      })
    }),
    watchEndpointSupportedOnesieConfig: ytv_sch({
      html5PlaybackOnesieConfig: ytv_sch({
        commonConfig: ytv_sch({
          url: ytv_str(),
          ustreamerConfig: ytv_str()
        })
      })
    }),
    watchEndpointSupportedPrefetchConfig: ytv_sch({
      prefetchHintConfig: ytv_sch({
        countdownUiRelativeSecondsPrefetchCondition: ytv_num(),
        playbackRelativeSecondsPrefetchCondition: ytv_num(),
        prefetchPriority: ytv_num()
      }),
      sabrPrefetchEndpointConfig: ytv_sch({
        disablePrefetch: ytv_bol(),
        maximumAllowableTimeMsBeforePlaybackToPrefetch: ytv_num()
      })
    })
  },
  watchPlaylistEndpoint: {
    index: ytv_num(),
    params: ytv_str(),
    playlistId: ytv_str()
  },
  webPlayerShareEntityServiceEndpoint: {
    serializedShareEntity: ytv_str()
  },
  ypcGetOffersEndpoint: {
    params: ytv_str()
  },
  ypcOffersEndpoint: {
    params: ytv_str()
  }
} satisfies Record<string, YTEndpointSchema>

export const YTEndpointOuterSchema = {
  clickTrackingParams: ytv_str(),
  commandMetadata: ytv_enp(YTCommandMetadataSchema),
  loggingUrls: ytv_arr(ytv_sch(YTUrlSchema)),

  // Special Command
  innertubeCommand: ytv_enp(),
  logGestureCommand: ytv_ren({
    gestureType: ytv_str(['GESTURE_EVENT_TYPE_LOG_GENERIC_CLICK'])
  })
} satisfies YTObjectSchema

export type YTEndpointKey = keyof typeof YTEndpointSchemaMap
export type YTEndpoint<K extends YTEndpointKey = YTEndpointKey> = typeof YTEndpointSchemaMap[K]
export type YTEndpointOuterData = YTObjectData<typeof YTEndpointOuterSchema>