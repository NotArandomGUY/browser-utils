import { ytv_enp, ytv_ren } from '../define/extended'
import { ytv_arr, ytv_bol, ytv_num, ytv_obj, ytv_sch, ytv_str, ytv_unk } from '../define/primitive'

import * as common from '../common'
import * as endpoint from '../endpoint'
import * as response from '../response'
import * as components from './components'
import * as enums from './enums'

// Renderer pre declare
export const sortFilterSubMenuItemRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  continuation: components.continuation,
  selected: ytv_bol(),
  serviceEndpoint: ytv_enp(),
  subtitle: ytv_str(),
  title: ytv_str()
}))

// ViewModel pre declare
export const textViewModel = ytv_ren(() => ({
  content: ytv_str(),
  alignment: ytv_str(['TEXT_ALIGNMENT_CENTER']),
  attachmentRuns: ytv_arr(ytv_ren({
    alignment: ytv_str(['ALIGNMENT_VERTICAL_CENTER']),
    element: ytv_sch({
      properties: ytv_sch({
        layoutProperties: ytv_sch({
          height: components.dimensionValue,
          margin: ytv_sch({
            bottom: components.dimensionValue,
            left: components.dimensionValue,
            right: components.dimensionValue,
            top: components.dimensionValue
          }),
          width: components.dimensionValue
        })
      }),
      type: ytv_sch({
        imageType: ytv_sch({
          image: components.image
        })
      })
    }),
    length: ytv_num(),
    startIndex: ytv_num()
  })),
  commandRuns: ytv_arr(ytv_ren({
    length: ytv_num(),
    loggingDirectives: components.loggingDirectives,
    onTap: ytv_enp(),
    onTapOptions: ytv_sch({
      accessibilityInfo: ytv_sch({
        accessibilityLabel: ytv_str()
      })
    }),
    startIndex: ytv_num()
  })),
  decorationRuns: ytv_arr(ytv_ren({
    textDecorator: ytv_sch({
      highlightTextDecorator: ytv_sch({
        backgroundCornerRadius: ytv_num(),
        bottomPadding: ytv_num(),
        highlightTextDecoratorExtensions: ytv_sch({
          highlightTextDecoratorColorMapExtension: components.textViewModelColorMapExtension
        }),
        length: ytv_num(),
        startIndex: ytv_num()
      })
    })
  })),
  paragraphStyleRuns: ytv_arr(ytv_ren({
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
  })),
  styleRuns: ytv_arr(ytv_ren({
    fontColor: ytv_num(),
    fontFamilyName: ytv_str(),
    fontName: ytv_str(),
    fontSize: ytv_num(),
    italic: ytv_bol(),
    length: ytv_num(),
    startIndex: ytv_num(),
    styleRunExtensions: ytv_sch({
      styleRunColorMapExtension: components.textViewModelColorMapExtension,
      styleRunMentionExtension: ytv_sch({
        channelId: ytv_str()
      })
    }),
    weight: ytv_num(),
    weightLabel: ytv_str(['FONT_WEIGHT_BOLD', 'FONT_WEIGHT_MEDIUM', 'FONT_WEIGHT_NORMAL'])
  }))
}))
export const buttonViewModel = ytv_ren(() => ({
  accessibilityId: ytv_str(),
  accessibilityText: ytv_str(),
  buttonSize: ytv_str(['BUTTON_VIEW_MODEL_SIZE_COMPACT', 'BUTTON_VIEW_MODEL_SIZE_DEFAULT', 'BUTTON_VIEW_MODEL_SIZE_XSMALL']),
  customBackgroundColor: ytv_num(),
  customFontColor: ytv_num(),
  iconImage: components.imageSource,
  iconName: ytv_str(),
  iconPosition: ytv_str(['BUTTON_VIEW_MODEL_ICON_POSITION_LEADING', 'BUTTON_VIEW_MODEL_ICON_POSITION_TRAILING']),
  iconTrailing: ytv_bol(),
  isFullWidth: ytv_bol(),
  loggingDirectives: components.loggingDirectives,
  onTap: ytv_enp(),
  onVisible: ytv_enp(),
  shouldLogGestures: ytv_bol(),
  state: ytv_str(['BUTTON_VIEW_MODEL_STATE_ACTIVE']),
  style: ytv_str(['BUTTON_VIEW_MODEL_STYLE_CUSTOM', 'BUTTON_VIEW_MODEL_STYLE_MONO', 'BUTTON_VIEW_MODEL_STYLE_OVERLAY', 'BUTTON_VIEW_MODEL_STYLE_OVERLAY_DARK', 'BUTTON_VIEW_MODEL_STYLE_UNKNOWN']),
  title: ytv_str(),
  titleFormatted: textViewModel,
  tooltip: ytv_str(),
  type: ytv_str(['BUTTON_VIEW_MODEL_TYPE_FILLED', 'BUTTON_VIEW_MODEL_TYPE_OUTLINE', 'BUTTON_VIEW_MODEL_TYPE_TEXT', 'BUTTON_VIEW_MODEL_TYPE_TONAL'])
}))

// No suffix
export const autoplay = ytv_ren(() => ({
  countDownSecs: ytv_num(),
  modifiedSets: ytv_arr(components.autoplaySet),
  replayVideoRenderer: ytv_ren(),
  sets: ytv_arr(components.autoplaySet)
}))
export const playlist = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren()),
  currentIndex: ytv_num(),
  isCourse: ytv_bol(),
  isEditable: ytv_bol(),
  isInfinite: ytv_bol(),
  likeButton: ytv_ren(),
  localCurrentIndex: ytv_num(),
  longBylineText: components.text,
  menu: ytv_ren(),
  nextVideoLabel: components.text,
  ownerName: components.text,
  playerInfoView: ytv_str(['DO_NOT_CHANGE']),
  playlistButtons: ytv_ren(),
  playlistId: ytv_str(),
  playlistShareUrl: ytv_str(),
  shortBylineText: components.text,
  title: ytv_str(),
  titleText: components.text
}))
export const results = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren())
}))
export const templatedAdText = ytv_ren(() => ({
  isTemplated: ytv_bol(),
  text: ytv_str()
}))
export const thirdPartyNetworkSection = ytv_ren(() => ({
  copyLinkContainer: ytv_ren(),
  shareTargetContainer: ytv_ren(),
  startAtContainer: ytv_ren()
}))

// Results
export const secondaryResults = ytv_ren(() => ({
  results: ytv_arr(ytv_ren()),
  targetId: ytv_str()
}))
export const singleColumnWatchNextResults = ytv_ren(() => ({
  autoplay: ytv_ren(),
  conversationBar: ytv_ren(),
  pivot: ytv_ren(),
  playlist: ytv_ren(),
  results: ytv_ren()
}))
export const twoColumnWatchNextResults = ytv_ren(() => ({
  autoplay: ytv_ren(),
  conversationBar: ytv_ren(),
  playlist: ytv_ren(),
  results: ytv_ren(),
  secondaryResults: ytv_ren(),
}))

// Offline data
export const offlineChannelData = ytv_ren({
  channelId: ytv_str(),
  isChannelOwner: ytv_bol(),
  thumbnail: components.thumbnail,
  title: ytv_str()
})
export const offlinePlaylistData = ytv_ren({
  channel: ytv_ren(),
  isPrivate: ytv_bol(),
  lastModifiedTimestamp: ytv_str(),
  offlinePlaylistToken: ytv_str(),
  playlistId: ytv_str(),
  privacy: ytv_str(),
  shareUrl: ytv_str(),
  thumbnail: components.thumbnail,
  title: ytv_str(),
  totalVideoCount: ytv_str(),
  videos: ytv_arr(ytv_ren())
})
export const offlineVideoData = ytv_ren({
  channel: ytv_ren(),
  description: components.text,
  lengthSeconds: ytv_str(),
  lengthText: ytv_str(),
  likesCount: ytv_str(),
  publishedTimestamp: ytv_str(),
  shareUrl: ytv_str(),
  shortViewCountText: ytv_str(),
  thumbnail: components.thumbnail,
  title: ytv_str(),
  videoId: ytv_str(),
  viewCount: ytv_str()
})

// Renderer
export const aboutThisAdRenderer = ytv_ren(() => ({
  url: ytv_sch({
    privateDoNotAccessOrElseTrustedResourceUrlWrappedValue: ytv_str()
  })
}))
export const aboveFeedAdLayoutRenderer = ytv_ren(() => ({
  adLayoutMetadata: components.adLayoutMetadata,
  layoutExitNormalTriggers: ytv_arr(ytv_sch({
    id: ytv_str(),
    layoutIdExitedTrigger: ytv_sch({
      triggeringLayoutId: ytv_str()
    }),
    onDifferentLayoutIdEnteredTrigger: ytv_sch({
      layoutType: ytv_str(enums.AdLayoutType)
    })
  })),
  renderingContent: ytv_ren()
}))
export const adActionInterstitialRenderer = ytv_ren(() => ({
  abandonCommands: endpoint.mapped.commandExecutorCommand,
  completionCommands: ytv_arr(ytv_enp()),
  durationMilliseconds: ytv_num(),
  layoutId: ytv_str(),
  skipPings: ytv_arr(common.components.url)
}))
export const adBreakServiceRenderer = ytv_ren(() => ({
  getAdBreakUrl: ytv_str(),
  prefetchMilliseconds: ytv_str()
}))
export const adDurationRemainingRenderer = ytv_ren(() => ({
  templatedCountdown: ytv_ren()
}))
export const adHoverTextButtonRenderer = ytv_ren(() => ({
  button: ytv_ren(),
  hoverText: components.text
}))
export const adPlacementRenderer = ytv_ren(() => ({
  adSlotLoggingData: components.adSlotLoggingData,
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
}))
export const adPlayerOverlayRenderer = ytv_ren(() => ({
  shareNavigationEndpoint: ytv_enp(),
  shortBylineText: components.text,
  showShareButton: ytv_bol(),
  thumbnail: components.thumbnail,
  thumbnailNavigationEndpoint: ytv_enp(),
  title: components.text,
  trvfaBanner: components.thumbnail,
  visitAdvertiserText: components.text
}))
export const adSlotRenderer = ytv_ren(() => ({
  adSlotMetadata: ytv_sch({
    adSlotLoggingData: components.adSlotLoggingData,
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
    layoutExitedForReasonTrigger: components.layoutExitedForReasonTrigger,
    layoutIdEnteredTrigger: ytv_sch({
      triggeringLayoutId: ytv_str()
    })
  }),
  slotExpirationTriggers: ytv_arr(ytv_sch({
    id: ytv_str(),
    layoutExitedForReasonTrigger: components.layoutExitedForReasonTrigger,
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
}))
export const adsEngagementPanelContentRenderer = ytv_ren(() => ({
  hack: ytv_bol()
}))
export const audioOnlyPlayabilityRenderer = ytv_ren(() => ({
  audioOnlyAvailability: ytv_str(['FEATURE_AVAILABILITY_ALLOWED'])
}))
export const autoplayEndpointRenderer = ytv_ren(() => ({
  endpoint: ytv_enp(),
  item: ytv_ren()
}))
export const autoplaySwitchButtonRenderer = ytv_ren(() => ({
  disabledAccessibilityData: common.components.accessibility,
  enabled: ytv_bol(),
  enabledAccessibilityData: common.components.accessibility,
  onDisabledCommand: ytv_enp(),
  onEnabledCommand: ytv_enp()
}))
export const autoplayVideoWrapperRenderer = ytv_ren(() => ({
  counterpartEndpointRenderers: ytv_arr(ytv_ren()),
  primaryEndpointRenderer: ytv_ren()
}))
export const avatarLockupRenderer = ytv_ren(() => ({
  size: ytv_str(['AVATAR_LOCKUP_SIZE_SMALL']),
  title: components.text
}))
export const backstageImageRenderer = ytv_ren(() => ({
  icon: components.icon,
  image: components.thumbnail
}))
export const bannerPromoRenderer = ytv_ren(() => ({
  actionButton: ytv_ren(),
  backgroundImage: components.thumbnail,
  badgeText: textViewModel,
  colorData: ytv_obj(ytv_str(), ytv_obj(ytv_str(), ytv_num())),
  dismissButton: ytv_ren(),
  impressionEndpoints: ytv_enp(),
  isVisible: ytv_bol(),
  overflowButton: ytv_ren(),
  promoText: components.text,
  style: components.style,
  supplementalText: components.text
}))
export const browseFeedActionsRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren())
}))
export const bubbleHintRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibilityData,
  detailsText: components.text,
  isVisible: ytv_bol(),
  style: ytv_str(['BUBBLE_HINT_STYLE_BLUE_TOOLTIP']),
  text: components.text
}))
export const buttonRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibilityData,
  accessibilityData: common.components.accessibility,
  command: ytv_enp(),
  hint: ytv_ren(),
  icon: components.icon,
  iconPosition: ytv_str(['BUTTON_ICON_POSITION_TYPE_LEFT_OF_TEXT', 'BUTTON_ICON_POSITION_TYPE_RIGHT_OF_TEXT']),
  isDisabled: ytv_bol(),
  isSelected: ytv_bol(),
  navigationEndpoint: ytv_enp(),
  serviceEndpoint: ytv_enp(),
  size: ytv_str(enums.SizeType),
  style: ytv_str(enums.ButtonStyle),
  targetId: ytv_str(),
  text: components.text,
  tooltip: ytv_str()
}))
export const callToActionButtonRenderer = ytv_ren(() => ({
  icon: components.icon,
  label: components.text,
  style: ytv_str(['CALL_TO_ACTION_BUTTON_RENDERER_STYLE_OPAQUE_BLACK'])
}))
export const cardCollectionRenderer = ytv_ren(() => ({
  allowTeaserDismiss: ytv_bol(),
  cards: ytv_arr(ytv_ren()),
  closeButton: ytv_ren(),
  headerText: components.text,
  icon: ytv_ren(),
  logIconVisibilityUpdates: ytv_bol(),
  onIconTapCommand: ytv_enp()
}))
export const cardRenderer = ytv_ren(() => ({
  cueRanges: ytv_arr(ytv_sch({
    endCardActiveMs: ytv_str(),
    iconAfterTeaserMs: ytv_str(),
    startCardActiveMs: ytv_str(),
    teaserDurationMs: ytv_str()
  })),
  teaser: ytv_ren()
}))
export const carouselItemRenderer = ytv_ren(() => ({
  backgroundColor: ytv_num(),
  carouselItems: ytv_arr(ytv_ren()),
  layoutStyle: ytv_str(['CAROUSEL_ITEM_RENDERER_LAYOUT_STYLE_DESTINATION']),
  paginationThumbnails: ytv_arr(components.thumbnail),
  paginatorAlignment: ytv_str(['CAROUSEL_ITEM_RENDERER_PAGINATOR_ALIGNMENT_START'])
}))
export const channelMetadataRenderer = ytv_ren(() => ({
  androidAppindexingLink: ytv_str(),
  androidDeepLink: ytv_str(),
  availableCountryCodes: ytv_arr(ytv_str()),
  avatar: components.thumbnail,
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
}))
export const channelRenderer = ytv_ren(() => ({
  channelId: ytv_str(),
  descriptionSnippet: components.text,
  longBylineText: components.text,
  navigationEndpoint: ytv_enp(),
  ownerBadges: ytv_arr(ytv_ren()),
  shortBylineText: components.text,
  subscribeButton: ytv_ren(),
  subscriberCountText: components.text,
  subscriptionButton: ytv_sch({
    subscribed: ytv_bol()
  }),
  thumbnail: components.thumbnail,
  title: components.text,
  videoCountText: components.text
}))
export const channelThumbnailWithLinkRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  navigationEndpoint: ytv_enp(),
  thumbnail: components.thumbnail
}))
export const channelVideoPlayerRenderer = ytv_ren(() => ({
  description: components.text,
  publishedTimeText: components.text,
  readMoreText: components.text,
  title: components.text,
  videoId: ytv_str(),
  viewCountText: components.text
}))
export const chipCloudChipRenderer = ytv_ren(() => ({
  isSelected: ytv_bol(),
  location: ytv_str(['CHIP_LOCATION_SEARCH_RESULTS']),
  navigationEndpoint: ytv_enp(),
  style: components.style,
  targetId: ytv_str(),
  text: components.text,
  uniqueId: ytv_str(['ATTRIBUTE_FILTER_TYPE_EXPLORE'])
}))
export const chipCloudRenderer = ytv_ren(() => ({
  chips: ytv_arr(ytv_ren()),
  horizontalScrollable: ytv_bol(),
  loggingDirectives: components.loggingDirectives,
  nextButton: ytv_ren(),
  previousButton: ytv_ren(),
  style: ytv_sch({
    backgroundStyle: ytv_str(['CHIP_CLOUD_BACKGROUND_STYLE_UNKNOWN'])
  })
}))
export const cinematicContainerRenderer = ytv_ren(() => ({
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
}))
export const clientSideToggleMenuItemRenderer = ytv_ren(() => ({
  command: ytv_enp(),
  defaultIcon: components.icon,
  defaultText: components.text,
  isToggled: ytv_bol(),
  loggingDirectives: components.loggingDirectives,
  menuItemIdentifier: ytv_str(),
  toggledIcon: components.icon,
  toggledText: components.text
}))
export const clipAdStateRenderer = ytv_ren(() => ({
  body: components.text,
  title: components.text
}))
export const clipCreationRenderer = ytv_ren(() => ({
  adStateOverlay: ytv_ren(),
  cancelButton: ytv_ren(),
  displayName: components.text,
  externalVideoId: ytv_str(),
  publicityLabel: ytv_str(),
  publicityLabelIcon: ytv_str(enums.IconType),
  saveButton: ytv_ren(),
  scrubber: ytv_ren(),
  titleInput: ytv_ren(),
  userAvatar: components.thumbnail
}))
export const clipCreationScrubberRenderer = ytv_ren(() => ({
  defaultLengthMs: ytv_num(),
  durationAccessibility: common.components.accessibility,
  endAccessibility: common.components.accessibility,
  lengthTemplate: ytv_str(),
  maxLengthMs: ytv_num(),
  minLengthMs: ytv_num(),
  startAccessibility: common.components.accessibility,
  windowSizeMs: ytv_num()
}))
export const clipCreationTextInputRenderer = ytv_ren(() => ({
  maxCharacterLimit: ytv_num(),
  placeholderText: components.text
}))
export const clipSectionRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren())
}))
export const collageHeroImageRenderer = ytv_ren(() => ({
  bottomRightThumbnail: components.thumbnail,
  leftThumbnail: components.thumbnail,
  topRightThumbnail: components.thumbnail
}))
export const commentActionButtonsRenderer = ytv_ren(() => ({
  dislikeButton: ytv_ren(),
  likeButton: ytv_ren(),
  replyButton: ytv_ren(),
  shareButton: ytv_ren(),
  style: ytv_str(['COMMENT_ACTION_BUTTON_STYLE_TYPE_DESKTOP_TOOLBAR'])
}))
export const commentRepliesRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren()),
  hideReplies: ytv_ren(),
  hideRepliesIcon: ytv_ren(),
  targetId: ytv_str(),
  viewReplies: ytv_ren(),
  viewRepliesCreatorThumbnail: components.thumbnail,
  viewRepliesIcon: ytv_ren()
}))
export const commentReplyDialogRenderer = ytv_ren(() => ({
  aadcGuidelinesStateEntityKey: ytv_str(),
  authorThumbnail: components.thumbnail,
  cancelButton: ytv_ren(),
  emojiButton: ytv_ren(),
  emojiPicker: ytv_ren(),
  errorMessage: components.text,
  placeholderText: components.text,
  replyButton: ytv_ren()
}))
export const commentSimpleboxRenderer = ytv_ren(() => ({
  aadcGuidelinesStateEntityKey: ytv_str(),
  authorThumbnail: components.thumbnail,
  avatarSize: ytv_str(['SIMPLEBOX_AVATAR_SIZE_TYPE_DEFAULT']),
  cancelButton: ytv_ren(),
  emojiButton: ytv_ren(),
  emojiPicker: ytv_ren(),
  placeholderText: components.text,
  prepareAccountEndpoint: ytv_enp(),
  submitButton: ytv_ren()
}))
export const commentThreadRenderer = ytv_ren(() => ({
  commentViewModel: ytv_ren(),
  isModeratedElqComment: ytv_bol(),
  loggingDirectives: components.loggingDirectives,
  renderingPriority: ytv_str(['RENDERING_PRIORITY_PINNED_COMMENT', 'RENDERING_PRIORITY_UNKNOWN']),
  replies: ytv_ren()
}))
export const commentsEntryPointRenderer = ytv_ren(() => ({
  authorText: components.text,
  authorThumbnail: components.thumbnail,
  commentCount: components.text,
  contentText: components.text,
  headerText: components.text,
  onSelectCommand: ytv_enp()
}))
export const commentsHeaderRenderer = ytv_ren(() => ({
  commentsCount: components.text,
  countText: components.text,
  createRenderer: ytv_ren(),
  customEmojis: ytv_arr(components.emoji),
  loggingDirectives: components.loggingDirectives,
  showSeparator: ytv_bol(),
  sortMenu: ytv_ren(),
  titleText: components.text,
  unicodeEmojisUrl: ytv_str()
}))
export const compactInfocardRenderer = ytv_ren(() => ({
  content: ytv_ren()
}))
export const compactLinkRenderer = ytv_ren(() => ({
  displayId: ytv_str(),
  icon: components.icon,
  navigationEndpoint: ytv_enp(),
  secondaryIcon: components.icon,
  serviceEndpoint: ytv_enp(),
  style: ytv_str(['COMPACT_LINK_STYLE_TYPE_CREATION_MENU']),
  title: components.text
}))
export const compactVideoRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  badges: ytv_arr(ytv_ren()),
  channelThumbnail: components.thumbnail,
  lengthText: components.text,
  longBylineText: components.text,
  menu: ytv_ren(),
  navigationEndpoint: ytv_enp(),
  ownerBadges: ytv_arr(ytv_ren()),
  publishedTimeText: components.text,
  richThumbnail: ytv_ren(),
  shortBylineText: components.text,
  shortViewCountText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  videoId: ytv_str(),
  viewCountText: components.text
}))
export const compositeVideoPrimaryInfoRenderer = ytv_ren(() => ({}))
export const confirmDialogRenderer = ytv_ren(() => ({
  cancelButton: ytv_ren(),
  confirmButton: ytv_ren(),
  dialogMessages: ytv_arr(components.text),
  onClosedActions: ytv_arr(ytv_enp()),
  primaryIsCancel: ytv_bol(),
  title: components.text
}))
export const continuationItemRenderer = ytv_ren(() => ({
  button: ytv_ren(),
  continuationEndpoint: ytv_enp(),
  ghostCards: ytv_ren(),
  loggingDirectives: components.loggingDirectives,
  trigger: ytv_str(['CONTINUATION_TRIGGER_ON_ITEM_SHOWN'])
}))
export const conversationBarRenderer = ytv_ren(() => ({
  availabilityMessage: ytv_ren()
}))
export const copyLinkRenderer = ytv_ren(() => ({
  copyButton: ytv_ren(),
  shortUrl: ytv_str()
}))
export const decoratedPlayerBarRenderer = ytv_ren(() => ({
  playerBar: ytv_ren(),
}))
export const defaultPromoPanelBylineRenderer = ytv_ren(() => ({
  badgeRenderers: ytv_arr(ytv_ren()),
  bylineText: components.text,
  thumbnailDetails: components.thumbnail
}))
export const defaultPromoPanelRenderer = ytv_ren(() => ({
  actionButton: ytv_ren(),
  byline: ytv_ren(),
  description: components.text,
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
  title: components.text
}))
export const desktopTopbarRenderer = ytv_ren(() => ({
  a11ySkipNavigationButton: ytv_ren(),
  backButton: ytv_ren(),
  countryCode: ytv_str(),
  forwardButton: ytv_ren(),
  hotkeyDialog: ytv_ren(),
  logo: ytv_ren(),
  searchbox: ytv_ren(),
  topbarButtons: ytv_arr(ytv_ren()),
  voiceSearchButton: ytv_ren()
}))
export const downloadButtonRenderer = ytv_ren(() => ({
  command: ytv_enp(),
  size: ytv_str(enums.SizeType),
  style: ytv_str(enums.ButtonStyle),
  targetId: ytv_str()
}))
export const downloadQualitySelectorRenderer = ytv_ren(() => ({
  downloadQualityPickerEntityKey: ytv_str(),
  onSubmitEndpoint: ytv_enp()
}))
export const emojiPickerCategoryButtonRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  categoryId: ytv_str(),
  icon: components.icon,
  targetId: ytv_str(),
  tooltip: ytv_str()
}))
export const emojiPickerCategoryRenderer = ytv_ren(() => ({
  categoryId: ytv_str(),
  categoryType: ytv_str(['CATEGORY_TYPE_GLOBAL', 'CATEGORY_TYPE_UNICODE']),
  emojiData: ytv_arr(components.emoji),
  emojiIds: ytv_arr(ytv_str()),
  imageLoadingLazy: ytv_bol(),
  title: components.text,
  usePngImages: ytv_bol()
}))
export const emojiPickerRenderer = ytv_ren(() => ({
  categories: ytv_arr(ytv_ren()),
  categoryButtons: ytv_arr(ytv_ren()),
  clearSearchLabel: ytv_str(),
  id: ytv_str(),
  pickSkinToneText: components.text,
  searchNoResultsText: components.text,
  searchPlaceholderText: components.text,
  skinToneDarkLabel: ytv_str(),
  skinToneGenericLabel: ytv_str(),
  skinToneLightLabel: ytv_str(),
  skinToneMediumDarkLabel: ytv_str(),
  skinToneMediumLabel: ytv_str(),
  skinToneMediumLightLabel: ytv_str()
}))
export const emojiPickerUpsellCategoryRenderer = ytv_ren(() => ({
  categoryId: ytv_str(),
  command: ytv_enp(),
  emojiIds: ytv_arr(ytv_str()),
  emojiTooltip: ytv_str(),
  title: components.text,
  upsell: components.text
}))
export const endScreenPlaylistRenderer = ytv_ren(() => ({
  longBylineText: components.text,
  navigationEndpoint: ytv_enp(),
  playlistId: ytv_str(),
  thumbnail: components.thumbnail,
  title: components.text,
  videoCount: ytv_str(),
  videoCountText: components.text
}))
export const endScreenVideoRenderer = ytv_ren(() => ({
  lengthInSeconds: ytv_num(),
  lengthText: components.text,
  navigationEndpoint: ytv_enp(),
  publishedTimeText: components.text,
  shortBylineText: components.text,
  shortViewCountText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  videoId: ytv_str()
}))
export const endscreenElementRenderer = ytv_ren(() => ({
  aspectRatio: ytv_num(),
  callToAction: components.text,
  dismiss: components.text,
  endMs: ytv_str(),
  endpoint: ytv_enp(),
  hovercardButton: ytv_ren(),
  icon: components.thumbnail,
  id: ytv_str(),
  image: components.thumbnail,
  isSubscribe: ytv_bol(),
  left: ytv_num(),
  metadata: components.text,
  playlistLength: components.text,
  startMs: ytv_str(),
  style: ytv_str(['CHANNEL', 'PLAYLIST', 'VIDEO', 'WEBSITE']),
  subscribersText: components.text,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  top: ytv_num(),
  width: ytv_num()
}))
export const endscreenRenderer = ytv_ren(() => ({
  elements: ytv_arr(ytv_ren()),
  startMs: ytv_str()
}))
export const engagementPanelSectionListRenderer = ytv_ren(() => ({
  content: ytv_ren(),
  continuationService: ytv_str(['ENGAGEMENT_PANEL_CONTINUATION_SERVICE_BROWSE']),
  darkColorPalette: ytv_sch({
    iconActivatedColor: ytv_num(),
    iconDisabledColor: ytv_num(),
    iconInactiveColor: ytv_num(),
    primaryTitleColor: ytv_num(),
    secondaryTitleColor: ytv_num(),
    section1Color: ytv_num(),
    section2Color: ytv_num(),
    section3Color: ytv_num(),
    section4Color: ytv_num()
  }),
  disablePullRefresh: ytv_bol(),
  header: ytv_ren(),
  identifier: components.engagementPanelIdentifier,
  loggingDirectives: components.loggingDirectives,
  onCloseCommand: ytv_enp(),
  onShowCommands: ytv_arr(ytv_enp()),
  panelIdentifier: ytv_str(),
  resizability: ytv_str(['ENGAGEMENT_PANEL_RESIZABILITY_SNAP']),
  size: ytv_str(['ENGAGEMENT_PANEL_SIZE_OPTIMIZED_FOR_CHANNELS']),
  targetId: ytv_str(),
  veType: ytv_num(),
  visibility: ytv_str(enums.EngagementPanelVisibility)
}))
export const engagementPanelTitleHeaderRenderer = ytv_ren(() => ({
  actionButton: ytv_ren(),
  contextualInfo: components.text,
  informationButton: ytv_ren(),
  menu: ytv_ren(),
  navigationButton: ytv_ren(),
  subheader: ytv_ren(),
  subtitle: components.text,
  title: components.text,
  visibilityButton: ytv_ren(),
}))
export const entityMetadataRenderer = ytv_ren(() => ({
  bylines: ytv_arr(ytv_ren()),
  layout: ytv_str(['ENTITY_METADATA_LAYOUT_IMMERSIVE_CAROUSEL']),
  title: components.text
}))
export const expandableMetadataRenderer = ytv_ren(() => ({
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
    collapsedLabel: components.text,
    collapsedThumbnail: components.thumbnail,
    collapsedTitle: components.text,
    expandedTitle: components.text,
    showLeadingCollapsedLabel: ytv_bol()
  }),
  loggingDirectives: components.loggingDirectives,
  useCustomColors: ytv_bol()
}))
export const expandableTabRenderer = ytv_ren(() => ({
  endpoint: ytv_enp(),
  expandedText: ytv_str(),
  selected: ytv_bol(),
  title: ytv_str()
}))
export const expandableVideoDescriptionBodyRenderer = ytv_ren(() => ({
  attributedDescriptionBodyText: textViewModel,
  collapseLoggingData: ytv_ren(),
  descriptionBodyText: components.text,
  expandLoggingData: ytv_ren(),
  headerRuns: ytv_arr(ytv_unk()),
  label: components.text,
  loggingData: ytv_ren(),
  showLessText: components.text,
  showMoreText: components.text
}))
export const expandedShelfContentsRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren())
}))
export const factoidRenderer = ytv_ren(() => ({
  accessibilityText: ytv_str(),
  label: components.text,
  position: ytv_str(['FACTOID_POSITION_LAST']),
  value: components.text
}))
export const fancyDismissibleDialogRenderer = ytv_ren(() => ({
  confirmLabel: components.text,
  dialogMessage: components.text
}))
export const feedFilterChipBarRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren()),
  nextButton: ytv_ren(),
  previousButton: ytv_ren(),
  styleType: ytv_str(['FEED_FILTER_CHIP_BAR_STYLE_TYPE_DEFAULT'])
}))
export const feedNudgeRenderer = ytv_ren(() => ({
  applyModernizedStyle: ytv_bol(),
  backgroundStyle: ytv_str(['FEED_NUDGE_BACKGROUND_STYLE_ACCENT_GRADIENT', 'FEED_NUDGE_BACKGROUND_STYLE_UNKNOWN']),
  contentsLocation: ytv_str(['FEED_NUDGE_CONTENTS_LOCATION_LEFT', 'FEED_NUDGE_CONTENTS_LOCATION_UNKNOWN']),
  disableDropShadow: ytv_bol(),
  enableHorizontalButtons: ytv_bol(),
  impressionEndpoint: ytv_enp(),
  primaryButton: ytv_ren(),
  style: ytv_str(['FEED_NUDGE_STYLE_BUTTONS']),
  subtitle: components.text,
  title: components.text,
  trimStyle: ytv_str(['FEED_NUDGE_TRIM_STYLE_NO_TRIM'])
}))
export const feedTabbedHeaderRenderer = ytv_ren(() => ({
  title: components.text
}))
export const fusionSearchboxRenderer = ytv_ren(() => ({
  clearButton: ytv_ren(),
  config: ytv_sch({
    webSearchboxConfig: ytv_sch({
      focusSearchbox: ytv_bol(),
      hasOnscreenKeyboard: ytv_bol(),
      requestDomain: ytv_str(),
      requestLanguage: ytv_str()
    })
  }),
  icon: components.icon,
  placeholderText: components.text,
  searchEndpoint: ytv_enp()
}))
export const ghostGridRenderer = ytv_ren(() => ({
  rows: ytv_num()
}))
export const gridChannelRenderer = ytv_ren(() => ({
  channelId: ytv_str(),
  navigationEndpoint: ytv_enp(),
  ownerBadges: ytv_arr(ytv_ren()),
  subscribeButton: ytv_ren(),
  subscriberCountText: components.text,
  thumbnail: components.thumbnail,
  title: components.text,
  videoCountText: components.text
}))
export const gridRenderer = ytv_ren(() => ({
  isCollapsible: ytv_bol(),
  items: ytv_arr(ytv_ren()),
  targetId: ytv_str()
}))
export const gridVideoRenderer = ytv_ren(() => ({
  badges: ytv_arr(ytv_ren()),
  menu: ytv_ren(),
  navigationEndpoint: ytv_enp(),
  offlineability: ytv_ren(),
  ownerBadges: ytv_arr(ytv_ren()),
  publishedTimeText: components.text,
  richThumbnail: ytv_ren(),
  shortBylineText: components.text,
  shortViewCountText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  upcomingEventData: ytv_sch({
    isReminderSet: ytv_bol(),
    startTime: ytv_str(),
    upcomingEventText: components.text
  }),
  videoId: ytv_str(),
  viewCountText: components.text
}))
export const guideAccountEntryRenderer = ytv_ren(() => ({
  hasUnlimitedEntitlement: ytv_bol(),
  navigationEndpoint: ytv_enp(),
  thumbnail: components.thumbnail,
  title: components.text
}))
export const guideCollapsibleEntryRenderer = ytv_ren(() => ({
  collapserItem: ytv_ren(),
  expandableItems: ytv_arr(ytv_ren()),
  expanderItem: ytv_ren(),
}))
export const guideCollapsibleSectionEntryRenderer = ytv_ren(() => ({
  collapserIcon: components.icon,
  expanderIcon: components.icon,
  headerEntry: ytv_ren(),
  sectionItems: ytv_arr(ytv_ren())
}))
export const guideDownloadsEntryRenderer = ytv_ren(() => ({
  alwaysShow: ytv_bol(),
  entryRenderer: ytv_ren()
}))
export const guideEntryRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  badges: ytv_sch({
    liveBroadcasting: ytv_bol()
  }),
  entryData: ytv_sch({
    guideEntryData: ytv_sch({
      guideEntryId: ytv_str()
    })
  }),
  formattedTitle: components.text,
  icon: components.icon,
  isPrimary: ytv_bol(),
  navigationEndpoint: ytv_enp(),
  presentationStyle: ytv_str(['GUIDE_ENTRY_PRESENTATION_STYLE_NEW_CONTENT', 'GUIDE_ENTRY_PRESENTATION_STYLE_NONE']),
  serviceEndpoint: ytv_enp(),
  targetId: ytv_str(),
  thumbnail: components.thumbnail
}))
export const guideSectionRenderer = ytv_ren(() => ({
  formattedTitle: components.text,
  items: ytv_arr(ytv_ren())
}))
export const guideSigninPromoRenderer = ytv_ren(() => ({
  actionText: components.text,
  descriptiveText: components.text,
  signInButton: ytv_ren()
}))
export const guideSubscriptionsSectionRenderer = ytv_ren(() => ({
  formattedTitle: components.text,
  handlerDatas: ytv_arr(ytv_str(['GUIDE_ACTION_ADD_TO_SUBSCRIPTIONS', 'GUIDE_ACTION_REMOVE_FROM_SUBSCRIPTIONS'])),
  items: ytv_arr(ytv_ren()),
  sort: ytv_str(['CHANNEL_ALPHABETICAL'])
}))
export const hintRenderer = ytv_ren(() => ({
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
}))
export const horizontalCardListRenderer = ytv_ren(() => ({
  cards: ytv_arr(ytv_ren()),
  footerButton: ytv_ren(),
  header: ytv_ren(),
  nextButton: ytv_ren(),
  previousButton: ytv_ren(),
  style: ytv_sch({
    type: ytv_str(['HORIZONTAL_CARD_LIST_STYLE_TYPE_ENGAGEMENT_PANEL_SECTION'])
  })
}))
export const horizontalListRenderer = ytv_ren(() => ({
  collapsedItemCount: ytv_num(),
  continuations: ytv_arr(components.continuation),
  itemSizeConstraint: ytv_str(['LIST_ITEM_SIZE_CONSTRAINT_EQUAL_HEIGHT']),
  items: ytv_arr(ytv_ren()),
  nextButton: ytv_ren(),
  previousButton: ytv_ren(),
  selectedIndex: ytv_num(),
  visibleItemCount: ytv_num()
}))
export const hotkeyDialogRenderer = ytv_ren(() => ({
  dismissButton: ytv_ren(),
  sections: ytv_arr(ytv_ren()),
  title: components.text
}))
export const hotkeyDialogSectionRenderer = ytv_ren(() => ({
  options: ytv_arr(ytv_ren()),
  title: components.text
}))
export const hotkeyDialogSectionOptionRenderer = ytv_ren(() => ({
  badge: ytv_ren(),
  hotkey: ytv_str(),
  hotkeyAccessibilityLabel: common.components.accessibility,
  label: components.text
}))
export const inFeedAdLayoutRenderer = ytv_ren(() => ({
  adLayoutMetadata: components.adLayoutMetadata,
  renderingContent: ytv_ren()
}))
export const inPlayerAdLayoutRenderer = ytv_ren(() => ({
  adLayoutMetadata: components.adLayoutMetadata,
  layoutExitNormalTriggers: ytv_arr(ytv_sch({
    id: ytv_str(),
    layoutIdExitedTrigger: ytv_sch({
      triggeringLayoutId: ytv_str()
    })
  })),
  renderingContent: ytv_ren()
}))
export const infoCardIconRenderer = ytv_ren(() => ({}))
export const inlinePlaybackRenderer = ytv_ren(() => ({
  inlinePlaybackEndpoint: ytv_enp(),
  navigationEndpoint: ytv_enp(),
  thumbnail: components.thumbnail,
  videoId: ytv_str()
}))
export const instreamVideoAdRenderer = ytv_ren(() => ({
  adLayoutLoggingData: components.adLayoutLoggingData,
  clickthroughEndpoint: ytv_enp(),
  csiParameters: ytv_arr(ytv_sch({
    key: ytv_str(),
    value: ytv_str()
  })),
  elementId: ytv_str(),
  externalVideoId: ytv_str(),
  layoutId: ytv_str(),
  legacyInfoCardVastExtension: ytv_str(),
  pings: components.videoAdPings,
  playerVars: ytv_str(),
  skipOffsetMilliseconds: ytv_num(),
  sodarExtensionData: ytv_sch({
    bgp: ytv_str(),
    bgub: ytv_str(),
    scs: ytv_str(),
    siub: ytv_str(),
    upb: ytv_str()
  })
}))
export const itemSectionHeaderRenderer = ytv_ren(() => ({
  title: components.text
}))
export const itemSectionRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren()),
  continuations: ytv_arr(components.continuation),
  header: ytv_ren(),
  sectionIdentifier: ytv_str(),
  selectedIndex: ytv_num(),
  targetId: ytv_str()
}))
export const likeButtonRenderer = ytv_ren(() => ({
  dislikeCountText: components.text,
  dislikeCountTooltipText: components.text,
  dislikeCountWithDislikeText: components.text,
  dislikeCountWithUndislikeText: components.text,
  dislikeNavigationEndpoint: ytv_enp(),
  hideDislikeButton: ytv_bol(),
  likeCommand: ytv_enp(),
  likeCount: ytv_num(),
  likeCountText: components.text,
  likeCountTooltipText: components.text,
  likeCountWithLikeText: components.text,
  likeCountWithUnlikeText: components.text,
  likeStatus: ytv_str(common.enums.LikeStatus),
  likeStatusEntityKey: ytv_str(),
  likesAllowed: ytv_bol(),
  serviceEndpoints: ytv_arr(ytv_enp()),
  target: ytv_sch({
    playlistId: ytv_str(),
    videoId: ytv_str()
  })
}))
export const lineItemRenderer = ytv_ren(() => ({
  badge: ytv_ren(),
  text: components.text
}))
export const lineRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren()),
  wrap: ytv_bol()
}))
export const linkPhoneWithTvCodeRenderer = ytv_ren(() => ({
  summary: components.text,
  title: components.text
}))
export const linkPhoneWithWiFiRenderer = ytv_ren(() => ({
  summary: components.text,
  title: components.text
}))
export const liveChatAuthorBadgeRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  customThumbnail: components.thumbnail,
  icon: components.icon,
  tooltip: ytv_str()
}))
export const liveChatBannerHeaderRenderer = ytv_ren(() => ({
  contextMenuButton: ytv_ren(),
  contextMenuEndpoint: ytv_enp(),
  icon: components.icon,
  text: components.text
}))
export const liveChatBannerPollRenderer = ytv_ren(() => ({
  authorPhoto: components.thumbnail,
  collapsedStateEntityKey: ytv_str(),
  contextMenuButton: ytv_ren(),
  contextMenuEndpoint: ytv_enp(),
  liveChatPollStateEntityKey: ytv_str(),
  pollChoices: ytv_arr(ytv_sch({
    pollOptionId: ytv_num(),
    text: components.text
  })),
  pollQuestion: components.text
}))
export const liveChatBannerRenderer = ytv_ren(() => ({
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
}))
export const liveChatDialogRenderer = ytv_ren(() => ({
  confirmButton: ytv_ren(),
  dialogMessages: ytv_arr(components.text),
  title: components.text
}))
export const liveChatEngagementPanelRenderer = ytv_ren(() => ({
  engagementPanelSupportedRenderers: ytv_ren()
}))
export const liveChatHeaderRenderer = ytv_ren(() => ({
  collapseButton: ytv_ren(),
  overflowMenu: ytv_ren(),
  viewSelector: ytv_ren(),
  viewerLeaderboardEntryPoint: ytv_ren()
}))
export const liveChatIconToggleButtonRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  activeTooltip: ytv_str(),
  icon: components.icon,
  targetId: ytv_str(),
  toggledIcon: components.icon,
  tooltip: ytv_str()
}))
export const liveChatItemListRenderer = ytv_ren(() => ({
  enablePauseChatKeyboardShortcuts: ytv_bol(),
  maxItemsToDisplay: ytv_num(),
  moreCommentsBelowButton: ytv_ren(),
  targetId: ytv_str()
}))
export const liveChatMembershipItemRenderer = ytv_ren(() => ({
  authorBadges: ytv_arr(ytv_ren()),
  authorExternalChannelId: ytv_str(),
  authorName: components.text,
  authorPhoto: components.thumbnail,
  contextMenuAccessibility: common.components.accessibility,
  contextMenuEndpoint: ytv_enp(),
  headerPrimaryText: components.text,
  headerSubtext: components.text,
  id: ytv_str(),
  message: components.text,
  timestampText: components.text,
  timestampUsec: ytv_str()
}))
export const liveChatMessageInputRenderer = ytv_ren(() => ({
  authorName: components.text,
  authorPhoto: components.thumbnail,
  emojiPickerButton: ytv_ren(),
  inputField: ytv_ren(),
  pickerButtons: ytv_arr(ytv_ren()),
  pickers: ytv_arr(ytv_ren()),
  sendButton: ytv_ren(),
  targetId: ytv_str()
}))
export const liveChatPaidMessageRenderer = ytv_ren(() => ({
  authorBadges: ytv_arr(ytv_ren()),
  authorExternalChannelId: ytv_str(),
  authorName: components.text,
  authorNameTextColor: ytv_num(),
  authorPhoto: components.thumbnail,
  bodyBackgroundColor: ytv_num(),
  bodyTextColor: ytv_num(),
  buyButton: ytv_ren(),
  contextMenuAccessibility: common.components.accessibility,
  contextMenuEndpoint: ytv_enp(),
  creatorHeartButton: ytv_ren(),
  headerBackgroundColor: ytv_num(),
  headerTextColor: ytv_num(),
  id: ytv_str(),
  isV2Style: ytv_bol(),
  leaderboardBadge: ytv_ren(),
  message: components.text,
  pdgLikeButton: ytv_ren(),
  purchaseAmountText: components.text,
  replyButton: ytv_ren(),
  textInputBackgroundColor: ytv_num(),
  timestampColor: ytv_num(),
  timestampText: components.text,
  timestampUsec: ytv_str()
}))
export const liveChatParticipantRenderer = ytv_ren(() => ({
  authorBadges: ytv_arr(ytv_ren()),
  authorName: components.text,
  authorPhoto: components.thumbnail
}))
export const liveChatParticipantsListRenderer = ytv_ren(() => ({
  backButton: ytv_ren(),
  participants: ytv_arr(ytv_ren()),
  title: components.text
}))
export const liveChatPlaceholderItemRenderer = ytv_ren(() => ({
  id: ytv_str(),
  timestampUsec: ytv_str()
}))
export const liveChatRenderer = ytv_ren(() => ({
  actionPanel: ytv_ren(),
  actions: ytv_arr(ytv_enp()),
  clientMessages: ytv_sch({
    fatalError: components.text,
    genericError: components.text,
    reconnectMessage: components.text,
    reconnectedMessage: components.text,
    unableToReconnectMessage: components.text
  }),
  continuations: ytv_arr(components.continuation),
  creatorGoalEntityKey: ytv_str(),
  emojis: ytv_arr(components.emoji),
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
}))
export const liveChatSponsorshipsGiftPurchaseAnnouncementRenderer = ytv_ren(() => ({
  authorExternalChannelId: ytv_str(),
  header: ytv_ren(),
  id: ytv_str(),
  optInPrompt: ytv_ren(),
  timestampUsec: ytv_str()
}))
export const liveChatSponsorshipsGiftRedemptionAnnouncementRenderer = ytv_ren(() => ({
  authorBadges: ytv_arr(ytv_ren()),
  authorExternalChannelId: ytv_str(),
  authorName: components.text,
  authorPhoto: components.thumbnail,
  contextMenuAccessibility: common.components.accessibility,
  contextMenuEndpoint: ytv_enp(),
  id: ytv_str(),
  message: components.text,
  timestampText: components.text,
  timestampUsec: ytv_str()
}))
export const liveChatSponsorshipsHeaderRenderer = ytv_ren(() => ({
  authorBadges: ytv_arr(ytv_ren()),
  authorName: components.text,
  authorPhoto: components.thumbnail,
  contextMenuAccessibility: common.components.accessibility,
  contextMenuEndpoint: ytv_enp(),
  image: components.thumbnail,
  primaryText: components.text
}))
export const liveChatTextInputFieldRenderer = ytv_ren(() => ({
  emojiCharacterCount: ytv_num(),
  maxCharacterLimit: ytv_num(),
  placeholder: components.text,
  unselectedPlaceholder: components.text
}))
export const liveChatTextMessageRenderer = ytv_ren(() => ({
  authorBadges: ytv_arr(ytv_ren()),
  authorExternalChannelId: ytv_str(),
  authorName: components.text,
  authorPhoto: components.thumbnail,
  beforeContentButtons: ytv_arr(ytv_ren()),
  contextMenuAccessibility: common.components.accessibility,
  contextMenuEndpoint: ytv_enp(),
  id: ytv_str(),
  message: components.text,
  timestampText: components.text,
  timestampUsec: ytv_str()
}))
export const liveChatTickerPaidMessageItemRenderer = ytv_ren(() => ({
  amountTextColor: ytv_num(),
  animationOrigin: ytv_str(['ANIMATION_ORIGIN_PDG_TICKER_LIKE']),
  authorExternalChannelId: ytv_str(),
  authorPhoto: components.thumbnail,
  authorUsername: components.text,
  durationSec: ytv_num(),
  dynamicStateData: ytv_sch({
    emptyStateText: textViewModel,
    engagementStateEntityKey: ytv_str(),
    likeCountEntityKey: ytv_str(),
    likeIcon: components.icon,
    likedIcon: components.icon,
    likesEmptyStateText: textViewModel,
    replyCountEntityKey: ytv_str(),
    replyIcon: components.icon,
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
}))
export const liveChatTickerRenderer = ytv_ren(() => ({
  sentinel: ytv_bol()
}))
export const liveChatTickerSponsorItemRenderer = ytv_ren(() => ({
  authorExternalChannelId: ytv_str(),
  detailIcon: components.icon,
  detailText: components.text,
  detailTextColor: ytv_num(),
  durationSec: ytv_num(),
  endBackgroundColor: ytv_num(),
  fullDurationSec: ytv_num(),
  id: ytv_str(),
  showItemEndpoint: ytv_enp(),
  sponsorPhoto: components.thumbnail,
  startBackgroundColor: ytv_num()
}))
export const liveChatViewerEngagementMessageRenderer = ytv_ren(() => ({
  actionButton: ytv_ren(),
  icon: components.icon,
  id: ytv_str(),
  message: components.text,
  timestampUsec: ytv_str()
}))
export const liveStreamOfflineSlateRenderer = ytv_ren(() => ({
  actionButtons: ytv_arr(ytv_ren()),
  canShowCountdown: ytv_bol(),
  mainText: components.text,
  offlineSlateStyle: ytv_str(['OFFLINE_SLATE_STYLE_ABSTRACT']),
  scheduledStartTime: ytv_str(),
  subtitleText: components.text,
  thumbnail: components.thumbnail
}))
export const liveStreamabilityRenderer = ytv_ren(() => ({
  broadcastId: ytv_str(),
  creatorRedirect: ytv_sch({
    hideAutoplayToggle: ytv_bol()
  }),
  displayEndscreen: ytv_bol(),
  offlineSlate: ytv_ren(),
  pollDelayMs: ytv_str(),
  videoId: ytv_str()
}))
export const macroMarkersInfoItemRenderer = ytv_ren(() => ({
  infoText: components.text,
  menu: ytv_ren()
}))
export const macroMarkersListItemRenderer = ytv_ren(() => ({
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
  thumbnail: components.thumbnail,
  timeDescription: components.text,
  timeDescriptionA11yLabel: ytv_str(),
  title: components.text
}))
export const macroMarkersListRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren()),
  syncButtonLabel: components.text,
  syncModelEntityKey: ytv_str()
}))
export const markerRenderer = ytv_ren(() => ({
  timeRangeStartMillis: ytv_num(),
  title: components.text
}))
export const mealbarPromoRenderer = ytv_ren(() => ({
  actionButton: ytv_ren(),
  dismissButton: ytv_ren(),
  icon: components.thumbnail,
  impressionEndpoints: ytv_arr(ytv_enp()),
  isVisible: ytv_bol(),
  messageTexts: ytv_arr(components.text),
  messageTitle: components.text,
  style: ytv_str(['STYLE_MESSAGE']),
  triggerCondition: ytv_str(['TRIGGER_CONDITION_POST_AD'])
}))
export const mediaLockupRenderer = ytv_ren(() => ({
  disableEndpoint: ytv_bol(),
  endpoint: ytv_enp(),
  enableSubtitleLaunchIcon: ytv_bol(),
  maxLinesSubtitle: ytv_num(),
  maxLinesTitle: ytv_num(),
  subtitle: components.text,
  thumbnailDetails: components.thumbnail,
  title: components.text,
  uiTweaks: ytv_sch({
    thumbnailHeight: ytv_num(),
    thumbnailWidth: ytv_num(),
    useZeroPadding: ytv_bol()
  })
}))
export const menuFlexibleItemRenderer = ytv_ren(() => ({
  menuItem: ytv_ren(),
  topLevelButton: ytv_ren()
}))
export const menuNavigationItemRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  icon: components.icon,
  navigationEndpoint: ytv_enp(),
  text: components.text
}))
export const menuPopupRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren())
}))
export const menuRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  disabledCommand: ytv_enp(),
  flexibleItems: ytv_arr(ytv_ren()),
  isDisabled: ytv_bol(),
  items: ytv_arr(ytv_ren()),
  loggingDirectives: components.loggingDirectives,
  menuPopupAccessibility: common.components.accessibilityData,
  targetId: ytv_str(),
  topLevelButtons: ytv_arr(ytv_ren())
}))
export const menuServiceItemRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  hasSeparator: ytv_bol(),
  icon: components.icon,
  isDisabled: ytv_bol(),
  isSelected: ytv_bol(),
  serviceEndpoint: ytv_enp(),
  text: components.text
}))
export const menuServiceItemDownloadRenderer = ytv_ren(() => ({
  serviceEndpoint: ytv_enp()
}))
export const merchandiseItemRenderer = ytv_ren(() => ({
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
  thumbnail: components.thumbnail,
  title: ytv_str(),
  vendorName: ytv_str()
}))
export const merchandiseShelfRenderer = ytv_ren(() => ({
  actionButton: ytv_ren(),
  hideText: ytv_str(),
  items: ytv_arr(ytv_ren()),
  shelfType: ytv_str(['MERCHANDISE_SHELF_TYPE_DEFAULT']),
  showText: ytv_str(),
  title: ytv_str()
}))
export const messageRenderer = ytv_ren(() => ({
  button: ytv_ren(),
  text: components.text
}))
export const metadataBadgeRenderer = ytv_ren(() => ({
  accessibilityData: common.components.accessibilityData,
  icon: components.icon,
  iconSourceUrl: ytv_str(),
  label: ytv_str(),
  style: ytv_str(['BADGE_STYLE_TYPE_SIMPLE', 'BADGE_STYLE_TYPE_LIVE_NOW', 'BADGE_STYLE_TYPE_MEMBERS_ONLY', 'BADGE_STYLE_TYPE_VERIFIED', 'BADGE_STYLE_TYPE_VERIFIED_ARTIST']),
  tooltip: ytv_str()
}))
export const metadataRowContainerRenderer = ytv_ren(() => ({
  collapsedItemCount: ytv_num(),
  rows: ytv_arr(ytv_ren())
}))
export const metadataRowRenderer = ytv_ren(() => ({
  contents: ytv_arr(components.text),
  title: components.text
}))
export const microformatDataRenderer = ytv_ren(() => ({
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
  thumbnail: components.thumbnail,
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
}))
export const miniplayerRenderer = ytv_ren(() => ({
  enableStashedPlayback: ytv_bol(),
  playbackMode: ytv_str(['PLAYBACK_MODE_ALLOW', 'PLAYBACK_MODE_PAUSED_ONLY'])
}))
export const modalWithTitleAndButtonRenderer = ytv_ren(() => ({
  button: ytv_ren(),
  content: components.text,
  title: components.text
}))
export const movingThumbnailRenderer = ytv_ren(() => ({
  enableHoveredLogging: ytv_bol(),
  enableOverlay: ytv_bol(),
  movingThumbnailDetails: components.thumbnail
}))
export const multiMarkersPlayerBarRenderer = ytv_ren(() => ({
  markersMap: ytv_arr(ytv_sch({
    key: ytv_str(),
    value: ytv_ren({
      markers: ytv_arr(ytv_ren())
    })
  })),
  visibleOnLoad: ytv_sch({
    key: ytv_str()
  })
}))
export const multiPageMenuRenderer = ytv_ren(() => ({
  sections: ytv_arr(ytv_ren()),
  showLoadingSpinner: ytv_bol(),
  style: ytv_str(['MULTI_PAGE_MENU_STYLE_TYPE_ACCOUNT', 'MULTI_PAGE_MENU_STYLE_TYPE_CREATION', 'MULTI_PAGE_MENU_STYLE_TYPE_NOTIFICATIONS', 'MULTI_PAGE_MENU_STYLE_TYPE_SYSTEM'])
}))
export const multiPageMenuSectionRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren())
}))
export const musicWatchMetadataRenderer = ytv_ren(() => ({
  accessibilityText: ytv_str(),
  blurredBackgroundThumbnail: components.thumbnail,
  byline: components.text,
  darkColorPalette: ytv_sch({
    iconActivatedColor: ytv_num(),
    iconInactiveColor: ytv_num(),
    primaryTitleColor: ytv_num(),
    secondaryTitleColor: ytv_num(),
    section1Color: ytv_num(),
    section2Color: ytv_num(),
    section3Color: ytv_num(),
    surgeColor: ytv_num()
  }),
  dateText: components.text,
  educationText: components.text,
  featuredMetadata: ytv_arr(ytv_ren()),
  mayTruncateChannelName: ytv_bol(),
  onClickCommand: ytv_enp(),
  publishedTime: components.text,
  secondaryTitle: components.text,
  title: components.text,
  viewCountText: components.text
}))
export const notificationActionRenderer = ytv_ren(() => ({
  actionButton: ytv_ren(),
  closeActionButton: ytv_ren(),
  responseText: components.text
}))
export const notificationMultiActionRenderer = ytv_ren(() => ({
  buttons: ytv_arr(ytv_ren()),
  dismissalViewStyle: ytv_str(['DISMISSAL_VIEW_STYLE_COMPACT_TALL']),
  responseText: components.text
}))
export const notificationTextRenderer = ytv_ren(() => ({
  successResponseText: components.text,
  undoEndpoint: ytv_enp(),
  undoText: components.text
}))
export const notificationTopbarButtonRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  handlerDatas: ytv_arr(ytv_str(['NOTIFICATION_ACTION_UPDATE_UNSEEN_COUNT'])),
  icon: components.icon,
  menuRequest: ytv_enp(),
  notificationCount: ytv_num(),
  style: ytv_str(['NOTIFICATION_BUTTON_STYLE_TYPE_DEFAULT']),
  tooltip: ytv_str(),
  updateUnseenCountEndpoint: ytv_enp()
}))
export const offlineabilityRenderer = ytv_ren(() => ({
  addToOfflineButtonState: ytv_str(enums.AddToOfflineButtonState),
  contentCheckOk: ytv_bol(),
  key: ytv_str(),
  loggingDirectives: components.loggingDirectives,
  offlineabilityRenderer: ytv_str(),
  offlineable: ytv_bol(),
  racyCheckOk: ytv_bol()
}))
export const overlayMessageRenderer = ytv_ren(() => ({
  label: components.text,
  style: ytv_str(['OVERLAY_MESSAGE_STYLE_NUMBERED_SENTENCE']),
  subtitle: components.text,
  title: components.text
}))
export const overlayPanelHeaderRenderer = ytv_ren(() => ({
  content: ytv_arr(ytv_ren()),
  image: components.thumbnail,
  style: ytv_str(['OVERLAY_PANEL_HEADER_STYLE_CIRCULAR_THUMBNAIL']),
  subtitle: components.text,
  title: components.text
}))
export const overlayPanelItemListRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren()),
  selectedIndex: ytv_num()
}))
export const overlayPanelRenderer = ytv_ren(() => ({
  content: ytv_ren(),
  header: ytv_ren()
}))
export const overlaySectionRenderer = ytv_ren(() => ({
  dismissalCommand: ytv_enp(),
  overlay: ytv_ren()
}))
export const overlayToastRenderer = ytv_ren(() => ({
  icon: components.icon,
  image: components.thumbnail,
  showImmediately: ytv_bol(),
  subtitle: components.text,
  title: components.text,
  turnOffAriaLive: ytv_bol()
}))
export const overlayTwoPanelRenderer = ytv_ren(() => ({
  actionPanel: ytv_ren(),
  backButton: ytv_ren()
}))
export const pageHeaderRenderer = ytv_ren(() => ({
  content: ytv_ren(),
  pageTitle: ytv_str()
}))
export const paidContentOverlayRenderer = ytv_ren(() => ({
  durationMs: ytv_str(),
  icon: components.icon,
  navigationEndpoint: ytv_enp(),
  showInPip: ytv_bol(),
  text: components.text
}))
export const pdgCommentChipRenderer = ytv_ren(() => ({
  chipColorPalette: ytv_sch({
    backgroundColor: ytv_num(),
    foregroundTitleColor: ytv_num()
  }),
  chipIcon: components.icon,
  chipText: components.text,
  command: ytv_enp(),
  loggingDirectives: components.loggingDirectives
}))
export const pivotVideoRenderer = ytv_ren(() => ({
  lengthText: components.text,
  navigationEndpoint: ytv_enp(),
  overlayIcon: components.icon,
  overlayLabel: components.text,
  shortBylineText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  videoId: ytv_str(),
  viewCountText: components.text
}))
export const playerAnnotationsExpandedRenderer = ytv_ren(() => ({
  allowSwipeDismiss: ytv_bol(),
  annotationId: ytv_str(),
  featuredChannel: ytv_ren({
    channelName: ytv_str(),
    endTimeMs: ytv_str(),
    navigationEndpoint: ytv_enp(),
    startTimeMs: ytv_str(),
    subscribeButton: ytv_ren(),
    watermark: components.thumbnail
  })
}))
export const playerAttestationRenderer = ytv_ren(() => ({
  botguardData: ytv_sch({
    interpreterSafeUrl: ytv_sch({
      privateDoNotAccessOrElseTrustedResourceUrlWrappedValue: ytv_str()
    }),
    program: ytv_str(),
    serverEnvironment: ytv_num()
  }),
  challenge: ytv_str()
}))
export const playerBytesAdLayoutRenderer = ytv_ren(() => ({
  adLayoutMetadata: components.adLayoutMetadata,
  layoutExitMuteTriggers: ytv_arr(ytv_sch({
    id: ytv_str(),
    skipRequestedTrigger: ytv_sch({
      triggeringLayoutId: ytv_str()
    })
  })),
  layoutExitNormalTriggers: ytv_arr(ytv_unk()),
  layoutExitSkipTriggers: ytv_arr(ytv_unk()),
  renderingContent: ytv_ren()
}))
export const playerBytesSequenceItemAdLayoutRenderer = ytv_ren(() => ({
  adLayoutMetadata: components.adLayoutMetadata,
  renderingContent: ytv_ren(),
  layoutExitNormalTriggers: ytv_arr(ytv_unk())
}))
export const playerBytesSequentialLayoutRenderer = ytv_ren(() => ({
  sequentialLayouts: ytv_arr(ytv_ren())
}))
export const playerCaptionsTracklistRenderer = ytv_ren(() => ({
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
    name: components.text,
    rtl: ytv_bol(),
    trackName: ytv_str(),
    vssId: ytv_str()
  })),
  defaultAudioTrackIndex: ytv_num(),
  translationLanguages: ytv_arr(ytv_sch({
    languageCode: ytv_str(),
    languageName: components.text
  }))
}))
export const playerErrorCommandRenderer = ytv_ren(() => ({
  command: ytv_enp()
}))
export const playerErrorMessageRenderer = ytv_ren(() => ({
  icon: components.icon,
  proceedButton: ytv_ren(),
  reason: components.text,
  subreason: components.text,
  thumbnail: components.thumbnail
}))
export const playerLegacyDesktopWatchAdsRenderer = ytv_ren(() => ({
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
}))
export const playerLiveStoryboardSpecRenderer = ytv_ren(() => ({
  spec: ytv_str()
}))
export const playerMicroformatRenderer = ytv_ren(() => ({
  availableCountries: ytv_arr(ytv_str()),
  canonicalUrl: ytv_str(),
  category: ytv_str(),
  description: components.text,
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
  thumbnail: components.thumbnail,
  title: components.text,
  uploadDate: ytv_str(),
  viewCount: ytv_str()
}))
export const playerOverlayAutoplayRenderer = ytv_ren(() => ({
  background: components.thumbnail,
  byline: components.text,
  cancelButton: ytv_ren(),
  closeButton: ytv_ren(),
  countDownSecs: ytv_num(),
  countDownSecsForFullscreen: ytv_num(),
  nextButton: ytv_ren(),
  pauseText: components.text,
  preferImmediateRedirect: ytv_bol(),
  publishedTimeText: components.text,
  shortViewCountText: components.text,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  videoId: ytv_str(),
  videoTitle: components.text,
  webShowBigThumbnailEndscreen: ytv_bol(),
  webShowNewAutonavCountdown: ytv_bol()
}))
export const playerOverlayLayoutRenderer = ytv_ren(() => ({
  adBadgeRenderer: ytv_ren(),
  adDurationRemaining: ytv_ren(),
  adInfoRenderer: ytv_ren(),
  adLayoutLoggingData: components.adLayoutLoggingData,
  adPodIndex: ytv_ren(),
  inPlayerLayoutId: ytv_str(),
  interaction: components.adInteraction,
  layoutId: ytv_str(),
  loggingDirectives: components.loggingDirectives,
  playerAdCard: ytv_ren(),
  skipOrPreview: ytv_ren(),
  visitAdvertiserLink: ytv_ren()
}))
export const playerOverlayRenderer = ytv_ren(() => ({
  addToMenu: ytv_ren(),
  autonavToggle: ytv_ren(),
  autoplay: ytv_ren(),
  decoratedPlayerBarRenderer: ytv_ren(),
  endScreen: ytv_ren(),
  isAutoplayEnabled: ytv_bol(),
  productsInVideoOverlayRenderer: ytv_ren(),
  replay: ytv_ren(),
  shareButton: ytv_ren(),
  showShareButtonFullscreen: ytv_bol(),
  showShareButtonSmallscreen: ytv_bol(),
  speedmasterUserEdu: ytv_ren(),
  timelyActionsOverlayViewModel: ytv_ren(),
  videoDetails: ytv_ren()
}))
export const playerOverlayReplayRenderer = ytv_ren(() => ({
  background: components.thumbnail,
  navigationEndpoint: ytv_enp(),
  overlayIcon: components.icon,
  overlayLabel: components.text,
  shortBylineText: components.text,
  title: components.text
}))
export const playerOverlayVideoDetailsRenderer = ytv_ren(() => ({
  subtitle: components.text,
  title: components.text
}))
export const playerStoryboardSpecRenderer = ytv_ren(() => ({
  highResolutionRecommendedLevel: ytv_num(),
  recommendedLevel: ytv_num(),
  spec: ytv_str()
}))
export const playlistLoopButtonRenderer = ytv_ren(() => ({
  currentState: ytv_str(['PLAYLIST_LOOP_STATE_ALL', 'PLAYLIST_LOOP_STATE_NONE', 'PLAYLIST_LOOP_STATE_ONE']),
  loggingDirectives: components.loggingDirectives,
  playlistLoopStateEntityKey: ytv_str(),
  states: ytv_arr(ytv_ren())
}))
export const playlistLoopButtonStateRenderer = ytv_ren(() => ({
  button: ytv_ren(),
  state: ytv_str(['PLAYLIST_LOOP_STATE_ALL', 'PLAYLIST_LOOP_STATE_NONE', 'PLAYLIST_LOOP_STATE_ONE'])
}))
export const playlistPanelVideoRenderer = ytv_ren(() => ({
  actionButtons: ytv_arr(ytv_ren()),
  darkColorPalette: ytv_sch({
    primaryTitleColor: ytv_num(),
    secondaryTitleColor: ytv_num(),
    section2Color: ytv_num(),
    section4Color: ytv_num()
  }),
  indexText: components.text,
  lengthText: components.text,
  lightColorPalette: ytv_sch({
    primaryTitleColor: ytv_num(),
    secondaryTitleColor: ytv_num(),
    section2Color: ytv_num(),
    section4Color: ytv_num()
  }),
  longBylineText: components.text,
  menu: ytv_ren(),
  navigationEndpoint: ytv_enp(),
  playlistSetVideoId: ytv_str(),
  selected: ytv_bol(),
  shortBylineText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  videoId: ytv_str()
}))
export const playlistPanelVideoWrapperRenderer = ytv_ren(() => ({
  counterpart: ytv_arr(ytv_sch({
    counterpartRenderer: ytv_ren()
  })),
  primaryRenderer: ytv_ren()
}))
export const playlistSidebarPrimaryInfoRenderer = ytv_ren(() => ({
  description: components.text,
  menu: ytv_ren(),
  navigationEndpoint: ytv_enp(),
  showMoreText: components.text,
  stats: ytv_arr(components.text),
  thumbnailOverlays: ytv_arr(ytv_ren()),
  thumbnailRenderer: ytv_ren(),
  title: components.text
}))
export const playlistSidebarRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren())
}))
export const playlistSidebarSecondaryInfoRenderer = ytv_ren(() => ({
  button: ytv_ren(),
  videoOwner: ytv_ren()
}))
export const playlistVideoListRenderer = ytv_ren(() => ({
  canReorder: ytv_bol(),
  contents: ytv_arr(ytv_ren()),
  isEditable: ytv_bol(),
  playlistId: ytv_str(),
  targetId: ytv_str()
}))
export const playlistVideoRenderer = ytv_ren(() => ({
  index: components.text,
  isPlayable: ytv_bol(),
  lengthSeconds: ytv_str(),
  lengthText: components.text,
  menu: ytv_ren(),
  navigationEndpoint: ytv_enp(),
  shortBylineText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  videoId: ytv_str(),
  videoInfo: components.text
}))
export const playlistVideoThumbnailRenderer = ytv_ren(() => ({
  thumbnail: components.thumbnail
}))
export const pollHeaderRenderer = ytv_ren(() => ({
  contextMenuButton: ytv_ren(),
  liveChatPollType: ytv_str(['LIVE_CHAT_POLL_TYPE_CREATOR']),
  metadataText: components.text,
  pollQuestion: components.text,
  thumbnail: components.thumbnail
}))
export const pollRenderer = ytv_ren(() => ({
  choices: ytv_arr(ytv_sch({
    selectServiceEndpoint: ytv_enp(),
    selected: ytv_bol(),
    text: components.text,
    votePercentage: components.text,
    voteRatio: ytv_num()
  })),
  header: ytv_ren(),
  liveChatPollId: ytv_str()
}))
export const postRenderer = ytv_ren(() => ({
  actionButtons: ytv_ren(),
  actionMenu: ytv_ren(),
  authorEndpoint: ytv_enp(),
  authorText: components.text,
  authorThumbnail: components.thumbnail,
  backstageAttachment: ytv_ren(),
  contentText: components.text,
  loggingDirectives: components.loggingDirectives,
  navigationEndpoint: ytv_enp(),
  postId: ytv_str(),
  publishedTimeText: components.text,
  surface: ytv_str(['BACKSTAGE_SURFACE_TYPE_SEARCH']),
  voteCount: components.text,
  voteStatus: ytv_str(['INDIFFERENT'])
}))
export const previewButtonRenderer = ytv_ren(() => ({
  byline: components.text,
  subtitle: components.text,
  thumbnail: components.thumbnail,
  title: components.text
}))
export const productListHeaderRenderer = ytv_ren(() => ({
  suppressPaddingDisclaimer: ytv_bol(),
  title: components.text
}))
export const productListItemRenderer = ytv_ren(() => ({
  accessibilityTitle: ytv_str(),
  loggingDirectives: components.loggingDirectives,
  merchantName: ytv_str(),
  onClickCommand: ytv_enp(),
  price: ytv_str(),
  priceReplacementText: ytv_str(),
  stayInApp: ytv_bol(),
  thumbnail: components.thumbnail,
  title: components.text,
  viewButton: ytv_ren()
}))
export const productListRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren())
}))
export const promotedVideoRenderer = ytv_ren(() => ({
  adBadge: ytv_ren(),
  adPlaybackContextParams: ytv_str(),
  channelThumbnail: components.thumbnail,
  clickTrackingUrls: ytv_arr(ytv_str()),
  ctaRenderer: ytv_ren(),
  description: components.text,
  impressionUrls: ytv_arr(ytv_str()),
  lengthText: components.text,
  longBylineText: components.text,
  menu: ytv_ren(),
  navigationEndpoint: ytv_enp(),
  richThumbnail: ytv_ren(),
  shortBylineText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  videoId: ytv_str(),
  watchButtonRenderer: ytv_ren()
}))
export const qrCodeRenderer = ytv_ren(() => ({
  qrCodeImage: components.thumbnail,
  style: ytv_str(['QR_CODE_RENDERER_STYLE_MAIN_SIDESHEET_CONTENT'])
}))
export const recognitionShelfRenderer = ytv_ren(() => ({
  avatars: ytv_arr(components.thumbnail),
  button: ytv_ren(),
  subtitle: components.text,
  surface: ytv_str(['RECOGNITION_SHELF_SURFACE_CHANNEL_PAGE']),
  title: components.text
}))
export const reelPlayerHeaderRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  reelTitleOnClickCommand: ytv_enp(),
  timestampText: components.text
}))
export const reelPlayerOverlayRenderer = ytv_ren(() => ({
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
}))
export const reelShelfRenderer = ytv_ren(() => ({
  button: ytv_ren(),
  icon: components.icon,
  items: ytv_arr(ytv_ren()),
  nextButton: ytv_ren(),
  previousButton: ytv_ren(),
  title: components.text
}))
export const relatedChipCloudRenderer = ytv_ren(() => ({
  content: ytv_ren(),
  showProminentChips: ytv_bol()
}))
export const richGridRenderer = ytv_ren(() => ({
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
}))
export const richItemRenderer = ytv_ren(() => ({
  content: ytv_ren()
}))
export const richListHeaderRenderer = ytv_ren(() => ({
  subtitle: components.text,
  title: components.text
}))
export const richMetadataRenderer = ytv_ren(() => ({
  callToAction: components.text,
  callToActionIcon: components.icon,
  endpoint: ytv_enp(),
  style: ytv_str(['RICH_METADATA_RENDERER_STYLE_BOX_ART']),
  subtitle: components.text,
  thumbnail: components.thumbnail,
  title: components.text,
}))
export const richMetadataRowRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren())
}))
export const richSectionRenderer = ytv_ren(() => ({
  content: ytv_ren()
}))
export const richShelfRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren()),
  endpoint: ytv_enp(),
  icon: components.icon,
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
  title: components.text
}))
export const scrollPaneItemListRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren())
}))
export const scrollPaneRenderer = ytv_ren(() => ({
  content: ytv_ren()
}))
export const searchBarRenderer = ytv_ren(() => ({
  hack: ytv_bol()
}))
export const searchBoxRenderer = ytv_ren(() => ({
  clearButton: ytv_ren(),
  endpoint: ytv_enp(),
  placeholderText: components.text,
  searchButton: ytv_ren()
}))
export const searchFilterGroupRenderer = ytv_ren(() => ({
  filters: ytv_arr(ytv_ren()),
  title: components.text
}))
export const searchFilterOptionsDialogRenderer = ytv_ren(() => ({
  groups: ytv_arr(ytv_ren()),
  title: components.text
}))
export const searchFilterRenderer = ytv_ren(() => ({
  label: components.text,
  navigationEndpoint: ytv_enp(),
  status: ytv_str(['FILTER_STATUS_SELECTED']),
  tooltip: ytv_str()
}))
export const searchHeaderRenderer = ytv_ren(() => ({
  chipBar: ytv_ren(),
  searchFilterButton: ytv_ren()
}))
export const searchPyvRenderer = ytv_ren(() => ({
  ads: ytv_arr(ytv_ren())
}))
export const searchRefinementCardRenderer = ytv_ren(() => ({
  query: components.text,
  searchEndpoint: ytv_enp(),
  thumbnail: components.thumbnail
}))
export const searchSubMenuRenderer = ytv_ren(() => ({}))
export const sectionListRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren()),
  continuations: ytv_arr(components.continuation),
  disablePullToRefresh: ytv_bol(),
  hack: ytv_bol(),
  hideBottomSeparator: ytv_bol(),
  scrollPaneStyle: ytv_sch({
    scrollable: ytv_bol()
  }),
  subMenu: ytv_ren(),
  targetId: ytv_str()
}))
export const secondarySearchContainerRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren())
}))
export const sharePanelHeaderRenderer = ytv_ren(() => ({
  title: ytv_ren()
}))
export const sharePanelTitleV15Renderer = ytv_ren(() => ({
  title: components.text
}))
export const shareTargetRenderer = ytv_ren(() => ({
  navigationEndpoint: ytv_enp(),
  serviceEndpoint: ytv_enp(),
  serviceName: ytv_str(),
  targetId: ytv_num(),
  title: components.text
}))
export const sharingEmbedRenderer = ytv_ren(() => ({
  actionButtons: ytv_arr(ytv_ren()),
  attributionId: ytv_str(),
  apiReferenceLinkLabel: components.text,
  developerSampleLinkLabel: components.text,
  embedOptionsLabel: components.text,
  enablePrivacyModeOptionLabel: components.text,
  encryptedEmbedConfig: ytv_str(),
  height: ytv_num(),
  legalInfo: components.text,
  previewHeight: ytv_num(),
  previewWidth: ytv_num(),
  showPlayerControlsOptionLabel: components.text,
  showSuggestedVideosOptionLabel: components.text,
  showVideoTitleOptionLabel: components.text,
  startAt: ytv_ren(),
  title: components.text,
  videoId: ytv_str(),
  width: ytv_num()
}))
export const shelfHeaderRenderer = ytv_ren(() => ({
  avatarLockup: ytv_ren(),
  icon: components.icon,
  title: components.text
}))
export const shelfRenderer = ytv_ren(() => ({
  content: ytv_ren(),
  endpoint: ytv_enp(),
  focusContent: ytv_bol(),
  headerRenderer: ytv_ren(),
  headerStyle: ytv_sch({
    styleType: ytv_str(['INLINE_CHIPS'])
  }),
  playAllButton: ytv_ren(),
  subtitle: components.text,
  thumbnail: components.thumbnail,
  title: components.text,
  tvhtml5ShelfRendererType: ytv_str(['TVHTML5_SHELF_RENDERER_TYPE_GRID']),
  tvhtml5Style: ytv_sch({
    effects: ytv_sch({
      enlarge: ytv_bol()
    })
  })
}))
export const shoppingOverlayRenderer = ytv_ren(() => ({
  badgeInteractionLogging: ytv_ren({}),
  dismissButton: ytv_ren({
    a11yLabel: components.text
  }),
  featuredProductsEntityKey: ytv_str(),
  isContentForward: ytv_bol(),
  onClickCommand: ytv_enp(),
  productsData: ytv_arr(ytv_ren()),
  text: components.text,
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
}))
export const simpleCardTeaserRenderer = ytv_ren(() => ({
  channelAvatar: components.thumbnail,
  logVisibilityUpdates: ytv_bol(),
  message: components.text,
  onTapCommand: ytv_enp(),
  prominent: ytv_bol()
}))
export const singleOptionSurveyOptionRenderer = ytv_ren(() => ({
  enumName: ytv_str(),
  option: components.text,
  submissionEndpoint: ytv_enp()
}))
export const singleOptionSurveyRenderer = ytv_ren(() => ({
  dismissalEndpoint: ytv_enp(),
  dismissalText: components.text,
  impressionEndpoints: ytv_arr(ytv_enp()),
  options: ytv_arr(ytv_ren()),
  question: components.text,
  showGfeedbackPrompt: ytv_bol(),
  surveyId: ytv_str(),
  surveyOrientation: ytv_sch({
    type: ytv_str(['VERTICAL'])
  })
}))
export const slimMetadataToggleButtonRenderer = ytv_ren(() => ({
  button: ytv_ren(),
  isDislike: ytv_bol(),
  isLike: ytv_bol(),
  likeStatus: ytv_str(common.enums.LikeStatus),
  likeStatusEntityKey: ytv_str()
}))
export const smartSkipPlayerScrimOverlayRenderer = ytv_ren(() => ({
  icon: components.icon,
  text: components.text
}))
export const sortFilterSubMenuRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  icon: components.icon,
  subMenuItems: ytv_arr(sortFilterSubMenuItemRenderer),
  targetId: ytv_str(),
  title: ytv_str(),
  tooltip: ytv_str()
}))
export const startAtRenderer = ytv_ren(() => ({
  startAtOptionLabel: components.text
}))
export const structuredDescriptionContentRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren())
}))
export const structuredDescriptionPlaylistLockupRenderer = ytv_ren(() => ({
  aspectRatio: ytv_num(),
  disableNavigationEndpoint: ytv_bol(),
  maxLinesTitle: ytv_num(),
  maxLinesShortBylineText: ytv_num(),
  navigationEndpoint: ytv_enp(),
  shortBylineText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  thumbnailWidth: ytv_num(),
  title: components.text,
  videoCountShortText: components.text
}))
export const structuredDescriptionVideoLockupRenderer = ytv_ren(() => ({
  aspectRatio: ytv_num(),
  disableNavigationEndpoint: ytv_bol(),
  isLiveVideo: ytv_bol(),
  lengthText: components.text,
  maxLinesMetadataDetails: ytv_num(),
  maxLinesShortBylineText: ytv_num(),
  maxLinesTitle: ytv_num(),
  metadataDetails: components.text,
  navigationEndpoint: ytv_enp(),
  shortBylineText: components.text,
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  thumbnailWidth: ytv_num(),
  title: components.text
}))
export const subscribeButtonRenderer = ytv_ren(() => ({
  buttonText: components.text,
  channelId: ytv_str(),
  enabled: ytv_bol(),
  notificationPreferenceButton: ytv_ren(),
  onSubscribeEndpoints: ytv_arr(ytv_enp()),
  onUnsubscribeEndpoints: ytv_arr(ytv_enp()),
  serviceEndpoints: ytv_arr(ytv_enp()),
  showPreferences: ytv_bol(),
  signInEndpoint: ytv_enp(),
  subscribeAccessibility: common.components.accessibility,
  subscribed: ytv_bol(),
  subscribedButtonText: components.text,
  subscribedEntityKey: ytv_str(),
  targetId: ytv_str(),
  type: ytv_str(['FREE']),
  unsubscribeAccessibility: common.components.accessibility,
  unsubscribeButtonText: components.text,
  unsubscribedButtonText: components.text
}))
export const subscriptionNotificationToggleButtonRenderer = ytv_ren(() => ({
  command: ytv_enp(),
  currentStateId: ytv_num(),
  notificationStateEntityKey: ytv_str(),
  notificationsLabel: components.text,
  onTapBehavior: ytv_str(['ON_TAP_BEHAVIOR_TOGGLE_ICON_WITH_INLINE_MENU']),
  secondaryIcon: components.icon,
  states: ytv_arr(ytv_sch({
    inlineMenuButton: ytv_ren(),
    nextStateId: ytv_num(),
    notificationState: ytv_str(['SUBSCRIPTION_NOTIFICATION_STATE_ALL', 'SUBSCRIPTION_NOTIFICATION_STATE_OCCASIONAL', 'SUBSCRIPTION_NOTIFICATION_STATE_OFF']),
    state: ytv_ren(),
    stateId: ytv_num()
  })),
  targetId: ytv_str()
}))
export const surveyTriggerRenderer = ytv_ren(() => ({
  dismissalEndpoint: ytv_enp(),
  followUpText: components.text,
  survey: ytv_ren()
}))
export const tabRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  content: ytv_ren(),
  endpoint: ytv_enp(),
  selected: ytv_bol(),
  tabIdentifier: ytv_str(),
  title: ytv_str()
}))
export const thirdPartyShareTargetSectionRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  shareTargets: ytv_arr(ytv_ren())
}))
export const thumbnailLandscapePortraitRenderer = ytv_ren(() => ({
  landscape: components.thumbnail,
  portrait: components.thumbnail
}))
export const thumbnailOverlayBottomPanelRenderer = ytv_ren(() => ({
  icon: components.icon,
  text: components.text
}))
export const thumbnailOverlayInlineUnplayableRenderer = ytv_ren(() => ({
  icon: components.icon,
  text: components.text
}))
export const thumbnailOverlayLoadingPreviewRenderer = ytv_ren(() => ({
  text: components.text
}))
export const thumbnailOverlayNowPlayingRenderer = ytv_ren(() => ({
  text: components.text
}))
export const thumbnailOverlayResumePlaybackRenderer = ytv_ren(() => ({
  percentDurationWatched: ytv_num()
}))
export const thumbnailOverlaySidePanelRenderer = ytv_ren(() => ({
  icon: components.icon,
  text: components.text
}))
export const thumbnailOverlayStackingEffectRenderer = ytv_ren(() => ({
  lowerStackColor: ytv_num(),
  upperStackColor: ytv_num()
}))
export const thumbnailOverlayTimeStatusRenderer = ytv_ren(() => ({
  icon: components.icon,
  style: ytv_str(['DEFAULT', 'LIVE', 'UPCOMING']),
  text: components.text
}))
export const thumbnailOverlayToggleButtonRenderer = ytv_ren(() => ({
  isToggled: ytv_bol(),
  toggledAccessibility: common.components.accessibility,
  toggledIcon: components.icon,
  toggledServiceEndpoint: ytv_enp(),
  toggledTooltip: ytv_str(),
  untoggledAccessibility: common.components.accessibility,
  untoggledIcon: components.icon,
  untoggledServiceEndpoint: ytv_enp(),
  untoggledTooltip: ytv_str()
}))
export const tileHeaderRenderer = ytv_ren(() => ({
  style: ytv_str(['TILE_HEADER_STYLE_PADDED', 'TILE_HEADER_STYLE_RECTANGULAR']),
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren())
}))
export const tileMetadataRenderer = ytv_ren(() => ({
  lines: ytv_arr(ytv_ren()),
  title: components.text
}))
export const tileRenderer = ytv_ren(() => ({
  contentId: ytv_str(),
  contentType: ytv_str(['TILE_CONTENT_TYPE_CHANNEL', 'TILE_CONTENT_TYPE_PLAYLIST', 'TILE_CONTENT_TYPE_VIDEO']),
  header: ytv_ren(),
  metadata: ytv_ren(),
  onFocusCommand: ytv_enp(),
  onLongPressCommand: ytv_enp(),
  onSelectCommand: ytv_enp(),
  style: ytv_str(['TILE_STYLE_YTLR_CAROUSEL', 'TILE_STYLE_YTLR_DEFAULT', 'TILE_STYLE_YTLR_ROUND', 'TILE_STYLE_YTLR_SQUARE'])
}))
export const timedAnimationButtonRenderer = ytv_ren(() => ({
  buttonRenderer: ytv_ren()
}))
export const titleAndButtonListHeaderRenderer = ytv_ren(() => ({
  title: components.text
}))
export const toggleButtonRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibilityData,
  accessibilityData: common.components.accessibility,
  defaultIcon: components.icon,
  defaultNavigationEndpoint: ytv_enp(),
  defaultServiceEndpoint: ytv_enp(),
  defaultText: components.text,
  defaultTooltip: ytv_str(),
  isDisabled: ytv_bol(),
  isToggled: ytv_bol(),
  size: components.size,
  style: components.style,
  targetId: ytv_str(),
  toggledAccessibilityData: common.components.accessibility,
  toggleButtonSupportedData: ytv_sch({
    toggleButtonIdData: ytv_sch({
      id: ytv_str(['TOGGLE_BUTTON_ID_TYPE_DISLIKE', 'TOGGLE_BUTTON_ID_TYPE_LIKE'])
    })
  }),
  toggledIcon: components.icon,
  toggledNavigationEndpoint: ytv_enp(),
  toggledServiceEndpoint: ytv_enp(),
  toggledStyle: components.style,
  toggledText: components.text,
  toggledTooltip: ytv_str()
}))
export const toggleMenuServiceItemRenderer = ytv_ren(() => ({
  defaultIcon: components.icon,
  defaultServiceEndpoint: ytv_enp(),
  defaultText: components.text,
  hasToggleSwitch: ytv_bol(),
  isToggled: ytv_bol(),
  persistentOnMenuPopup: ytv_bol(),
  toggleMenuServiceItemEntityKey: ytv_str(),
  toggledIcon: components.icon,
  toggledServiceEndpoint: ytv_enp(),
  toggledText: components.text
}))
export const topbarLogoRenderer = ytv_ren(() => ({
  endpoint: ytv_enp(),
  iconImage: components.icon,
  overrideEntityKey: ytv_str(),
  tooltipText: components.text
}))
export const topbarMenuButtonRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  avatar: components.thumbnail,
  icon: components.icon,
  menuRequest: ytv_enp(),
  style: ytv_str(enums.ButtonStyle),
  tooltip: ytv_str()
}))
export const transportControlsRenderer = ytv_ren(() => ({
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
  })),
  featuredActionViewModels: ytv_arr(ytv_ren())
}))
export const tvBrowseRenderer = ytv_ren(() => ({
  content: ytv_ren(),
  header: ytv_ren()
}))
export const tvSurfaceContentRenderer = ytv_ren(() => ({
  content: ytv_ren(),
  targetId: ytv_str()
}))
export const tvSurfaceHeaderRenderer = ytv_ren(() => ({
  title: components.text
}))
export const twoColumnBrowseResultsRenderer = ytv_ren(() => ({
  secondaryContents: ytv_ren(),
  tabs: ytv_arr(ytv_ren())
}))
export const twoColumnSearchResultsRenderer = ytv_ren(() => ({
  primaryContents: ytv_ren(),
  secondaryContents: ytv_ren()
}))
export const unifiedSharePanelRenderer = ytv_ren(() => ({
  contents: ytv_arr(ytv_ren()),
  header: ytv_ren(),
  sharePanelVersion: ytv_num(),
  showLoadingSpinner: ytv_bol()
}))
export const universalWatchCardRenderer = ytv_ren(() => ({
  callToAction: ytv_ren(),
  collapsedLabel: components.text,
  footer: ytv_ren(),
  header: ytv_ren(),
  sections: ytv_arr(ytv_ren())
}))
export const unlinkDevicesRenderer = ytv_ren(() => ({
  thumbnail: components.thumbnail,
  title: components.text
}))
export const uploadTimeFactoidRenderer = ytv_ren(() => ({
  factoid: ytv_ren(),
  uploadTimeEntity: ytv_sch({
    key: ytv_str()
  })
}))
export const verticalListRenderer = ytv_ren(() => ({
  collapsedItemCount: ytv_num(),
  collapsedStateButtonText: components.text,
  items: ytv_arr(ytv_ren())
}))
export const verticalWatchCardListRenderer = ytv_ren(() => ({
  items: ytv_arr(ytv_ren())
}))
export const videoAdTrackingRenderer = ytv_ren(() => ({
  adLayoutLoggingData: components.adLayoutLoggingData,
  pings: components.videoAdPings
}))
export const videoDescriptionChannelSectionRenderer = ytv_ren(() => ({
  channel: ytv_ren()
}))
export const videoDescriptionCommentsSectionRenderer = ytv_ren(() => ({
  content: ytv_ren()
}))
export const videoDescriptionHeaderRenderer = ytv_ren(() => ({
  channel: components.text,
  channelNavigationEndpoint: ytv_enp(),
  channelThumbnail: components.thumbnail,
  factoid: ytv_arr(ytv_ren()),
  publishDate: components.text,
  title: components.text,
  views: components.text
}))
export const videoDescriptionInfocardsSectionRenderer = ytv_ren(() => ({
  channelAvatar: components.thumbnail,
  channelEndpoint: ytv_enp(),
  creatorAboutButton: ytv_ren(),
  creatorCustomUrlButtons: ytv_arr(ytv_ren()),
  creatorVideosButton: ytv_ren(),
  infocards: ytv_arr(ytv_ren()),
  sectionSubtitle: components.text,
  sectionTitle: components.text
}))
export const videoDescriptionTranscriptSectionRenderer = ytv_ren(() => ({
  primaryButton: ytv_ren(),
  sectionTitle: components.text,
  subHeaderText: components.text
}))
export const videoOwnerRenderer = ytv_ren(() => ({
  badges: ytv_arr(ytv_ren()),
  hideMembershipButtonIfUnsubscribed: ytv_bol(),
  membershipButton: ytv_ren(),
  navigationEndpoint: ytv_enp(),
  subscribeButton: ytv_ren(),
  subscriberCountText: components.text,
  subscriptionButton: ytv_sch({
    subscribed: ytv_bol(),
    type: ytv_str(['FREE'])
  }),
  thumbnail: components.thumbnail,
  title: components.text
}))
export const videoPrimaryInfoRenderer = ytv_ren(() => ({
  dateText: components.text,
  relativeDateText: components.text,
  superTitleLink: components.text,
  title: components.text,
  updatedMetadataEndpoint: ytv_enp(),
  videoActions: ytv_ren(),
  viewCount: ytv_ren()
}))
export const videoRenderer = ytv_ren(() => ({
  avatar: ytv_ren(),
  badges: ytv_arr(ytv_ren()),
  channelThumbnailSupportedRenderers: ytv_ren(),
  descriptionSnippet: components.text,
  detailedMetadataSnippets: ytv_arr(ytv_unk()),
  expandableMetadata: ytv_ren(),
  inlinePlaybackEndpoint: ytv_enp(),
  isWatched: ytv_bol(),
  lengthText: components.text,
  longBylineText: components.text,
  menu: ytv_ren(),
  navigationEndpoint: ytv_enp(),
  ownerBadges: ytv_arr(ytv_ren()),
  ownerText: components.text,
  publishedTimeText: components.text,
  richThumbnail: ytv_ren(),
  searchVideoResultEntityKey: ytv_str(),
  shortBylineText: components.text,
  shortViewCountText: components.text,
  showActionMenu: ytv_bol(),
  thumbnail: components.thumbnail,
  thumbnailOverlays: ytv_arr(ytv_ren()),
  title: components.text,
  upcomingEventData: ytv_sch({
    isReminderSet: ytv_bol(),
    startTime: ytv_str(),
    upcomingEventText: components.text
  }),
  videoId: ytv_str(),
  viewCountText: components.text
}))
export const videoSecondaryInfoRenderer = ytv_ren(() => ({
  attributedDescription: ytv_obj(ytv_str(), ytv_unk()),
  defaultExpanded: ytv_bol(),
  descriptionCollapsedLines: ytv_num(),
  headerRuns: ytv_arr(ytv_unk()),
  metadataRowContainer: ytv_ren(),
  owner: ytv_ren(),
  showLessCommand: ytv_enp(),
  showLessText: components.text,
  showMoreCommand: ytv_enp(),
  showMoreText: components.text,
  subscribeButton: ytv_ren()
}))
export const videoViewCountRenderer = ytv_ren(() => ({
  entityKey: ytv_str(),
  extraShortViewCount: components.text,
  isLive: ytv_bol(),
  originalViewCount: ytv_str(),
  shortViewCount: components.text,
  unlabeledViewCountValue: components.text,
  viewCount: components.text,
  viewCountLabel: components.text
}))
export const viewCountFactoidRenderer = ytv_ren(() => ({
  factoid: ytv_ren(),
  viewCountEntityKey: ytv_str(),
  viewCountType: ytv_str(['VIEW_COUNT_FACTOID_TYPE_TOTAL_VIEWS'])
}))
export const voiceSearchDialogRenderer = ytv_ren(() => ({
  connectionErrorHeader: components.text,
  connectionErrorMicrophoneLabel: components.text,
  disabledHeader: components.text,
  disabledSubtext: components.text,
  exampleQuery1: components.text,
  exampleQuery2: components.text,
  exitButton: ytv_ren(),
  loadingHeader: components.text,
  microphoneButtonAriaLabel: components.text,
  microphoneOffPromptHeader: components.text,
  placeholderHeader: components.text,
  permissionsHeader: components.text,
  permissionsSubtext: components.text,
  promptHeader: components.text,
  promptMicrophoneLabel: components.text
}))
export const watchCardCompactVideoRenderer = ytv_ren(() => ({
  byline: components.text,
  lengthText: components.text,
  navigationEndpoint: ytv_enp(),
  style: ytv_str(['WATCH_CARD_COMPACT_VIDEO_RENDERER_STYLE_CONDENSED']),
  subtitle: components.text,
  title: components.text
}))
export const watchCardHeroVideoRenderer = ytv_ren(() => ({
  accessibility: common.components.accessibility,
  callToActionButton: ytv_ren(),
  heroImage: ytv_ren(),
  navigationEndpoint: ytv_enp()
}))
export const watchCardRichHeaderRenderer = ytv_ren(() => ({
  avatar: components.thumbnail,
  callToActionButtons: ytv_arr(ytv_ren()),
  colorSupportedDatas: components.colorSupportedDatas,
  darkThemeColorSupportedDatas: components.colorSupportedDatas,
  style: ytv_str(['WATCH_CARD_RICH_HEADER_RENDERER_STYLE_LEFT_AVATAR']),
  subtitle: components.text,
  title: components.text,
  titleBadge: ytv_ren(),
  titleNavigationEndpoint: ytv_enp()
}))
export const watchCardSectionSequenceRenderer = ytv_ren(() => ({
  listTitles: ytv_arr(components.text),
  lists: ytv_arr(ytv_ren())
}))
export const watchNextEndScreenRenderer = ytv_ren(() => ({
  results: ytv_arr(ytv_ren()),
  title: components.text
}))
export const youThereRenderer = ytv_ren(() => ({
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
}))
export const ypcTrailerRenderer = ytv_ren(() => ({
  fullVideoMessage: components.text,
  unserializedPlayerResponse: response.mapped.player
}))

// ViewModel
export const adAvatarLockupViewModel = ytv_ren(() => ({
  adAvatar: ytv_ren(),
  adBadge: ytv_ren(),
  headline: textViewModel,
  interaction: components.adInteraction,
  loggingDirectives: components.loggingDirectives,
  primaryDetailsLine: ytv_ren(),
  style: ytv_str(['AD_AVATAR_LOCKUP_STYLE_COMPACT'])
}))
export const adAvatarViewModel = ytv_ren(() => ({
  image: components.image,
  interaction: components.adInteraction,
  loggingDirectives: components.loggingDirectives,
  rendererContext: components.rendererContext,
  size: ytv_str(['AD_AVATAR_SIZE_M']),
  style: ytv_str(['AD_AVATAR_STYLE_CIRCULAR'])
}))
export const adBadgeViewModel = ytv_ren(() => ({
  interaction: components.adInteraction,
  label: textViewModel,
  loggingDirectives: components.loggingDirectives,
  style: ytv_str(['AD_BADGE_STYLE_STARK'])
}))
export const adButtonViewModel = ytv_ren(() => ({
  interaction: components.adInteraction,
  label: textViewModel,
  loggingDirectives: components.loggingDirectives,
  size: ytv_str(['AD_BUTTON_SIZE_DEFAULT']),
  style: ytv_str(['AD_BUTTON_STYLE_FILLED'])
}))
export const adDetailsLineViewModel = ytv_ren(() => ({
  attributes: ytv_arr(ytv_sch({
    text: textViewModel
  })),
  style: ytv_str(['AD_DETAILS_LINE_STYLE_STANDARD'])
}))
export const adImageViewModel = ytv_ren(() => ({
  imageSources: ytv_arr(components.imageSource),
  interaction: components.adInteraction,
  loggingDirectives: components.loggingDirectives
}))
export const adPodIndexViewModel = ytv_ren(() => ({
  adPodIndex: textViewModel,
  visibilityCondition: ytv_str(['AD_POD_INDEX_VISIBILITY_CONDITION_AUTOHIDE'])
}))
export const adPreviewViewModel = ytv_ren(() => ({
  durationMilliseconds: ytv_num(),
  interaction: components.adInteraction,
  loggingDirectives: components.loggingDirectives,
  previewImage: components.image,
  previewText: ytv_sch({
    text: ytv_str(),
    isTemplated: ytv_bol()
  })
}))
export const attributionViewModel = ytv_ren(() => ({
  rendererContext: components.rendererContext,
  suffix: textViewModel,
  text: textViewModel
}))
export const avatarStackViewModel = ytv_ren(() => ({
  avatars: ytv_arr(ytv_ren()),
  rendererContext: components.rendererContext,
  text: textViewModel,
  textSuffix: textViewModel
}))
export const avatarViewModel = ytv_ren(() => ({
  accessibilityText: ytv_str(),
  avatarImageSize: ytv_str(['AVATAR_SIZE_M', 'AVATAR_SIZE_S', 'AVATAR_SIZE_XL', 'AVATAR_SIZE_XS']),
  image: components.image,
  liveData: ytv_sch({
    liveBadgeText: ytv_str()
  }),
  loggingDirectives: components.loggingDirectives,
  rendererContext: components.rendererContext
}))
export const basicContentViewModel = ytv_ren(() => ({
  paragraphs: ytv_arr(ytv_sch({
    text: textViewModel
  }))
}))
export const bkaEnforcementMessageViewModel = ytv_ren(() => ({
  bulletList: ytv_sch({
    bulletListItems: ytv_arr(ytv_sch({
      title: textViewModel
    }))
  }),
  dismissButton: buttonViewModel,
  displayType: ytv_str(['ENFORCEMENT_MESSAGE_VIEW_MODEL_DISPLAY_TYPE_POPUP']),
  feedbackMessage: textViewModel,
  impressionEndpoints: ytv_arr(ytv_enp()),
  isVisible: ytv_bol(),
  logo: components.image,
  logoDark: components.image,
  primaryButton: buttonViewModel,
  secondaryButton: buttonViewModel,
  title: textViewModel
}))
export const buttonBannerViewModel = ytv_ren(() => ({
  ctaButton: ytv_ren(),
  subtext: textViewModel
}))
export const buttonCardViewModel = ytv_ren(() => ({
  image: components.image,
  rendererContext: components.rendererContext,
  title: ytv_str()
}))
export const carouselItemViewModel = ytv_ren(() => ({
  carouselItem: ytv_ren(),
  itemType: ytv_str(['VIDEO_METADATA_CAROUSEL_PAGINATION_TYPE_LIVE_CHAT_STATIC_TEXT'])
}))
export const carouselTitleViewModel = ytv_ren(() => ({
  nextButton: ytv_ren(),
  previousButton: ytv_ren(),
  title: ytv_str()
}))
export const chipBarViewModel = ytv_ren(() => ({
  chipBarStateEntityKey: ytv_str(),
  chips: ytv_arr(ytv_ren())
}))
export const chipViewModel = ytv_ren(() => ({
  accessibilityLabel: ytv_str(),
  displayType: ytv_str(['CHIP_VIEW_MODEL_DISPLAY_TYPE_UNSPECIFIED']),
  loggingDirectives: components.loggingDirectives,
  selected: ytv_bol(),
  tapCommand: ytv_enp(),
  text: ytv_str()
}))
export const collectionThumbnailViewModel = ytv_ren(() => ({
  primaryThumbnail: ytv_ren(),
  stackColor: components.themedColor
}))
export const commentViewModel = ytv_ren(() => ({
  allowProfileCard: ytv_bol(),
  commentId: ytv_str(),
  commentKey: ytv_str(),
  commentSurfaceKey: ytv_str(),
  inlineRepliesKey: ytv_str(),
  pinnedText: ytv_str(),
  rendererContext: components.rendererContext,
  sharedKey: ytv_str(),
  sharedSurfaceKey: ytv_str(),
  toolbarStateKey: ytv_str(),
  toolbarSurfaceKey: ytv_str(),
  translateButton: ytv_ren()
}))
export const contentMetadataViewModel = ytv_ren(() => ({
  delimiter: ytv_str(),
  metadataRows: ytv_arr(ytv_sch({
    metadataParts: ytv_arr(ytv_sch({
      accessibilityLabel: ytv_str(),
      avatarStack: ytv_ren(),
      enableTruncation: ytv_bol(),
      text: textViewModel
    })),
    isSpacerRow: ytv_bol()
  })),
  rendererContext: components.rendererContext
}))
export const contentPreviewImageViewModel = ytv_ren(() => ({
  image: components.image,
  layoutMode: ytv_str(['CONTENT_PREVIEW_IMAGE_LAYOUT_MODE_UNKNOWN']),
  rendererContext: components.rendererContext,
  style: ytv_str(['CONTENT_PREVIEW_IMAGE_STYLE_CIRCLE', 'CONTENT_PREVIEW_IMAGE_STYLE_SQUARE'])
}))
export const creatorHeartViewModel = ytv_ren(() => ({
  creatorThumbnail: components.image,
  engagementStateKey: ytv_str(),
  heartedAccessibilityLabel: ytv_str(),
  heartedHoverText: ytv_str(),
  heartedIcon: components.image,
  loggingDirectives: components.loggingDirectives,
  unheartedAccessibilityLabel: ytv_str(),
  unheartedIcon: components.image
}))
export const decoratedAvatarViewModel = ytv_ren(() => ({
  a11yLabel: ytv_str(),
  avatar: ytv_ren(),
  liveData: ytv_sch({
    liveBadgeText: ytv_str()
  }),
  rendererContext: components.rendererContext
}))
export const descriptionPreviewViewModel = ytv_ren(() => ({
  alwaysShowTruncationText: ytv_bol(),
  description: textViewModel,
  maxLines: ytv_num(),
  rendererContext: components.rendererContext,
  truncationText: textViewModel
}))
export const dialogHeaderViewModel = ytv_ren(() => ({
  headline: textViewModel
}))
export const dialogViewModel = ytv_ren(() => ({
  content: ytv_ren(),
  footer: ytv_ren(),
  header: ytv_ren()
}))
export const dislikeButtonViewModel = ytv_ren(() => ({
  dislikeEntityKey: ytv_str(),
  toggleButtonViewModel: ytv_ren()
}))
export const downloadListItemViewModel = ytv_ren(() => ({
  rendererContext: components.rendererContext
}))
export const dynamicTextViewModel = ytv_ren(() => ({
  maxLines: ytv_num(),
  rendererContext: components.rendererContext,
  text: textViewModel
}))
export const emojiFountainViewModel = ytv_ren(() => ({
  emojiFountainDataEntityKey: ytv_str(),
  loggingDirectives: components.loggingDirectives
}))
export const featuredActionViewModel = ytv_ren(() => ({
  featuredTransportControlAction: ytv_str(['TRANSPORT_CONTROLS_BUTTON_TYPE_SUBSCRIBE']),
  loggingDirectives: components.loggingDirectives,
  videoPlaybackTimeoutTimeMs: ytv_sch({
    streamTimeMillis: ytv_str()
  }),
  videoPlaybackTriggerTimeMs: ytv_sch({
    streamTimeMillis: ytv_str()
  })
}))
export const firstPartyNetworkSectionViewModel = ytv_ren(() => ({}))
export const flexibleActionsViewModel = ytv_ren(() => ({
  actionsRows: ytv_arr(ytv_sch({
    actions: ytv_arr(ytv_ren())
  })),
  minimumRowHeight: ytv_num(),
  rendererContext: components.rendererContext
}))
export const gridShelfViewModel = ytv_ren(() => ({
  contentAspectRatio: ytv_str(['GRID_SHELF_CONTENT_ASPECT_RATIO_TWO_BY_THREE']),
  contents: ytv_arr(ytv_ren()),
  enableVerticalExpansion: ytv_bol(),
  header: ytv_ren(),
  loggingDirectives: components.loggingDirectives,
  minCollapsedItemCount: ytv_num(),
  showLessButton: ytv_ren(),
  showMoreButton: ytv_ren()
}))
export const imageBannerViewModel = ytv_ren(() => ({
  image: components.image,
  rendererContext: components.rendererContext,
  style: ytv_str(['IMAGE_BANNER_STYLE_INSET'])
}))
export const likeButtonViewModel = ytv_ren(() => ({
  likeStatusEntity: ytv_sch({
    key: ytv_str(),
    likeStatus: ytv_str(common.enums.LikeStatus)
  }),
  likeStatusEntityKey: ytv_str(),
  toggleButtonViewModel: ytv_ren()
}))
export const listViewModel = ytv_ren(() => ({
  listItems: ytv_arr(ytv_ren())
}))
export const listItemViewModel = ytv_ren(() => ({
  isDisabled: ytv_bol(),
  isSelected: ytv_bol(),
  leadingImage: components.image,
  rendererContext: components.rendererContext,
  selectionStyle: ytv_str(['LIST_ITEM_SELECTION_STYLE_DEFAULT']),
  title: textViewModel
}))
export const liveChatProductPickerPanelItemViewModel = ytv_ren(() => ({
  description: textViewModel,
  onTapCommand: ytv_enp(),
  productImage: ytv_ren(),
  title: textViewModel
}))
export const liveChatProductPickerPanelViewModel = ytv_ren(() => ({
  closeButton: ytv_ren(),
  items: ytv_arr(ytv_ren()),
  title: textViewModel
}))
export const liveViewerLeaderboardChatEntryPointViewModel = ytv_ren(() => ({
  defaultButton: ytv_ren(),
  entryPointStateEntityKey: ytv_str(),
  isCameo: ytv_bol(),
  isImmersive: ytv_bol(),
  pointsButton: ytv_ren(),
  pointsEntityKey: ytv_str()
}))
export const lockupMetadataViewModel = ytv_ren(() => ({
  image: ytv_ren(),
  menuButton: ytv_ren(),
  metadata: ytv_ren(),
  title: textViewModel
}))
export const lockupViewModel = ytv_ren(() => ({
  contentId: ytv_str(),
  contentImage: ytv_ren(),
  contentType: ytv_str(['LOCKUP_CONTENT_TYPE_ALBUM', 'LOCKUP_CONTENT_TYPE_PLAYLIST', 'LOCKUP_CONTENT_TYPE_VIDEO']),
  metadata: ytv_ren(),
  rendererContext: components.rendererContext
}))
export const officialCardViewModel = ytv_ren(() => ({
  backgroundColor: components.themedColor,
  header: ytv_ren(),
  rendererContext: components.rendererContext
}))
export const pageHeaderViewModel = ytv_ren(() => ({
  actions: ytv_ren(),
  animatedImage: ytv_ren(),
  attribution: ytv_ren(),
  banner: ytv_ren(),
  description: ytv_ren(),
  image: ytv_ren(),
  metadata: ytv_ren(),
  rendererContext: components.rendererContext,
  title: ytv_ren()
}))
export const panelFooterViewModel = ytv_ren(() => ({
  primaryButton: ytv_ren(),
  secondaryButton: ytv_ren(),
  shouldHideDivider: ytv_bol()
}))
export const pdgLikeViewModel = ytv_ren(() => ({
  engagementStateKey: ytv_str(),
  likeCountEntityKey: ytv_str(),
  likeCountPlaceholder: textViewModel,
  likedIcon: components.image,
  toggleButton: ytv_ren(),
  unlikeA11yText: textViewModel,
  unlikedIcon: components.image
}))
export const pdgReplyButtonViewModel = ytv_ren(() => ({
  replyButton: ytv_ren(),
  replyCountEntityKey: ytv_str(),
  replyCountPlaceholder: textViewModel
}))
export const pivotButtonViewModel = ytv_ren(() => ({
  backgroundAnimationStyle: ytv_str(['BACKGROUND_ANIMATION_STYLE_DEFAULT']),
  contentDescription: ytv_str(),
  experiments: ytv_obj(ytv_str(), ytv_bol()),
  loggingDirectives: components.loggingDirectives,
  onClickCommand: ytv_enp(),
  soundAttributionTitle: textViewModel,
  thumbnail: components.image,
  waveformAnimationStyle: ytv_str(['WAVEFORM_ANIMATION_STYLE_DEFAULT']),
}))
export const playerAdAvatarLockupCardButtonedViewModel = ytv_ren(() => ({
  avatar: ytv_ren(),
  button: ytv_ren(),
  description: textViewModel,
  headline: textViewModel,
  interaction: components.adInteraction,
  loggingDirectives: components.loggingDirectives,
  startMs: ytv_num()
}))
export const reactionControlPanelButtonViewModel = ytv_ren(() => ({
  a11yLabel: ytv_str(),
  buttonIcon: components.image,
  buttonIconType: ytv_str(enums.IconType),
  emojiId: ytv_str(),
  loggingDirectives: components.loggingDirectives,
  onTap: ytv_enp(),
  shouldTriggerAnimation: ytv_bol()
}))
export const reactionControlPanelOverlayViewModel = ytv_ren(() => ({
  emojiFountain: ytv_ren(),
  liveReactionsSettingEntityKey: ytv_str(),
  loggingDirectives: components.loggingDirectives,
  reactionControlPanel: ytv_ren()
}))
export const reactionControlPanelViewModel = ytv_ren(() => ({
  collapsedButton: ytv_ren(),
  expandedButtons: ytv_arr(ytv_ren()),
  loggingDirectives: components.loggingDirectives,
  onMouseEnter: ytv_enp(),
  onMouseLeave: ytv_enp(),
  reactionControlPanelExpandedEntityKey: ytv_str()
}))
export const reelChannelBarViewModel = ytv_ren(() => ({
  alcPurchaseStateEntityStoreKey: ytv_str(),
  channelName: textViewModel,
  decoratedAvatarViewModel: ytv_ren(),
  endPositionActionButton: ytv_bol(),
  rendererContext: components.rendererContext,
  sponsorStateEntityStoreKey: ytv_str(),
  subscribeButtonViewModel: ytv_ren(),
  subscribeStateEntityStoreKey: ytv_str()
}))
export const reelMetapanelViewModel = ytv_ren(() => ({
  metadataItems: ytv_arr(ytv_ren())
}))
export const reelSoundMetadataViewModel = ytv_ren(() => ({
  enableMarqueeScroll: ytv_bol(),
  loggingDirectives: components.loggingDirectives,
  loopCount: ytv_num(),
  musicIcon: components.image,
  onTapCommand: ytv_enp(),
  soundMetadata: textViewModel,
  useDefaultPadding: ytv_bol()
}))
export const sectionHeaderViewModel = ytv_ren(() => ({
  headline: textViewModel,
  leadingAccessory: ytv_sch({
    image: components.image
  })
}))
export const segmentedLikeDislikeButtonViewModel = ytv_ren(() => ({
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
}))
export const sheetViewModel = ytv_ren(() => ({
  content: ytv_ren()
}))
export const shortsLockupViewModel = ytv_ren(() => ({
  accessibilityText: ytv_str(),
  entityId: ytv_str(),
  indexInCollection: ytv_num(),
  inlinePlayerData: ytv_sch({
    onVisible: ytv_enp()
  }),
  loggingDirectives: components.loggingDirectives,
  menuOnTap: ytv_enp(),
  menuOnTapA11yLabel: ytv_str(),
  onTap: ytv_enp(),
  overlayMetadata: ytv_sch({
    primaryText: textViewModel,
    secondaryText: textViewModel
  }),
  thumbnail: components.image
}))
export const shortsVideoTitleViewModel = ytv_ren(() => ({
  loggingDirectives: components.loggingDirectives,
  maxLines: ytv_num(),
  text: textViewModel,
  truncatedTextOnTapCommand: ytv_enp()
}))
export const skipAdButtonViewModel = ytv_ren(() => ({
  interaction: components.adInteraction,
  label: ytv_str(),
  loggingDirectives: components.loggingDirectives
}))
export const skipAdViewModel = ytv_ren(() => ({
  interaction: components.adInteraction,
  preskipState: ytv_ren(),
  skipOffsetMilliseconds: ytv_num(),
  skippableState: ytv_ren(),
  loggingDirectives: components.loggingDirectives
}))
export const speedmasterEduViewModel = ytv_ren(() => ({
  bodyText: textViewModel
}))
export const subscribeButtonViewModel = ytv_ren(() => ({
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
  loggingDirectives: components.loggingDirectives,
  notificationStateEntityStoreKeys: ytv_sch({
    subsNotificationStateKey: ytv_str()
  }),
  onShowSubscriptionOptions: ytv_enp(),
  stateEntityStoreKey: ytv_str(),
  subscribeButtonContent: components.subscribeButtonViewModelContent,
  unsubscribeButtonContent: components.subscribeButtonViewModelContent
}))
export const textCarouselItemViewModel = ytv_ren(() => ({
  button: ytv_ren(),
  iconName: ytv_str(enums.IconType),
  onTap: ytv_enp(),
  text: textViewModel
}))
export const themedImageViewModel = ytv_ren(() => ({
  imageDark: components.image,
  imageLight: components.image
}))
export const thumbnailBadgeViewModel = ytv_ren(() => ({
  animatedText: ytv_str(),
  animationActivationEntityKey: ytv_str(),
  animationActivationEntitySelectorType: ytv_str(['THUMBNAIL_BADGE_ANIMATION_ENTITY_SELECTOR_TYPE_PLAYER_STATE']),
  animationActivationTargetId: ytv_str(),
  backgroundColor: components.themedColor,
  badgeStyle: ytv_str(['THUMBNAIL_OVERLAY_BADGE_STYLE_DEFAULT', 'THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE']),
  icon: components.image,
  lottieData: ytv_sch({
    settings: ytv_sch({
      autoplay: ytv_bol(),
      loop: ytv_bol()
    }),
    url: ytv_str()
  }),
  rendererContext: components.rendererContext,
  text: ytv_str()
}))
export const thumbnailHoverOverlayToggleActionsViewModel = ytv_ren(() => ({
  buttons: ytv_arr(ytv_ren())
}))
export const thumbnailHoverOverlayViewModel = ytv_ren(() => ({
  icon: components.image,
  style: ytv_str(['THUMBNAIL_HOVER_OVERLAY_STYLE_COVER']),
  text: textViewModel
}))
export const thumbnailOverlayBadgeViewModel = ytv_ren(() => ({
  position: ytv_str(['THUMBNAIL_OVERLAY_BADGE_POSITION_BOTTOM_END']),
  thumbnailBadges: ytv_arr(ytv_ren())
}))
export const thumbnailViewModel = ytv_ren(() => ({
  backgroundColor: components.themedColor,
  image: components.image,
  overlays: ytv_arr(ytv_ren())
}))
export const timelyActionsOverlayViewModel = ytv_ren(() => ({
  rendererContext: components.rendererContext,
  timelyActions: ytv_arr(ytv_ren())
}))
export const timelyActionViewModel = ytv_ren(() => ({
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
  rendererContext: components.rendererContext,
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
}))
export const toggleButtonViewModel = ytv_ren(() => ({
  defaultButtonViewModel: ytv_ren(),
  identifier: ytv_str(),
  isToggled: ytv_bol(),
  isTogglingDisabled: ytv_bol(),
  toggledButtonViewModel: ytv_ren()
}))
export const topBannerImageTextIconButtonedLayoutViewModel = ytv_ren(() => ({
  adAvatarLockup: ytv_ren(),
  adButton: ytv_ren(),
  adImage: ytv_ren(),
  adLayoutLoggingData: components.adLayoutLoggingData,
  adVideoId: ytv_str(),
  interaction: components.adInteraction,
  loggingDirectives: components.loggingDirectives,
  menu: ytv_ren()
}))
export const triStateButtonViewModel = ytv_ren(() => ({
  toggledStateData: ytv_sch({
    loggingDirectives: components.loggingDirectives
  }),
  untoggledStateData: ytv_sch({
    loggingDirectives: components.loggingDirectives
  })
}))
export const videoAttributesSectionViewModel = ytv_ren(() => ({
  headerInfoButtonOnTap: ytv_enp(),
  headerSubtitle: ytv_str(),
  headerTitle: ytv_str(),
  nextButton: ytv_ren(),
  previousButton: ytv_ren(),
  videoAttributeViewModels: ytv_arr(ytv_ren())
}))
export const videoAttributeViewModel = ytv_ren(() => ({
  image: components.image,
  imageSize: ytv_str(['VIDEO_ATTRIBUTE_IMAGE_SIZE_LARGE']),
  imageStyle: ytv_str(['VIDEO_ATTRIBUTE_IMAGE_STYLE_SQUARE']),
  loggingDirectives: components.loggingDirectives,
  onTap: ytv_enp(),
  orientation: ytv_str(['VIDEO_ATTRIBUTE_ORIENTATION_HORIZONTAL', 'VIDEO_ATTRIBUTE_ORIENTATION_VERTICAL']),
  overflowMenuA11yLabel: ytv_str(),
  overflowMenuOnTap: ytv_enp(),
  rendererContext: components.rendererContext,
  secondarySubtitle: textViewModel,
  sizingRule: ytv_str(['VIDEO_ATTRIBUTE_SIZING_RULE_RESPONSIVE']),
  subtitle: ytv_str(),
  title: ytv_str()
}))
export const videoBadgeViewModel = ytv_ren(() => ({
  avatar: ytv_ren(),
  iconName: ytv_str(enums.IconType),
  label: ytv_str(),
  mayTruncateText: ytv_bol()
}))
export const videoMetadataCarouselViewModel = ytv_ren(() => ({
  carouselItems: ytv_arr(ytv_ren()),
  carouselTitles: ytv_arr(ytv_ren())
}))
export const visitAdvertiserLinkViewModel = ytv_ren(() => ({
  interaction: components.adInteraction,
  label: textViewModel,
  loggingDirectives: components.loggingDirectives
}))