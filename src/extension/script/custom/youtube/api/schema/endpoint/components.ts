import { ytv_enp, ytv_ren } from '../define/extended'
import { ytv_arr, ytv_bol, ytv_num, ytv_obj, ytv_sto, ytv_str, ytv_unk } from '../define/primitive'

import * as common from '../common'
import * as renderer from '../renderer'
import * as enums from './enums'

// Entities
export const booleanEntity = ytv_sto(() => ({
  key: ytv_str(),
  value: ytv_bol()
}))
export const chipBarStateEntity = ytv_sto(() => ({
  key: ytv_str(),
  selectedIndex: ytv_num()
}))
export const chipEntity = ytv_sto(() => ({
  key: ytv_str(),
  text: ytv_str()
}))
export const downloadQualityPickerEntity = ytv_sto(() => ({
  formats: ytv_arr(ytv_sto({
    approximateSize: ytv_str(),
    availabilityType: ytv_str(renderer.enums.OfflineabilityAvailabilityType),
    format: ytv_str(common.enums.OfflineFormatType),
    name: ytv_str(),
    savedSettingShouldExpire: ytv_bol()
  })),
  key: ytv_str(),
  rememberSettingString: ytv_str()
}))
export const emojiFountainDataEntity = ytv_sto(() => ({
  key: ytv_str(),
  reactionBuckets: ytv_arr(ytv_sto({
    duration: common.components.highResTime,
    intensityScore: ytv_num(),
    reactionsData: ytv_arr(ytv_sto({
      reactionCount: ytv_num(),
      unicodeEmojiId: ytv_str()
    })),
    totalReactions: ytv_num()
  })),
  updateTimeUsec: ytv_str()
}))
export const featuredProductsEntity = ytv_sto(() => ({
  key: ytv_str(),
  productsData: ytv_arr(ytv_sto({
    bannerData: ytv_sto({
      bannerDismissCommand: ytv_enp(),
      dismissedStatusKey: ytv_str(),
      droppedProductItemDataEntityKey: ytv_str(),
      itemData: ytv_ren({
        accessibilityLabel: ytv_str(),
        ctaDescriptionText: ytv_str(),
        dealsData: ytv_sto({
          currentPrice: ytv_str()
        }),
        encodedOfferSkuId: ytv_str(),
        featuredProductIdentifier: ytv_str(),
        menuOnTap: ytv_enp(),
        offerDocId: ytv_str(),
        onTapCommand: ytv_enp(),
        price: ytv_str(),
        priceReplacementText: ytv_str(),
        productDescription: ytv_str(),
        productTitle: ytv_str(),
        stayInApp: ytv_bol(),
        thumbnailSources: ytv_arr(renderer.components.imageSource),
        vendorLogoUrl: ytv_str(),
        vendorName: ytv_str()
      })
    }),
    featuredSegments: ytv_arr(ytv_sto({
      endTimeSec: ytv_str(),
      startTimeSec: ytv_str()
    })),
    identifier: ytv_str()
  }))
}))
export const flowStateEntity = ytv_sto(() => ({
  currentStepId: ytv_str(),
  key: ytv_str()
}))
export const likeButtonAnimationEntity = ytv_sto({
  animationDarkUrl: ytv_str(),
  animationLightUrl: ytv_str(),
  key: ytv_str()
})
export const likeCountEntity = ytv_sto(() => ({
  expandedLikeCountIfDisliked: renderer.mapped.textViewModel,
  expandedLikeCountIfIndifferent: renderer.mapped.textViewModel,
  expandedLikeCountIfLiked: renderer.mapped.textViewModel,
  key: ytv_str(),
  likeButtonA11yText: renderer.mapped.textViewModel,
  likeCountIfDisliked: renderer.mapped.textViewModel,
  likeCountIfDislikedNumber: ytv_str(),
  likeCountIfIndifferent: renderer.mapped.textViewModel,
  likeCountIfIndifferentNumber: ytv_str(),
  likeCountIfLiked: renderer.mapped.textViewModel,
  likeCountIfLikedNumber: ytv_str(),
  likeCountLabel: renderer.mapped.textViewModel,
  sentimentFactoidA11yTextIfDisliked: renderer.mapped.textViewModel,
  sentimentFactoidA11yTextIfLiked: renderer.mapped.textViewModel,
  shouldExpandLikeCount: ytv_bol()
}))
export const likeStatusEntity = ytv_sto(() => ({
  key: ytv_str(),
  likeStatus: ytv_str(common.enums.LikeStatus)
}))
export const liveChatPollStateEntity = ytv_sto(() => ({
  collapsedMetadataText: renderer.components.text,
  key: ytv_str(),
  metadataText: renderer.components.text,
  pollChoiceStates: ytv_arr(ytv_sto({
    key: ytv_num(),
    value: ytv_sto({
      votePercentage: renderer.components.text,
      voteRatio: ytv_num()
    })
  })),
  postVoteCountText: ytv_str(),
  preVoteCountText: ytv_str()
}))
export const liveViewerLeaderboardChatEntryPointStateEntity = ytv_sto(() => ({
  key: ytv_str(),
  state: ytv_str(['LIVE_VIEWER_LEADERBOARD_CHAT_ENTRY_POINT_STATE_POINTS_AVAILABLE', 'LIVE_VIEWER_LEADERBOARD_CHAT_ENTRY_POINT_STATE_DISABLED'])
}))
export const liveViewerLeaderboardPointsEntity = ytv_sto(() => ({
  isOptimisticUpdate: ytv_bol(),
  key: ytv_str(),
  pointsCompactText: ytv_str(),
  pointsValue: ytv_num()
}))
export const macroMarkersListEntity = ytv_sto(() => ({
  externalVideoId: ytv_str(),
  key: ytv_str(),
  markersList: ytv_sto({
    markerType: ytv_str(['MARKER_TYPE_HEATMAP', 'MARKER_TYPE_TIMESTAMPS']),
    markers: ytv_arr(ytv_sto({
      durationMillis: ytv_str(),
      intensityScoreNormalized: ytv_num(),
      sourceType: ytv_str(['SOURCE_TYPE_SMART_SKIP']),
      startMillis: ytv_str()
    })),
    markersDecoration: ytv_sto({
      timedMarkerDecorations: ytv_arr(ytv_sto({
        badge: ytv_ren(),
        decorationTimeMillis: ytv_num(),
        icon: ytv_str(renderer.enums.IconType),
        label: renderer.components.text,
        visibleTimeRangeEndMillis: ytv_num(),
        visibleTimeRangeStartMillis: ytv_num()
      }))
    }),
    markersMetadata: ytv_sto({
      heatmapMetadata: ytv_sto({
        maxHeightDp: ytv_num(),
        minHeightDp: ytv_num(),
        showHideAnimationDurationMillis: ytv_num()
      }),
      timestampMarkerMetadata: ytv_sto({
        snappingData: ytv_arr(ytv_sto({
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
export const playlistLoopStateEntity = ytv_sto(() => ({
  key: ytv_str(),
  state: ytv_str(['PLAYLIST_LOOP_STATE_ALL', 'PLAYLIST_LOOP_STATE_NONE', 'PLAYLIST_LOOP_STATE_ONE'])
}))
export const replyCountEntity = ytv_sto(() => ({
  key: ytv_str(),
  replyButtonAccessibilityText: ytv_str(),
  replyCount: renderer.mapped.textViewModel,
  replyCountNumber: ytv_str()
}))
export const subscriptionNotificationStateEntity = ytv_sto(() => ({
  key: ytv_str(),
  state: ytv_str(['SUBSCRIPTION_NOTIFICATION_STATE_ALL', 'SUBSCRIPTION_NOTIFICATION_STATE_OCCASIONAL'])
}))
export const subscriptionStateEntity = ytv_sto(() => ({
  key: ytv_str(),
  subscribed: ytv_bol()
}))
export const videoActionButtonEnablementEntity = ytv_sto(() => ({
  enabled: ytv_bol(),
  videoActionButtonEnablementEntityKey: ytv_str()
}))
export const viewCountEntity = ytv_sto(() => ({
  extraShortViewCount: renderer.components.text,
  key: ytv_str(),
  unlabeledViewCountValue: renderer.components.text,
  viewCount: renderer.components.text,
  viewCountLabel: renderer.components.text,
  viewCountLength: ytv_num(),
  viewCountNumber: ytv_str()
}))

// Components
export const entityMutationOption = ytv_sto({
  persistenceOption: ytv_str(['ENTITY_PERSISTENCE_OPTION_INMEMORY_AND_PERSIST', 'ENTITY_PERSISTENCE_OPTION_PERSIST'])
})
export const entityMutationPayload = ytv_sto(() => ({
  booleanEntity,
  commentEntityPayload: ytv_ren({
    author: ytv_unk(),
    avatar: ytv_unk(),
    isTranslationAvailable: ytv_bol(),
    key: ytv_str(),
    properties: ytv_sto({
      authorButtonA11y: ytv_str(),
      commentId: ytv_str(),
      content: /*ytv_ren(YTTextViewModelSchema)*/ytv_unk(),
      imageAttachmentMaxHeight: ytv_num(),
      publishedTime: ytv_str(),
      replyLevel: ytv_num(),
      toolbarStateKey: ytv_str(),
      translateButtonEntityKey: ytv_str()
    }),
    readMoreLogging: ytv_ren({}),
    threadLines: ytv_sto({}),
    toolbar: ytv_sto({
      creatorThumbnailUrl: ytv_str(),
      dislikeActiveTooltip: ytv_str(),
      dislikeInactiveTooltip: ytv_str(),
      engagementToolbarStyle: ytv_sto({
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
    translateData: ytv_sto({
      text: ytv_str(),
      translateComment: ytv_enp()
    })
  }),
  commentSharedEntityPayload: ytv_sto({
    key: ytv_str(),
    strings: ytv_sto({
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
    toolbarShared: ytv_sto({
      approveButtonA11y: ytv_str(),
      blockButtonA11y: ytv_str(),
      cancelButtonLabel: ytv_str(),
      dislikeCommentButtonA11y: ytv_str(),
      dislikeReplyButtonA11y: ytv_str(),
      heartButtonA11y: ytv_str(),
      heartedTooltipA11y: ytv_str(),
      heartedTooltipCommand: ytv_sto({
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
  commentSurfaceEntityPayload: ytv_sto({
    commentBackgroundColor: ytv_num(),
    commentClickCommand: ytv_enp(),
    commentClickOpensComposer: ytv_bol(),
    composerDraftEntityKey: ytv_str(),
    inlineReadMoreButton: ytv_sto({
      isExpanded: ytv_bol()
    }),
    key: ytv_str(),
    logTapCommand: ytv_enp(),
    pdgCommentChip: ytv_ren(),
    publishedTimeCommand: ytv_enp(),
    viewRepliesTooltipData: ytv_sto({
      tooltipCommand: ytv_sto({
        tooltipCommand: ytv_ren()
      }),
      viewRepliesTooltipIdentifier: ytv_str()
    })
  }),
  chipBarStateEntity,
  chipEntity,
  downloadQualityPickerEntity,
  emojiFountainDataEntity,
  engagementToolbarStateEntityPayload: ytv_sto({
    heartState: ytv_str(['TOOLBAR_HEART_STATE_HEARTED', 'TOOLBAR_HEART_STATE_UNHEARTED']),
    key: ytv_str(),
    likeState: ytv_str(['TOOLBAR_LIKE_STATE_INDIFFERENT'])
  }),
  engagementToolbarSurfaceEntityPayload: ytv_sto({
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
  featuredProductsEntity,
  flowStateEntity,
  likeButtonAnimationEntity,
  likeCountEntity,
  likeStatusEntity,
  liveChatPollStateEntity,
  liveViewerLeaderboardChatEntryPointStateEntity,
  liveViewerLeaderboardPointsEntity,
  macroMarkersListEntity,
  offlineVideoPolicy: ytv_sto({
    action: ytv_str(['OFFLINE_VIDEO_POLICY_ACTION_DISABLE', 'OFFLINE_VIDEO_POLICY_ACTION_DOWNLOAD_FAILED', 'OFFLINE_VIDEO_POLICY_ACTION_OK']),
    expirationTimestamp: ytv_str(),
    key: ytv_str(),
    lastUpdatedTimestampSeconds: ytv_str(),
    offlineStateBytes: ytv_str(),
    offlineToken: ytv_str(),
    shortMessageForDisabledAction: ytv_str()
  }),
  offlineabilityEntity: renderer.mapped.offlineabilityRenderer,
  playbackData: ytv_sto({
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
  triStateButtonStateEntityPayload: ytv_sto({
    key: ytv_str(),
    stateIdentifier: ytv_str(['TRI_STATE_IDENTIFIER_UNTOGGLED_STATE'])
  }),
  videoActionButtonEnablementEntity,
  viewCountEntity
}))
export const entityMutation = ytv_sto({
  entityKey: ytv_str(),
  options: entityMutationOption,
  payload: entityMutationPayload,
  type: ytv_str(['ENTITY_MUTATION_TYPE_DELETE', 'ENTITY_MUTATION_TYPE_REPLACE'])
})
export const panelLoadingStrategy = ytv_sto({
  inlineContent: ytv_ren(),
  requestTemplate: ytv_sto({
    panelId: ytv_str(),
    params: ytv_str()
  }),
  screenVe: ytv_num()
})
export const watchEndpointLoggingContext = ytv_sto({
  qoeLoggingContext: ytv_sto({
    serializedContextData: ytv_str()
  }),
  vssLoggingContext: ytv_sto({
    serializedContextData: ytv_str()
  })
})

// Metadata components
export const interactionLoggingCommandMetadata = ytv_enp({
  loggingExpectations: ytv_sto({
    screenCreatedLoggingExpectations: ytv_sto({
      expectedParentScreens: ytv_arr(ytv_sto({
        screenVeType: ytv_num()
      }))
    })
  }),
  screenVisualElement: ytv_sto({
    uiType: ytv_num()
  })
})
export const resolveUrlCommandMetadata = ytv_enp({
  isVanityUrl: ytv_bol()
})
export const webCommandMetadata = ytv_enp({
  apiUrl: ytv_str(),
  ignoreNavigation: ytv_bol(),
  rootVe: ytv_num(),
  sendPost: ytv_bol(),
  url: ytv_str(),
  webPageType: ytv_str(enums.WebPageType)
})