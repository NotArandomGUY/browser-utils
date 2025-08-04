import { YTAccessibilityDataSchema, YTAccessibilitySchema, YTAdSlotLoggingDataSchema, YTDimensionValueSchema, YTEmojiSchema, YTEngagementPanelIdentifier, YTEngagementPanelVisibility, YTImageSchema, YTImageSourceSchema, YTLikeStatus, YTLoggingDirectivesSchema, YTObjectSchema, YTOfflineabilityRendererSchema, YTRendererSchema, YTTextSchema, YTThumbnailSchema, YTUrlSchema, ytv_arr, ytv_bol, ytv_enp, ytv_num, ytv_obj, ytv_ren, ytv_sch, ytv_str, ytv_unk } from './common'
import { YTEndpointSchemaMap } from './endpoint'
import { YTIconSchema, YTIconType } from './icon'
import { YTSizeSchema, YTSizeType } from './size'

export enum YTAdLayoutType {
  LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES = 'LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES',
  LAYOUT_TYPE_DISPLAY_SQUARE_IMAGE = 'LAYOUT_TYPE_DISPLAY_SQUARE_IMAGE',
  LAYOUT_TYPE_ENDCAP = 'LAYOUT_TYPE_ENDCAP',
  LAYOUT_TYPE_LANDSCAPE_RECTANGLE = 'LAYOUT_TYPE_LANDSCAPE_RECTANGLE',
  LAYOUT_TYPE_MEDIA = 'LAYOUT_TYPE_MEDIA',
  LAYOUT_TYPE_MEDIA_BREAK = 'LAYOUT_TYPE_MEDIA_BREAK',
  LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY = 'LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY',
  LAYOUT_TYPE_PANEL = 'LAYOUT_TYPE_PANEL',
  LAYOUT_TYPE_VIDEO_DISPLAY_BUTTON_GROUP = 'LAYOUT_TYPE_VIDEO_DISPLAY_BUTTON_GROUP',
  LAYOUT_TYPE_VIDEO_DISPLAY_COMPACT_BUTTON_GROUP = 'LAYOUT_TYPE_VIDEO_DISPLAY_COMPACT_BUTTON_GROUP'
}

export enum YTButtonStyle {
  STYLE_BLUE_TEXT = 'STYLE_BLUE_TEXT',
  STYLE_BRAND = 'STYLE_BRAND',
  STYLE_DARK = 'STYLE_DARK',
  STYLE_DEFAULT = 'STYLE_DEFAULT',
  STYLE_INACTIVE_OUTLINE = 'STYLE_INACTIVE_OUTLINE',
  STYLE_MONO_FILLED = 'STYLE_MONO_FILLED',
  STYLE_MONO_TONAL = 'STYLE_MONO_TONAL',
  STYLE_OPACITY = 'STYLE_OPACITY',
  STYLE_PRIMARY = 'STYLE_PRIMARY',
  STYLE_SUGGESTIVE = 'STYLE_SUGGESTIVE',
  STYLE_TEXT = 'STYLE_TEXT',
  STYLE_UNKNOWN = 'STYLE_UNKNOWN'
}

export enum YTMediaFormatQualityOrdinal {
  QUALITY_ORDINAL_UNKNOWN = 'QUALITY_ORDINAL_UNKNOWN',
  QUALITY_ORDINAL_144P = 'QUALITY_ORDINAL_144P',
  QUALITY_ORDINAL_240P = 'QUALITY_ORDINAL_240P',
  QUALITY_ORDINAL_240P_SAVER = 'QUALITY_ORDINAL_240P_SAVER',
  QUALITY_ORDINAL_360P = 'QUALITY_ORDINAL_360P',
  QUALITY_ORDINAL_360P_SAVER = 'QUALITY_ORDINAL_360P_SAVER',
  QUALITY_ORDINAL_480P = 'QUALITY_ORDINAL_480P',
  QUALITY_ORDINAL_608P = 'QUALITY_ORDINAL_608P',
  QUALITY_ORDINAL_608P_SAVER = 'QUALITY_ORDINAL_608P_SAVER',
  QUALITY_ORDINAL_720P = 'QUALITY_ORDINAL_720P',
  QUALITY_ORDINAL_1080P = 'QUALITY_ORDINAL_1080P',
  QUALITY_ORDINAL_1080P_ENHANCED = 'QUALITY_ORDINAL_1080P_ENHANCED',
  QUALITY_ORDINAL_1440P = 'QUALITY_ORDINAL_1440P',
  QUALITY_ORDINAL_2160P = 'QUALITY_ORDINAL_2160P'
}

export const YTResponseContextSchema = {
  consistencyTokenJar: ytv_sch({
    encryptedTokenJarContents: ytv_str(),
    expirationSeconds: ytv_str()
  }),
  mainAppWebResponseContext: ytv_sch({
    datasyncId: ytv_str(),
    loggedOut: ytv_bol(),
    trackingParam: ytv_str()
  }),
  maxAgeSeconds: ytv_num(),
  serviceTrackingParams: ytv_arr(ytv_sch({
    params: ytv_arr(ytv_sch({
      key: ytv_str(),
      value: ytv_str()
    })),
    service: ytv_str()
  })),
  visitorData: ytv_str(),
  webResponseContextExtensionData: ytv_sch({
    hasDecorated: ytv_bol(),
    webPrefetchData: ytv_sch({
      navigationEndpoints: ytv_arr(ytv_enp())
    }),
    ytConfigData: ytv_sch({
      rootVisualElementType: ytv_num(),
      sessionIndex: ytv_num(),
      visitorData: ytv_str()
    })
  })
} satisfies YTRendererSchema

export const YTResponseCommonSchema = {
  actions: ytv_arr(ytv_enp()),
  command: ytv_enp(),
  frameworkUpdates: ytv_enp(YTEndpointSchemaMap['entityUpdateCommand']),
  onResponseReceivedAction: ytv_enp(),
  onResponseReceivedCommand: ytv_enp(),
  onResponseReceivedEndpoint: ytv_enp(),
  onResponseReceivedActions: ytv_arr(ytv_enp()),
  onResponseReceivedCommands: ytv_arr(ytv_enp()),
  onResponseReceivedEndpoints: ytv_arr(ytv_enp()),
  responseContext: ytv_ren(YTResponseContextSchema)
} satisfies YTRendererSchema

export const YTAdInteractionSchema = {
  accessibility: ytv_sch(YTAccessibilityDataSchema),
  onFirstVisible: ytv_enp(),
  onTap: ytv_enp()
} satisfies YTRendererSchema

export const YTAdLayoutLoggingDataSchema = {
  serializedAdServingDataEntry: ytv_str()
} satisfies YTRendererSchema

export const YTAdLayoutMetadataSchema = {
  adLayoutLoggingData: ytv_ren(YTAdLayoutLoggingDataSchema),
  layoutId: ytv_str(),
  layoutType: ytv_str(YTAdLayoutType)
} satisfies YTRendererSchema

export const YTColorPaletteDataSchema = {
  backgroundColor: ytv_num(),
  foregroundBodyColor: ytv_num(),
  foregroundTitleColor: ytv_num()
} satisfies YTRendererSchema

export const YTLayoutExitedForReasonTrigger = {
  layoutExitReason: ytv_str(['LAYOUT_EXIT_REASON_ERROR', 'LAYOUT_EXIT_REASON_NORMAL']),
  triggeringLayoutId: ytv_str()
} satisfies YTRendererSchema

export const YTMediaFormatRangeSchema = {
  start: ytv_str(),
  end: ytv_str()
} satisfies YTRendererSchema

export const YTMediaFormatSchema = {
  approxDurationMs: ytv_str(),
  audioChannels: ytv_num(),
  audioQuality: ytv_str(['AUDIO_QUALITY_LOW', 'AUDIO_QUALITY_MEDIUM']),
  audioSampleRate: ytv_str(),
  audioTrack: ytv_sch({
    audioIsDefault: ytv_bol(),
    displayName: ytv_str(),
    id: ytv_str()
  }),
  averageBitrate: ytv_num(),
  bitrate: ytv_num(),
  colorInfo: ytv_sch({
    primaries: ytv_str(['COLOR_PRIMARIES_BT709']),
    transferCharacteristics: ytv_str(['COLOR_TRANSFER_CHARACTERISTICS_BT709']),
    matrixCoefficients: ytv_str(['COLOR_MATRIX_COEFFICIENTS_BT709'])
  }),
  contentLength: ytv_str(),
  fps: ytv_num(),
  height: ytv_num(),
  highReplication: ytv_bol(),
  indexRange: ytv_ren(YTMediaFormatRangeSchema),
  initRange: ytv_ren(YTMediaFormatRangeSchema),
  isDrc: ytv_bol(),
  itag: ytv_num(),
  lastModified: ytv_str(),
  loudnessDb: ytv_num(),
  maxDvrDurationSec: ytv_num(),
  mimeType: ytv_str(),
  projectionType: ytv_str(['RECTANGULAR']),
  quality: ytv_str(['hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny']),
  qualityLabel: ytv_str(),
  qualityOrdinal: ytv_str(YTMediaFormatQualityOrdinal),
  signatureCipher: ytv_str(),
  targetDurationSec: ytv_num(),
  url: ytv_str(),
  width: ytv_num(),
  xtags: ytv_str()
} satisfies YTRendererSchema

export const YTRendererContinuationDataSchema = {
  invalidationId: ytv_sch({
    objectId: ytv_str(),
    objectSource: ytv_num(),
    protoCreationTimestampMs: ytv_str(),
    subscribeToGcmTopics: ytv_bol(),
    topic: ytv_str()
  }),
  timeUntilLastMessageMsec: ytv_num(),
  timeoutMs: ytv_num(),
  continuation: ytv_str()
} satisfies YTRendererSchema

export const YTRendererContinuationSchema = {
  invalidationContinuationData: ytv_ren(YTRendererContinuationDataSchema),
  liveChatReplayContinuationData: ytv_ren(YTRendererContinuationDataSchema),
  nextContinuationData: ytv_ren(YTRendererContinuationDataSchema),
  playerSeekContinuationData: ytv_ren(YTRendererContinuationDataSchema),
  reloadContinuationData: ytv_ren(YTRendererContinuationDataSchema),
  timedContinuationData: ytv_ren(YTRendererContinuationDataSchema)
} satisfies YTRendererSchema

export const YTPaygatedQualityDetailSchema = {
  paygatedIndicatorText: ytv_str()
} satisfies YTRendererSchema

export const YTPaygatedQualitiesMetadataSchema = {
  qualityDetails: ytv_arr(ytv_sch({
    key: ytv_str(),
    value: ytv_ren(YTPaygatedQualityDetailSchema)
  }))
} satisfies YTRendererSchema

export const YTStyleSchema = {
  styleType: ytv_str(['STYLE_DEFAULT', 'STYLE_DEFAULT_ACTIVE', 'STYLE_GREY_TEXT', 'STYLE_HOME_FILTER', 'STYLE_TEXT'])
} satisfies YTRendererSchema

export const YTFeaturedChannelSchema = {
  channelName: ytv_str(),
  endTimeMs: ytv_str(),
  navigationEndpoint: ytv_enp(),
  startTimeMs: ytv_str(),
  subscribeButton: ytv_ren(),
  watermark: ytv_sch(YTThumbnailSchema)
} satisfies YTRendererSchema

export const YTVideoAdPingsSchema = {
  abandonPings: ytv_arr(ytv_sch(YTUrlSchema)),
  activeViewFullyViewableAudibleHalfDurationPings: ytv_arr(ytv_sch(YTUrlSchema)),
  activeViewMeasurablePings: ytv_arr(ytv_sch(YTUrlSchema)),
  activeViewTracking: ytv_sch({
    identifier: ytv_str(),
    trafficType: ytv_str(['ACTIVE_VIEW_TRAFFIC_TYPE_VIDEO'])
  }),
  activeViewViewablePings: ytv_arr(ytv_sch(YTUrlSchema)),
  closePings: ytv_arr(ytv_sch(YTUrlSchema)),
  completePings: ytv_arr(ytv_sch(YTUrlSchema)),
  errorPings: ytv_arr(ytv_sch(YTUrlSchema)),
  firstQuartilePings: ytv_arr(ytv_sch(YTUrlSchema)),
  fullscreenPings: ytv_arr(ytv_sch(YTUrlSchema)),
  impressionPings: ytv_arr(ytv_sch(YTUrlSchema)),
  mutePings: ytv_arr(ytv_sch(YTUrlSchema)),
  pausePings: ytv_arr(ytv_sch(YTUrlSchema)),
  progressPings: ytv_arr(ytv_sch(YTUrlSchema)),
  resumePings: ytv_arr(ytv_sch(YTUrlSchema)),
  rewindPings: ytv_arr(ytv_sch(YTUrlSchema)),
  secondQuartilePings: ytv_arr(ytv_sch(YTUrlSchema)),
  skipPings: ytv_arr(ytv_sch(YTUrlSchema)),
  startPings: ytv_arr(ytv_sch(YTUrlSchema)),
  swipePings: ytv_arr(ytv_sch(YTUrlSchema)),
  thirdQuartilePings: ytv_arr(ytv_sch(YTUrlSchema)),
  unmutePings: ytv_arr(ytv_sch(YTUrlSchema))
} satisfies YTRendererSchema

export const YTLiveChatRendererSchema = {
  actionPanel: ytv_ren(),
  actions: ytv_arr(ytv_enp()),
  clientMessages: ytv_sch({
    fatalError: ytv_sch(YTTextSchema),
    genericError: ytv_sch(YTTextSchema),
    reconnectMessage: ytv_sch(YTTextSchema),
    reconnectedMessage: ytv_sch(YTTextSchema),
    unableToReconnectMessage: ytv_sch(YTTextSchema)
  }),
  continuations: ytv_arr(ytv_ren(YTRendererContinuationSchema)),
  creatorGoalEntityKey: ytv_str(),
  emojis: ytv_arr(ytv_sch(YTEmojiSchema)),
  engagementPanel: ytv_arr(ytv_ren()),
  header: ytv_ren(),
  initialDisplayState: ytv_str(['LIVE_CHAT_DISPLAY_STATE_COLLAPSED', 'LIVE_CHAT_DISPLAY_STATE_EXPANDED']),
  isReplay: ytv_bol(),
  itemList: ytv_ren(),
  liveChatAdminSheetEntryPointEntityKey: ytv_str(),
  liveChatCurrentFilter: ytv_str(['LIVE_CHAT_FILTER_MODE_DEFAULT']),
  participantsList: ytv_ren(),
  popoutMessage: ytv_ren(),
  showButton: ytv_ren(),
  ticker: ytv_ren(),
  viewerName: ytv_str()
} satisfies YTRendererSchema

export const YTSectionListRendererSchema = {
  contents: ytv_arr(ytv_ren()),
  continuations: ytv_arr(ytv_ren(YTRendererContinuationSchema)),
  disablePullToRefresh: ytv_bol(),
  hack: ytv_bol(),
  hideBottomSeparator: ytv_bol(),
  scrollPaneStyle: ytv_sch({
    scrollable: ytv_bol()
  }),
  subMenu: ytv_ren(),
  targetId: ytv_str()
} satisfies YTRendererSchema

export const YTSortFilterSubMenuItemRendererSchema = {
  accessibility: ytv_sch(YTAccessibilitySchema),
  continuation: ytv_ren(YTRendererContinuationSchema),
  selected: ytv_bol(),
  serviceEndpoint: ytv_enp(),
  subtitle: ytv_str(),
  title: ytv_str()
} satisfies YTRendererSchema

export const YTTvBrowseRendererSchema = {
  content: ytv_ren(),
  header: ytv_ren()
} satisfies YTRendererSchema

export const YTSubscribeButtonViewModelContentSchema = {
  accessibilityText: ytv_str(),
  buttonText: ytv_str(),
  imageName: ytv_str(),
  onTapCommand: ytv_enp(),
  subscribeState: ytv_sch({
    key: ytv_str(),
    subscribed: ytv_bol()
  })
} satisfies YTRendererSchema

export const YTTextViewModelColorMapExtensionSchema = {
  colorMap: ytv_arr(ytv_sch({
    key: ytv_str(),
    value: ytv_num()
  }))
} satisfies YTRendererSchema

export const YTTextViewModelAttachmentRunSchema = {
  alignment: ytv_str(['ALIGNMENT_VERTICAL_CENTER']),
  element: ytv_sch({
    properties: ytv_sch({
      layoutProperties: ytv_sch({
        height: ytv_sch(YTDimensionValueSchema),
        margin: ytv_sch({
          bottom: ytv_sch(YTDimensionValueSchema),
          left: ytv_sch(YTDimensionValueSchema),
          right: ytv_sch(YTDimensionValueSchema),
          top: ytv_sch(YTDimensionValueSchema)
        }),
        width: ytv_sch(YTDimensionValueSchema)
      })
    }),
    type: ytv_sch({
      imageType: ytv_sch({
        image: ytv_sch(YTImageSchema)
      })
    })
  }),
  length: ytv_num(),
  startIndex: ytv_num()
} satisfies YTRendererSchema

export const YTTextViewModelCommandRunSchema = {
  length: ytv_num(),
  loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
  onTap: ytv_enp(),
  onTapOptions: ytv_sch({
    accessibilityInfo: ytv_sch({
      accessibilityLabel: ytv_str()
    })
  }),
  startIndex: ytv_num()
} satisfies YTRendererSchema

export const YTTextViewModelDecorationRunSchema = {
  textDecorator: ytv_sch({
    highlightTextDecorator: ytv_sch({
      backgroundCornerRadius: ytv_num(),
      bottomPadding: ytv_num(),
      highlightTextDecoratorExtensions: ytv_sch({
        highlightTextDecoratorColorMapExtension: ytv_sch(YTTextViewModelColorMapExtensionSchema)
      }),
      length: ytv_num(),
      startIndex: ytv_num()
    })
  })
} satisfies YTRendererSchema

export const YTTextViewModelParagraphStyleRunSchema = {
  length: ytv_num(),
  listGroup: ytv_sch({
    listItems: ytv_arr(ytv_sch({
      length: ytv_num(),
      listType: ytv_str(['LIST_TYPE_BULLET']),
      startIndex: ytv_num()
    })),
    listType: ytv_str(['LIST_TYPE_BULLET'])
  }),
  startIndex: ytv_num()
} satisfies YTRendererSchema

export const YTTextViewModelStyleRunSchema = {
  fontColor: ytv_num(),
  fontFamilyName: ytv_str(),
  fontName: ytv_str(),
  fontSize: ytv_num(),
  italic: ytv_bol(),
  length: ytv_num(),
  startIndex: ytv_num(),
  styleRunExtensions: ytv_sch({
    styleRunColorMapExtension: ytv_sch(YTTextViewModelColorMapExtensionSchema),
    styleRunMentionExtension: ytv_sch({
      channelId: ytv_str()
    })
  }),
  weight: ytv_num(),
  weightLabel: ytv_str(['FONT_WEIGHT_BOLD', 'FONT_WEIGHT_MEDIUM', 'FONT_WEIGHT_NORMAL'])
} satisfies YTRendererSchema

export const YTTextViewModelSchema = {
  content: ytv_str(),
  alignment: ytv_str(['TEXT_ALIGNMENT_CENTER']),
  attachmentRuns: ytv_arr(ytv_ren(YTTextViewModelAttachmentRunSchema)),
  commandRuns: ytv_arr(ytv_ren(YTTextViewModelCommandRunSchema)),
  decorationRuns: ytv_arr(ytv_ren(YTTextViewModelDecorationRunSchema)),
  paragraphStyleRuns: ytv_arr(ytv_ren(YTTextViewModelParagraphStyleRunSchema)),
  styleRuns: ytv_arr(ytv_ren(YTTextViewModelStyleRunSchema))
} satisfies YTRendererSchema

export const YTAutoplaySetSchema = {
  autoplayVideo: ytv_enp(),
  mode: ytv_str(['NORMAL']),
  nextButtonVideo: ytv_enp(),
  previousButtonVideo: ytv_enp()
} satisfies YTRendererSchema

export const YTButtonViewModelSchema = {
  accessibilityId: ytv_str(),
  accessibilityText: ytv_str(),
  buttonSize: ytv_str(['BUTTON_VIEW_MODEL_SIZE_COMPACT', 'BUTTON_VIEW_MODEL_SIZE_DEFAULT', 'BUTTON_VIEW_MODEL_SIZE_XSMALL']),
  customBackgroundColor: ytv_num(),
  customFontColor: ytv_num(),
  iconImage: ytv_sch(YTImageSourceSchema),
  iconName: ytv_str(),
  iconPosition: ytv_str(['BUTTON_VIEW_MODEL_ICON_POSITION_LEADING', 'BUTTON_VIEW_MODEL_ICON_POSITION_TRAILING']),
  iconTrailing: ytv_bol(),
  isFullWidth: ytv_bol(),
  loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
  onTap: ytv_enp(),
  onVisible: ytv_enp(),
  shouldLogGestures: ytv_bol(),
  state: ytv_str(['BUTTON_VIEW_MODEL_STATE_ACTIVE']),
  style: ytv_str(['BUTTON_VIEW_MODEL_STYLE_CUSTOM', 'BUTTON_VIEW_MODEL_STYLE_MONO', 'BUTTON_VIEW_MODEL_STYLE_OVERLAY', 'BUTTON_VIEW_MODEL_STYLE_OVERLAY_DARK', 'BUTTON_VIEW_MODEL_STYLE_UNKNOWN']),
  title: ytv_str(),
  titleFormatted: ytv_ren(YTTextViewModelSchema),
  tooltip: ytv_str(),
  type: ytv_str(['BUTTON_VIEW_MODEL_TYPE_FILLED', 'BUTTON_VIEW_MODEL_TYPE_OUTLINE', 'BUTTON_VIEW_MODEL_TYPE_TEXT', 'BUTTON_VIEW_MODEL_TYPE_TONAL'])
} satisfies YTRendererSchema

export const YTColorSupportedDatasSchema = {
  basicColorPaletteData: ytv_ren(YTColorPaletteDataSchema)
} satisfies YTRendererSchema

export const YTCommandContextSchema = {
  onHidden: ytv_enp(),
  onTap: ytv_enp(),
  onVisible: ytv_enp()
} satisfies YTRendererSchema

export const YTLoggingContextSchema = {
  loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
} satisfies YTRendererSchema

export const YTPlayerConfigSchema = {
  audioConfig: ytv_sch({
    enablePerFormatLoudness: ytv_bol(),
    loudnessDb: ytv_num(),
    muteOnStart: ytv_bol(),
    perceptualLoudnessDb: ytv_num()
  }),
  inlinePlaybackConfig: ytv_sch({
    showAudioControls: ytv_bol(),
    showScrubbingControls: ytv_bol()
  }),
  livePlayerConfig: ytv_sch({
    hasSubfragmentedFmp4: ytv_bol(),
    hasSubfragmentedWebm: ytv_bol(),
    isLiveHeadPlayable: ytv_bol(),
    liveExperimentalContentId: ytv_str(),
    liveReadaheadSeconds: ytv_num()
  }),
  mediaCommonConfig: ytv_sch({
    dynamicReadaheadConfig: ytv_sch({
      maxReadAheadMediaTimeMs: ytv_num(),
      minReadAheadMediaTimeMs: ytv_num(),
      readAheadGrowthRateMs: ytv_num()
    }),
    enableServerDrivenRequestCancellation: ytv_bol(),
    fixLivePlaybackModelDefaultPosition: ytv_bol(),
    mediaUstreamerRequestConfig: ytv_sch({
      videoPlaybackUstreamerConfig: ytv_str()
    }),
    serverPlaybackStartConfig: ytv_sch({
      enable: ytv_bol(),
      playbackStartPolicy: ytv_sch({
        startMinReadaheadPolicy: ytv_arr(ytv_sch({
          minReadaheadMs: ytv_num()
        }))
      })
    }),
    useServerDrivenAbr: ytv_bol()
  }),
  playbackStartConfig: ytv_sch({
    startPaused: ytv_bol(),
    startPosition: ytv_sch({
      streamTimeMillis: ytv_str()
    }),
    startSeconds: ytv_num()
  }),
  streamSelectionConfig: ytv_sch({
    maxBitrate: ytv_str()
  }),
  webPlayerConfig: ytv_sch({
    useCobaltTvosDash: ytv_bol(),
    webPlayerActionsPorting: ytv_sch({
      addToWatchLaterCommand: ytv_enp(),
      getSharePanelCommand: ytv_enp(),
      removeFromWatchLaterCommand: ytv_enp(),
      subscribeCommand: ytv_enp(),
      unsubscribeCommand: ytv_enp()
    })
  })
} satisfies YTRendererSchema

export const YTPlayerPlayabilityStatusSchema = {
  additionalLoggingData: ytv_str(),
  contextParams: ytv_str(),
  desktopLegacyAgeGateReason: ytv_num(),
  errorScreen: ytv_ren(),
  liveStreamability: ytv_ren(),
  miniplayer: ytv_ren(),
  offlineability: ytv_ren(),
  paygatedQualitiesMetadata: ytv_ren(YTPaygatedQualitiesMetadataSchema),
  playableInEmbed: ytv_bol(),
  reason: ytv_str(),
  status: ytv_str(['AGE_CHECK_REQUIRED', 'AGE_VERIFICATION_REQUIRED', 'CONTENT_CHECK_REQUIRED', 'LIVE_STREAM_OFFLINE', 'OK'])
} satisfies YTRendererSchema

export const YTPlayerPlaybackTrackingSchema = {
  atrUrl: ytv_sch(YTUrlSchema),
  googleRemarketingUrl: ytv_sch(YTUrlSchema),
  ptrackingUrl: ytv_sch(YTUrlSchema),
  qoeUrl: ytv_sch(YTUrlSchema),
  videostatsDelayplayUrl: ytv_sch(YTUrlSchema),
  videostatsPlaybackUrl: ytv_sch(YTUrlSchema),
  videostatsWatchtimeUrl: ytv_sch(YTUrlSchema),
  videostatsDefaultFlushIntervalSeconds: ytv_num(),
  videostatsScheduledFlushWalltimeSeconds: ytv_arr(ytv_num()), // NOTE: maybe union of (number | number[])
  youtubeRemarketingUrl: ytv_sch(YTUrlSchema)
} satisfies YTRendererSchema

export const YTPlayerStreamingDataSchema = {
  adaptiveFormats: ytv_arr(ytv_ren(YTMediaFormatSchema)),
  dashManifestUrl: ytv_str(),
  expiresInSeconds: ytv_str(),
  formats: ytv_arr(ytv_ren(YTMediaFormatSchema)),
  hlsManifestUrl: ytv_str(),
  serverAbrStreamingUrl: ytv_str()
} satisfies YTRendererSchema

export const YTPlayerVideoDetailsSchema = {
  allowRatings: ytv_bol(),
  author: ytv_str(),
  channelId: ytv_str(),
  isCrawlable: ytv_bol(),
  isLive: ytv_bol(),
  isLiveContent: ytv_bol(),
  isLiveDvrEnabled: ytv_bol(),
  isLowLatencyLiveStream: ytv_bol(),
  isOwnerViewing: ytv_bol(),
  isPrivate: ytv_bol(),
  isUnpluggedCorpus: ytv_bol(),
  isUpcoming: ytv_bol(),
  keywords: ytv_arr(ytv_str()),
  latencyClass: ytv_str(['MDE_STREAM_OPTIMIZATIONS_RENDERER_LATENCY_NORMAL', 'MDE_STREAM_OPTIMIZATIONS_RENDERER_LATENCY_ULTRA_LOW']),
  lengthSeconds: ytv_str(),
  liveChunkReadahead: ytv_num(),
  shortDescription: ytv_str(),
  thumbnail: ytv_sch(YTThumbnailSchema),
  title: ytv_str(),
  videoId: ytv_str(),
  viewCount: ytv_str()
} satisfies YTRendererSchema

export const YTRendererContextSchema = {
  accessibilityContext: ytv_sch(YTAccessibilityDataSchema),
  commandContext: ytv_ren(YTCommandContextSchema),
  loggingContext: ytv_ren(YTLoggingContextSchema)
} satisfies YTRendererSchema

export const YTThemedColorSchema = {
  darkTheme: ytv_num(),
  lightTheme: ytv_num()
} satisfies YTRendererSchema

export const YTPlayerResponseSchema = {
  ...YTResponseCommonSchema,
  adBreakHeartbeatParams: ytv_str(),
  adPlacements: ytv_arr(ytv_ren()),
  adSlots: ytv_arr(ytv_ren()),
  annotations: ytv_arr(ytv_ren()),
  attestation: ytv_ren(),
  auxiliaryUi: ytv_sch({
    messageRenderers: ytv_ren()
  }),
  captions: ytv_ren(),
  cards: ytv_ren(),
  endscreen: ytv_ren(),
  heartbeatParams: ytv_sch({
    drmSessionId: ytv_str(),
    heartbeatAttestationConfig: ytv_sch({
      requiresAttestation: ytv_bol()
    }),
    heartbeatServerData: ytv_str(),
    heartbeatToken: ytv_str(),
    intervalMilliseconds: ytv_str(),
    maxRetries: ytv_str(),
    softFailOnError: ytv_bol()
  }),
  messages: ytv_arr(ytv_ren()),
  microformat: ytv_ren(),
  paidContentOverlay: ytv_ren(),
  playabilityStatus: ytv_ren(YTPlayerPlayabilityStatusSchema),
  playbackTracking: ytv_ren(YTPlayerPlaybackTrackingSchema),
  playerAds: ytv_arr(ytv_ren()),
  playerConfig: ytv_ren(YTPlayerConfigSchema),
  storyboards: ytv_ren(),
  streamingData: ytv_ren(YTPlayerStreamingDataSchema),
  videoDetails: ytv_ren(YTPlayerVideoDetailsSchema)
} satisfies YTRendererSchema

export const YTRendererSchemaMap = {
  // Response
  browseResponse: {
    ...YTResponseCommonSchema,
    contents: ytv_ren(),
    continuationContents: ytv_sch({
      sectionListContinuation: ytv_ren(YTSectionListRendererSchema),
      tvSurfaceContentContinuation: ytv_ren(YTTvBrowseRendererSchema)
    }),
    header: ytv_ren(),
    metadata: ytv_ren(),
    microformat: ytv_ren(),
    topbar: ytv_ren()
  },
  browseEditPlaylistResponse: {
    ...YTResponseCommonSchema,
    playlistEditResults: ytv_arr(ytv_sch({
      playlistEditVideoAddedResultData: ytv_sch({
        setVideoId: ytv_str(),
        videoId: ytv_str()
      })
    })),
    status: ytv_str(['STATUS_SUCCEEDED'])
  },
  guideResponse: {
    ...YTResponseCommonSchema,
    footer: ytv_ren(),
    items: ytv_arr(ytv_ren())
  },
  liveChatGetLiveChatResponse: {
    ...YTResponseCommonSchema,
    continuationContents: ytv_sch({
      liveChatContinuation: ytv_ren(YTLiveChatRendererSchema)
    }),
    liveChatStreamingResponseExtension: ytv_sch({
      lastPublishAtUsec: ytv_str()
    })
  },
  nextResponse: {
    ...YTResponseCommonSchema,
    adEngagementPanels: ytv_arr(ytv_ren()),
    cards: ytv_ren(),
    contents: ytv_ren(),
    currentVideoEndpoint: ytv_enp(),
    engagementPanels: ytv_arr(ytv_ren()),
    pageVisualEffects: ytv_arr(ytv_ren()),
    playerOverlays: ytv_ren(),
    survey: ytv_ren(),
    topbar: ytv_ren(),
    transportControls: ytv_ren(),
    videoReporting: ytv_ren()
  },
  notificationGetUnseenCountResponse: {
    ...YTResponseCommonSchema
  },
  playerResponse: YTPlayerResponseSchema,
  playerHeartbeatResponse: {
    ...YTResponseCommonSchema,
    adBreakHeartbeatParams: ytv_str(),
    heartbeatServerData: ytv_str(),
    playabilityStatus: ytv_ren(YTPlayerPlayabilityStatusSchema),
    pollDelayMs: ytv_str()
  },
  reelReelItemWatchResponse: {
    ...YTResponseCommonSchema,
    background: ytv_ren(),
    engagementPanels: ytv_arr(ytv_ren()),
    overlay: ytv_ren(),
    replacementEndpoint: ytv_enp(),
    sequenceContinuation: ytv_str(),
    status: ytv_str(['REEL_ITEM_WATCH_STATUS_SUCCEEDED']),
    tooltip: ytv_ren(), // NOTE: actually an unknown type
    topbar: ytv_ren()
  },
  reelReelWatchSequenceResponse: {
    ...YTResponseCommonSchema,
    continuationEndpoint: ytv_enp(),
    entries: ytv_arr(ytv_ren())
  },
  searchResponse: {
    ...YTResponseCommonSchema,
    contents: ytv_ren(),
    estimatedResults: ytv_str(),
    header: ytv_ren(),
    refinements: ytv_arr(ytv_str()),
    targetId: ytv_str(),
    topbar: ytv_ren()
  },
  updatedMetadataResponse: {
    ...YTResponseCommonSchema,
    continuation: ytv_ren(YTRendererContinuationSchema)
  },

  // Renderer
  aboutThisAdRenderer: {
    url: ytv_sch({
      privateDoNotAccessOrElseTrustedResourceUrlWrappedValue: ytv_str()
    })
  },
  aboveFeedAdLayoutRenderer: {
    adLayoutMetadata: ytv_ren(YTAdLayoutMetadataSchema),
    layoutExitNormalTriggers: ytv_arr(ytv_sch({
      id: ytv_str(),
      layoutIdExitedTrigger: ytv_sch({
        triggeringLayoutId: ytv_str()
      }),
      onDifferentLayoutIdEnteredTrigger: ytv_sch({
        layoutType: ytv_str(YTAdLayoutType)
      })
    })),
    renderingContent: ytv_ren()
  },
  adActionInterstitialRenderer: {
    abandonCommands: ytv_enp(YTEndpointSchemaMap['commandExecutorCommand']),
    completionCommands: ytv_arr(ytv_enp()),
    durationMilliseconds: ytv_num(),
    layoutId: ytv_str(),
    skipPings: ytv_arr(ytv_sch(YTUrlSchema))
  },
  adBreakServiceRenderer: {
    getAdBreakUrl: ytv_str(),
    prefetchMilliseconds: ytv_str()
  },
  adDurationRemainingRenderer: {
    templatedCountdown: ytv_ren()
  },
  adHoverTextButtonRenderer: {
    button: ytv_ren(),
    hoverText: ytv_sch(YTTextSchema)
  },
  adPlacementRenderer: {
    adSlotLoggingData: ytv_sch(YTAdSlotLoggingDataSchema),
    config: ytv_sch({
      adPlacementConfig: ytv_sch({
        adTimeOffset: ytv_sch({
          offsetEndMilliseconds: ytv_str(),
          offsetStartMilliseconds: ytv_str()
        }),
        hideCueRangeMarker: ytv_bol(),
        kind: ytv_str(['AD_PLACEMENT_KIND_END'])
      })
    }),
    renderer: ytv_ren()
  },
  adPlayerOverlayRenderer: {
    shareNavigationEndpoint: ytv_enp(),
    shortBylineText: ytv_sch(YTTextSchema),
    showShareButton: ytv_bol(),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailNavigationEndpoint: ytv_enp(),
    title: ytv_sch(YTTextSchema),
    trvfaBanner: ytv_sch(YTThumbnailSchema),
    visitAdvertiserText: ytv_sch(YTTextSchema)
  },
  adSlotRenderer: {
    adSlotMetadata: ytv_sch({
      adSlotLoggingData: ytv_sch(YTAdSlotLoggingDataSchema),
      slotId: ytv_str(),
      slotPhysicalPosition: ytv_num(),
      slotType: ytv_str(['SLOT_TYPE_ABOVE_FEED', 'SLOT_TYPE_IN_FEED', 'SLOT_TYPE_IN_PLAYER', 'SLOT_TYPE_PLAYER_BYTES', 'SLOT_TYPE_PLAYER_BYTES_SEQUENCE_ITEM']),
      triggerEvent: ytv_str(['SLOT_TRIGGER_EVENT_BEFORE_CONTENT', 'SLOT_TRIGGER_EVENT_LAYOUT_ID_ENTERED', 'SLOT_TRIGGER_EVENT_LAYOUT_ID_EXITED_NORMAL']),
      triggeringSourceLayoutId: ytv_str()
    }),
    enablePacfLoggingWeb: ytv_bol(),
    fulfillmentContent: ytv_sch({
      fulfilledLayout: ytv_ren()
    }),
    slotEntryTrigger: ytv_sch({
      beforeContentVideoIdStartedTrigger: ytv_unk(),
      id: ytv_str(),
      layoutExitedForReasonTrigger: ytv_sch(YTLayoutExitedForReasonTrigger),
      layoutIdEnteredTrigger: ytv_sch({
        triggeringLayoutId: ytv_str()
      })
    }),
    slotExpirationTriggers: ytv_arr(ytv_sch({
      id: ytv_str(),
      layoutExitedForReasonTrigger: ytv_sch(YTLayoutExitedForReasonTrigger),
      onNewPlaybackAfterContentVideoIdTrigger: ytv_unk(),
      slotIdExitedTrigger: ytv_sch({
        triggeringSlotId: ytv_str()
      })
    })),
    slotFulfillmentTriggers: ytv_arr(ytv_sch({
      id: ytv_str(),
      slotIdEnteredTrigger: ytv_sch({
        triggeringSlotId: ytv_str()
      }),
      slotIdScheduledTrigger: ytv_sch({
        triggeringSlotId: ytv_str()
      })
    }))
  },
  adsEngagementPanelContentRenderer: {
    hack: ytv_bol()
  },
  autoplaySwitchButtonRenderer: {
    disabledAccessibilityData: ytv_sch(YTAccessibilitySchema),
    enabled: ytv_bol(),
    enabledAccessibilityData: ytv_sch(YTAccessibilitySchema),
    onDisabledCommand: ytv_enp(),
    onEnabledCommand: ytv_enp()
  },
  avatarLockupRenderer: {
    size: ytv_str(['AVATAR_LOCKUP_SIZE_SMALL']),
    title: ytv_sch(YTTextSchema)
  },
  backstageImageRenderer: {
    icon: ytv_sch(YTIconSchema),
    image: ytv_sch(YTThumbnailSchema)
  },
  browseFeedActionsRenderer: {
    contents: ytv_arr(ytv_ren())
  },
  bubbleHintRenderer: {
    accessibility: ytv_sch(YTAccessibilityDataSchema),
    detailsText: ytv_sch(YTTextSchema),
    isVisible: ytv_bol(),
    style: ytv_str(['BUBBLE_HINT_STYLE_BLUE_TOOLTIP']),
    text: ytv_sch(YTTextSchema)
  },
  buttonRenderer: {
    accessibility: ytv_sch(YTAccessibilityDataSchema),
    accessibilityData: ytv_sch(YTAccessibilitySchema),
    command: ytv_enp(),
    hint: ytv_ren(),
    icon: ytv_sch(YTIconSchema),
    iconPosition: ytv_str(['BUTTON_ICON_POSITION_TYPE_LEFT_OF_TEXT', 'BUTTON_ICON_POSITION_TYPE_RIGHT_OF_TEXT']),
    isDisabled: ytv_bol(),
    navigationEndpoint: ytv_enp(),
    serviceEndpoint: ytv_enp(),
    size: ytv_str(YTSizeType),
    style: ytv_str(YTButtonStyle),
    targetId: ytv_str(),
    text: ytv_sch(YTTextSchema),
    tooltip: ytv_str()
  },
  callToActionButtonRenderer: {
    icon: ytv_sch(YTIconSchema),
    label: ytv_sch(YTTextSchema),
    style: ytv_str(['CALL_TO_ACTION_BUTTON_RENDERER_STYLE_OPAQUE_BLACK'])
  },
  cardCollectionRenderer: {
    allowTeaserDismiss: ytv_bol(),
    cards: ytv_arr(ytv_ren()),
    closeButton: ytv_ren(),
    headerText: ytv_sch(YTTextSchema),
    icon: ytv_ren(),
    logIconVisibilityUpdates: ytv_bol(),
    onIconTapCommand: ytv_enp()
  },
  cardRenderer: {
    cueRanges: ytv_arr(ytv_sch({
      endCardActiveMs: ytv_str(),
      iconAfterTeaserMs: ytv_str(),
      startCardActiveMs: ytv_str(),
      teaserDurationMs: ytv_str()
    })),
    teaser: ytv_ren()
  },
  carouselItemRenderer: {
    backgroundColor: ytv_num(),
    carouselItems: ytv_arr(ytv_ren()),
    layoutStyle: ytv_str(['CAROUSEL_ITEM_RENDERER_LAYOUT_STYLE_DESTINATION']),
    paginationThumbnails: ytv_arr(ytv_sch(YTThumbnailSchema)),
    paginatorAlignment: ytv_str(['CAROUSEL_ITEM_RENDERER_PAGINATOR_ALIGNMENT_START'])
  },
  channelMetadataRenderer: {
    androidAppindexingLink: ytv_str(),
    androidDeepLink: ytv_str(),
    availableCountryCodes: ytv_arr(ytv_str()),
    avatar: ytv_sch(YTThumbnailSchema),
    channelUrl: ytv_str(),
    description: ytv_str(),
    externalId: ytv_str(),
    iosAppindexingLink: ytv_str(),
    isFamilySafe: ytv_bol(),
    keywords: ytv_str(),
    ownerUrls: ytv_arr(ytv_str()),
    rssUrl: ytv_str(),
    title: ytv_str(),
    vanityChannelUrl: ytv_str()
  },
  channelRenderer: {
    channelId: ytv_str(),
    descriptionSnippet: ytv_sch(YTTextSchema),
    longBylineText: ytv_sch(YTTextSchema),
    navigationEndpoint: ytv_enp(),
    ownerBadges: ytv_arr(ytv_ren()),
    shortBylineText: ytv_sch(YTTextSchema),
    subscribeButton: ytv_ren(),
    subscriberCountText: ytv_sch(YTTextSchema),
    subscriptionButton: ytv_sch({
      subscribed: ytv_bol()
    }),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema),
    videoCountText: ytv_sch(YTTextSchema)
  },
  channelThumbnailWithLinkRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    navigationEndpoint: ytv_enp(),
    thumbnail: ytv_sch(YTThumbnailSchema)
  },
  channelVideoPlayerRenderer: {
    description: ytv_sch(YTTextSchema),
    publishedTimeText: ytv_sch(YTTextSchema),
    readMoreText: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema),
    videoId: ytv_str(),
    viewCountText: ytv_sch(YTTextSchema)
  },
  chipCloudChipRenderer: {
    isSelected: ytv_bol(),
    location: ytv_str(['CHIP_LOCATION_SEARCH_RESULTS']),
    navigationEndpoint: ytv_enp(),
    style: ytv_ren(YTStyleSchema),
    targetId: ytv_str(),
    text: ytv_sch(YTTextSchema),
    uniqueId: ytv_str(['ATTRIBUTE_FILTER_TYPE_EXPLORE'])
  },
  chipCloudRenderer: {
    chips: ytv_arr(ytv_ren()),
    horizontalScrollable: ytv_bol(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    nextButton: ytv_ren(),
    previousButton: ytv_ren(),
    style: ytv_sch({
      backgroundStyle: ytv_str(['CHIP_CLOUD_BACKGROUND_STYLE_UNKNOWN'])
    })
  },
  cinematicContainerRenderer: {
    config: ytv_sch({
      animationConfig: ytv_sch({
        minImageUpdateIntervalMs: ytv_num(),
        crossfadeDurationMs: ytv_num(),
        crossfadeStartOffset: ytv_num(),
        maxFrameRate: ytv_num()
      }),
      applyClientImageBlur: ytv_bol(),
      blurStrength: ytv_num(),
      bottomColorSourceHeightMultiplier: ytv_num(),
      darkThemeBackgroundColor: ytv_num(),
      colorSourceHeightMultiplier: ytv_num(),
      colorSourceSizeMultiplier: ytv_num(),
      colorSourceWidthMultiplier: ytv_num(),
      enableInLightTheme: ytv_bol(),
      lightThemeBackgroundColor: ytv_num(),
      maxBottomColorSourceHeight: ytv_num(),
      pageType: ytv_str(['CINEMATIC_CONTAINER_PAGE_TYPE_SHORTS']),
      settingOnByDefault: ytv_bol(),
      watchFullscreenConfig: ytv_sch({
        colorSourceWidthMultiplier: ytv_num(),
        colorSourceHeightMultiplier: ytv_num(),
        flatScrimColor: ytv_num(),
        scrimGradientConfig: ytv_sch({
          gradientColors: ytv_arr(ytv_sch({
            darkThemeColor: ytv_num(),
            lightThemeColor: ytv_num(),
            startLocation: ytv_num()
          })),
          gradientEndPointX: ytv_num(),
          gradientEndPointY: ytv_num(),
          gradientStartPointX: ytv_num(),
          gradientStartPointY: ytv_num(),
          gradientType: ytv_str(['CINEMATIC_CONTAINER_GRADIENT_TYPE_RADIAL'])
        }),
        scrimWidthMultiplier: ytv_num(),
        scrimHeightMultiplier: ytv_num()
      })
    }),
    gradientColorConfig: ytv_arr(ytv_sch({
      darkThemeColor: ytv_num(),
      startLocation: ytv_num()
    })),
    presentationStyle: ytv_str(['CINEMATIC_CONTAINER_PRESENTATION_STYLE_DYNAMIC_BLURRED', 'CINEMATIC_CONTAINER_PRESENTATION_STYLE_STATIC_SINGLE_COLOR'])
  },
  clientSideToggleMenuItemRenderer: {
    command: ytv_enp(),
    defaultIcon: ytv_sch(YTIconSchema),
    defaultText: ytv_sch(YTTextSchema),
    isToggled: ytv_bol(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    menuItemIdentifier: ytv_str(),
    toggledIcon: ytv_sch(YTIconSchema),
    toggledText: ytv_sch(YTTextSchema)
  },
  clipAdStateRenderer: {
    body: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema)
  },
  clipCreationRenderer: {
    adStateOverlay: ytv_ren(),
    cancelButton: ytv_ren(),
    displayName: ytv_sch(YTTextSchema),
    externalVideoId: ytv_str(),
    publicityLabel: ytv_str(),
    publicityLabelIcon: ytv_str(YTIconType),
    saveButton: ytv_ren(),
    scrubber: ytv_ren(),
    titleInput: ytv_ren(),
    userAvatar: ytv_sch(YTThumbnailSchema)
  },
  clipCreationScrubberRenderer: {
    defaultLengthMs: ytv_num(),
    durationAccessibility: ytv_sch(YTAccessibilitySchema),
    endAccessibility: ytv_sch(YTAccessibilitySchema),
    lengthTemplate: ytv_str(),
    maxLengthMs: ytv_num(),
    minLengthMs: ytv_num(),
    startAccessibility: ytv_sch(YTAccessibilitySchema),
    windowSizeMs: ytv_num()
  },
  clipCreationTextInputRenderer: {
    maxCharacterLimit: ytv_num(),
    placeholderText: ytv_sch(YTTextSchema)
  },
  clipSectionRenderer: {
    contents: ytv_arr(ytv_ren())
  },
  collageHeroImageRenderer: {
    bottomRightThumbnail: ytv_sch(YTThumbnailSchema),
    leftThumbnail: ytv_sch(YTThumbnailSchema),
    topRightThumbnail: ytv_sch(YTThumbnailSchema)
  },
  commentActionButtonsRenderer: {
    dislikeButton: ytv_ren(),
    likeButton: ytv_ren(),
    replyButton: ytv_ren(),
    shareButton: ytv_ren(),
    style: ytv_str(['COMMENT_ACTION_BUTTON_STYLE_TYPE_DESKTOP_TOOLBAR'])
  },
  commentRepliesRenderer: {
    contents: ytv_arr(ytv_ren()),
    hideReplies: ytv_ren(),
    hideRepliesIcon: ytv_ren(),
    targetId: ytv_str(),
    viewReplies: ytv_ren(),
    viewRepliesCreatorThumbnail: ytv_sch(YTThumbnailSchema),
    viewRepliesIcon: ytv_ren()
  },
  commentReplyDialogRenderer: {
    aadcGuidelinesStateEntityKey: ytv_str(),
    authorThumbnail: ytv_sch(YTThumbnailSchema),
    cancelButton: ytv_ren(),
    emojiButton: ytv_ren(),
    emojiPicker: ytv_ren(),
    errorMessage: ytv_sch(YTTextSchema),
    placeholderText: ytv_sch(YTTextSchema),
    replyButton: ytv_ren()
  },
  commentSimpleboxRenderer: {
    aadcGuidelinesStateEntityKey: ytv_str(),
    authorThumbnail: ytv_sch(YTThumbnailSchema),
    avatarSize: ytv_str(['SIMPLEBOX_AVATAR_SIZE_TYPE_DEFAULT']),
    cancelButton: ytv_ren(),
    emojiButton: ytv_ren(),
    emojiPicker: ytv_ren(),
    placeholderText: ytv_sch(YTTextSchema),
    prepareAccountEndpoint: ytv_enp(),
    submitButton: ytv_ren()
  },
  commentThreadRenderer: {
    commentViewModel: ytv_ren(),
    isModeratedElqComment: ytv_bol(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    renderingPriority: ytv_str(['RENDERING_PRIORITY_PINNED_COMMENT', 'RENDERING_PRIORITY_UNKNOWN']),
    replies: ytv_ren()
  },
  commentsHeaderRenderer: {
    commentsCount: ytv_sch(YTTextSchema),
    countText: ytv_sch(YTTextSchema),
    createRenderer: ytv_ren(),
    customEmojis: ytv_arr(ytv_sch(YTEmojiSchema)),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    showSeparator: ytv_bol(),
    sortMenu: ytv_ren(),
    titleText: ytv_sch(YTTextSchema),
    unicodeEmojisUrl: ytv_str()
  },
  compactInfocardRenderer: {
    content: ytv_ren()
  },
  compactLinkRenderer: {
    icon: ytv_sch(YTIconSchema),
    navigationEndpoint: ytv_enp(),
    style: ytv_str(['COMPACT_LINK_STYLE_TYPE_CREATION_MENU']),
    title: ytv_sch(YTTextSchema)
  },
  compactVideoRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    badges: ytv_arr(ytv_ren()),
    channelThumbnail: ytv_sch(YTThumbnailSchema),
    lengthText: ytv_sch(YTTextSchema),
    longBylineText: ytv_sch(YTTextSchema),
    menu: ytv_ren(),
    navigationEndpoint: ytv_enp(),
    ownerBadges: ytv_arr(ytv_ren()),
    publishedTimeText: ytv_sch(YTTextSchema),
    richThumbnail: ytv_ren(),
    shortBylineText: ytv_sch(YTTextSchema),
    shortViewCountText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema),
    videoId: ytv_str(),
    viewCountText: ytv_sch(YTTextSchema)
  },
  compositeVideoPrimaryInfoRenderer: {},
  confirmDialogRenderer: {
    cancelButton: ytv_ren(),
    confirmButton: ytv_ren(),
    dialogMessages: ytv_arr(ytv_sch(YTTextSchema)),
    onClosedActions: ytv_arr(ytv_enp()),
    primaryIsCancel: ytv_bol(),
    title: ytv_sch(YTTextSchema)
  },
  continuationItemRenderer: {
    button: ytv_ren(),
    continuationEndpoint: ytv_enp(),
    ghostCards: ytv_ren(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    trigger: ytv_str(['CONTINUATION_TRIGGER_ON_ITEM_SHOWN'])
  },
  conversationBarRenderer: {
    availabilityMessage: ytv_ren()
  },
  decoratedPlayerBarRenderer: {
    playerBar: ytv_ren(),
  },
  defaultPromoPanelBylineRenderer: {
    badgeRenderers: ytv_arr(ytv_ren()),
    bylineText: ytv_sch(YTTextSchema),
    thumbnailDetails: ytv_sch(YTThumbnailSchema)
  },
  defaultPromoPanelRenderer: {
    actionButton: ytv_ren(),
    byline: ytv_ren(),
    description: ytv_sch(YTTextSchema),
    inlinePlaybackRenderer: ytv_ren(),
    largeFormFactorBackgroundThumbnail: ytv_ren(),
    metadataOrder: ytv_str(['DEFAULT_PROMO_PANEL_RENDERER_METADATA_ORDER_TITLE_DESCRIPTION']),
    minPanelDisplayDurationMs: ytv_num(),
    minVideoPlayDurationMs: ytv_num(),
    navigationEndpoint: ytv_enp(),
    panelLayout: ytv_str(['DEFAULT_PROMO_PANEL_RENDERER_LAYOUT_C']),
    scrimColorValues: ytv_arr(ytv_num()),
    scrimRotation: ytv_num(),
    smallFormFactorBackgroundThumbnail: ytv_ren(),
    title: ytv_sch(YTTextSchema)
  },
  desktopTopbarRenderer: {
    a11ySkipNavigationButton: ytv_ren(),
    backButton: ytv_ren(),
    countryCode: ytv_str(),
    forwardButton: ytv_ren(),
    hotkeyDialog: ytv_ren(),
    logo: ytv_ren(),
    searchbox: ytv_ren(),
    topbarButtons: ytv_arr(ytv_ren()),
    voiceSearchButton: ytv_ren()
  },
  downloadButtonRenderer: {
    command: ytv_enp(),
    size: ytv_str(YTSizeType),
    style: ytv_str(YTButtonStyle),
    targetId: ytv_str()
  },
  emojiPickerCategoryButtonRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    categoryId: ytv_str(),
    icon: ytv_sch(YTIconSchema),
    targetId: ytv_str(),
    tooltip: ytv_str()
  },
  emojiPickerCategoryRenderer: {
    categoryId: ytv_str(),
    categoryType: ytv_str(['CATEGORY_TYPE_GLOBAL', 'CATEGORY_TYPE_UNICODE']),
    emojiData: ytv_arr(ytv_sch(YTEmojiSchema)),
    emojiIds: ytv_arr(ytv_str()),
    imageLoadingLazy: ytv_bol(),
    title: ytv_sch(YTTextSchema),
    usePngImages: ytv_bol()
  },
  emojiPickerRenderer: {
    categories: ytv_arr(ytv_ren()),
    categoryButtons: ytv_arr(ytv_ren()),
    clearSearchLabel: ytv_str(),
    id: ytv_str(),
    pickSkinToneText: ytv_sch(YTTextSchema),
    searchNoResultsText: ytv_sch(YTTextSchema),
    searchPlaceholderText: ytv_sch(YTTextSchema),
    skinToneDarkLabel: ytv_str(),
    skinToneGenericLabel: ytv_str(),
    skinToneLightLabel: ytv_str(),
    skinToneMediumDarkLabel: ytv_str(),
    skinToneMediumLabel: ytv_str(),
    skinToneMediumLightLabel: ytv_str()
  },
  emojiPickerUpsellCategoryRenderer: {
    categoryId: ytv_str(),
    command: ytv_enp(),
    emojiIds: ytv_arr(ytv_str()),
    emojiTooltip: ytv_str(),
    title: ytv_sch(YTTextSchema),
    upsell: ytv_sch(YTTextSchema)
  },
  endScreenPlaylistRenderer: {
    longBylineText: ytv_sch(YTTextSchema),
    navigationEndpoint: ytv_enp(),
    playlistId: ytv_str(),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema),
    videoCount: ytv_str(),
    videoCountText: ytv_sch(YTTextSchema)
  },
  endScreenVideoRenderer: {
    lengthInSeconds: ytv_num(),
    lengthText: ytv_sch(YTTextSchema),
    navigationEndpoint: ytv_enp(),
    publishedTimeText: ytv_sch(YTTextSchema),
    shortBylineText: ytv_sch(YTTextSchema),
    shortViewCountText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema),
    videoId: ytv_str()
  },
  endscreenElementRenderer: {
    aspectRatio: ytv_num(),
    callToAction: ytv_sch(YTTextSchema),
    dismiss: ytv_sch(YTTextSchema),
    endMs: ytv_str(),
    endpoint: ytv_enp(),
    hovercardButton: ytv_ren(),
    icon: ytv_sch(YTThumbnailSchema),
    id: ytv_str(),
    image: ytv_sch(YTThumbnailSchema),
    isSubscribe: ytv_bol(),
    left: ytv_num(),
    metadata: ytv_sch(YTTextSchema),
    playlistLength: ytv_sch(YTTextSchema),
    startMs: ytv_str(),
    style: ytv_str(['CHANNEL', 'PLAYLIST', 'VIDEO', 'WEBSITE']),
    subscribersText: ytv_sch(YTTextSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema),
    top: ytv_num(),
    width: ytv_num()
  },
  endscreenRenderer: {
    elements: ytv_arr(ytv_ren()),
    startMs: ytv_str()
  },
  engagementPanelSectionListRenderer: {
    content: ytv_ren(),
    continuationService: ytv_str(['ENGAGEMENT_PANEL_CONTINUATION_SERVICE_BROWSE']),
    disablePullRefresh: ytv_bol(),
    header: ytv_ren(),
    identifier: ytv_sch(YTEngagementPanelIdentifier),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    onCloseCommand: ytv_enp(),
    onShowCommands: ytv_arr(ytv_enp()),
    panelIdentifier: ytv_str(),
    resizability: ytv_str(['ENGAGEMENT_PANEL_RESIZABILITY_SNAP']),
    size: ytv_str(['ENGAGEMENT_PANEL_SIZE_OPTIMIZED_FOR_CHANNELS']),
    targetId: ytv_str(),
    veType: ytv_num(),
    visibility: ytv_str(YTEngagementPanelVisibility)
  },
  engagementPanelTitleHeaderRenderer: {
    actionButton: ytv_ren(),
    contextualInfo: ytv_sch(YTTextSchema),
    informationButton: ytv_ren(),
    menu: ytv_ren(),
    navigationButton: ytv_ren(),
    subheader: ytv_ren(),
    title: ytv_sch(YTTextSchema),
    visibilityButton: ytv_ren(),
  },
  expandableMetadataRenderer: {
    collapseButton: ytv_ren(),
    colorData: ytv_sch({
      darkColorPalette: ytv_sch({
        section1Color: ytv_num(),
        section2Color: ytv_num(),
        section3Color: ytv_num(),
        primaryTitleColor: ytv_num(),
        secondaryTitleColor: ytv_num(),
        iconActivatedColor: ytv_num(),
        iconInactiveColor: ytv_num(),
        section4Color: ytv_num(),
        iconDisabledColor: ytv_num()
      }),
      lightColorPalette: ytv_sch({
        section1Color: ytv_num(),
        section2Color: ytv_num(),
        section3Color: ytv_num(),
        primaryTitleColor: ytv_num(),
        secondaryTitleColor: ytv_num(),
        iconActivatedColor: ytv_num(),
        iconInactiveColor: ytv_num(),
        section4Color: ytv_num(),
        iconDisabledColor: ytv_num()
      }),
      vibrantColorPalette: ytv_sch({
        section1Color: ytv_num(),
        section2Color: ytv_num(),
        section3Color: ytv_num(),
        primaryTitleColor: ytv_num(),
        secondaryTitleColor: ytv_num(),
        iconActivatedColor: ytv_num(),
        iconInactiveColor: ytv_num(),
        section4Color: ytv_num(),
        iconDisabledColor: ytv_num()
      })
    }),
    expandButton: ytv_ren(),
    expandedContent: ytv_ren(),
    header: ytv_sch({
      collapsedLabel: ytv_sch(YTTextSchema),
      collapsedThumbnail: ytv_sch(YTThumbnailSchema),
      collapsedTitle: ytv_sch(YTTextSchema),
      expandedTitle: ytv_sch(YTTextSchema),
      showLeadingCollapsedLabel: ytv_bol()
    }),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    useCustomColors: ytv_bol()
  },
  expandableTabRenderer: {
    endpoint: ytv_enp(),
    expandedText: ytv_str(),
    selected: ytv_bol(),
    title: ytv_str()
  },
  expandableVideoDescriptionBodyRenderer: {
    attributedDescriptionBodyText: ytv_ren(YTTextViewModelSchema),
    descriptionBodyText: ytv_sch(YTTextSchema),
    headerRuns: ytv_arr(ytv_unk()),
    showLessText: ytv_sch(YTTextSchema),
    showMoreText: ytv_sch(YTTextSchema)
  },
  expandedShelfContentsRenderer: {
    items: ytv_arr(ytv_ren())
  },
  factoidRenderer: {
    accessibilityText: ytv_str(),
    label: ytv_sch(YTTextSchema),
    value: ytv_sch(YTTextSchema)
  },
  fancyDismissibleDialogRenderer: {
    confirmLabel: ytv_sch(YTTextSchema),
    dialogMessage: ytv_sch(YTTextSchema)
  },
  feedFilterChipBarRenderer: {
    contents: ytv_arr(ytv_ren()),
    nextButton: ytv_ren(),
    previousButton: ytv_ren(),
    styleType: ytv_str(['FEED_FILTER_CHIP_BAR_STYLE_TYPE_DEFAULT'])
  },
  feedNudgeRenderer: {
    applyModernizedStyle: ytv_bol(),
    backgroundStyle: ytv_str(['FEED_NUDGE_BACKGROUND_STYLE_ACCENT_GRADIENT', 'FEED_NUDGE_BACKGROUND_STYLE_UNKNOWN']),
    contentsLocation: ytv_str(['FEED_NUDGE_CONTENTS_LOCATION_LEFT', 'FEED_NUDGE_CONTENTS_LOCATION_UNKNOWN']),
    disableDropShadow: ytv_bol(),
    enableHorizontalButtons: ytv_bol(),
    impressionEndpoint: ytv_enp(),
    primaryButton: ytv_ren(),
    style: ytv_str(['FEED_NUDGE_STYLE_BUTTONS']),
    subtitle: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema),
    trimStyle: ytv_str(['FEED_NUDGE_TRIM_STYLE_NO_TRIM'])
  },
  feedTabbedHeaderRenderer: {
    title: ytv_sch(YTTextSchema)
  },
  fusionSearchboxRenderer: {
    clearButton: ytv_ren(),
    config: ytv_sch({
      webSearchboxConfig: ytv_sch({
        focusSearchbox: ytv_bol(),
        hasOnscreenKeyboard: ytv_bol(),
        requestDomain: ytv_str(),
        requestLanguage: ytv_str()
      })
    }),
    icon: ytv_sch(YTIconSchema),
    placeholderText: ytv_sch(YTTextSchema),
    searchEndpoint: ytv_enp()
  },
  ghostGridRenderer: {
    rows: ytv_num()
  },
  gridChannelRenderer: {
    channelId: ytv_str(),
    navigationEndpoint: ytv_enp(),
    ownerBadges: ytv_arr(ytv_ren()),
    subscribeButton: ytv_ren(),
    subscriberCountText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema),
    videoCountText: ytv_sch(YTTextSchema)
  },
  gridRenderer: {
    isCollapsible: ytv_bol(),
    items: ytv_arr(ytv_ren()),
    targetId: ytv_str()
  },
  gridVideoRenderer: {
    badges: ytv_arr(ytv_ren()),
    menu: ytv_ren(),
    navigationEndpoint: ytv_enp(),
    offlineability: ytv_ren(),
    ownerBadges: ytv_arr(ytv_ren()),
    publishedTimeText: ytv_sch(YTTextSchema),
    richThumbnail: ytv_ren(),
    shortBylineText: ytv_sch(YTTextSchema),
    shortViewCountText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema),
    upcomingEventData: ytv_sch({
      isReminderSet: ytv_bol(),
      startTime: ytv_str(),
      upcomingEventText: ytv_sch(YTTextSchema)
    }),
    videoId: ytv_str(),
    viewCountText: ytv_sch(YTTextSchema)
  },
  guideCollapsibleEntryRenderer: {
    collapserItem: ytv_ren(),
    expandableItems: ytv_arr(ytv_ren()),
    expanderItem: ytv_ren(),
  },
  guideCollapsibleSectionEntryRenderer: {
    collapserIcon: ytv_sch(YTIconSchema),
    expanderIcon: ytv_sch(YTIconSchema),
    headerEntry: ytv_ren(),
    sectionItems: ytv_arr(ytv_ren())
  },
  guideDownloadsEntryRenderer: {
    alwaysShow: ytv_bol(),
    entryRenderer: ytv_ren()
  },
  guideEntryRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    badges: ytv_sch({
      liveBroadcasting: ytv_bol()
    }),
    entryData: ytv_sch({
      guideEntryData: ytv_sch({
        guideEntryId: ytv_str()
      })
    }),
    formattedTitle: ytv_sch(YTTextSchema),
    icon: ytv_sch(YTIconSchema),
    isPrimary: ytv_bol(),
    navigationEndpoint: ytv_enp(),
    presentationStyle: ytv_str(['GUIDE_ENTRY_PRESENTATION_STYLE_NEW_CONTENT', 'GUIDE_ENTRY_PRESENTATION_STYLE_NONE']),
    serviceEndpoint: ytv_enp(),
    targetId: ytv_str(),
    thumbnail: ytv_sch(YTThumbnailSchema)
  },
  guideSectionRenderer: {
    formattedTitle: ytv_sch(YTTextSchema),
    items: ytv_arr(ytv_ren())
  },
  guideSigninPromoRenderer: {
    actionText: ytv_sch(YTTextSchema),
    descriptiveText: ytv_sch(YTTextSchema),
    signInButton: ytv_ren()
  },
  guideSubscriptionsSectionRenderer: {
    formattedTitle: ytv_sch(YTTextSchema),
    handlerDatas: ytv_arr(ytv_str(['GUIDE_ACTION_ADD_TO_SUBSCRIPTIONS', 'GUIDE_ACTION_REMOVE_FROM_SUBSCRIPTIONS'])),
    items: ytv_arr(ytv_ren()),
    sort: ytv_str(['CHANNEL_ALPHABETICAL'])
  },
  hintRenderer: {
    content: ytv_ren(),
    dismissStrategy: ytv_sch({
      type: ytv_str(['DISMISS_ON_TAP_ONLY'])
    }),
    dwellTimeMs: ytv_str(),
    hintCap: ytv_sch({
      impressionCap: ytv_str()
    }),
    hintId: ytv_str(),
    suggestedPosition: ytv_sch({
      type: ytv_str(['HINT_SUGGESTED_POSITION_TYPE_ABOVE', 'HINT_SUGGESTED_POSITION_TYPE_BELOW'])
    })
  },
  horizontalCardListRenderer: {
    cards: ytv_arr(ytv_ren()),
    footerButton: ytv_ren(),
    header: ytv_ren(),
    nextButton: ytv_ren(),
    previousButton: ytv_ren(),
    style: ytv_sch({
      type: ytv_str(['HORIZONTAL_CARD_LIST_STYLE_TYPE_ENGAGEMENT_PANEL_SECTION'])
    })
  },
  horizontalListRenderer: {
    collapsedItemCount: ytv_num(),
    continuations: ytv_arr(ytv_ren(YTRendererContinuationSchema)),
    itemSizeConstraint: ytv_str(['LIST_ITEM_SIZE_CONSTRAINT_EQUAL_HEIGHT']),
    items: ytv_arr(ytv_ren()),
    nextButton: ytv_ren(),
    previousButton: ytv_ren(),
    visibleItemCount: ytv_num()
  },
  hotkeyDialogRenderer: {
    dismissButton: ytv_ren(),
    sections: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema)
  },
  hotkeyDialogSectionRenderer: {
    options: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema)
  },
  hotkeyDialogSectionOptionRenderer: {
    badge: ytv_ren(),
    hotkey: ytv_str(),
    hotkeyAccessibilityLabel: ytv_sch(YTAccessibilitySchema),
    label: ytv_sch(YTTextSchema)
  },
  inFeedAdLayoutRenderer: {
    adLayoutMetadata: ytv_ren(YTAdLayoutMetadataSchema),
    renderingContent: ytv_ren()
  },
  inPlayerAdLayoutRenderer: {
    adLayoutMetadata: ytv_ren(YTAdLayoutMetadataSchema),
    layoutExitNormalTriggers: ytv_arr(ytv_sch({
      id: ytv_str(),
      layoutIdExitedTrigger: ytv_sch({
        triggeringLayoutId: ytv_str()
      })
    })),
    renderingContent: ytv_ren()
  },
  infoCardIconRenderer: {},
  inlinePlaybackRenderer: {
    inlinePlaybackEndpoint: ytv_enp(),
    navigationEndpoint: ytv_enp(),
    thumbnail: ytv_sch(YTThumbnailSchema),
    videoId: ytv_str()
  },
  instreamVideoAdRenderer: {
    adLayoutLoggingData: ytv_ren(YTAdLayoutLoggingDataSchema),
    clickthroughEndpoint: ytv_enp(),
    csiParameters: ytv_arr(ytv_sch({
      key: ytv_str(),
      value: ytv_str()
    })),
    elementId: ytv_str(),
    externalVideoId: ytv_str(),
    layoutId: ytv_str(),
    legacyInfoCardVastExtension: ytv_str(),
    pings: ytv_ren(YTVideoAdPingsSchema),
    playerVars: ytv_str(),
    skipOffsetMilliseconds: ytv_num(),
    sodarExtensionData: ytv_sch({
      bgp: ytv_str(),
      bgub: ytv_str(),
      scs: ytv_str(),
      siub: ytv_str()
    })
  },
  itemSectionHeaderRenderer: {
    title: ytv_sch(YTTextSchema)
  },
  itemSectionRenderer: {
    contents: ytv_arr(ytv_ren()),
    header: ytv_ren(),
    sectionIdentifier: ytv_str(),
    targetId: ytv_str()
  },
  likeButtonRenderer: {
    dislikeCountText: ytv_sch(YTTextSchema),
    dislikeCountTooltipText: ytv_sch(YTTextSchema),
    dislikeCountWithDislikeText: ytv_sch(YTTextSchema),
    dislikeCountWithUndislikeText: ytv_sch(YTTextSchema),
    dislikeNavigationEndpoint: ytv_enp(),
    hideDislikeButton: ytv_bol(),
    likeCommand: ytv_enp(),
    likeCount: ytv_num(),
    likeCountText: ytv_sch(YTTextSchema),
    likeCountTooltipText: ytv_sch(YTTextSchema),
    likeCountWithLikeText: ytv_sch(YTTextSchema),
    likeCountWithUnlikeText: ytv_sch(YTTextSchema),
    likeStatus: ytv_str(YTLikeStatus),
    likeStatusEntityKey: ytv_str(),
    likesAllowed: ytv_bol(),
    target: ytv_sch({
      videoId: ytv_str()
    })
  },
  lineItemRenderer: {
    text: ytv_sch(YTTextSchema)
  },
  lineRenderer: {
    items: ytv_arr(ytv_ren())
  },
  liveChatAuthorBadgeRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    customThumbnail: ytv_sch(YTThumbnailSchema),
    icon: ytv_sch(YTIconSchema),
    tooltip: ytv_str()
  },
  liveChatBannerHeaderRenderer: {
    contextMenuButton: ytv_ren(),
    contextMenuEndpoint: ytv_enp(),
    icon: ytv_sch(YTIconSchema),
    text: ytv_sch(YTTextSchema)
  },
  liveChatBannerPollRenderer: {
    authorPhoto: ytv_sch(YTThumbnailSchema),
    collapsedStateEntityKey: ytv_str(),
    contextMenuButton: ytv_ren(),
    contextMenuEndpoint: ytv_enp(),
    liveChatPollStateEntityKey: ytv_str(),
    pollChoices: ytv_arr(ytv_sch({
      pollOptionId: ytv_num(),
      text: ytv_sch(YTTextSchema)
    })),
    pollQuestion: ytv_sch(YTTextSchema)
  },
  liveChatBannerRenderer: {
    actionId: ytv_str(),
    backgroundType: ytv_str(['LIVE_CHAT_BANNER_BACKGROUND_TYPE_SHIMMER_ANIMATION', 'LIVE_CHAT_BANNER_BACKGROUND_TYPE_STATIC']),
    bannerProperties: ytv_sch({
      autoCollapseDelay: ytv_sch({
        seconds: ytv_str()
      }),
      bannerCollapsedStateEntityKey: ytv_str()
    }),
    bannerType: ytv_str(['LIVE_CHAT_BANNER_TYPE_ACTIVE_POLL', 'LIVE_CHAT_BANNER_TYPE_PINNED_MESSAGE']),
    contents: ytv_ren(),
    header: ytv_ren(),
    isStackable: ytv_bol(),
    onCollapseCommand: ytv_enp(),
    onExpandCommand: ytv_enp(),
    targetId: ytv_str(),
    viewerIsCreator: ytv_bol()
  },
  liveChatDialogRenderer: {
    confirmButton: ytv_ren(),
    dialogMessages: ytv_arr(ytv_sch(YTTextSchema)),
    title: ytv_sch(YTTextSchema)
  },
  liveChatEngagementPanelRenderer: {
    engagementPanelSupportedRenderers: ytv_ren()
  },
  liveChatHeaderRenderer: {
    collapseButton: ytv_ren(),
    overflowMenu: ytv_ren(),
    viewSelector: ytv_ren(),
    viewerLeaderboardEntryPoint: ytv_ren()
  },
  liveChatIconToggleButtonRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    activeTooltip: ytv_str(),
    icon: ytv_sch(YTIconSchema),
    targetId: ytv_str(),
    toggledIcon: ytv_sch(YTIconSchema),
    tooltip: ytv_str()
  },
  liveChatItemListRenderer: {
    enablePauseChatKeyboardShortcuts: ytv_bol(),
    maxItemsToDisplay: ytv_num(),
    moreCommentsBelowButton: ytv_ren(),
    targetId: ytv_str()
  },
  liveChatMembershipItemRenderer: {
    authorBadges: ytv_arr(ytv_ren()),
    authorExternalChannelId: ytv_str(),
    authorName: ytv_sch(YTTextSchema),
    authorPhoto: ytv_sch(YTThumbnailSchema),
    contextMenuAccessibility: ytv_sch(YTAccessibilitySchema),
    contextMenuEndpoint: ytv_enp(),
    headerPrimaryText: ytv_sch(YTTextSchema),
    headerSubtext: ytv_sch(YTTextSchema),
    id: ytv_str(),
    message: ytv_sch(YTTextSchema),
    timestampText: ytv_sch(YTTextSchema),
    timestampUsec: ytv_str()
  },
  liveChatMessageInputRenderer: {
    authorName: ytv_sch(YTTextSchema),
    authorPhoto: ytv_sch(YTThumbnailSchema),
    emojiPickerButton: ytv_ren(),
    inputField: ytv_ren(),
    pickerButtons: ytv_arr(ytv_ren()),
    pickers: ytv_arr(ytv_ren()),
    sendButton: ytv_ren(),
    targetId: ytv_str()
  },
  liveChatPaidMessageRenderer: {
    authorBadges: ytv_arr(ytv_ren()),
    authorExternalChannelId: ytv_str(),
    authorName: ytv_sch(YTTextSchema),
    authorNameTextColor: ytv_num(),
    authorPhoto: ytv_sch(YTThumbnailSchema),
    bodyBackgroundColor: ytv_num(),
    bodyTextColor: ytv_num(),
    buyButton: ytv_ren(),
    contextMenuAccessibility: ytv_sch(YTAccessibilitySchema),
    contextMenuEndpoint: ytv_enp(),
    creatorHeartButton: ytv_ren(),
    headerBackgroundColor: ytv_num(),
    headerTextColor: ytv_num(),
    id: ytv_str(),
    isV2Style: ytv_bol(),
    leaderboardBadge: ytv_ren(),
    message: ytv_sch(YTTextSchema),
    pdgLikeButton: ytv_ren(),
    purchaseAmountText: ytv_sch(YTTextSchema),
    replyButton: ytv_ren(),
    textInputBackgroundColor: ytv_num(),
    timestampColor: ytv_num(),
    timestampText: ytv_sch(YTTextSchema),
    timestampUsec: ytv_str()
  },
  liveChatParticipantRenderer: {
    authorBadges: ytv_arr(ytv_ren()),
    authorName: ytv_sch(YTTextSchema),
    authorPhoto: ytv_sch(YTThumbnailSchema)
  },
  liveChatParticipantsListRenderer: {
    backButton: ytv_ren(),
    participants: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema)
  },
  liveChatPlaceholderItemRenderer: {
    id: ytv_str(),
    timestampUsec: ytv_str()
  },
  liveChatRenderer: YTLiveChatRendererSchema,
  liveChatSponsorshipsGiftPurchaseAnnouncementRenderer: {
    authorExternalChannelId: ytv_str(),
    header: ytv_ren(),
    id: ytv_str(),
    optInPrompt: ytv_ren(),
    timestampUsec: ytv_str()
  },
  liveChatSponsorshipsGiftRedemptionAnnouncementRenderer: {
    authorBadges: ytv_arr(ytv_ren()),
    authorExternalChannelId: ytv_str(),
    authorName: ytv_sch(YTTextSchema),
    authorPhoto: ytv_sch(YTThumbnailSchema),
    contextMenuAccessibility: ytv_sch(YTAccessibilitySchema),
    contextMenuEndpoint: ytv_enp(),
    id: ytv_str(),
    message: ytv_sch(YTTextSchema),
    timestampText: ytv_sch(YTTextSchema),
    timestampUsec: ytv_str()
  },
  liveChatSponsorshipsHeaderRenderer: {
    authorBadges: ytv_arr(ytv_ren()),
    authorName: ytv_sch(YTTextSchema),
    authorPhoto: ytv_sch(YTThumbnailSchema),
    contextMenuAccessibility: ytv_sch(YTAccessibilitySchema),
    contextMenuEndpoint: ytv_enp(),
    image: ytv_sch(YTThumbnailSchema),
    primaryText: ytv_sch(YTTextSchema)
  },
  liveChatTextInputFieldRenderer: {
    emojiCharacterCount: ytv_num(),
    maxCharacterLimit: ytv_num(),
    placeholder: ytv_sch(YTTextSchema),
    unselectedPlaceholder: ytv_sch(YTTextSchema)
  },
  liveChatTextMessageRenderer: {
    authorBadges: ytv_arr(ytv_ren()),
    authorExternalChannelId: ytv_str(),
    authorName: ytv_sch(YTTextSchema),
    authorPhoto: ytv_sch(YTThumbnailSchema),
    beforeContentButtons: ytv_arr(ytv_ren()),
    contextMenuAccessibility: ytv_sch(YTAccessibilitySchema),
    contextMenuEndpoint: ytv_enp(),
    id: ytv_str(),
    message: ytv_sch(YTTextSchema),
    timestampText: ytv_sch(YTTextSchema),
    timestampUsec: ytv_str()
  },
  liveChatTickerPaidMessageItemRenderer: {
    amountTextColor: ytv_num(),
    animationOrigin: ytv_str(['ANIMATION_ORIGIN_PDG_TICKER_LIKE']),
    authorExternalChannelId: ytv_str(),
    authorPhoto: ytv_sch(YTThumbnailSchema),
    authorUsername: ytv_sch(YTTextSchema),
    durationSec: ytv_num(),
    dynamicStateData: ytv_sch({
      emptyStateText: ytv_ren(YTTextViewModelSchema),
      engagementStateEntityKey: ytv_str(),
      likeCountEntityKey: ytv_str(),
      likeIcon: ytv_sch(YTIconSchema),
      likedIcon: ytv_sch(YTIconSchema),
      likesEmptyStateText: ytv_ren(YTTextViewModelSchema),
      replyCountEntityKey: ytv_str(),
      replyIcon: ytv_sch(YTIconSchema),
      stateSlideDirection: ytv_str(['LIVE_CHAT_TICKER_SLIDE_DIRECTION_BOTTOM_UP']),
      stateSlideDurationMs: ytv_num(),
      stateUpdateDelayAfterMs: ytv_num(),
      stateUpdateDelayBeforeMs: ytv_num()
    }),
    endBackgroundColor: ytv_num(),
    fullDurationSec: ytv_num(),
    id: ytv_str(),
    openEngagementPanelCommand: ytv_enp(),
    showItemEndpoint: ytv_enp(),
    startBackgroundColor: ytv_num()
  },
  liveChatTickerRenderer: {
    sentinel: ytv_bol()
  },
  liveChatTickerSponsorItemRenderer: {
    authorExternalChannelId: ytv_str(),
    detailIcon: ytv_sch(YTIconSchema),
    detailText: ytv_sch(YTTextSchema),
    detailTextColor: ytv_num(),
    durationSec: ytv_num(),
    endBackgroundColor: ytv_num(),
    fullDurationSec: ytv_num(),
    id: ytv_str(),
    showItemEndpoint: ytv_enp(),
    sponsorPhoto: ytv_sch(YTThumbnailSchema),
    startBackgroundColor: ytv_num()
  },
  liveChatViewerEngagementMessageRenderer: {
    actionButton: ytv_ren(),
    icon: ytv_sch(YTIconSchema),
    id: ytv_str(),
    message: ytv_sch(YTTextSchema),
    timestampUsec: ytv_str()
  },
  liveStreamOfflineSlateRenderer: {
    actionButtons: ytv_arr(ytv_ren()),
    canShowCountdown: ytv_bol(),
    mainText: ytv_sch(YTTextSchema),
    offlineSlateStyle: ytv_str(['OFFLINE_SLATE_STYLE_ABSTRACT']),
    scheduledStartTime: ytv_str(),
    subtitleText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema)
  },
  liveStreamabilityRenderer: {
    broadcastId: ytv_str(),
    creatorRedirect: ytv_sch({
      hideAutoplayToggle: ytv_bol()
    }),
    displayEndscreen: ytv_bol(),
    offlineSlate: ytv_ren(),
    pollDelayMs: ytv_str(),
    videoId: ytv_str()
  },
  macroMarkersInfoItemRenderer: {
    infoText: ytv_sch(YTTextSchema),
    menu: ytv_ren()
  },
  macroMarkersListItemRenderer: {
    carouselType: ytv_str(['MACRO_MARKERS_LIST_ITEM_RENDERER_CAROUSEL_TYPE_DEFAULT']),
    darkColorPalette: ytv_sch({
      primaryTitleColor: ytv_num(),
      secondaryTitleColor: ytv_num(),
      section1Color: ytv_num(),
      section2Color: ytv_num(),
      section3Color: ytv_num(),
      section4Color: ytv_num()
    }),
    endRepeatCommand: ytv_enp(),
    isHighlighted: ytv_bol(),
    layout: ytv_str(['MACRO_MARKERS_LIST_ITEM_RENDERER_LAYOUT_VERTICAL']),
    lightColorPalette: ytv_sch({
      primaryTitleColor: ytv_num(),
      secondaryTitleColor: ytv_num(),
      section1Color: ytv_num(),
      section2Color: ytv_num(),
      section3Color: ytv_num(),
      section4Color: ytv_num()
    }),
    macroMarkerRepeatStateEntityKey: ytv_str(),
    onTap: ytv_enp(),
    playerStateEntityKey: ytv_str(),
    repeatButton: ytv_ren(),
    shareButton: ytv_ren(),
    thumbnail: ytv_sch(YTThumbnailSchema),
    timeDescription: ytv_sch(YTTextSchema),
    timeDescriptionA11yLabel: ytv_str(),
    title: ytv_sch(YTTextSchema)
  },
  macroMarkersListRenderer: {
    contents: ytv_arr(ytv_ren()),
    syncButtonLabel: ytv_sch(YTTextSchema),
    syncModelEntityKey: ytv_str()
  },
  markerRenderer: {
    timeRangeStartMillis: ytv_num(),
    title: ytv_sch(YTTextSchema)
  },
  mealbarPromoRenderer: {
    actionButton: ytv_ren(),
    dismissButton: ytv_ren(),
    icon: ytv_sch(YTThumbnailSchema),
    impressionEndpoints: ytv_arr(ytv_enp()),
    isVisible: ytv_bol(),
    messageTexts: ytv_arr(ytv_sch(YTTextSchema)),
    messageTitle: ytv_sch(YTTextSchema),
    style: ytv_str(['STYLE_MESSAGE']),
    triggerCondition: ytv_str(['TRIGGER_CONDITION_POST_AD'])
  },
  mediaLockupRenderer: {
    disableEndpoint: ytv_bol(),
    endpoint: ytv_enp(),
    enableSubtitleLaunchIcon: ytv_bol(),
    maxLinesSubtitle: ytv_num(),
    maxLinesTitle: ytv_num(),
    subtitle: ytv_sch(YTTextSchema),
    thumbnailDetails: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema),
    uiTweaks: ytv_sch({
      thumbnailHeight: ytv_num(),
      thumbnailWidth: ytv_num(),
      useZeroPadding: ytv_bol()
    })
  },
  menuFlexibleItemRenderer: {
    menuItem: ytv_ren(),
    topLevelButton: ytv_ren()
  },
  menuNavigationItemRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    icon: ytv_sch(YTIconSchema),
    navigationEndpoint: ytv_enp(),
    text: ytv_sch(YTTextSchema)
  },
  menuPopupRenderer: {
    items: ytv_arr(ytv_ren())
  },
  menuRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    disabledCommand: ytv_enp(),
    flexibleItems: ytv_arr(ytv_ren()),
    isDisabled: ytv_bol(),
    items: ytv_arr(ytv_ren()),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    menuPopupAccessibility: ytv_sch(YTAccessibilityDataSchema),
    targetId: ytv_str(),
    topLevelButtons: ytv_arr(ytv_ren())
  },
  menuServiceItemRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    hasSeparator: ytv_bol(),
    icon: ytv_sch(YTIconSchema),
    isDisabled: ytv_bol(),
    isSelected: ytv_bol(),
    serviceEndpoint: ytv_enp(),
    text: ytv_sch(YTTextSchema)
  },
  menuServiceItemDownloadRenderer: {
    serviceEndpoint: ytv_enp()
  },
  merchandiseItemRenderer: {
    accessibilityTitle: ytv_str(),
    additionalFeesText: ytv_str(),
    buttonAccessibilityText: ytv_str(),
    buttonCommand: ytv_enp(),
    buttonText: ytv_str(),
    description: ytv_str(),
    fromVendorText: ytv_str(),
    price: ytv_str(),
    priceReplacementText: ytv_str(),
    showOpenInNewIcon: ytv_bol(),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_str(),
    vendorName: ytv_str()
  },
  merchandiseShelfRenderer: {
    actionButton: ytv_ren(),
    hideText: ytv_str(),
    items: ytv_arr(ytv_ren()),
    shelfType: ytv_str(['MERCHANDISE_SHELF_TYPE_DEFAULT']),
    showText: ytv_str(),
    title: ytv_str()
  },
  messageRenderer: {
    button: ytv_ren(),
    text: ytv_sch(YTTextSchema)
  },
  metadataBadgeRenderer: {
    accessibilityData: ytv_sch(YTAccessibilityDataSchema),
    icon: ytv_sch(YTIconSchema),
    iconSourceUrl: ytv_str(),
    label: ytv_str(),
    style: ytv_str(['BADGE_STYLE_TYPE_SIMPLE', 'BADGE_STYLE_TYPE_LIVE_NOW', 'BADGE_STYLE_TYPE_MEMBERS_ONLY', 'BADGE_STYLE_TYPE_VERIFIED', 'BADGE_STYLE_TYPE_VERIFIED_ARTIST']),
    tooltip: ytv_str()
  },
  metadataRowContainerRenderer: {
    collapsedItemCount: ytv_num(),
    rows: ytv_arr(ytv_ren())
  },
  metadataRowRenderer: {
    contents: ytv_arr(ytv_sch(YTTextSchema)),
    title: ytv_sch(YTTextSchema)
  },
  microformatDataRenderer: {
    androidPackage: ytv_str(),
    appName: ytv_str(),
    availableCountries: ytv_arr(ytv_str()),
    description: ytv_str(),
    familySafe: ytv_bol(),
    iosAppArguments: ytv_str(),
    iosAppStoreId: ytv_str(),
    linkAlternates: ytv_arr(ytv_sch({
      hrefUrl: ytv_str()
    })),
    noindex: ytv_bol(),
    ogType: ytv_str(),
    schemaDotOrgType: ytv_str(),
    siteName: ytv_str(),
    tags: ytv_arr(ytv_str()),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_str(),
    twitterCardType: ytv_str(),
    twitterSiteHandle: ytv_str(),
    unlisted: ytv_bol(),
    urlApplinksAndroid: ytv_str(),
    urlApplinksIos: ytv_str(),
    urlApplinksWeb: ytv_str(),
    urlCanonical: ytv_str(),
    urlTwitterAndroid: ytv_str(),
    urlTwitterIos: ytv_str()
  },
  miniplayerRenderer: {
    enableStashedPlayback: ytv_bol(),
    playbackMode: ytv_str(['PLAYBACK_MODE_ALLOW', 'PLAYBACK_MODE_PAUSED_ONLY'])
  },
  modalWithTitleAndButtonRenderer: {
    button: ytv_ren(),
    content: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema)
  },
  movingThumbnailRenderer: {
    enableHoveredLogging: ytv_bol(),
    enableOverlay: ytv_bol(),
    movingThumbnailDetails: ytv_sch(YTThumbnailSchema)
  },
  multiMarkersPlayerBarRenderer: {
    markersMap: ytv_arr(ytv_sch({
      key: ytv_str(),
      value: ytv_ren({
        markers: ytv_arr(ytv_ren())
      })
    })),
    visibleOnLoad: ytv_sch({
      key: ytv_str()
    })
  },
  multiPageMenuRenderer: {
    sections: ytv_arr(ytv_ren()),
    showLoadingSpinner: ytv_bol(),
    style: ytv_str(['MULTI_PAGE_MENU_STYLE_TYPE_ACCOUNT', 'MULTI_PAGE_MENU_STYLE_TYPE_CREATION', 'MULTI_PAGE_MENU_STYLE_TYPE_NOTIFICATIONS', 'MULTI_PAGE_MENU_STYLE_TYPE_SYSTEM'])
  },
  multiPageMenuSectionRenderer: {
    items: ytv_arr(ytv_ren())
  },
  notificationActionRenderer: {
    actionButton: ytv_ren(),
    closeActionButton: ytv_ren(),
    responseText: ytv_sch(YTTextSchema)
  },
  notificationMultiActionRenderer: {
    buttons: ytv_arr(ytv_ren()),
    dismissalViewStyle: ytv_str(['DISMISSAL_VIEW_STYLE_COMPACT_TALL']),
    responseText: ytv_sch(YTTextSchema)
  },
  notificationTextRenderer: {
    successResponseText: ytv_sch(YTTextSchema),
    undoEndpoint: ytv_enp(),
    undoText: ytv_sch(YTTextSchema)
  },
  notificationTopbarButtonRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    handlerDatas: ytv_arr(ytv_str(['NOTIFICATION_ACTION_UPDATE_UNSEEN_COUNT'])),
    icon: ytv_sch(YTIconSchema),
    menuRequest: ytv_enp(),
    notificationCount: ytv_num(),
    style: ytv_str(['NOTIFICATION_BUTTON_STYLE_TYPE_DEFAULT']),
    tooltip: ytv_str(),
    updateUnseenCountEndpoint: ytv_enp()
  },
  offlineabilityRenderer: YTOfflineabilityRendererSchema,
  overlayPanelHeaderRenderer: {
    title: ytv_sch(YTTextSchema)
  },
  overlayPanelItemListRenderer: {
    items: ytv_arr(ytv_ren()),
    selectedIndex: ytv_num()
  },
  overlayPanelRenderer: {
    content: ytv_ren(),
    header: ytv_ren()
  },
  overlaySectionRenderer: {
    dismissalCommand: ytv_enp(),
    overlay: ytv_ren()
  },
  overlayTwoPanelRenderer: {
    actionPanel: ytv_ren()
  },
  pageHeaderRenderer: {
    content: ytv_ren(),
    pageTitle: ytv_str()
  },
  paidContentOverlayRenderer: {
    durationMs: ytv_str(),
    icon: ytv_sch(YTIconSchema),
    navigationEndpoint: ytv_enp(),
    showInPip: ytv_bol(),
    text: ytv_sch(YTTextSchema)
  },
  pdgCommentChipRenderer: {
    chipColorPalette: ytv_sch({
      backgroundColor: ytv_num(),
      foregroundTitleColor: ytv_num()
    }),
    chipIcon: ytv_sch(YTIconSchema),
    chipText: ytv_sch(YTTextSchema),
    command: ytv_enp(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
  },
  playerAnnotationsExpandedRenderer: {
    allowSwipeDismiss: ytv_bol(),
    annotationId: ytv_str(),
    featuredChannel: ytv_ren(YTFeaturedChannelSchema)
  },
  playerAttestationRenderer: {
    botguardData: ytv_sch({
      interpreterSafeUrl: ytv_sch({
        privateDoNotAccessOrElseTrustedResourceUrlWrappedValue: ytv_str()
      }),
      program: ytv_str(),
      serverEnvironment: ytv_num()
    }),
    challenge: ytv_str()
  },
  playerBytesAdLayoutRenderer: {
    adLayoutMetadata: ytv_ren(YTAdLayoutMetadataSchema),
    layoutExitMuteTriggers: ytv_arr(ytv_sch({
      id: ytv_str(),
      skipRequestedTrigger: ytv_sch({
        triggeringLayoutId: ytv_str()
      })
    })),
    layoutExitNormalTriggers: ytv_arr(ytv_unk()),
    layoutExitSkipTriggers: ytv_arr(ytv_unk()),
    renderingContent: ytv_ren()
  },
  playerBytesSequenceItemAdLayoutRenderer: {
    adLayoutMetadata: ytv_ren(YTAdLayoutMetadataSchema),
    renderingContent: ytv_ren(),
    layoutExitNormalTriggers: ytv_arr(ytv_unk())
  },
  playerBytesSequentialLayoutRenderer: {
    sequentialLayouts: ytv_arr(ytv_ren())
  },
  playerCaptionsTracklistRenderer: {
    audioTracks: ytv_arr(ytv_sch({
      audioTrackId: ytv_str(),
      captionTrackIndices: ytv_arr(ytv_num()),
      captionsInitialState: ytv_str(['CAPTIONS_INITIAL_STATE_OFF_RECOMMENDED', 'CAPTIONS_INITIAL_STATE_ON_RECOMMENDED', 'CAPTIONS_INITIAL_STATE_ON_REQUIRED']),
      defaultCaptionTrackIndex: ytv_num(),
      hasDefaultTrack: ytv_bol(),
      visibility: ytv_str(['ON', 'UNKNOWN'])
    })),
    captionTracks: ytv_arr(ytv_sch({
      baseUrl: ytv_str(),
      isTranslatable: ytv_bol(),
      kind: ytv_str(),
      languageCode: ytv_str(),
      name: ytv_sch(YTTextSchema),
      rtl: ytv_bol(),
      trackName: ytv_str(),
      vssId: ytv_str()
    })),
    defaultAudioTrackIndex: ytv_num(),
    translationLanguages: ytv_arr(ytv_sch({
      languageCode: ytv_str(),
      languageName: ytv_sch(YTTextSchema)
    }))
  },
  playerErrorMessageRenderer: {
    icon: ytv_sch(YTIconSchema),
    proceedButton: ytv_ren(),
    reason: ytv_sch(YTTextSchema),
    subreason: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema)
  },
  playerLegacyDesktopWatchAdsRenderer: {
    gutParams: ytv_sch({
      tag: ytv_str()
    }),
    playerAdParams: ytv_sch({
      enabledEngageTypes: ytv_str(),
      showContentThumbnail: ytv_bol()
    }),
    showCompanion: ytv_bol(),
    showInstream: ytv_bol(),
    useGut: ytv_bol()
  },
  playerLiveStoryboardSpecRenderer: {
    spec: ytv_str()
  },
  playerMicroformatRenderer: {
    availableCountries: ytv_arr(ytv_str()),
    canonicalUrl: ytv_str(),
    category: ytv_str(),
    description: ytv_sch(YTTextSchema),
    embed: ytv_sch({
      height: ytv_num(),
      iframeUrl: ytv_str(),
      width: ytv_num()
    }),
    externalChannelId: ytv_str(),
    externalVideoId: ytv_str(),
    hasYpcMetadata: ytv_bol(),
    isFamilySafe: ytv_bol(),
    isShortsEligible: ytv_bol(),
    isUnlisted: ytv_bol(),
    lengthSeconds: ytv_str(),
    likeCount: ytv_str(),
    liveBroadcastDetails: ytv_sch({
      endTimestamp: ytv_str(),
      isLiveNow: ytv_bol(),
      startTimestamp: ytv_str()
    }),
    ownerChannelName: ytv_str(),
    ownerProfileUrl: ytv_str(),
    publishDate: ytv_str(),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema),
    uploadDate: ytv_str(),
    viewCount: ytv_str()
  },
  playerOverlayAutoplayRenderer: {
    background: ytv_sch(YTThumbnailSchema),
    byline: ytv_sch(YTTextSchema),
    cancelButton: ytv_ren(),
    closeButton: ytv_ren(),
    countDownSecs: ytv_num(),
    countDownSecsForFullscreen: ytv_num(),
    nextButton: ytv_ren(),
    pauseText: ytv_sch(YTTextSchema),
    preferImmediateRedirect: ytv_bol(),
    publishedTimeText: ytv_sch(YTTextSchema),
    shortViewCountText: ytv_sch(YTTextSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema),
    videoId: ytv_str(),
    videoTitle: ytv_sch(YTTextSchema),
    webShowBigThumbnailEndscreen: ytv_bol(),
    webShowNewAutonavCountdown: ytv_bol()
  },
  playerOverlayLayoutRenderer: {
    adBadgeRenderer: ytv_ren(),
    adDurationRemaining: ytv_ren(),
    adInfoRenderer: ytv_ren(),
    adLayoutLoggingData: ytv_ren(YTAdLayoutLoggingDataSchema),
    adPodIndex: ytv_ren(),
    inPlayerLayoutId: ytv_str(),
    interaction: ytv_ren(YTAdInteractionSchema),
    layoutId: ytv_str(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    playerAdCard: ytv_ren(),
    skipOrPreview: ytv_ren(),
    visitAdvertiserLink: ytv_ren()
  },
  playerOverlayRenderer: {
    addToMenu: ytv_ren(),
    autonavToggle: ytv_ren(),
    autoplay: ytv_ren(),
    decoratedPlayerBarRenderer: ytv_ren(),
    endScreen: ytv_ren(),
    productsInVideoOverlayRenderer: ytv_ren(),
    shareButton: ytv_ren(),
    showShareButtonFullscreen: ytv_bol(),
    showShareButtonSmallscreen: ytv_bol(),
    speedmasterUserEdu: ytv_ren(),
    timelyActionsOverlayViewModel: ytv_ren(),
    videoDetails: ytv_ren()
  },
  playerOverlayVideoDetailsRenderer: {
    subtitle: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema)
  },
  playerStoryboardSpecRenderer: {
    highResolutionRecommendedLevel: ytv_num(),
    recommendedLevel: ytv_num(),
    spec: ytv_str()
  },
  playlistLoopButtonRenderer: {
    currentState: ytv_str(['PLAYLIST_LOOP_STATE_ALL', 'PLAYLIST_LOOP_STATE_NONE', 'PLAYLIST_LOOP_STATE_ONE']),
    playlistLoopStateEntityKey: ytv_str(),
    states: ytv_arr(ytv_ren())
  },
  playlistLoopButtonStateRenderer: {
    button: ytv_ren(),
    state: ytv_str(['PLAYLIST_LOOP_STATE_ALL', 'PLAYLIST_LOOP_STATE_NONE', 'PLAYLIST_LOOP_STATE_ONE'])
  },
  playlistPanelVideoRenderer: {
    actionButtons: ytv_arr(ytv_ren()),
    darkColorPalette: ytv_sch({
      primaryTitleColor: ytv_num(),
      secondaryTitleColor: ytv_num(),
      section2Color: ytv_num(),
      section4Color: ytv_num()
    }),
    indexText: ytv_sch(YTTextSchema),
    lengthText: ytv_sch(YTTextSchema),
    lightColorPalette: ytv_sch({
      primaryTitleColor: ytv_num(),
      secondaryTitleColor: ytv_num(),
      section2Color: ytv_num(),
      section4Color: ytv_num()
    }),
    longBylineText: ytv_sch(YTTextSchema),
    menu: ytv_ren(),
    navigationEndpoint: ytv_enp(),
    playlistSetVideoId: ytv_str(),
    selected: ytv_bol(),
    shortBylineText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema),
    videoId: ytv_str()
  },
  pollHeaderRenderer: {
    contextMenuButton: ytv_ren(),
    liveChatPollType: ytv_str(['LIVE_CHAT_POLL_TYPE_CREATOR']),
    metadataText: ytv_sch(YTTextSchema),
    pollQuestion: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema)
  },
  pollRenderer: {
    choices: ytv_arr(ytv_sch({
      selectServiceEndpoint: ytv_enp(),
      selected: ytv_bol(),
      text: ytv_sch(YTTextSchema),
      votePercentage: ytv_sch(YTTextSchema),
      voteRatio: ytv_num()
    })),
    header: ytv_ren(),
    liveChatPollId: ytv_str()
  },
  postRenderer: {
    actionButtons: ytv_ren(),
    actionMenu: ytv_ren(),
    authorEndpoint: ytv_enp(),
    authorText: ytv_sch(YTTextSchema),
    authorThumbnail: ytv_sch(YTThumbnailSchema),
    backstageAttachment: ytv_ren(),
    contentText: ytv_sch(YTTextSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    navigationEndpoint: ytv_enp(),
    postId: ytv_str(),
    publishedTimeText: ytv_sch(YTTextSchema),
    surface: ytv_str(['BACKSTAGE_SURFACE_TYPE_SEARCH']),
    voteCount: ytv_sch(YTTextSchema),
    voteStatus: ytv_str(['INDIFFERENT'])
  },
  productListHeaderRenderer: {
    suppressPaddingDisclaimer: ytv_bol(),
    title: ytv_sch(YTTextSchema)
  },
  productListItemRenderer: {
    accessibilityTitle: ytv_str(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    merchantName: ytv_str(),
    onClickCommand: ytv_enp(),
    price: ytv_str(),
    priceReplacementText: ytv_str(),
    stayInApp: ytv_bol(),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema),
    viewButton: ytv_ren()
  },
  productListRenderer: {
    contents: ytv_arr(ytv_ren())
  },
  promotedVideoRenderer: {
    adBadge: ytv_ren(),
    adPlaybackContextParams: ytv_str(),
    channelThumbnail: ytv_sch(YTThumbnailSchema),
    clickTrackingUrls: ytv_arr(ytv_str()),
    ctaRenderer: ytv_ren(),
    description: ytv_sch(YTTextSchema),
    impressionUrls: ytv_arr(ytv_str()),
    lengthText: ytv_sch(YTTextSchema),
    longBylineText: ytv_sch(YTTextSchema),
    menu: ytv_ren(),
    navigationEndpoint: ytv_enp(),
    richThumbnail: ytv_ren(),
    shortBylineText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema),
    videoId: ytv_str(),
    watchButtonRenderer: ytv_ren()
  },
  recognitionShelfRenderer: {
    avatars: ytv_arr(ytv_sch(YTThumbnailSchema)),
    button: ytv_ren(),
    subtitle: ytv_sch(YTTextSchema),
    surface: ytv_str(['RECOGNITION_SHELF_SURFACE_CHANNEL_PAGE']),
    title: ytv_sch(YTTextSchema)
  },
  reelPlayerHeaderRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    reelTitleOnClickCommand: ytv_enp(),
    timestampText: ytv_sch(YTTextSchema)
  },
  reelPlayerOverlayRenderer: {
    likeButton: ytv_ren(),
    menu: ytv_ren(),
    metapanel: ytv_ren(),
    nextItemButton: ytv_ren(),
    pivotButton: ytv_ren(),
    prevItemButton: ytv_ren(),
    reelPlayerHeaderSupportedRenderers: ytv_ren(),
    reelPlayerNavigationModel: ytv_str(['REEL_PLAYER_NAVIGATION_MODEL_UNSPECIFIED']),
    shareButton: ytv_ren(),
    style: ytv_str(['REEL_PLAYER_OVERLAY_STYLE_SHORTS']),
    viewCommentsButton: ytv_ren()
  },
  reelShelfRenderer: {
    button: ytv_ren(),
    icon: ytv_sch(YTIconSchema),
    items: ytv_arr(ytv_ren()),
    nextButton: ytv_ren(),
    previousButton: ytv_ren(),
    title: ytv_sch(YTTextSchema)
  },
  relatedChipCloudRenderer: {
    content: ytv_ren(),
    showProminentChips: ytv_bol()
  },
  richGridRenderer: {
    contents: ytv_arr(ytv_ren()),
    header: ytv_ren(),
    layoutSizing: ytv_str(['RICH_GRID_LAYOUT_SIZING_STANDARD']),
    masthead: ytv_ren(),
    reflowOptions: ytv_sch({
      minimumRowsOfVideosAtStart: ytv_num(),
      minimumRowsOfVideosBetweenSections: ytv_num()
    }),
    style: ytv_str(['RICH_GRID_STYLE_SHORTS_GRID']),
    targetId: ytv_str()
  },
  richItemRenderer: {
    content: ytv_ren()
  },
  richListHeaderRenderer: {
    subtitle: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema)
  },
  richMetadataRenderer: {
    callToAction: ytv_sch(YTTextSchema),
    callToActionIcon: ytv_sch(YTIconSchema),
    endpoint: ytv_enp(),
    style: ytv_str(['RICH_METADATA_RENDERER_STYLE_BOX_ART']),
    subtitle: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema),
  },
  richMetadataRowRenderer: {
    contents: ytv_arr(ytv_ren())
  },
  richSectionRenderer: {
    content: ytv_ren()
  },
  richShelfRenderer: {
    contents: ytv_arr(ytv_ren()),
    endpoint: ytv_enp(),
    icon: ytv_sch(YTIconSchema),
    isBottomDividerHidden: ytv_bol(),
    isExpanded: ytv_bol(),
    isTopDividerHidden: ytv_bol(),
    menu: ytv_ren(),
    responsiveContainerConfiguration: ytv_sch({
      enableContentSpecificAspectRatio: ytv_bol()
    }),
    showLessButton: ytv_ren(),
    showMoreButton: ytv_ren(),
    targetingContext: ytv_sch({
      targetGroupId: ytv_arr(ytv_str()),
      targetId: ytv_str()
    }),
    title: ytv_sch(YTTextSchema)
  },
  searchBarRenderer: {
    hack: ytv_bol()
  },
  searchBoxRenderer: {
    clearButton: ytv_ren(),
    endpoint: ytv_enp(),
    placeholderText: ytv_sch(YTTextSchema),
    searchButton: ytv_ren()
  },
  searchFilterGroupRenderer: {
    filters: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema)
  },
  searchFilterOptionsDialogRenderer: {
    groups: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema)
  },
  searchFilterRenderer: {
    label: ytv_sch(YTTextSchema),
    navigationEndpoint: ytv_enp(),
    status: ytv_str(['FILTER_STATUS_SELECTED']),
    tooltip: ytv_str()
  },
  searchHeaderRenderer: {
    chipBar: ytv_ren(),
    searchFilterButton: ytv_ren()
  },
  searchPyvRenderer: {
    ads: ytv_arr(ytv_ren())
  },
  searchRefinementCardRenderer: {
    query: ytv_sch(YTTextSchema),
    searchEndpoint: ytv_enp(),
    thumbnail: ytv_sch(YTThumbnailSchema)
  },
  searchSubMenuRenderer: {},
  sectionListRenderer: YTSectionListRendererSchema,
  secondarySearchContainerRenderer: {
    contents: ytv_arr(ytv_ren())
  },
  shelfHeaderRenderer: {
    avatarLockup: ytv_ren()
  },
  shelfRenderer: {
    content: ytv_ren(),
    endpoint: ytv_enp(),
    headerRenderer: ytv_ren(),
    playAllButton: ytv_ren(),
    subtitle: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema),
    tvhtml5Style: ytv_sch({
      effects: ytv_sch({
        enlarge: ytv_bol()
      })
    })
  },
  shoppingOverlayRenderer: {
    badgeInteractionLogging: ytv_ren({}),
    dismissButton: ytv_ren({
      a11yLabel: ytv_sch(YTTextSchema)
    }),
    featuredProductsEntityKey: ytv_str(),
    isContentForward: ytv_bol(),
    onClickCommand: ytv_enp(),
    productsData: ytv_arr(ytv_ren()),
    text: ytv_sch(YTTextSchema),
    timing: ytv_sch({
      expanded: ytv_sch({
        endSec: ytv_num(),
        startSec: ytv_num()
      }),
      preview: ytv_sch({
        endSec: ytv_num(),
        startSec: ytv_num()
      }),
      visible: ytv_sch({
        endSec: ytv_num(),
        startSec: ytv_num()
      }),
      userExpandedDurationSec: ytv_num()
    }),
    trendingOfferEntityKey: ytv_str()
  },
  simpleCardTeaserRenderer: {
    channelAvatar: ytv_sch(YTThumbnailSchema),
    logVisibilityUpdates: ytv_bol(),
    message: ytv_sch(YTTextSchema),
    onTapCommand: ytv_enp(),
    prominent: ytv_bol()
  },
  singleOptionSurveyOptionRenderer: {
    enumName: ytv_str(),
    option: ytv_sch(YTTextSchema),
    submissionEndpoint: ytv_enp()
  },
  singleOptionSurveyRenderer: {
    dismissalEndpoint: ytv_enp(),
    dismissalText: ytv_sch(YTTextSchema),
    impressionEndpoints: ytv_arr(ytv_enp()),
    options: ytv_arr(ytv_ren()),
    question: ytv_sch(YTTextSchema),
    showGfeedbackPrompt: ytv_bol(),
    surveyId: ytv_str(),
    surveyOrientation: ytv_sch({
      type: ytv_str(['VERTICAL'])
    })
  },
  slimMetadataToggleButtonRenderer: {
    button: ytv_ren(),
    isDislike: ytv_bol(),
    isLike: ytv_bol(),
    likeStatus: ytv_str(YTLikeStatus),
    likeStatusEntityKey: ytv_str()
  },
  smartSkipPlayerScrimOverlayRenderer: {
    icon: ytv_sch(YTIconSchema),
    text: ytv_sch(YTTextSchema)
  },
  sortFilterSubMenuRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    icon: ytv_sch(YTIconSchema),
    subMenuItems: ytv_arr(ytv_ren(YTSortFilterSubMenuItemRendererSchema)),
    targetId: ytv_str(),
    title: ytv_str(),
    tooltip: ytv_str()
  },
  sortFilterSubMenuItemRenderer: YTSortFilterSubMenuItemRendererSchema,
  structuredDescriptionContentRenderer: {
    items: ytv_arr(ytv_ren())
  },
  structuredDescriptionPlaylistLockupRenderer: {
    aspectRatio: ytv_num(),
    disableNavigationEndpoint: ytv_bol(),
    maxLinesTitle: ytv_num(),
    maxLinesShortBylineText: ytv_num(),
    navigationEndpoint: ytv_enp(),
    shortBylineText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    thumbnailWidth: ytv_num(),
    title: ytv_sch(YTTextSchema),
    videoCountShortText: ytv_sch(YTTextSchema)
  },
  structuredDescriptionVideoLockupRenderer: {
    aspectRatio: ytv_num(),
    disableNavigationEndpoint: ytv_bol(),
    isLiveVideo: ytv_bol(),
    lengthText: ytv_sch(YTTextSchema),
    maxLinesMetadataDetails: ytv_num(),
    maxLinesShortBylineText: ytv_num(),
    maxLinesTitle: ytv_num(),
    metadataDetails: ytv_sch(YTTextSchema),
    navigationEndpoint: ytv_enp(),
    shortBylineText: ytv_sch(YTTextSchema),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    thumbnailWidth: ytv_num(),
    title: ytv_sch(YTTextSchema)
  },
  subscribeButtonRenderer: {
    buttonText: ytv_sch(YTTextSchema),
    channelId: ytv_str(),
    enabled: ytv_bol(),
    notificationPreferenceButton: ytv_ren(),
    onSubscribeEndpoints: ytv_arr(ytv_enp()),
    onUnsubscribeEndpoints: ytv_arr(ytv_enp()),
    serviceEndpoints: ytv_arr(ytv_enp()),
    showPreferences: ytv_bol(),
    signInEndpoint: ytv_enp(),
    subscribeAccessibility: ytv_sch(YTAccessibilitySchema),
    subscribed: ytv_bol(),
    subscribedButtonText: ytv_sch(YTTextSchema),
    subscribedEntityKey: ytv_str(),
    targetId: ytv_str(),
    type: ytv_str(['FREE']),
    unsubscribeAccessibility: ytv_sch(YTAccessibilitySchema),
    unsubscribeButtonText: ytv_sch(YTTextSchema),
    unsubscribedButtonText: ytv_sch(YTTextSchema)
  },
  subscriptionNotificationToggleButtonRenderer: {
    command: ytv_enp(),
    currentStateId: ytv_num(),
    secondaryIcon: ytv_sch(YTIconSchema),
    states: ytv_arr(ytv_sch({
      nextStateId: ytv_num(),
      state: ytv_ren(),
      stateId: ytv_num()
    })),
    targetId: ytv_str()
  },
  surveyTriggerRenderer: {
    dismissalEndpoint: ytv_enp(),
    followUpText: ytv_sch(YTTextSchema),
    survey: ytv_ren()
  },
  tabRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    content: ytv_ren(),
    endpoint: ytv_enp(),
    selected: ytv_bol(),
    tabIdentifier: ytv_str(),
    title: ytv_str()
  },
  thumbnailLandscapePortraitRenderer: {
    landscape: ytv_sch(YTThumbnailSchema),
    portrait: ytv_sch(YTThumbnailSchema)
  },
  thumbnailOverlayBottomPanelRenderer: {
    icon: ytv_sch(YTIconSchema),
    text: ytv_sch(YTTextSchema)
  },
  thumbnailOverlayInlineUnplayableRenderer: {
    icon: ytv_sch(YTIconSchema),
    text: ytv_sch(YTTextSchema)
  },
  thumbnailOverlayLoadingPreviewRenderer: {
    text: ytv_sch(YTTextSchema)
  },
  thumbnailOverlayNowPlayingRenderer: {
    text: ytv_sch(YTTextSchema)
  },
  thumbnailOverlayResumePlaybackRenderer: {
    percentDurationWatched: ytv_num()
  },
  thumbnailOverlayTimeStatusRenderer: {
    icon: ytv_sch(YTIconSchema),
    style: ytv_str(['DEFAULT', 'LIVE', 'UPCOMING']),
    text: ytv_sch(YTTextSchema)
  },
  thumbnailOverlayToggleButtonRenderer: {
    isToggled: ytv_bol(),
    toggledAccessibility: ytv_sch(YTAccessibilitySchema),
    toggledIcon: ytv_sch(YTIconSchema),
    toggledServiceEndpoint: ytv_enp(),
    toggledTooltip: ytv_str(),
    untoggledAccessibility: ytv_sch(YTAccessibilitySchema),
    untoggledIcon: ytv_sch(YTIconSchema),
    untoggledServiceEndpoint: ytv_enp(),
    untoggledTooltip: ytv_str()
  },
  tileHeaderRenderer: {
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren())
  },
  tileMetadataRenderer: {
    lines: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema)
  },
  tileRenderer: {
    contentId: ytv_str(),
    contentType: ytv_str(['TILE_CONTENT_TYPE_VIDEO']),
    header: ytv_ren(),
    metadata: ytv_ren(),
    onLongPressCommand: ytv_enp(),
    onSelectCommand: ytv_enp(),
    style: ytv_str(['TILE_STYLE_YTLR_DEFAULT'])
  },
  timedAnimationButtonRenderer: {
    buttonRenderer: ytv_ren()
  },
  titleAndButtonListHeaderRenderer: {
    title: ytv_sch(YTTextSchema)
  },
  toggleButtonRenderer: {
    accessibility: ytv_sch(YTAccessibilityDataSchema),
    accessibilityData: ytv_sch(YTAccessibilitySchema),
    defaultIcon: ytv_sch(YTIconSchema),
    defaultNavigationEndpoint: ytv_enp(),
    defaultServiceEndpoint: ytv_enp(),
    defaultText: ytv_sch(YTTextSchema),
    defaultTooltip: ytv_str(),
    isDisabled: ytv_bol(),
    isToggled: ytv_bol(),
    size: ytv_sch(YTSizeSchema),
    style: ytv_ren(YTStyleSchema),
    toggledAccessibilityData: ytv_sch(YTAccessibilitySchema),
    toggleButtonSupportedData: ytv_sch({
      toggleButtonIdData: ytv_sch({
        id: ytv_str(['TOGGLE_BUTTON_ID_TYPE_DISLIKE', 'TOGGLE_BUTTON_ID_TYPE_LIKE'])
      })
    }),
    toggledIcon: ytv_sch(YTIconSchema),
    toggledNavigationEndpoint: ytv_enp(),
    toggledServiceEndpoint: ytv_enp(),
    toggledStyle: ytv_ren(YTStyleSchema),
    toggledText: ytv_sch(YTTextSchema),
    toggledTooltip: ytv_str()
  },
  toggleMenuServiceItemRenderer: {
    defaultIcon: ytv_sch(YTIconSchema),
    defaultServiceEndpoint: ytv_enp(),
    defaultText: ytv_sch(YTTextSchema),
    hasToggleSwitch: ytv_bol(),
    isToggled: ytv_bol(),
    persistentOnMenuPopup: ytv_bol(),
    toggleMenuServiceItemEntityKey: ytv_str(),
    toggledIcon: ytv_sch(YTIconSchema),
    toggledServiceEndpoint: ytv_enp(),
    toggledText: ytv_sch(YTTextSchema)
  },
  topbarLogoRenderer: {
    endpoint: ytv_enp(),
    iconImage: ytv_sch(YTIconSchema),
    overrideEntityKey: ytv_str(),
    tooltipText: ytv_sch(YTTextSchema)
  },
  topbarMenuButtonRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    avatar: ytv_sch(YTThumbnailSchema),
    icon: ytv_sch(YTIconSchema),
    menuRequest: ytv_enp(),
    style: ytv_str(YTButtonStyle),
    tooltip: ytv_str()
  },
  transportControlsRenderer: {
    buttons: ytv_arr(ytv_sch({
      button: ytv_ren(),
      type: ytv_str([
        'TRANSPORT_CONTROLS_BUTTON_TYPE_ADD_TO_PLAYLIST',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_AUDIO_TRACKS',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_CAPTIONS',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_CHANNEL_BUTTON',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_DISLIKE_BUTTON',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_DRC',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_FEEDBACK',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_LIKE_BUTTON',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_LOOP_BUTTON',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_PLAYBACK_SETTINGS',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_QUALITY',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_REPORT_VIDEO',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_SKIP_NEXT',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_SKIP_PREVIOUS',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_SPEED_BUTTON',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_STATS_FOR_NERDS',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_SUBSCRIBE',
        'TRANSPORT_CONTROLS_BUTTON_TYPE_SURROUND_SOUND'
      ])
    })),
    featuredActionViewModels: ytv_arr(ytv_ren())
  },
  tvBrowseRenderer: YTTvBrowseRendererSchema,
  tvSurfaceContentRenderer: {
    content: ytv_ren(),
    targetId: ytv_str()
  },
  tvSurfaceHeaderRenderer: {
    title: ytv_sch(YTTextSchema)
  },
  twoColumnBrowseResultsRenderer: {
    secondaryContents: ytv_ren(),
    tabs: ytv_arr(ytv_ren())
  },
  twoColumnSearchResultsRenderer: {
    primaryContents: ytv_ren(),
    secondaryContents: ytv_ren()
  },
  twoColumnWatchNextResults: {
    autoplay: ytv_ren(),
    conversationBar: ytv_ren(),
    playlist: ytv_ren(),
    results: ytv_ren(),
    secondaryResults: ytv_ren(),
  },
  unifiedSharePanelRenderer: {
    showLoadingSpinner: ytv_bol()
  },
  universalWatchCardRenderer: {
    callToAction: ytv_ren(),
    collapsedLabel: ytv_sch(YTTextSchema),
    footer: ytv_ren(),
    header: ytv_ren(),
    sections: ytv_arr(ytv_ren())
  },
  uploadTimeFactoidRenderer: {
    factoid: ytv_ren(),
    uploadTimeEntity: ytv_sch({
      key: ytv_str()
    })
  },
  verticalListRenderer: {
    collapsedItemCount: ytv_num(),
    collapsedStateButtonText: ytv_sch(YTTextSchema),
    items: ytv_arr(ytv_ren())
  },
  verticalWatchCardListRenderer: {
    items: ytv_arr(ytv_ren())
  },
  videoAdTrackingRenderer: {
    adLayoutLoggingData: ytv_ren(YTAdLayoutLoggingDataSchema),
    pings: ytv_ren(YTVideoAdPingsSchema)
  },
  videoDescriptionHeaderRenderer: {
    channel: ytv_sch(YTTextSchema),
    channelNavigationEndpoint: ytv_enp(),
    channelThumbnail: ytv_sch(YTThumbnailSchema),
    factoid: ytv_arr(ytv_ren()),
    publishDate: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema),
    views: ytv_sch(YTTextSchema)
  },
  videoDescriptionInfocardsSectionRenderer: {
    channelAvatar: ytv_sch(YTThumbnailSchema),
    channelEndpoint: ytv_enp(),
    creatorAboutButton: ytv_ren(),
    creatorCustomUrlButtons: ytv_arr(ytv_ren()),
    creatorVideosButton: ytv_ren(),
    infocards: ytv_arr(ytv_ren()),
    sectionSubtitle: ytv_sch(YTTextSchema),
    sectionTitle: ytv_sch(YTTextSchema)
  },
  videoDescriptionTranscriptSectionRenderer: {
    primaryButton: ytv_ren(),
    sectionTitle: ytv_sch(YTTextSchema),
    subHeaderText: ytv_sch(YTTextSchema)
  },
  videoOwnerRenderer: {
    badges: ytv_arr(ytv_ren()),
    hideMembershipButtonIfUnsubscribed: ytv_bol(),
    membershipButton: ytv_ren(),
    navigationEndpoint: ytv_enp(),
    subscriberCountText: ytv_sch(YTTextSchema),
    subscriptionButton: ytv_sch({
      subscribed: ytv_bol(),
      type: ytv_str(['FREE'])
    }),
    thumbnail: ytv_sch(YTThumbnailSchema),
    title: ytv_sch(YTTextSchema)
  },
  videoPrimaryInfoRenderer: {
    dateText: ytv_sch(YTTextSchema),
    relativeDateText: ytv_sch(YTTextSchema),
    superTitleLink: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema),
    updatedMetadataEndpoint: ytv_enp(),
    videoActions: ytv_ren(),
    viewCount: ytv_ren()
  },
  videoRenderer: {
    avatar: ytv_ren(),
    badges: ytv_arr(ytv_ren()),
    channelThumbnailSupportedRenderers: ytv_ren(),
    descriptionSnippet: ytv_sch(YTTextSchema),
    detailedMetadataSnippets: ytv_arr(ytv_unk()),
    expandableMetadata: ytv_ren(),
    inlinePlaybackEndpoint: ytv_enp(),
    isWatched: ytv_bol(),
    lengthText: ytv_sch(YTTextSchema),
    longBylineText: ytv_sch(YTTextSchema),
    menu: ytv_ren(),
    navigationEndpoint: ytv_enp(),
    ownerBadges: ytv_arr(ytv_ren()),
    ownerText: ytv_sch(YTTextSchema),
    publishedTimeText: ytv_sch(YTTextSchema),
    richThumbnail: ytv_ren(),
    searchVideoResultEntityKey: ytv_str(),
    shortBylineText: ytv_sch(YTTextSchema),
    shortViewCountText: ytv_sch(YTTextSchema),
    showActionMenu: ytv_bol(),
    thumbnail: ytv_sch(YTThumbnailSchema),
    thumbnailOverlays: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema),
    upcomingEventData: ytv_sch({
      isReminderSet: ytv_bol(),
      startTime: ytv_str(),
      upcomingEventText: ytv_sch(YTTextSchema)
    }),
    videoId: ytv_str(),
    viewCountText: ytv_sch(YTTextSchema)
  },
  videoSecondaryInfoRenderer: {
    attributedDescription: ytv_obj(ytv_str(), ytv_unk()),
    defaultExpanded: ytv_bol(),
    descriptionCollapsedLines: ytv_num(),
    headerRuns: ytv_arr(ytv_unk()),
    metadataRowContainer: ytv_ren(),
    owner: ytv_ren(),
    showLessCommand: ytv_enp(),
    showLessText: ytv_sch(YTTextSchema),
    showMoreCommand: ytv_enp(),
    showMoreText: ytv_sch(YTTextSchema),
    subscribeButton: ytv_ren()
  },
  videoViewCountRenderer: {
    entityKey: ytv_str(),
    extraShortViewCount: ytv_sch(YTTextSchema),
    isLive: ytv_bol(),
    originalViewCount: ytv_str(),
    shortViewCount: ytv_sch(YTTextSchema),
    unlabeledViewCountValue: ytv_sch(YTTextSchema),
    viewCount: ytv_sch(YTTextSchema),
    viewCountLabel: ytv_sch(YTTextSchema)
  },
  viewCountFactoidRenderer: {
    factoid: ytv_ren(),
    viewCountEntityKey: ytv_str(),
    viewCountType: ytv_str(['VIEW_COUNT_FACTOID_TYPE_TOTAL_VIEWS'])
  },
  voiceSearchDialogRenderer: {
    connectionErrorHeader: ytv_sch(YTTextSchema),
    connectionErrorMicrophoneLabel: ytv_sch(YTTextSchema),
    disabledHeader: ytv_sch(YTTextSchema),
    disabledSubtext: ytv_sch(YTTextSchema),
    exampleQuery1: ytv_sch(YTTextSchema),
    exampleQuery2: ytv_sch(YTTextSchema),
    exitButton: ytv_ren(),
    loadingHeader: ytv_sch(YTTextSchema),
    microphoneButtonAriaLabel: ytv_sch(YTTextSchema),
    microphoneOffPromptHeader: ytv_sch(YTTextSchema),
    placeholderHeader: ytv_sch(YTTextSchema),
    permissionsHeader: ytv_sch(YTTextSchema),
    permissionsSubtext: ytv_sch(YTTextSchema),
    promptHeader: ytv_sch(YTTextSchema),
    promptMicrophoneLabel: ytv_sch(YTTextSchema)
  },
  watchCardCompactVideoRenderer: {
    byline: ytv_sch(YTTextSchema),
    lengthText: ytv_sch(YTTextSchema),
    navigationEndpoint: ytv_enp(),
    style: ytv_str(['WATCH_CARD_COMPACT_VIDEO_RENDERER_STYLE_CONDENSED']),
    subtitle: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema)
  },
  watchCardHeroVideoRenderer: {
    accessibility: ytv_sch(YTAccessibilitySchema),
    callToActionButton: ytv_ren(),
    heroImage: ytv_ren(),
    navigationEndpoint: ytv_enp()
  },
  watchCardRichHeaderRenderer: {
    avatar: ytv_sch(YTThumbnailSchema),
    callToActionButtons: ytv_arr(ytv_ren()),
    colorSupportedDatas: ytv_ren(YTColorSupportedDatasSchema),
    darkThemeColorSupportedDatas: ytv_ren(YTColorSupportedDatasSchema),
    style: ytv_str(['WATCH_CARD_RICH_HEADER_RENDERER_STYLE_LEFT_AVATAR']),
    subtitle: ytv_sch(YTTextSchema),
    title: ytv_sch(YTTextSchema),
    titleBadge: ytv_ren(),
    titleNavigationEndpoint: ytv_enp()
  },
  watchCardSectionSequenceRenderer: {
    listTitles: ytv_arr(ytv_sch(YTTextSchema)),
    lists: ytv_arr(ytv_ren())
  },
  watchNextEndScreenRenderer: {
    results: ytv_arr(ytv_ren()),
    title: ytv_sch(YTTextSchema)
  },
  youThereRenderer: {
    configData: ytv_sch({
      youThereData: ytv_sch({
        blockingPromptDelayMs: ytv_num(),
        lactServerRequestMs: ytv_str(),
        lactThresholdMs: ytv_str(),
        playbackPauseDelayMs: ytv_num(),
        promptDelaySec: ytv_num(),
        showPausedActions: ytv_arr(ytv_enp()),
        showToastWarningPrompt: ytv_bol(),
        showWarningActions: ytv_arr(ytv_enp()),
        triggerReason: ytv_str(['YOU_THERE_TRIGGER_REASON_2'])
      })
    })
  },
  ypcTrailerRenderer: {
    fullVideoMessage: ytv_sch(YTTextSchema),
    unserializedPlayerResponse: ytv_sch(YTPlayerResponseSchema)
  },

  // ViewModel
  adAvatarLockupViewModel: {
    adAvatar: ytv_ren(),
    adBadge: ytv_ren(),
    headline: ytv_ren(YTTextViewModelSchema),
    interaction: ytv_ren(YTAdInteractionSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    primaryDetailsLine: ytv_ren(),
    style: ytv_str(['AD_AVATAR_LOCKUP_STYLE_COMPACT'])
  },
  adAvatarViewModel: {
    image: ytv_sch(YTImageSchema),
    interaction: ytv_ren(YTAdInteractionSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    rendererContext: ytv_ren(YTRendererContextSchema),
    size: ytv_str(['AD_AVATAR_SIZE_M']),
    style: ytv_str(['AD_AVATAR_STYLE_CIRCULAR'])
  },
  adBadgeViewModel: {
    interaction: ytv_ren(YTAdInteractionSchema),
    label: ytv_ren(YTTextViewModelSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    style: ytv_str(['AD_BADGE_STYLE_STARK'])
  },
  adButtonViewModel: {
    interaction: ytv_ren(YTAdInteractionSchema),
    label: ytv_ren(YTTextViewModelSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    size: ytv_str(['AD_BUTTON_SIZE_DEFAULT']),
    style: ytv_str(['AD_BUTTON_STYLE_FILLED'])
  },
  adDetailsLineViewModel: {
    attributes: ytv_arr(ytv_sch({
      text: ytv_ren(YTTextViewModelSchema)
    })),
    style: ytv_str(['AD_DETAILS_LINE_STYLE_STANDARD'])
  },
  adImageViewModel: {
    imageSources: ytv_arr(ytv_sch(YTImageSourceSchema)),
    interaction: ytv_ren(YTAdInteractionSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
  },
  adPodIndexViewModel: {
    adPodIndex: ytv_ren(YTTextViewModelSchema),
    visibilityCondition: ytv_str(['AD_POD_INDEX_VISIBILITY_CONDITION_AUTOHIDE'])
  },
  adPreviewViewModel: {
    durationMilliseconds: ytv_num(),
    interaction: ytv_ren(YTAdInteractionSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    previewImage: ytv_sch(YTImageSchema),
    previewText: ytv_sch({
      text: ytv_str(),
      isTemplated: ytv_bol()
    })
  },
  attributionViewModel: {
    rendererContext: ytv_ren(YTRendererContextSchema),
    suffix: ytv_ren(YTTextViewModelSchema),
    text: ytv_ren(YTTextViewModelSchema)
  },
  avatarStackViewModel: {
    avatars: ytv_arr(ytv_ren()),
    rendererContext: ytv_ren(YTRendererContextSchema),
    text: ytv_ren(YTTextViewModelSchema),
    textSuffix: ytv_ren(YTTextViewModelSchema)
  },
  avatarViewModel: {
    accessibilityText: ytv_str(),
    avatarImageSize: ytv_str(['AVATAR_SIZE_M', 'AVATAR_SIZE_S', 'AVATAR_SIZE_XL', 'AVATAR_SIZE_XS']),
    image: ytv_sch(YTImageSchema),
    liveData: ytv_sch({
      liveBadgeText: ytv_str()
    }),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    rendererContext: ytv_ren(YTRendererContextSchema)
  },
  basicContentViewModel: {
    paragraphs: ytv_arr(ytv_sch({
      text: ytv_ren(YTTextViewModelSchema)
    }))
  },
  bkaEnforcementMessageViewModel: {
    bulletList: ytv_sch({
      bulletListItems: ytv_arr(ytv_sch({
        title: ytv_ren(YTTextViewModelSchema)
      }))
    }),
    dismissButton: ytv_ren(YTButtonViewModelSchema),
    displayType: ytv_str(['ENFORCEMENT_MESSAGE_VIEW_MODEL_DISPLAY_TYPE_POPUP']),
    feedbackMessage: ytv_ren(YTTextViewModelSchema),
    impressionEndpoints: ytv_arr(ytv_enp()),
    isVisible: ytv_bol(),
    logo: ytv_sch(YTImageSchema),
    logoDark: ytv_sch(YTImageSchema),
    primaryButton: ytv_ren(YTButtonViewModelSchema),
    secondaryButton: ytv_ren(YTButtonViewModelSchema),
    title: ytv_ren(YTTextViewModelSchema)
  },
  buttonBannerViewModel: {
    ctaButton: ytv_ren(),
    subtext: ytv_ren(YTTextViewModelSchema)
  },
  buttonCardViewModel: {
    image: ytv_sch(YTImageSchema),
    rendererContext: ytv_ren(YTRendererContextSchema),
    title: ytv_str()
  },
  buttonViewModel: YTButtonViewModelSchema,
  carouselItemViewModel: {
    carouselItem: ytv_ren(),
    itemType: ytv_str(['VIDEO_METADATA_CAROUSEL_PAGINATION_TYPE_LIVE_CHAT_STATIC_TEXT'])
  },
  carouselTitleViewModel: {
    nextButton: ytv_ren(),
    previousButton: ytv_ren(),
    title: ytv_str()
  },
  chipBarViewModel: {
    chipBarStateEntityKey: ytv_str(),
    chips: ytv_arr(ytv_ren())
  },
  chipViewModel: {
    accessibilityLabel: ytv_str(),
    displayType: ytv_str(['CHIP_VIEW_MODEL_DISPLAY_TYPE_UNSPECIFIED']),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    selected: ytv_bol(),
    tapCommand: ytv_enp(),
    text: ytv_str()
  },
  collectionThumbnailViewModel: {
    primaryThumbnail: ytv_ren(),
    stackColor: ytv_ren(YTThemedColorSchema)
  },
  commentViewModel: {
    allowProfileCard: ytv_bol(),
    commentId: ytv_str(),
    commentKey: ytv_str(),
    commentSurfaceKey: ytv_str(),
    inlineRepliesKey: ytv_str(),
    pinnedText: ytv_str(),
    rendererContext: ytv_ren(YTRendererContextSchema),
    sharedKey: ytv_str(),
    sharedSurfaceKey: ytv_str(),
    toolbarStateKey: ytv_str(),
    toolbarSurfaceKey: ytv_str(),
    translateButton: ytv_ren()
  },
  contentMetadataViewModel: {
    delimiter: ytv_str(),
    metadataRows: ytv_arr(ytv_sch({
      metadataParts: ytv_arr(ytv_sch({
        accessibilityLabel: ytv_str(),
        avatarStack: ytv_ren(),
        enableTruncation: ytv_bol(),
        text: ytv_ren(YTTextViewModelSchema)
      })),
      isSpacerRow: ytv_bol()
    })),
    rendererContext: ytv_ren(YTRendererContextSchema)
  },
  contentPreviewImageViewModel: {
    image: ytv_sch(YTImageSchema),
    layoutMode: ytv_str(['CONTENT_PREVIEW_IMAGE_LAYOUT_MODE_UNKNOWN']),
    rendererContext: ytv_ren(YTRendererContextSchema),
    style: ytv_str(['CONTENT_PREVIEW_IMAGE_STYLE_CIRCLE', 'CONTENT_PREVIEW_IMAGE_STYLE_SQUARE'])
  },
  creatorHeartViewModel: {
    creatorThumbnail: ytv_sch(YTImageSchema),
    engagementStateKey: ytv_str(),
    heartedAccessibilityLabel: ytv_str(),
    heartedHoverText: ytv_str(),
    heartedIcon: ytv_sch(YTImageSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    unheartedAccessibilityLabel: ytv_str(),
    unheartedIcon: ytv_sch(YTImageSchema)
  },
  decoratedAvatarViewModel: {
    a11yLabel: ytv_str(),
    avatar: ytv_ren(),
    liveData: ytv_sch({
      liveBadgeText: ytv_str()
    }),
    rendererContext: ytv_ren(YTRendererContextSchema)
  },
  descriptionPreviewViewModel: {
    alwaysShowTruncationText: ytv_bol(),
    description: ytv_ren(YTTextViewModelSchema),
    maxLines: ytv_num(),
    rendererContext: ytv_ren(YTRendererContextSchema),
    truncationText: ytv_ren(YTTextViewModelSchema)
  },
  dialogViewModel: {
    content: ytv_ren(),
    footer: ytv_ren()
  },
  dislikeButtonViewModel: {
    dislikeEntityKey: ytv_str(),
    toggleButtonViewModel: ytv_ren()
  },
  downloadListItemViewModel: {
    rendererContext: ytv_ren(YTRendererContextSchema)
  },
  dynamicTextViewModel: {
    maxLines: ytv_num(),
    rendererContext: ytv_ren(YTRendererContextSchema),
    text: ytv_ren(YTTextViewModelSchema)
  },
  emojiFountainViewModel: {
    emojiFountainDataEntityKey: ytv_str(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
  },
  flexibleActionsViewModel: {
    actionsRows: ytv_arr(ytv_sch({
      actions: ytv_arr(ytv_ren())
    })),
    minimumRowHeight: ytv_num(),
    rendererContext: ytv_ren(YTRendererContextSchema)
  },
  imageBannerViewModel: {
    image: ytv_sch(YTImageSchema),
    rendererContext: ytv_ren(YTRendererContextSchema),
    style: ytv_str(['IMAGE_BANNER_STYLE_INSET'])
  },
  likeButtonViewModel: {
    likeStatusEntity: ytv_sch({
      key: ytv_str(),
      likeStatus: ytv_str(YTLikeStatus)
    }),
    likeStatusEntityKey: ytv_str(),
    toggleButtonViewModel: ytv_ren()
  },
  listViewModel: {
    listItems: ytv_arr(ytv_ren())
  },
  listItemViewModel: {
    isDisabled: ytv_bol(),
    isSelected: ytv_bol(),
    leadingImage: ytv_sch(YTImageSchema),
    rendererContext: ytv_ren(YTRendererContextSchema),
    selectionStyle: ytv_str(['LIST_ITEM_SELECTION_STYLE_DEFAULT']),
    title: ytv_ren(YTTextViewModelSchema)
  },
  liveChatProductPickerPanelItemViewModel: {
    description: ytv_ren(YTTextViewModelSchema),
    onTapCommand: ytv_enp(),
    productImage: ytv_ren(),
    title: ytv_ren(YTTextViewModelSchema)
  },
  liveChatProductPickerPanelViewModel: {
    closeButton: ytv_ren(),
    items: ytv_arr(ytv_ren()),
    title: ytv_ren(YTTextViewModelSchema)
  },
  liveViewerLeaderboardChatEntryPointViewModel: {
    defaultButton: ytv_ren(),
    entryPointStateEntityKey: ytv_str(),
    isCameo: ytv_bol(),
    isImmersive: ytv_bol(),
    pointsButton: ytv_ren(),
    pointsEntityKey: ytv_str()
  },
  lockupMetadataViewModel: {
    image: ytv_ren(),
    menuButton: ytv_ren(),
    metadata: ytv_ren(),
    title: ytv_ren(YTTextViewModelSchema)
  },
  lockupViewModel: {
    contentId: ytv_str(),
    contentImage: ytv_ren(),
    contentType: ytv_str(['LOCKUP_CONTENT_TYPE_ALBUM', 'LOCKUP_CONTENT_TYPE_PLAYLIST', 'LOCKUP_CONTENT_TYPE_VIDEO']),
    metadata: ytv_ren(),
    rendererContext: ytv_ren(YTRendererContextSchema)
  },
  officialCardViewModel: {
    backgroundColor: ytv_ren(YTThemedColorSchema),
    header: ytv_ren(),
    rendererContext: ytv_ren(YTRendererContextSchema)
  },
  pageHeaderViewModel: {
    actions: ytv_ren(),
    animatedImage: ytv_ren(),
    attribution: ytv_ren(),
    banner: ytv_ren(),
    description: ytv_ren(),
    image: ytv_ren(),
    metadata: ytv_ren(),
    rendererContext: ytv_ren(YTRendererContextSchema),
    title: ytv_ren()
  },
  panelFooterViewModel: {
    primaryButton: ytv_ren(),
    shouldHideDivider: ytv_bol()
  },
  pdgLikeViewModel: {
    engagementStateKey: ytv_str(),
    likeCountEntityKey: ytv_str(),
    likeCountPlaceholder: ytv_ren(YTTextViewModelSchema),
    likedIcon: ytv_sch(YTImageSchema),
    toggleButton: ytv_ren(),
    unlikeA11yText: ytv_ren(YTTextViewModelSchema),
    unlikedIcon: ytv_sch(YTImageSchema)
  },
  pdgReplyButtonViewModel: {
    replyButton: ytv_ren(),
    replyCountEntityKey: ytv_str(),
    replyCountPlaceholder: ytv_ren(YTTextViewModelSchema)
  },
  pivotButtonViewModel: {
    backgroundAnimationStyle: ytv_str(['BACKGROUND_ANIMATION_STYLE_DEFAULT']),
    contentDescription: ytv_str(),
    experiments: ytv_obj(ytv_str(), ytv_bol()),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    onClickCommand: ytv_enp(),
    soundAttributionTitle: ytv_ren(YTTextViewModelSchema),
    thumbnail: ytv_sch(YTImageSchema),
    waveformAnimationStyle: ytv_str(['WAVEFORM_ANIMATION_STYLE_DEFAULT']),
  },
  playerAdAvatarLockupCardButtonedViewModel: {
    avatar: ytv_ren(),
    button: ytv_ren(),
    description: ytv_ren(YTTextViewModelSchema),
    headline: ytv_ren(YTTextViewModelSchema),
    interaction: ytv_ren(YTAdInteractionSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    startMs: ytv_num()
  },
  reactionControlPanelButtonViewModel: {
    a11yLabel: ytv_str(),
    buttonIcon: ytv_sch(YTImageSchema),
    buttonIconType: ytv_str(YTIconType),
    emojiId: ytv_str(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    onTap: ytv_enp(),
    shouldTriggerAnimation: ytv_bol()
  },
  reactionControlPanelOverlayViewModel: {
    emojiFountain: ytv_ren(),
    liveReactionsSettingEntityKey: ytv_str(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    reactionControlPanel: ytv_ren()
  },
  reactionControlPanelViewModel: {
    collapsedButton: ytv_ren(),
    expandedButtons: ytv_arr(ytv_ren()),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    onMouseEnter: ytv_enp(),
    onMouseLeave: ytv_enp(),
    reactionControlPanelExpandedEntityKey: ytv_str()
  },
  reelChannelBarViewModel: {
    alcPurchaseStateEntityStoreKey: ytv_str(),
    channelName: ytv_ren(YTTextViewModelSchema),
    decoratedAvatarViewModel: ytv_ren(),
    endPositionActionButton: ytv_bol(),
    rendererContext: ytv_ren(YTRendererContextSchema),
    sponsorStateEntityStoreKey: ytv_str(),
    subscribeButtonViewModel: ytv_ren(),
    subscribeStateEntityStoreKey: ytv_str()
  },
  reelMetapanelViewModel: {
    metadataItems: ytv_arr(ytv_ren())
  },
  reelSoundMetadataViewModel: {
    enableMarqueeScroll: ytv_bol(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    loopCount: ytv_num(),
    musicIcon: ytv_sch(YTImageSchema),
    onTapCommand: ytv_enp(),
    soundMetadata: ytv_ren(YTTextViewModelSchema),
    useDefaultPadding: ytv_bol()
  },
  segmentedLikeDislikeButtonViewModel: {
    dislikeButtonViewModel: ytv_ren(),
    dynamicLikeCountUpdateData: ytv_sch({
      placeholderLikeCountValuesKey: ytv_str(),
      updateDelayLoopId: ytv_str(),
      updateDelaySec: ytv_num(),
      updateStatusKey: ytv_str()
    }),
    iconType: ytv_str(['LIKE_ICON_TYPE_UNKNOWN']),
    likeButtonViewModel: ytv_ren(),
    likeCountEntity: ytv_sch({
      key: ytv_str()
    }),
    teasersOrderEntityKey: ytv_str(),
  },
  sheetViewModel: {
    content: ytv_ren()
  },
  shortsLockupViewModel: {
    accessibilityText: ytv_str(),
    entityId: ytv_str(),
    indexInCollection: ytv_num(),
    inlinePlayerData: ytv_sch({
      onVisible: ytv_enp()
    }),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    menuOnTap: ytv_enp(),
    menuOnTapA11yLabel: ytv_str(),
    onTap: ytv_enp(),
    overlayMetadata: ytv_sch({
      primaryText: ytv_ren(YTTextViewModelSchema),
      secondaryText: ytv_ren(YTTextViewModelSchema)
    }),
    thumbnail: ytv_sch(YTImageSchema)
  },
  shortsVideoTitleViewModel: {
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    maxLines: ytv_num(),
    text: ytv_ren(YTTextViewModelSchema),
    truncatedTextOnTapCommand: ytv_enp()
  },
  skipAdButtonViewModel: {
    interaction: ytv_ren(YTAdInteractionSchema),
    label: ytv_str(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
  },
  skipAdViewModel: {
    interaction: ytv_ren(YTAdInteractionSchema),
    preskipState: ytv_ren(),
    skipOffsetMilliseconds: ytv_num(),
    skippableState: ytv_ren(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
  },
  speedmasterEduViewModel: {
    bodyText: ytv_ren(YTTextViewModelSchema)
  },
  subscribeButtonViewModel: {
    backgroundStyle: ytv_str(['SUBSCRIBE_BUTTON_VIEW_MODEL_BACKGROUND_STYLE_UNKNOWN']),
    bellAccessibilityData: ytv_sch({
      allLabel: ytv_str(),
      disabledLabel: ytv_str(),
      occasionalLabel: ytv_str(),
      offLabel: ytv_str()
    }),
    buttonStyle: ytv_sch({
      buttonSize: ytv_str(['SUBSCRIBE_BUTTON_VIEW_MODEL_SIZE_MEDIUM']),
      subscribedStateStyle: ytv_str(['SUBSCRIBE_BUTTON_VIEW_MODEL_SUBSCRIBED_STATE_STYLE_DROPDOWN']),
      unsubscribedStateStyle: ytv_str(['SUBSCRIBE_BUTTON_VIEW_MODEL_UNSUBSCRIBED_STATE_STYLE_PILL'])
    }),
    channelId: ytv_str(),
    disableNotificationBell: ytv_bol(),
    disableSubscribeButton: ytv_bol(),
    enableSubscribeButtonPostClickAnimation: ytv_bol(),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    notificationStateEntityStoreKeys: ytv_sch({
      subsNotificationStateKey: ytv_str()
    }),
    onShowSubscriptionOptions: ytv_enp(),
    stateEntityStoreKey: ytv_str(),
    subscribeButtonContent: ytv_ren(YTSubscribeButtonViewModelContentSchema),
    unsubscribeButtonContent: ytv_ren(YTSubscribeButtonViewModelContentSchema)
  },
  textCarouselItemViewModel: {
    button: ytv_ren(),
    iconName: ytv_str(YTIconType),
    onTap: ytv_enp(),
    text: ytv_ren(YTTextViewModelSchema)
  },
  themedImageViewModel: {
    imageDark: ytv_sch(YTImageSchema),
    imageLight: ytv_sch(YTImageSchema)
  },
  thumbnailBadgeViewModel: {
    animatedText: ytv_str(),
    animationActivationEntityKey: ytv_str(),
    animationActivationEntitySelectorType: ytv_str(['THUMBNAIL_BADGE_ANIMATION_ENTITY_SELECTOR_TYPE_PLAYER_STATE']),
    animationActivationTargetId: ytv_str(),
    backgroundColor: ytv_ren(YTThemedColorSchema),
    badgeStyle: ytv_str(['THUMBNAIL_OVERLAY_BADGE_STYLE_DEFAULT']),
    icon: ytv_sch(YTImageSchema),
    lottieData: ytv_sch({
      settings: ytv_sch({
        autoplay: ytv_bol(),
        loop: ytv_bol()
      }),
      url: ytv_str()
    }),
    rendererContext: ytv_ren(YTRendererContextSchema),
    text: ytv_str()
  },
  thumbnailHoverOverlayToggleActionsViewModel: {
    buttons: ytv_arr(ytv_ren())
  },
  thumbnailHoverOverlayViewModel: {
    icon: ytv_sch(YTImageSchema),
    style: ytv_str(['THUMBNAIL_HOVER_OVERLAY_STYLE_COVER']),
    text: ytv_ren(YTTextViewModelSchema)
  },
  thumbnailOverlayBadgeViewModel: {
    position: ytv_str(['THUMBNAIL_OVERLAY_BADGE_POSITION_BOTTOM_END']),
    thumbnailBadges: ytv_arr(ytv_ren())
  },
  thumbnailViewModel: {
    backgroundColor: ytv_ren(YTThemedColorSchema),
    image: ytv_sch(YTImageSchema),
    overlays: ytv_arr(ytv_ren())
  },
  timelyActionsOverlayViewModel: {
    rendererContext: ytv_ren(YTRendererContextSchema),
    timelyActions: ytv_arr(ytv_ren())
  },
  timelyActionViewModel: {
    additionalTrigger: ytv_arr(ytv_sch({
      args: ytv_sch({
        seekDirection: ytv_str(['TIMELY_ACTION_TRIGGER_DIRECTION_FORWARD', 'TIMELY_ACTION_TRIGGER_DIRECTION_BACKWARD']),
        seekLengthMilliseconds: ytv_str()
      }),
      type: ytv_str(['TIMELY_ACTION_TRIGGER_TYPE_KEYBOARD_SEEK', 'TIMELY_ACTION_TRIGGER_TYPE_PLAYER_CONTROLS_SHOWN', 'TIMELY_ACTION_TRIGGER_TYPE_PROGRESS_BAR_SEEK', 'TIMELY_ACTION_TRIGGER_TYPE_SPEEDMASTER'])
    })),
    content: ytv_ren(),
    cueRangeId: ytv_str(),
    endTimeMilliseconds: ytv_str(),
    maxShowCount: ytv_num(),
    maxVisibleDurationMilliseconds: ytv_str(),
    onCueRangeEnter: ytv_enp(),
    onCueRangeExit: ytv_enp(),
    rendererContext: ytv_ren(YTRendererContextSchema),
    smartSkipMetadata: ytv_sch({
      loggingData: ytv_sch({
        algorithmId: ytv_str(),
        endMilliseconds: ytv_str(),
        isCounterfactual: ytv_bol(),
        startMilliseconds: ytv_str()
      }),
      markerKey: ytv_str()
    }),
    startTimeMilliseconds: ytv_str()
  },
  toggleButtonViewModel: {
    defaultButtonViewModel: ytv_ren(),
    identifier: ytv_str(),
    isToggled: ytv_bol(),
    isTogglingDisabled: ytv_bol(),
    toggledButtonViewModel: ytv_ren()
  },
  topBannerImageTextIconButtonedLayoutViewModel: {
    adAvatarLockup: ytv_ren(),
    adButton: ytv_ren(),
    adImage: ytv_ren(),
    adLayoutLoggingData: ytv_ren(YTAdLayoutLoggingDataSchema),
    adVideoId: ytv_str(),
    interaction: ytv_ren(YTAdInteractionSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    menu: ytv_ren()
  },
  triStateButtonViewModel: {
    toggledStateData: ytv_sch({
      loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
    }),
    untoggledStateData: ytv_sch({
      loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
    })
  },
  videoAttributesSectionViewModel: {
    headerInfoButtonOnTap: ytv_enp(),
    headerSubtitle: ytv_str(),
    headerTitle: ytv_str(),
    nextButton: ytv_ren(),
    previousButton: ytv_ren(),
    videoAttributeViewModels: ytv_arr(ytv_ren())
  },
  videoAttributeViewModel: {
    image: ytv_sch(YTImageSchema),
    imageSize: ytv_str(['VIDEO_ATTRIBUTE_IMAGE_SIZE_LARGE']),
    imageStyle: ytv_str(['VIDEO_ATTRIBUTE_IMAGE_STYLE_SQUARE']),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
    onTap: ytv_enp(),
    orientation: ytv_str(['VIDEO_ATTRIBUTE_ORIENTATION_HORIZONTAL', 'VIDEO_ATTRIBUTE_ORIENTATION_VERTICAL']),
    overflowMenuA11yLabel: ytv_str(),
    overflowMenuOnTap: ytv_enp(),
    rendererContext: ytv_ren(YTRendererContextSchema),
    secondarySubtitle: ytv_ren(YTTextViewModelSchema),
    sizingRule: ytv_str(['VIDEO_ATTRIBUTE_SIZING_RULE_RESPONSIVE']),
    subtitle: ytv_str(),
    title: ytv_str()
  },
  videoMetadataCarouselViewModel: {
    carouselItems: ytv_arr(ytv_ren()),
    carouselTitles: ytv_arr(ytv_ren())
  },
  visitAdvertiserLinkViewModel: {
    interaction: ytv_ren(YTAdInteractionSchema),
    label: ytv_ren(YTTextViewModelSchema),
    loggingDirectives: ytv_ren(YTLoggingDirectivesSchema)
  },

  // Others
  autoplay: {
    countDownSecs: ytv_num(),
    modifiedSets: ytv_arr(ytv_ren(YTAutoplaySetSchema)),
    sets: ytv_arr(ytv_ren(YTAutoplaySetSchema))
  },
  playlist: {
    contents: ytv_arr(ytv_ren()),
    currentIndex: ytv_num(),
    isCourse: ytv_bol(),
    isEditable: ytv_bol(),
    isInfinite: ytv_bol(),
    localCurrentIndex: ytv_num(),
    longBylineText: ytv_sch(YTTextSchema),
    menu: ytv_ren(),
    nextVideoLabel: ytv_sch(YTTextSchema),
    ownerName: ytv_sch(YTTextSchema),
    playerInfoView: ytv_str(['DO_NOT_CHANGE']),
    playlistButtons: ytv_ren(),
    playlistId: ytv_str(),
    playlistShareUrl: ytv_str(),
    shortBylineText: ytv_sch(YTTextSchema),
    title: ytv_str(),
    titleText: ytv_sch(YTTextSchema)
  },
  results: {
    contents: ytv_arr(ytv_ren())
  },
  secondaryResults: {
    results: ytv_arr(ytv_ren()),
    targetId: ytv_str()
  },
  templatedAdText: {
    isTemplated: ytv_bol(),
    text: ytv_str()
  }
} satisfies Record<string, YTRendererSchema>

export const YTRendererMixinSchema = {
  clickTrackingParams: ytv_str(),
  command: ytv_enp(),
  trackingParams: ytv_str()
} satisfies YTObjectSchema

export type YTRendererKey = keyof typeof YTRendererSchemaMap
export type YTRenderer<K extends YTRendererKey = YTRendererKey> = typeof YTRendererSchemaMap[K]