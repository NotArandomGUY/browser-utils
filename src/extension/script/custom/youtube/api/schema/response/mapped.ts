import { ytv_enp, ytv_ren, ytv_rsp } from '../define/extended'
import { ytv_arr, ytv_bol, ytv_num, ytv_sch, ytv_str } from '../define/primitive'

import * as renderer from '../renderer'
import * as components from './components'

// Normal response
export const browse = ytv_rsp(() => ({
  contents: ytv_ren(),
  continuationContents: components.continuationContents,
  header: ytv_ren(),
  metadata: ytv_ren(),
  microformat: ytv_ren(),
  sidebar: ytv_ren(),
  topbar: ytv_ren()
}))
export const browseEditPlaylist = ytv_rsp(() => ({
  playlistEditResults: ytv_arr(ytv_sch({
    playlistEditVideoAddedResultData: ytv_sch({
      setVideoId: ytv_str(),
      videoId: ytv_str()
    })
  })),
  status: ytv_str(['STATUS_SUCCEEDED'])
}))
export const guide = ytv_rsp(() => ({
  footer: ytv_ren(),
  items: ytv_arr(ytv_ren())
}))
export const liveChatGetLiveChatReplay = ytv_rsp(() => ({
  continuationContents: components.continuationContents
}))
export const liveChatGetLiveChat = ytv_rsp(() => ({
  continuationContents: components.continuationContents,
  liveChatStreamingResponseExtension: ytv_sch({
    lastPublishAtUsec: ytv_str()
  })
}))
export const next = ytv_rsp(() => ({
  adEngagementPanels: ytv_arr(ytv_ren()),
  cards: ytv_ren(),
  contents: ytv_ren(),
  currentVideoEndpoint: ytv_enp(),
  engagementPanels: ytv_arr(ytv_ren()),
  mdxExpandedVideoList: ytv_sch({
    videoIds: ytv_arr(ytv_str())
  }),
  pageVisualEffects: ytv_arr(ytv_ren()),
  playerOverlays: ytv_ren(),
  queueContextParams: ytv_str(),
  survey: ytv_ren(),
  topbar: ytv_ren(),
  transportControls: ytv_ren(),
  videoReporting: ytv_ren()
}))
export const notificationGetUnseenCount = ytv_rsp(() => ({}))
export const offlineGetDownloadAction = ytv_rsp(() => ({}))
export const offlineGetPlaybackDataEntity = ytv_rsp(() => ({
  orchestrationActions: ytv_arr(ytv_sch({
    actionMetadata: ytv_sch({
      priority: ytv_num(),
      transferEntityActionMetadata: ytv_sch({
        isEnqueuedForPes: ytv_bol(),
        maximumDownloadQuality: ytv_str()
      })
    }),
    actionType: ytv_str(['OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD', 'OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE', 'OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH']),
    entityKey: ytv_str()
  }))
}))
export const offline = ytv_rsp(() => ({
  playlists: ytv_arr(ytv_ren()),
  videos: ytv_arr(ytv_ren())
}))
export const player = ytv_rsp(() => ({
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
  cotn: ytv_str(),
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
  playabilityStatus: renderer.components.playerPlayabilityStatus,
  playbackTracking: renderer.components.playerPlaybackTracking,
  playerAds: ytv_arr(ytv_ren()),
  playerConfig: renderer.components.playerConfig,
  storyboards: ytv_ren(),
  streamingData: renderer.components.playerStreamingData,
  videoDetails: renderer.components.playerVideoDetails
}))
export const playerHeartbeat = ytv_rsp(() => ({
  adBreakHeartbeatParams: ytv_str(),
  heartbeatServerData: ytv_str(),
  playabilityStatus: renderer.components.playerPlayabilityStatus,
  pollDelayMs: ytv_str()
}))
export const reelReelItemWatch = ytv_rsp(() => ({
  background: ytv_ren(),
  engagementPanels: ytv_arr(ytv_ren()),
  overlay: ytv_ren(),
  replacementEndpoint: ytv_enp(),
  sequenceContinuation: ytv_str(),
  status: ytv_str(['REEL_ITEM_WATCH_STATUS_SUCCEEDED']),
  tooltip: ytv_ren(), // NOTE: actually an unknown type
  topbar: ytv_ren()
}))
export const reelReelWatchSequence = ytv_rsp(() => ({
  continuationEndpoint: ytv_enp(),
  entries: ytv_arr(ytv_ren())
}))
export const search = ytv_rsp(() => ({
  contents: ytv_ren(),
  estimatedResults: ytv_str(),
  header: ytv_ren(),
  refinements: ytv_arr(ytv_str()),
  targetId: ytv_str(),
  topbar: ytv_ren()
}))
export const shareGetSharePanel = ytv_rsp(() => ({
}))
export const updatedMetadata = ytv_rsp(() => ({
  continuation: renderer.components.continuation
}))

// Streaming response
export const getWatch = ytv_rsp(() => ({
  responseType: ytv_str(['STREAMING_WATCH_RESPONSE_TYPE_PLAYER_RESPONSE', 'STREAMING_WATCH_RESPONSE_TYPE_WATCH_NEXT_RESPONSE']),
  subStreamResponseCompleted: ytv_bol(),
  playerResponse: player,
  watchNextResponse: next
}))