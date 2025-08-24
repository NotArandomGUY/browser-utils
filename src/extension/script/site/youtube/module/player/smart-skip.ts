import { floor, max } from '@ext/global/math'
import { Mutex } from '@ext/lib/async'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { registerOverlayPage } from '@ext/overlay'
import { YTEntityMutationSchema } from '@ext/site/youtube/api/endpoint'
import EntityKey from '@ext/site/youtube/api/proto/entity-key'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { YTObjectData, YTValueData, YTValueType } from '@ext/site/youtube/api/types/common'
import YTSkipSegmentPage from '@ext/site/youtube/pages/skip-segments'
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
} satisfies YTRendererData<YTRenderer<'buttonViewModel'>>
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
] satisfies YTRendererData<YTRenderer<'timelyActionViewModel'>>['additionalTrigger']

const segmentEntriesCacheMap = new Map<string, SkipSegmentEntry[]>()
const segmentFetchMutex = new Mutex()

let lastLoadedVideoId: string | null = null
let state: State<SkipSegmentEntry[]> | null = null

const getSkipSegmentEntityKey = (id: number): string => {
  const buffer = new EntityKey({
    key: `SMART_SKIP_${id}`
  }).serialize()

  return encodeURIComponent(btoa(new Array(buffer.length).fill(0).map((_, i) => String.fromCharCode(buffer[i])).join('')))
}

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

    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(videoId)))).map(b => b.toString(16).padStart(2, '0')).join('')

    logger.debug('fetching skip segments for video:', videoId, hash)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const rsp = await fetch(`${DB_API_HOST}/api/skipSegments/${hash.slice(0, 4)}?actionType=skip&trimUUIDs=1`, { signal: controller.signal })
    clearTimeout(timer)

    const data = Array.from<VideoSegmentInfo>(await rsp.json())

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

const processPlayerResponse = async (data: YTRendererData<YTRenderer<'playerResponse'>>): Promise<boolean> => {
  lastLoadedVideoId = data.videoDetails?.videoId ?? null

  await fetchSegmentEntries(lastLoadedVideoId)

  return true
}

const updateNextResponse = async (data: YTRendererData<YTRenderer<'nextResponse'>>): Promise<boolean> => {
  const entries = await fetchSegmentEntries(lastLoadedVideoId)

  data.onResponseReceivedEndpoints ??= []
  data.onResponseReceivedEndpoints.push({
    loadMarkersCommand: {
      entityKeys: entries.map(entry => getSkipSegmentEntityKey(entry.segmentId))
    }
  })

  data.frameworkUpdates ??= {}
  data.frameworkUpdates.entityBatchUpdate ??= {}
  data.frameworkUpdates.entityBatchUpdate.mutations ??= []
  data.frameworkUpdates.entityBatchUpdate.mutations.push(...entries.map(entry => ({
    entityKey: getSkipSegmentEntityKey(entry.segmentId),
    type: 'ENTITY_MUTATION_TYPE_REPLACE',
    payload: {
      macroMarkersListEntity: {
        key: getSkipSegmentEntityKey(entry.segmentId),
        markersList: {
          markerType: 'MARKER_TYPE_TIMESTAMPS',
          markers: [
            {
              sourceType: 'SOURCE_TYPE_SMART_SKIP',
              startMillis: entry.endTimeMs.toString(),
              durationMillis: '0'
            }
          ]
        }
      }
    }
  } satisfies YTObjectData<typeof YTEntityMutationSchema>)))

  return true
}

const updatePlayerOverlayRenderer = (data: YTRendererData<YTRenderer<'playerOverlayRenderer'>>): boolean => {
  data.timelyActionsOverlayViewModel ??= { timelyActionsOverlayViewModel: {} }

  return true
}

const updateTimelyActionsOverlayViewModel = async (data: YTRendererData<YTRenderer<'timelyActionsOverlayViewModel'>>): Promise<boolean> => {
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

export default class YTPlayerSmartSkipModule extends Feature {
  public constructor() {
    super('smart-skip')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['nextResponse'], updateNextResponse)
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], processPlayerResponse)
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerOverlayRenderer'], updatePlayerOverlayRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['timelyActionsOverlayViewModel'], updateTimelyActionsOverlayViewModel)

    state = van.state<SkipSegmentEntry[]>([])

    registerOverlayPage('Skip Segments', YTSkipSegmentPage.bind(null, { segments: state }))

    return true
  }

  protected deactivate(): boolean {
    state = null

    return false
  }
}