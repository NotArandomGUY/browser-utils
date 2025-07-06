import { Feature } from '@ext/lib/feature'
import { YTSignalActionType } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { YTIconType } from '@ext/site/youtube/api/types/icon'
import { getYTConfigInt, registerYTConfigMenuItem, YTConfigMenuItemType } from '@ext/site/youtube/module/core/config'
import { getYTPInstance, YTPInstanceType } from '@ext/site/youtube/module/player/bootstrap'

const LIVE_BEHAVIOUR_KEY = 'live-behaviour'
const HEALTH_AVG_SAMPLE_SIZE = 20
const HEALTH_DEV_MUL = 1.05
const HEALTH_DEV_DECAY_MUL = 0.95
const LATENCY_AVG_SAMPLE_SIZE = 8
const LATENCY_STEP = 100
const LATENCY_TOLERANCE = 50
const SYNC_INTERVAL = 250
const MIN_SYNC_RATE = 0.9
const MAX_SYNC_RATE = 1.1

let lastSyncLiveHeadTime = 0
let syncLiveHeadDeltaTime = 0
let healthAvg = 0
let healthDev = 0
let latencyAvg = 0
let latencyDeltaAvg = 0

export function isSyncLiveHeadEnabled(): boolean {
  return getYTConfigInt(LIVE_BEHAVIOUR_KEY, 0) === 1
}

function syncLiveHeadUpdate(): void {
  const now = Date.now()
  const delta = Math.max(1, now - lastSyncLiveHeadTime)

  syncLiveHeadDeltaTime = (syncLiveHeadDeltaTime + delta) / 2
  lastSyncLiveHeadTime = now

  if (!isSyncLiveHeadEnabled()) return

  const player = getYTPInstance(YTPInstanceType.VIDEO_PLAYER)
  if (player == null || !player.isAtLiveHead?.() || !player.isPlaying?.()) return

  const currentHealth = Number(player.getBufferHealth?.()) * 1e3
  const currentLatency = Number(player.getLiveLatency?.()) * 1e3
  if (isNaN(currentHealth) || isNaN(currentLatency)) return

  healthAvg = ((healthAvg * (HEALTH_AVG_SAMPLE_SIZE - 1)) + currentHealth) / HEALTH_AVG_SAMPLE_SIZE
  healthDev = Math.max(healthDev * HEALTH_DEV_DECAY_MUL, Math.abs(currentHealth - healthAvg) * HEALTH_DEV_MUL)
  latencyAvg = ((latencyAvg * (LATENCY_AVG_SAMPLE_SIZE - 1)) + currentLatency) / LATENCY_AVG_SAMPLE_SIZE

  const targetHealth = Math.max(syncLiveHeadDeltaTime * 2, healthDev) + healthDev

  let targetLatency: number
  switch (true) {
    case healthAvg > (targetHealth + healthDev):
      // Decrease latency if buffer health is sufficient
      targetLatency = (Math.round(latencyAvg / LATENCY_STEP) - 1) * LATENCY_STEP
      break
    case healthAvg < (targetHealth - healthDev):
      // Increase latency if buffer health is insufficient
      targetLatency = (Math.round(latencyAvg / LATENCY_STEP) + 1) * LATENCY_STEP
      break
    default:
      // Use current latency by default
      targetLatency = Math.round(latencyAvg / LATENCY_STEP) * LATENCY_STEP
      break
  }

  const latencyDelta = currentLatency - targetLatency
  latencyDeltaAvg = ((latencyDeltaAvg * (LATENCY_AVG_SAMPLE_SIZE - 1)) + latencyDelta) / LATENCY_AVG_SAMPLE_SIZE

  const playbackRate = Math.abs(latencyDeltaAvg) < LATENCY_TOLERANCE ? 1 : Math.max(MIN_SYNC_RATE, Math.min(MAX_SYNC_RATE, (syncLiveHeadDeltaTime + latencyDelta) / syncLiveHeadDeltaTime))
  player.setPlaybackRate?.(playbackRate)

  Object.defineProperty(window, 'ytp_live_head', {
    configurable: true,
    value: {
      healthAvg,
      healthDev,
      latencyDeltaAvg,
      targetHealth,
      targetLatency
    }
  })
}


function updatePlayerResponse(data: YTRendererData<YTRenderer<'playerResponse'>>): boolean {
  const startMinReadaheadPolicy = data.playerConfig?.mediaCommonConfig?.serverPlaybackStartConfig?.playbackStartPolicy?.startMinReadaheadPolicy
  if (startMinReadaheadPolicy != null && startMinReadaheadPolicy.length > 0) {
    startMinReadaheadPolicy.forEach(policy => policy.minReadaheadMs ??= 50)
  }

  return true
}

export default class YTPlayerLiveHeadModule extends Feature {
  public constructor() {
    super('player-live-head')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)

    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: LIVE_BEHAVIOUR_KEY,
      disabledIcon: YTIconType.CLOCK,
      disabledText: 'Live Behaviour: Normal',
      enabledIcon: YTIconType.CLOCK,
      enabledText: 'Live Behaviour: Low Latency',
      defaultValue: false,
      signals: [YTSignalActionType.SOFT_RELOAD_PAGE]
    })

    lastSyncLiveHeadTime = Date.now()
    syncLiveHeadDeltaTime = SYNC_INTERVAL
    setInterval(syncLiveHeadUpdate, SYNC_INTERVAL)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}