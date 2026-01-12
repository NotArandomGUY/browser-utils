import { registerOverlayPage } from '@ext/common/preload/overlay'
import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import YTSkipSegmentPage from '@ext/custom/youtube/pages/skip-segments'
import { encodeEntityKey } from '@ext/custom/youtube/proto/entity-key'
import { digestSHA256 } from '@ext/custom/youtube/utils/crypto'
import { floor, max } from '@ext/global/math'
import { fetch } from '@ext/global/network'
import { Mutex } from '@ext/lib/async'
import { bufferFromString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import van, { State } from 'vanjs-core'

const logger = new Logger('YTPLAYER-SKIP')

export interface SkipSegmentEntry {
  videoId: string
  segmentId: number
  startTimeMs: number
  endTimeMs: number
  category?: string
}

interface VideoSegmentInfo {
  videoID: string
  segments: {
    segment: [number, number]
    UUID: string
    category: string
    actionType: string
    locked: number
    votes: number
    videoDuration: number
    description: string
  }[]
}

const DB_API_HOST = 'https://sponsor.ajay.app'
const SKIP_SEGMENT_BASE_ID = 1000
const SKIP_SEGMENT_BUTTON = {
  iconName: 'fast_forward',
  title: 'Skip segment',
  style: 'BUTTON_VIEW_MODEL_STYLE_OVERLAY',
  type: 'BUTTON_VIEW_MODEL_TYPE_FILLED',
  buttonSize: 'BUTTON_VIEW_MODEL_SIZE_DEFAULT',
  state: 'BUTTON_VIEW_MODEL_STATE_ACTIVE',
  iconPosition: 'BUTTON_VIEW_MODEL_ICON_POSITION_LEADING'
} satisfies YTValueData<YTRenderer.Mapped<'buttonViewModel'>>
const SKIP_SEGMENT_TRIGGERS = [
  {
    type: 'TIMELY_ACTION_TRIGGER_TYPE_KEYBOARD_SEEK',
    args: {
      seekDirection: 'TIMELY_ACTION_TRIGGER_DIRECTION_FORWARD',
      seekLengthMilliseconds: '5000'
    }
  },
  {
    type: 'TIMELY_ACTION_TRIGGER_TYPE_KEYBOARD_SEEK',
    args: {
      seekDirection: 'TIMELY_ACTION_TRIGGER_DIRECTION_FORWARD',
      seekLengthMilliseconds: '10000'
    }
  },
  {
    type: 'TIMELY_ACTION_TRIGGER_TYPE_PROGRESS_BAR_SEEK',
    args: {
      seekDirection: 'TIMELY_ACTION_TRIGGER_DIRECTION_FORWARD'
    }
  },
  {
    type: 'TIMELY_ACTION_TRIGGER_TYPE_PLAYER_CONTROLS_SHOWN'
  },
  {
    type: 'TIMELY_ACTION_TRIGGER_TYPE_SPEEDMASTER'
  }
] satisfies YTValueData<YTRenderer.Mapped<'timelyActionViewModel'>>['additionalTrigger']

const segmentEntriesCacheMap = new Map<string, SkipSegmentEntry[]>()
const segmentFetchMutex = new Mutex()

let lastLoadedVideoId: string | null = null
let state: State<SkipSegmentEntry[]> | null = null

const getSkipSegmentEntityKey = (id: number): string => encodeEntityKey({
  entityId: `SMART_SKIP_${id}`
})

const buildChangeMarkersVisibilityCommand = (entityKey: string, isVisible: boolean): YTValueData<{ type: YTValueType.ENDPOINT }> => {
  return {
    innertubeCommand: {
      changeMarkersVisibilityCommand: {
        entityKeys: [entityKey],
        isVisible,
        visibilityRestrictionMode: isVisible ? 'CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_NOT_OVERWRITE_SAME_TYPE' : 'CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_UNKNOWN'
      }
    }
  }
}

const buildChangeTimelyActionVisibilityCommand = (id: number, isVisible: boolean): YTValueData<{ type: YTValueType.ENDPOINT }> => {
  return {
    innertubeCommand: {
      changeTimelyActionVisibilityCommand: {
        id: id.toString(),
        isVisible
      }
    }
  }
}

const buildMarkerMutationFromSegmentEntry = (entry: SkipSegmentEntry, startTimeMs?: number, endTimeMs?: number): YTValueData<YTEndpoint.Component<'entityMutation'>> => {
  startTimeMs ??= entry.startTimeMs
  endTimeMs ??= entry.endTimeMs

  const duration = endTimeMs - startTimeMs
  const entityKey = getSkipSegmentEntityKey(entry.segmentId)
  const title = ['Skip', entry.category, 'segment', `(${floor(duration / 1e3)}s)`].join(' ')

  return {
    entityKey,
    type: 'ENTITY_MUTATION_TYPE_REPLACE',
    payload: {
      macroMarkersListEntity: {
        externalVideoId: lastLoadedVideoId ?? undefined,
        key: entityKey,
        markersList: {
          markerType: 'MARKER_TYPE_TIMESTAMPS',
          markers: [
            {
              sourceType: 'SOURCE_TYPE_SMART_SKIP',
              startMillis: entry.endTimeMs.toString(),
              durationMillis: '0'
            }
          ],
          markersDecoration: {
            timedMarkerDecorations: [
              {
                visibleTimeRangeStartMillis: endTimeMs,
                visibleTimeRangeEndMillis: endTimeMs,
                label: { simpleText: title }
              }
            ]
          },
          markersMetadata: {
            timestampMarkerMetadata: {
              snappingData: [
                {
                  startMediaTimeMs: startTimeMs,
                  endMediaTimeMs: endTimeMs,
                  targetMediaTimeMs: endTimeMs,
                  maxSnappingCount: 1,
                  snappingLingeringTimeoutMs: 5e3,
                  overseekAllowanceMediaTimeMs: 60e3,
                  onSnappingCommand: {
                    openPopupAction: {
                      popup: {
                        overlayToastRenderer: {
                          title: { simpleText: title }
                        }
                      },
                      popupType: 'TOAST'
                    }
                  },
                  onSnappingAriaLabel: title
                }
              ]
            }
          }
        }
      }
    }
  }
}

const buildTimelyActionFromSegmentEntry = (entry: SkipSegmentEntry, startTimeMs?: number, endTimeMs?: number): YTValueData<{ type: YTValueType.RENDERER }> => {
  startTimeMs ??= entry.startTimeMs
  endTimeMs ??= entry.endTimeMs

  const duration = endTimeMs - startTimeMs
  const entityKey = getSkipSegmentEntityKey(entry.segmentId)
  const title = ['Skip', entry.category, 'segment', `(${floor(duration / 1e3)}s)`].join(' ')

  return {
    timelyActionViewModel: {
      content: {
        buttonViewModel: {
          ...SKIP_SEGMENT_BUTTON,
          title
        }
      },
      cueRangeId: entry.segmentId.toString(),
      startTimeMilliseconds: startTimeMs.toString(),
      endTimeMilliseconds: endTimeMs.toString(),
      maxVisibleDurationMilliseconds: floor(max(3e3, duration * 0.75)).toString(),
      smartSkipMetadata: {
        markerKey: entityKey
      },
      maxShowCount: 0x7FFFFFFF,
      additionalTrigger: SKIP_SEGMENT_TRIGGERS,
      onCueRangeEnter: buildChangeTimelyActionVisibilityCommand(entry.segmentId, true),
      onCueRangeExit: buildChangeTimelyActionVisibilityCommand(entry.segmentId, false),
      rendererContext: {
        accessibilityContext: {
          label: title
        },
        commandContext: {
          onVisible: buildChangeMarkersVisibilityCommand(entityKey, true),
          onHidden: buildChangeMarkersVisibilityCommand(entityKey, false),
          onTap: {
            serialCommand: {
              commands: [
                buildChangeMarkersVisibilityCommand(entityKey, false),
                {
                  innertubeCommand: {
                    seekToVideoTimestampCommand: {
                      videoId: entry.videoId,
                      offsetFromVideoStartMilliseconds: entry.endTimeMs.toString()
                    }
                  }
                },
                buildChangeTimelyActionVisibilityCommand(entry.segmentId, false)
              ]
            }
          }
        }
      }
    }
  }
}

const addMarkerMutationFromSegmentEntry = (mutations: YTValueData<YTEndpoint.Component<'entityMutation'>>[], entry: SkipSegmentEntry): void => {
  let { startTimeMs, endTimeMs } = entry

  // Merge overlapping markers to the same segment
  for (const mutation of mutations) {
    const snappingData = mutation.payload?.macroMarkersListEntity?.markersList?.markersMetadata?.timestampMarkerMetadata?.snappingData
    if (!Array.isArray(snappingData)) continue

    for (const marker of snappingData) {
      const { startMediaTimeMs, endMediaTimeMs } = marker

      const markerStartMs = Number(startMediaTimeMs)
      const markerEndMs = Number(endMediaTimeMs)
      if (isNaN(markerStartMs) || isNaN(markerEndMs) || markerStartMs > endTimeMs || markerEndMs < startTimeMs) continue

      if (startTimeMs > markerStartMs) startTimeMs = markerStartMs
      if (endTimeMs < markerEndMs) endTimeMs = markerEndMs

      snappingData.splice(snappingData.indexOf(marker), 1)
    }

    if (snappingData.length === 0) mutations.splice(mutations.indexOf(mutation), 1)
  }

  // Ignore segments that are too short
  const duration = endTimeMs - startTimeMs
  if (duration < 5e3) return

  mutations.push(buildMarkerMutationFromSegmentEntry(entry))
}

const addTimelyActionFromSegmentEntry = (timelyActions: YTValueData<{ type: YTValueType.RENDERER }>[], entry: SkipSegmentEntry): void => {
  let { startTimeMs, endTimeMs } = entry

  // Merge overlapping actions to the same segment
  for (const action of timelyActions) {
    const { timelyActionViewModel } = action
    if (timelyActionViewModel == null) continue

    const { startTimeMilliseconds, endTimeMilliseconds } = timelyActionViewModel

    const actionStartMs = Number(startTimeMilliseconds)
    const actionEndMs = Number(endTimeMilliseconds)
    if (isNaN(actionStartMs) || isNaN(actionEndMs) || actionStartMs > endTimeMs || actionEndMs < startTimeMs) continue

    if (startTimeMs > actionStartMs) startTimeMs = actionStartMs
    if (endTimeMs < actionEndMs) endTimeMs = actionEndMs

    timelyActions.splice(timelyActions.indexOf(action), 1)
  }

  // Ignore segments that are too short
  const duration = endTimeMs - startTimeMs
  if (duration < 5e3) return

  timelyActions.push(buildTimelyActionFromSegmentEntry(entry, startTimeMs, endTimeMs))
}

const fetchSegmentEntries = async (videoId: string | null): Promise<SkipSegmentEntry[]> => {
  await segmentFetchMutex.lock()
  try {
    if (videoId == null) return []

    let entries = segmentEntriesCacheMap.get(videoId)
    if (entries != null) return entries

    const hash = Array.from(await digestSHA256(bufferFromString(videoId), 2)).map(b => b.toString(16).padStart(2, '0')).join('')
    if (hash.length === 0) return []

    logger.debug('fetching skip segments for video:', videoId, hash)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const response = await fetch(`${DB_API_HOST}/api/skipSegments/${hash}?actionType=skip&trimUUIDs=1`, { signal: controller.signal })
    clearTimeout(timer)

    const data = Array.from<VideoSegmentInfo>(await response.json())

    for (const info of data) {
      if (segmentEntriesCacheMap.get(info.videoID)?.length === info.segments?.length) continue

      segmentEntriesCacheMap.set(info.videoID, info.segments?.map?.((s, i) => ({
        videoId: info.videoID,
        segmentId: SKIP_SEGMENT_BASE_ID + i,
        startTimeMs: s.segment[0] * 1e3,
        endTimeMs: s.segment[1] * 1e3,
        category: s.category || undefined
      })) ?? [])
    }

    entries = segmentEntriesCacheMap.get(videoId)
    if (entries == null) {
      entries = []
      segmentEntriesCacheMap.set(videoId, entries)
    }

    logger.debug('skip segments for video:', videoId, entries)

    return entries
  } catch (error) {
    logger.warn('fetch skip segments error:', error)
    return []
  } finally {
    segmentFetchMutex.unlock()
  }
}

const updatePlayerOverlayRenderer = (data: YTValueData<YTRenderer.Mapped<'playerOverlayRenderer'>>): boolean => {
  data.timelyActionsOverlayViewModel ??= { timelyActionsOverlayViewModel: {} }

  return true
}

const updateTimelyActionsOverlayViewModel = async (data: YTValueData<YTRenderer.Mapped<'timelyActionsOverlayViewModel'>>): Promise<boolean> => {
  const entries = await fetchSegmentEntries(lastLoadedVideoId)

  let timelyActions = data.timelyActions
  if (!Array.isArray(timelyActions)) {
    timelyActions = []
    data.timelyActions = timelyActions
  }

  for (const entry of entries) {
    addTimelyActionFromSegmentEntry(timelyActions, entry)
  }

  if (state != null) state.val = entries

  return true
}

const processPlayerResponse = async (data: YTValueData<YTResponse.Mapped<'player'>>): Promise<boolean> => {
  lastLoadedVideoId = data.videoDetails?.videoId ?? null

  await fetchSegmentEntries(lastLoadedVideoId)

  return true
}

const updateNextResponse = async (data: YTValueData<YTResponse.Mapped<'next'>>): Promise<boolean> => {
  const entries = await fetchSegmentEntries(lastLoadedVideoId)

  data.frameworkUpdates ??= {}
  data.frameworkUpdates.entityBatchUpdate ??= {}

  let mutations = data.frameworkUpdates.entityBatchUpdate.mutations
  if (!Array.isArray(mutations)) {
    mutations = []
    data.frameworkUpdates.entityBatchUpdate.mutations = mutations
  }

  for (const entry of entries) {
    addMarkerMutationFromSegmentEntry(mutations, entry)
  }

  const entityKeys = entries.map(entry => getSkipSegmentEntityKey(entry.segmentId))

  if (data.onUiReady == null || data.onUiReady.loadMarkersCommand != null) {
    data.onUiReady = { loadMarkersCommand: { entityKeys: [...data.onUiReady?.loadMarkersCommand?.entityKeys ?? [], ...entityKeys] } }
  } else {
    data.onResponseReceivedEndpoints ??= []
    data.onResponseReceivedEndpoints.push({ loadMarkersCommand: { entityKeys } })
  }

  return true
}

export default class YTPlayerSmartSkipModule extends Feature {
  public constructor() {
    super('smart-skip')
  }

  protected activate(): boolean {
    registerYTValueProcessor(YTRenderer.mapped.playerOverlayRenderer, updatePlayerOverlayRenderer)
    registerYTValueProcessor(YTRenderer.mapped.timelyActionsOverlayViewModel, updateTimelyActionsOverlayViewModel)
    registerYTValueProcessor(YTResponse.mapped.next, updateNextResponse)
    registerYTValueProcessor(YTResponse.mapped.player, processPlayerResponse)

    state = van.state<SkipSegmentEntry[]>([])

    registerOverlayPage('Skip Segments', YTSkipSegmentPage.bind(null, { segments: state }))

    return true
  }

  protected deactivate(): boolean {
    state = null

    return false
  }
}