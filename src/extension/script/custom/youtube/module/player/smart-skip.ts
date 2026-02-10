import { registerOverlayPage } from '@ext/common/preload/overlay'
import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { getYTConfigBool, getYTConfigInt, registerYTConfigMenuItemGroup, setYTConfigInt, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import YTSkipSegmentPage from '@ext/custom/youtube/pages/skip-segments'
import { encodeEntityKey } from '@ext/custom/youtube/proto/entity-key'
import { digestSHA256 } from '@ext/custom/youtube/utils/crypto'
import { floor, min } from '@ext/global/math'
import { fetch } from '@ext/global/network'
import { keys } from '@ext/global/object'
import { Mutex } from '@ext/lib/async'
import { bufferFromString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import van, { State } from 'vanjs-core'

const logger = new Logger('YTPLAYER-SKIP')

const enum YTAutoSkipCategoryMask {
  SPONSOR = 0x001,
  SELFPROMO = 0x002,
  INTERACTION = 0x004,
  INTRO = 0x008,
  OUTRO = 0x010,
  PREVIEW = 0x020,
  HOOK = 0x040,
  FILLER = 0x080
}

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

const AUTO_SKIP_CATEGORY_KEY = 'auto-skip-category'
const DB_API_HOST = 'https://sponsor.ajay.app'
const SKIP_SEGMENT_BASE_ID = 1000
const SKIP_SEGMENT_OVERLAP_MERGE_THRESHOLD = 5e3
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
const SKIP_SEGMENT_CATEGORIES = {
  sponsor: YTAutoSkipCategoryMask.SPONSOR,
  selfpromo: YTAutoSkipCategoryMask.SELFPROMO,
  interaction: YTAutoSkipCategoryMask.INTERACTION,
  intro: YTAutoSkipCategoryMask.INTRO,
  outro: YTAutoSkipCategoryMask.OUTRO,
  preview: YTAutoSkipCategoryMask.PREVIEW,
  hook: YTAutoSkipCategoryMask.HOOK,
  filler: YTAutoSkipCategoryMask.FILLER
} satisfies Record<string, YTAutoSkipCategoryMask>

const segmentEntriesCacheMap = new Map<string, SkipSegmentEntry[]>()
const segmentFetchMutex = new Mutex()

let lastLoadedVideoId: string | null = null
let state: State<SkipSegmentEntry[]> | null = null

const getSkipSegmentEntityKey = (id: number): string => encodeEntityKey({
  entityId: `SMART_SKIP_${id}`
})

const buildInnertubeCommand = (innertubeCommand: YTValueData<{ type: YTValueType.ENDPOINT }>): YTValueData<{ type: YTValueType.ENDPOINT }> => {
  return { innertubeCommand }
}

const buildChangeMarkersVisibilityCommand = (entityKey: string, isVisible: boolean): YTValueData<{ type: YTValueType.ENDPOINT }> => {
  return buildInnertubeCommand({
    changeMarkersVisibilityCommand: {
      entityKeys: [entityKey],
      isVisible,
      visibilityRestrictionMode: isVisible ? 'CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_NOT_OVERWRITE_SAME_TYPE' : 'CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_UNKNOWN'
    }
  })
}

const buildChangeTimelyActionVisibilityCommand = (id: number, isVisible: boolean): YTValueData<{ type: YTValueType.ENDPOINT }> => {
  return buildInnertubeCommand({
    changeTimelyActionVisibilityCommand: {
      id: id.toString(),
      isVisible
    }
  })
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
                      popup: { overlayToastRenderer: { title: { simpleText: title } } },
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

const buildAutoTimelyActionFromSegmentEntry = (entry: SkipSegmentEntry): YTValueData<{ type: YTValueType.RENDERER }> => {
  const { videoId, segmentId, startTimeMs, endTimeMs, category } = entry

  const title = ['Auto skipped', category ?? 'unknown', 'segment', `(${floor((endTimeMs - startTimeMs) / 1e3)}s)`].join(' ')

  return {
    timelyActionViewModel: {
      cueRangeId: (SKIP_SEGMENT_BASE_ID + segmentId).toString(),
      startTimeMilliseconds: startTimeMs.toString(),
      endTimeMilliseconds: endTimeMs.toString(),
      maxShowCount: 1,
      onCueRangeEnter: {
        serialCommand: {
          commands: [
            buildInnertubeCommand({ seekToVideoTimestampCommand: { videoId, offsetFromVideoStartMilliseconds: endTimeMs.toString() } }),
            buildInnertubeCommand({
              openPopupAction: {
                popup: {
                  notificationActionRenderer: { responseText: { simpleText: title } },
                  overlayToastRenderer: { title: { simpleText: title } }
                },
                popupType: 'TOAST'
              }
            })
          ]
        }
      }
    }
  }
}

const buildManualTimelyActionFromSegmentEntry = (entry: SkipSegmentEntry): YTValueData<{ type: YTValueType.RENDERER }> => {
  const { videoId, segmentId, startTimeMs, endTimeMs, category } = entry

  const duration = endTimeMs - startTimeMs
  const entityKey = getSkipSegmentEntityKey(segmentId)
  const title = ['Skip', category ?? 'unknown', 'segment', `(${floor(duration / 1e3)}s)`].join(' ')

  return {
    timelyActionViewModel: {
      content: {
        buttonViewModel: {
          ...SKIP_SEGMENT_BUTTON,
          title
        }
      },
      cueRangeId: segmentId.toString(),
      startTimeMilliseconds: startTimeMs.toString(),
      endTimeMilliseconds: endTimeMs.toString(),
      maxVisibleDurationMilliseconds: floor(min(10e3, duration * 0.75)).toString(),
      smartSkipMetadata: {
        markerKey: entityKey
      },
      maxShowCount: 0x7FFFFFFF,
      additionalTrigger: SKIP_SEGMENT_TRIGGERS,
      onCueRangeEnter: buildChangeTimelyActionVisibilityCommand(segmentId, true),
      onCueRangeExit: buildChangeTimelyActionVisibilityCommand(segmentId, false),
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
                buildInnertubeCommand({ seekToVideoTimestampCommand: { videoId, offsetFromVideoStartMilliseconds: endTimeMs.toString() } }),
                buildChangeTimelyActionVisibilityCommand(segmentId, false)
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

      if (startTimeMs > markerStartMs) {
        if ((markerEndMs - startTimeMs) < SKIP_SEGMENT_OVERLAP_MERGE_THRESHOLD) continue
        startTimeMs = markerStartMs
      }
      if (endTimeMs < markerEndMs) {
        if ((endTimeMs - markerStartMs) < SKIP_SEGMENT_OVERLAP_MERGE_THRESHOLD) continue
        endTimeMs = markerEndMs
      }

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

    if (startTimeMs > actionStartMs) {
      if ((actionEndMs - startTimeMs) < SKIP_SEGMENT_OVERLAP_MERGE_THRESHOLD) continue
      startTimeMs = actionStartMs
    }
    if (endTimeMs < actionEndMs) {
      if ((endTimeMs - actionStartMs) < SKIP_SEGMENT_OVERLAP_MERGE_THRESHOLD) continue
      endTimeMs = actionEndMs
    }

    timelyActions.splice(timelyActions.indexOf(action), 1)
  }

  // Ignore segments that are too short
  const duration = endTimeMs - startTimeMs
  if (duration < 5e3) return

  const isAutoSkip = getYTConfigBool(AUTO_SKIP_CATEGORY_KEY, false, SKIP_SEGMENT_CATEGORIES[entry.category! as keyof typeof SKIP_SEGMENT_CATEGORIES] ?? 0)
  if (isAutoSkip) {
    timelyActions.push(buildAutoTimelyActionFromSegmentEntry({ ...entry, startTimeMs, endTimeMs }))
  }
  timelyActions.push(buildManualTimelyActionFromSegmentEntry({ ...entry, startTimeMs, endTimeMs }))
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
    const response = await fetch(`${DB_API_HOST}/api/skipSegments/${hash}?actionType=skip&categories=${JSON.stringify(keys(SKIP_SEGMENT_CATEGORIES))}&trimUUIDs=1`, { signal: controller.signal })
    clearTimeout(timer)

    const data = Array.from<VideoSegmentInfo>(await response.json())

    for (const { videoID, segments } of data) {
      if (!Array.isArray(segments) || segmentEntriesCacheMap.get(videoID)?.length === segments.length) continue

      segmentEntriesCacheMap.set(videoID, segments.filter(segment => segment?.locked || Number(segment?.votes) >= 0).map((s, i) => ({
        videoId: videoID,
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

const updatePlayerOverlayRenderer = (data: YTValueData<YTRenderer.Mapped<'playerOverlayRenderer'>>): void => {
  data.timelyActionsOverlayViewModel ??= { timelyActionsOverlayViewModel: {} }
}

const updateTimelyActionsOverlayViewModel = async (data: YTValueData<YTRenderer.Mapped<'timelyActionsOverlayViewModel'>>): Promise<void> => {
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
}

const processPlayerResponse = async (data: YTValueData<YTResponse.Mapped<'player'>>): Promise<void> => {
  const { videoDetails } = data

  lastLoadedVideoId = videoDetails?.isLive ? null : (videoDetails?.videoId ?? null)

  await fetchSegmentEntries(lastLoadedVideoId)
}

const updateNextResponse = async (data: YTValueData<YTResponse.Mapped<'next'>>): Promise<void> => {
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
}

export default class YTPlayerSmartSkipModule extends Feature {
  public constructor() {
    super('smart-skip')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    state ??= van.state<SkipSegmentEntry[]>([])

    cleanupCallbacks.push(
      registerOverlayPage('Skip Segments', YTSkipSegmentPage.bind(null, { segments: state })),
      registerYTConfigMenuItemGroup(AUTO_SKIP_CATEGORY_KEY, [
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: AUTO_SKIP_CATEGORY_KEY,
          icon: YTRenderer.enums.IconType.MONEY_FILL,
          text: 'Sponsor',
          mask: YTAutoSkipCategoryMask.SPONSOR
        },
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: AUTO_SKIP_CATEGORY_KEY,
          icon: YTRenderer.enums.IconType.PROMOTE,
          text: 'Self promotion',
          mask: YTAutoSkipCategoryMask.SELFPROMO
        },
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: AUTO_SKIP_CATEGORY_KEY,
          icon: YTRenderer.enums.IconType.CHECK_BOX,
          text: 'Interaction',
          mask: YTAutoSkipCategoryMask.INTERACTION
        },
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: AUTO_SKIP_CATEGORY_KEY,
          icon: YTRenderer.enums.IconType.PLAY_ARROW,
          text: 'Intro',
          mask: YTAutoSkipCategoryMask.INTRO
        },
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: AUTO_SKIP_CATEGORY_KEY,
          icon: YTRenderer.enums.IconType.PAUSE_FILLED,
          text: 'Outro',
          mask: YTAutoSkipCategoryMask.OUTRO
        },
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: AUTO_SKIP_CATEGORY_KEY,
          icon: YTRenderer.enums.IconType.SKIP_NEXT,
          text: 'Preview',
          mask: YTAutoSkipCategoryMask.PREVIEW
        },
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: AUTO_SKIP_CATEGORY_KEY,
          icon: YTRenderer.enums.IconType.SKIP_NEXT,
          text: 'Hook',
          mask: YTAutoSkipCategoryMask.HOOK
        },
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: AUTO_SKIP_CATEGORY_KEY,
          icon: YTRenderer.enums.IconType.SKIP_NEXT,
          text: 'Filler',
          mask: YTAutoSkipCategoryMask.FILLER
        }
      ]),
      registerYTValueProcessor(YTRenderer.mapped.playerOverlayRenderer, updatePlayerOverlayRenderer),
      registerYTValueProcessor(YTRenderer.mapped.timelyActionsOverlayViewModel, updateTimelyActionsOverlayViewModel),
      registerYTValueProcessor(YTResponse.mapped.next, updateNextResponse),
      registerYTValueProcessor(YTResponse.mapped.player, processPlayerResponse)
    )

    // Default enable auto skip for sponsor segments
    if (getYTConfigInt(AUTO_SKIP_CATEGORY_KEY, -1) < 0) setYTConfigInt(AUTO_SKIP_CATEGORY_KEY, YTAutoSkipCategoryMask.SPONSOR)

    return true
  }

  protected deactivate(): boolean {
    state = null

    return super.deactivate()
  }
}