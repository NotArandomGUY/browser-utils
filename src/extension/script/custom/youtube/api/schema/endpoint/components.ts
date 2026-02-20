import { ytv_enp, ytv_ren } from '../define/extended'
import { ytv_arr, ytv_bol, ytv_num, ytv_obj, ytv_sch, ytv_str, ytv_unk } from '../define/primitive'

import * as common from '../common'
import * as renderer from '../renderer'
import * as enums from './enums'

// Entities
export const booleanEntity = ytv_sch(() => ({
  key: ytv_str(),
  value: ytv_bol()
}))
export const chipBarStateEntity = ytv_sch(() => ({
  key: ytv_str(),
  selectedIndex: ytv_num()
}))
export const downloadQualityPickerEntity = ytv_sch(() => ({
  formats: ytv_arr(ytv_sch({
    approximateSize: ytv_str(),
    availabilityType: ytv_str(renderer.enums.OfflineabilityAvailabilityType),
    format: ytv_str(common.enums.OfflineFormatType),
    name: ytv_str(),
    savedSettingShouldExpire: ytv_bol()
  })),
  key: ytv_str(),
  rememberSettingString: ytv_str()
}))
export const emojiFountainDataEntity = ytv_sch(() => ({
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
}))
export const flowStateEntity = ytv_sch(() => ({
  currentStepId: ytv_str(),
  key: ytv_str()
}))
export const likeStatusEntity = ytv_sch(() => ({
  key: ytv_str(),
  likeStatus: ytv_str(common.enums.LikeStatus)
}))
export const liveChatPollStateEntity = ytv_sch(() => ({
  collapsedMetadataText: renderer.components.text,
  key: ytv_str(),
  metadataText: renderer.components.text,
  pollChoiceStates: ytv_arr(ytv_sch({
    key: ytv_num(),
    value: ytv_sch({
      votePercentage: renderer.components.text,
      voteRatio: ytv_num()
    })
  })),
  postVoteCountText: ytv_str(),
  preVoteCountText: ytv_str()
}))
export const liveViewerLeaderboardChatEntryPointStateEntity = ytv_sch(() => ({
  key: ytv_str(),
  state: ytv_str(['LIVE_VIEWER_LEADERBOARD_CHAT_ENTRY_POINT_STATE_POINTS_AVAILABLE'])
}))
export const liveViewerLeaderboardPointsEntity = ytv_sch(() => ({
  key: ytv_str(),
  pointsCompactText: ytv_str(),
  pointsValue: ytv_num()
}))
export const macroMarkersListEntity = ytv_sch(() => ({
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
        icon: ytv_str(renderer.enums.IconType),
        label: renderer.components.text,
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
}))
export const playlistLoopStateEntity = ytv_sch(() => ({
  key: ytv_str(),
  state: ytv_str(['PLAYLIST_LOOP_STATE_ALL', 'PLAYLIST_LOOP_STATE_NONE', 'PLAYLIST_LOOP_STATE_ONE'])
}))
export const replyCountEntity = ytv_sch(() => ({
  key: ytv_str(),
  replyButtonAccessibilityText: ytv_str(),
  replyCount: renderer.mapped.textViewModel,
  replyCountNumber: ytv_str()
}))
export const subscriptionNotificationStateEntity = ytv_sch(() => ({
  key: ytv_str(),
  state: ytv_str(['SUBSCRIPTION_NOTIFICATION_STATE_OCCASIONAL'])
}))
export const subscriptionStateEntity = ytv_sch(() => ({
  key: ytv_str(),
  subscribed: ytv_bol()
}))
export const videoActionButtonEnablementEntity = ytv_sch(() => ({
  enabled: ytv_bol(),
  videoActionButtonEnablementEntityKey: ytv_str()
}))
export const viewCountEntity = ytv_sch(() => ({
  extraShortViewCount: renderer.components.text,
  key: ytv_str(),
  unlabeledViewCountValue: renderer.components.text,
  viewCount: renderer.components.text,
  viewCountLabel: renderer.components.text,
  viewCountLength: ytv_num(),
  viewCountNumber: ytv_str()
}))

// Components
export const entityMutationOption = ytv_sch({
  persistenceOption: ytv_str(['ENTITY_PERSISTENCE_OPTION_INMEMORY_AND_PERSIST', 'ENTITY_PERSISTENCE_OPTION_PERSIST'])
})
export const entityMutationPayload = ytv_sch(() => ({
  booleanEntity,
  commentEntityPayload: ytv_sch({
    author: ytv_unk(),
    avatar: ytv_unk(),
    isTranslationAvailable: ytv_bol(),
    key: ytv_str(),
    loggingDirectives: renderer.components.loggingDirectives,
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
      loggingDirectives: renderer.components.loggingDirectives
    }),
    threadLines: ytv_sch({}),
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
    commentEnvironment: common.components.environment,
    environment: common.components.environment,
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
  chipBarStateEntity,
  downloadQualityPickerEntity,
  emojiFountainDataEntity,
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
  flowStateEntity,
  likeCountEntity: ytv_unk(),
  likeStatusEntity,
  liveChatPollStateEntity,
  liveViewerLeaderboardChatEntryPointStateEntity,
  liveViewerLeaderboardPointsEntity,
  macroMarkersListEntity,
  offlineVideoPolicy: ytv_sch({
    action: ytv_str(['OFFLINE_VIDEO_POLICY_ACTION_DISABLE', 'OFFLINE_VIDEO_POLICY_ACTION_DOWNLOAD_FAILED', 'OFFLINE_VIDEO_POLICY_ACTION_OK']),
    expirationTimestamp: ytv_str(),
    key: ytv_str(),
    lastUpdatedTimestampSeconds: ytv_str(),
    offlineStateBytes: ytv_str(),
    offlineToken: ytv_str(),
    shortMessageForDisabledAction: ytv_str()
  }),
  offlineabilityEntity: renderer.mapped.offlineabilityRenderer,
  playbackData: ytv_sch({
    key: ytv_str(),
    offlineVideoPolicy: ytv_str(),
    playerResponseJson: ytv_str(),
    playerResponsePlayabilityCanPlayStatus: ytv_str(),
    playerResponseTimestamp: ytv_str(),
    streamDownloadTimestampSeconds: ytv_str(),
    transfer: ytv_str(),
    videoDownloadContextEntity: ytv_str()
  }),
  playlistLoopStateEntity,
  replyCountEntity,
  subscriptionNotificationStateEntity,
  subscriptionStateEntity,
  triStateButtonStateEntityPayload: ytv_sch({
    key: ytv_str(),
    stateIdentifier: ytv_str(['TRI_STATE_IDENTIFIER_UNTOGGLED_STATE'])
  }),
  videoActionButtonEnablementEntity,
  viewCountEntity
}))
export const entityMutation = ytv_sch({
  entityKey: ytv_str(),
  options: entityMutationOption,
  payload: entityMutationPayload,
  type: ytv_str(['ENTITY_MUTATION_TYPE_DELETE', 'ENTITY_MUTATION_TYPE_REPLACE'])
})
export const watchEndpointLoggingContext = ytv_sch({
  qoeLoggingContext: ytv_sch({
    serializedContextData: ytv_str()
  }),
  vssLoggingContext: ytv_sch({
    serializedContextData: ytv_str()
  })
})

// Metadata components
export const interactionLoggingCommandMetadata = ytv_enp({
  loggingExpectations: ytv_sch({
    screenCreatedLoggingExpectations: ytv_sch({
      expectedParentScreens: ytv_arr(ytv_sch({
        screenVeType: ytv_num()
      }))
    })
  }),
  screenVisualElement: ytv_sch({
    uiType: ytv_num()
  })
})
export const webCommandMetadata = ytv_enp({
  apiUrl: ytv_str(),
  ignoreNavigation: ytv_bol(),
  rootVe: ytv_num(),
  sendPost: ytv_bol(),
  url: ytv_str(),
  webPageType: ytv_str(enums.WebPageType)
})