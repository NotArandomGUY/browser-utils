import { ytv_enp, ytv_ren } from '../define/extended'
import { ytv_arr, ytv_bol, ytv_num, ytv_obj, ytv_sch, ytv_str, ytv_unk } from '../define/primitive'
import { YTObjectSchema } from '../define/types'

import * as common from '../common'
import * as enums from './enums'

// Components pre declare
export const imageSource = ytv_ren({
  clientResource: ytv_ren({
    imageName: ytv_str()
  }),
  height: ytv_num(),
  url: ytv_str(),
  width: ytv_num()
})
export const image = ytv_ren({
  contentMode: ytv_str(['CONTENT_MODE_SCALE_ASPECT_FILL']),
  imageFormatHint: ytv_str(['IMAGE_FORMAT_ANIMATED_WEBP']),
  processor: ytv_obj(ytv_str(), ytv_unk()),
  sources: ytv_arr(imageSource)
})
export const loggingDirectives = ytv_ren({
  attentionLogging: ytv_str(['ATTENTION_LOGGING_BASIC', 'ATTENTION_LOGGING_SCROLL']),
  clientVeSpec: ytv_sch({
    uiType: ytv_num(),
    veCounter: ytv_num()
  }),
  visibility: ytv_sch({
    types: ytv_str()
  }),
  gestures: ytv_sch({
    types: ytv_str()
  })
})
export const thumbnail = ytv_ren({
  accessibility: common.components.accessibility,
  darkColorPalette: ytv_obj(ytv_str(), ytv_num()),
  isOriginalAspectRatio: ytv_bol(),
  lightColorPalette: ytv_obj(ytv_str(), ytv_num()),
  logAsMovingThumbnail: ytv_bol(),
  placeholderColor: ytv_num(),
  sampledThumbnailColor: ytv_obj(ytv_str(), ytv_num()),
  thumbnails: ytv_arr(imageSource),
  vibrantColorPalette: ytv_obj(ytv_str(), ytv_num()),
  webThumbnailDetailsExtensionData: ytv_sch({
    isPreloaded: ytv_bol()
  })
})

// Components
export const adInteraction = ytv_ren({
  accessibility: common.components.accessibilityData,
  onFirstVisible: ytv_enp(),
  onTap: ytv_enp()
})
export const adLayoutLoggingData = ytv_ren({
  serializedAdServingDataEntry: ytv_str()
})
export const adLayoutMetadata = ytv_ren({
  adLayoutLoggingData: adLayoutLoggingData,
  layoutId: ytv_str(),
  layoutType: ytv_str(enums.AdLayoutType)
})
export const adSlotLoggingData = ytv_ren({
  serializedSlotAdServingDataEntry: ytv_str()
})
export const autoplaySet = ytv_ren({
  autoplayVideo: ytv_enp(),
  autoplayVideoRenderer: ytv_ren(),
  mode: ytv_str(['LOOP_ONE', 'NORMAL']),
  nextButtonVideo: ytv_enp(),
  nextVideoRenderer: ytv_ren(),
  previousButtonVideo: ytv_enp(),
  previousVideoRenderer: ytv_ren()
})
export const colorSupportedDatas = ytv_ren({
  basicColorPaletteData: ytv_ren({
    backgroundColor: ytv_num(),
    foregroundBodyColor: ytv_num(),
    foregroundTitleColor: ytv_num()
  })
})
export const continuationData = ytv_ren({
  autoloadEnabled: ytv_bol(),
  autoloadThresholdItemsFromEnd: ytv_num(),
  continuation: ytv_str(),
  disableContinuationClickLogging: ytv_bol(),
  invalidationId: ytv_sch({
    objectId: ytv_str(),
    objectSource: ytv_num(),
    protoCreationTimestampMs: ytv_str(),
    subscribeToGcmTopics: ytv_bol(),
    topic: ytv_str()
  }),
  timeUntilLastMessageMsec: ytv_num(),
  timeoutMs: ytv_num()
})
export const continuation = ytv_ren({
  invalidationContinuationData: continuationData,
  liveChatReplayContinuationData: continuationData,
  nextContinuationData: continuationData,
  nextRadioContinuationData: continuationData,
  playerSeekContinuationData: continuationData,
  reloadContinuationData: continuationData,
  timedContinuationData: continuationData
})
export const dimensionValue = ytv_sch({
  unit: ytv_str(['DIMENSION_UNIT_POINT']),
  value: ytv_num()
})
export const emoji = ytv_ren({
  emojiId: ytv_str(),
  image: thumbnail,
  isCustomEmoji: ytv_bol(),
  isLocked: ytv_bol(),
  multiSelectorThumbnailRow: ytv_arr(ytv_sch({
    thumbnails: ytv_arr(thumbnail)
  })),
  searchTerms: ytv_arr(ytv_str()),
  shortcuts: ytv_arr(ytv_str()),
  supportsSkinTone: ytv_bol(),
  variantIds: ytv_arr(ytv_str())
})
export const engagementPanelIdentifier = ytv_sch({
  surface: ytv_str(['ENGAGEMENT_PANEL_SURFACE_BROWSE', 'ENGAGEMENT_PANEL_SURFACE_LIVE_CHAT', 'ENGAGEMENT_PANEL_SURFACE_SHORTS', 'ENGAGEMENT_PANEL_SURFACE_WATCH']),
  tag: ytv_str()
})
export const icon = ytv_ren({
  iconType: ytv_str(enums.IconType)
})
export const layoutExitedForReasonTrigger = ytv_ren({
  layoutExitReason: ytv_str(['LAYOUT_EXIT_REASON_ERROR', 'LAYOUT_EXIT_REASON_NORMAL']),
  triggeringLayoutId: ytv_str()
})
export const mediaFormatRange = ytv_sch({
  start: ytv_str(),
  end: ytv_str()
})
export const mediaFormat = ytv_sch({
  approxDurationMs: ytv_str(),
  audioChannels: ytv_num(),
  audioQuality: ytv_str(common.enums.MediaFormatAudioQuality),
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
  indexRange: mediaFormatRange,
  initRange: mediaFormatRange,
  isDrc: ytv_bol(),
  itag: ytv_num(),
  lastModified: ytv_str(),
  loudnessDb: ytv_num(),
  maxDvrDurationSec: ytv_num(),
  mimeType: ytv_str(),
  projectionType: ytv_str(['RECTANGULAR']),
  quality: ytv_str(common.enums.MediaFormatVideoQuality),
  qualityLabel: ytv_str(),
  qualityOrdinal: ytv_str(common.enums.MediaFormatQualityOrdinal),
  signatureCipher: ytv_str(),
  targetDurationSec: ytv_num(),
  url: ytv_str(),
  width: ytv_num(),
  xtags: ytv_str()
})
export const minReadaheadPolicy = ytv_ren({
  minBandwidthBytesPerSec: ytv_num(),
  minReadaheadMs: ytv_num()
})
export const paygatedQualityDetail = ytv_ren({
  paygatedIndicatorText: ytv_str()
})
export const paygatedQualitiesMetadata = ytv_ren({
  qualityDetails: ytv_obj(ytv_str(), paygatedQualityDetail)
  // TODO: support union type
  /*
  qualityDetails: ytv_arr(ytv_sch({
    key: ytv_str(),
    value: paygatedQualityDetail
  }))
  */
})
export const playbackPosition = ytv_ren({
  streamTimeMillis: ytv_str(),
  utcTimeMillis: ytv_str()
})
export const playerConfig = ytv_ren({
  audioConfig: ytv_sch({
    audioMuted: ytv_bol(),
    enablePerFormatLoudness: ytv_bol(),
    loudnessDb: ytv_num(),
    loudnessNormalizationConfig: ytv_sch({
      applyStatefulNormalization: ytv_bol(),
      maxStatefulTimeThresholdSec: ytv_num(),
      minimumLoudnessTargetLkfs: ytv_num(),
      preserveStatefulLoudnessTarget: ytv_bol()
    }),
    loudnessTargetLkfs: ytv_num(),
    muteOnStart: ytv_bol(),
    perceptualLoudnessDb: ytv_num(),
    playAudioOnly: ytv_bol(),
    trackAbsoluteLoudnessLkfs: ytv_num()
  }),
  daiConfig: ytv_sch({
    allowUstreamerRequestAdconfig: ytv_bol(),
    daiType: ytv_str(['DAI_TYPE_CLIENT_STITCHED', 'DAI_TYPE_SERVER_STITCHED', 'DAI_TYPE_SS_DISABLED']),
    debugInfo: ytv_sch({
      isDisabledUnpluggedChannel: ytv_bol()
    }),
    enableDai: ytv_bol(),
    enablePreroll: ytv_bol(),
    enableServerStitchedDai: ytv_bol()
  }),
  embeddedPlayerConfig: ytv_sch({
    embeddedPlayerMode: ytv_str(['EMBEDDED_PLAYER_MODE_DEFAULT', 'EMBEDDED_PLAYER_MODE_PFL', 'EMBEDDED_PLAYER_MODE_PFP', 'EMBEDDED_PLAYER_MODE_UNKNOWN']),
    permissions: ytv_sch({
      allowImaMonetization: ytv_bol()
    })
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
  manifestlessWindowedLiveConfig: ytv_sch({
    maxDvrSequence: ytv_num(),
    minDvrSequence: ytv_num(),
    maxDvrMediaTimeMs: ytv_num(),
    minDvrMediaTimeMs: ytv_num(),
    startWalltimeMs: ytv_num()
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
        resumeMinReadaheadPolicy: ytv_arr(minReadaheadPolicy),
        startMinReadaheadPolicy: ytv_arr(minReadaheadPolicy)
      })
    }),
    splitScreenEligible: ytv_bol(),
    useServerDrivenAbr: ytv_bol()
  }),
  playbackEndConfig: ytv_sch({
    endSeconds: ytv_num(),
    limitedPlaybackDurationInSeconds: ytv_num()
  }),
  playbackStartConfig: ytv_sch({
    liveUtcStartSeconds: ytv_num(),
    progressBarEndPosition: ytv_num(),
    progressBarStartPosition: ytv_num(),
    startPaused: ytv_bol(),
    startPosition: playbackPosition,
    startSeconds: ytv_num()
  }),
  skippableIntroConfig: ytv_sch({
    endMs: ytv_str(),
    startMs: ytv_str()
  }),
  skippableSegmentsConfig: ytv_sch({
    introSkipDurationMs: ytv_str(),
    outroSkipDurationMs: ytv_str()
  }),
  streamSelectionConfig: ytv_sch({
    maxBitrate: ytv_str()
  }),
  vrConfig: ytv_sch({
    partialSpherical: ytv_str()
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
})
export const playerPlayabilityStatus = ytv_ren({
  additionalLoggingData: ytv_str(),
  audioOnlyPlayability: ytv_ren(),
  contextParams: ytv_str(),
  desktopLegacyAgeGateReason: ytv_num(),
  errorCode: ytv_str(['PLAYABILITY_ERROR_CODE_EMBARGOED']),
  errorScreen: ytv_ren(),
  liveStreamability: ytv_ren(),
  miniplayer: ytv_ren(),
  offlineability: ytv_ren(),
  paygatedQualitiesMetadata,
  playableInEmbed: ytv_bol(),
  reason: ytv_str(),
  status: ytv_str(['AGE_CHECK_REQUIRED', 'AGE_VERIFICATION_REQUIRED', 'CONTENT_CHECK_REQUIRED', 'LIVE_STREAM_OFFLINE', 'OK', 'UNPLAYABLE'])
})
export const playerPlaybackTracking = ytv_ren({
  atrUrl: common.components.url,
  googleRemarketingUrl: common.components.url,
  ptrackingUrl: common.components.url,
  qoeUrl: common.components.url,
  videostatsDelayplayUrl: common.components.url,
  videostatsPlaybackUrl: common.components.url,
  videostatsWatchtimeUrl: common.components.url,
  videostatsDefaultFlushIntervalSeconds: ytv_num(),
  videostatsScheduledFlushWalltimeSeconds: ytv_arr(ytv_num()), // NOTE: maybe union of (number | number[])
  youtubeRemarketingUrl: common.components.url
})
export const playerStreamingData = ytv_ren({
  adaptiveFormats: ytv_arr(mediaFormat),
  dashManifestUrl: ytv_str(),
  expiresInSeconds: ytv_str(),
  formats: ytv_arr(mediaFormat),
  hlsManifestUrl: ytv_str(),
  serverAbrStreamingUrl: ytv_str()
})
export const playerVideoDetails = ytv_ren({
  allowRatings: ytv_bol(),
  author: ytv_str(),
  channelId: ytv_str(),
  isCrawlable: ytv_bol(),
  isExternallyHostedPodcast: ytv_bol(),
  isLive: ytv_bol(),
  isLiveContent: ytv_bol(),
  isLiveDvrEnabled: ytv_bol(),
  isLowLatencyLiveStream: ytv_bol(),
  isOwnerViewing: ytv_bol(),
  isPrivate: ytv_bol(),
  isUnpluggedCorpus: ytv_bol(),
  isUpcoming: ytv_bol(),
  keywords: ytv_arr(ytv_str()),
  latencyClass: ytv_str(['MDE_STREAM_OPTIMIZATIONS_RENDERER_LATENCY_UNKNOWN', 'MDE_STREAM_OPTIMIZATIONS_RENDERER_LATENCY_NORMAL', 'MDE_STREAM_OPTIMIZATIONS_RENDERER_LATENCY_LOW', 'MDE_STREAM_OPTIMIZATIONS_RENDERER_LATENCY_ULTRA_LOW']),
  lengthSeconds: ytv_str(),
  liveChunkReadahead: ytv_num(),
  musicVideoType: ytv_str(common.enums.MusicVideoType),
  shortDescription: ytv_str(),
  thumbnail,
  title: ytv_str(),
  videoId: ytv_str(),
  viewCount: ytv_str()
})
export const rendererContext = ytv_ren({
  accessibilityContext: common.components.accessibilityData,
  commandContext: ytv_ren({
    onHidden: ytv_enp(),
    onTap: ytv_enp(),
    onVisible: ytv_enp()
  }),
  loggingContext: ytv_ren({
    loggingDirectives
  })
})
export const size = ytv_ren({
  sizeType: ytv_str(enums.SizeType)
})
export const subscribeButtonViewModelContent = ytv_ren({
  accessibilityText: ytv_str(),
  buttonText: ytv_str(),
  imageName: ytv_str(),
  onTapCommand: ytv_enp(),
  subscribeState: ytv_sch({
    key: ytv_str(),
    subscribed: ytv_bol()
  })
})
export const style = ytv_ren({
  styleType: ytv_str(['STYLE_DEFAULT', 'STYLE_DEFAULT_ACTIVE', 'STYLE_GREY_TEXT', 'STYLE_HOME_FILTER', 'STYLE_TEXT'])
})
export const text = ytv_ren({
  runs: ytv_arr(ytv_sch({
    bold: ytv_bol(),
    emoji,
    fontFace: ytv_str(['FONT_FACE_ROBOTO_MEDIUM', 'FONT_FACE_ROBOTO_REGULAR']),
    loggingDirectives,
    navigationEndpoint: ytv_enp(),
    text: ytv_str(),
    textColor: ytv_num()
  })),
  accessibility: common.components.accessibility,
  simpleText: ytv_str()
})
export const textViewModelColorMapExtension = ytv_ren({
  colorMap: ytv_arr(ytv_sch({
    key: ytv_str(),
    value: ytv_num()
  }))
})
export const themedColor = ytv_ren({
  darkTheme: ytv_num(),
  lightTheme: ytv_num()
})
export const timedLyricLine = ytv_ren({
  endTimeOffsetMs: ytv_num(),
  lyricLine: text,
  lyricLineStyle: ytv_str(['LYRIC_LINE_STYLE_EQUALIZER', 'LYRIC_LINE_STYLE_SONG_SOURCE', 'LYRIC_LINE_STYLE_TEXT']),
  startTimeOffsetMs: ytv_num()
})
export const transportControlsAction = ytv_ren({
  button: ytv_ren(),
  type: ytv_str([
    'TRANSPORT_CONTROLS_BUTTON_TYPE_ABOUT_BUTTON',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_ADD_TO_PLAYLIST',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_AUDIO_TRACKS',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_BLOCK',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_CAPTIONS',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_CHANNEL_BUTTON',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_COMMENTS',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_DISLIKE_BUTTON',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_DRC',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_FEEDBACK',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_LIKE_BUTTON',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_LIVE_LATENCY',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_LOOP_BUTTON',
    'TRANSPORT_CONTROLS_BUTTON_TYPE_MUSIC_DISPLAY',
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
})
export const videoAdPings = ytv_ren({
  abandonPings: ytv_arr(common.components.url),
  activeViewFullyViewableAudibleHalfDurationPings: ytv_arr(common.components.url),
  activeViewMeasurablePings: ytv_arr(common.components.url),
  activeViewTracking: ytv_sch({
    identifier: ytv_str(),
    trafficType: ytv_str(['ACTIVE_VIEW_TRAFFIC_TYPE_VIDEO'])
  }),
  activeViewViewablePings: ytv_arr(common.components.url),
  closePings: ytv_arr(common.components.url),
  completePings: ytv_arr(common.components.url),
  errorPings: ytv_arr(common.components.url),
  firstQuartilePings: ytv_arr(common.components.url),
  fullscreenPings: ytv_arr(common.components.url),
  impressionPings: ytv_arr(common.components.url),
  mutePings: ytv_arr(common.components.url),
  pausePings: ytv_arr(common.components.url),
  progressPings: ytv_arr(common.components.url),
  resumePings: ytv_arr(common.components.url),
  rewindPings: ytv_arr(common.components.url),
  secondQuartilePings: ytv_arr(common.components.url),
  skipPings: ytv_arr(common.components.url),
  startPings: ytv_arr(common.components.url),
  swipePings: ytv_arr(common.components.url),
  thirdQuartilePings: ytv_arr(common.components.url),
  unmutePings: ytv_arr(common.components.url)
})

// Schema base
export const SchemaBase = {
  clickTrackingParams: ytv_str(),
  command: ytv_enp(),
  trackingParams: ytv_str()
} as const satisfies YTObjectSchema