import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { getYTConfigBool, registerYTConfigMenuItemGroup, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { getYTPInstance, YTPInstanceType } from '@ext/custom/youtube/module/player/bootstrap'
import { abs, max, min, round } from '@ext/global/math'
import { defineProperty } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'

const LIVE_BEHAVIOUR_KEY = 'live-behaviour'
const SYNC_INTERVAL = 50
const MIN_SYNC_RATE = 0.95
const MAX_SYNC_RATE = 1.05
const HEALTH_AVG_SAMPLE_SIZE = (1e3 / SYNC_INTERVAL) * 5 // ~5s of samples
const HEALTH_DEV_MUL = 1.05
const HEALTH_DEV_DECAY_MUL = 1 - ((SYNC_INTERVAL / 5e3) * 0.05) // decay 5% over 5s
const LATENCY_AVG_SAMPLE_SIZE = (1e3 / SYNC_INTERVAL) * 2 // ~2s of samples
const LATENCY_STEP = 100
const LATENCY_TOLERANCE = 50
const MAX_DESYNC_TICKS = Math.ceil(30e3 / SYNC_INTERVAL) // 30s of recovery time before giving up

export const enum YTLiveBehaviourMask {
  LOW_LATENCY = 0x01,
  FORCE_DVR = 0x02
}

let liveHeadUpdateTimer: ReturnType<typeof setInterval> | null = null
let lastLiveHeadUpdateTime = 0
let liveHeadUpdateDeltaTime = 0

let healthAvg = 0
let healthDev = 0
let latencyAvg = 0
let latencyDeltaAvg = 0
let desyncTime = -1

export const isYTLiveBehaviourEnabled = (mask: YTLiveBehaviourMask): boolean => {
  return getYTConfigBool(LIVE_BEHAVIOUR_KEY, false, mask)
}

const liveHeadUpdate = (): void => {
  const now = Date.now()
  const delta = max(1, now - lastLiveHeadUpdateTime)

  liveHeadUpdateDeltaTime = (liveHeadUpdateDeltaTime + delta) / 2
  lastLiveHeadUpdateTime = now

  const player = getYTPInstance(YTPInstanceType.APP)?.playerRef?.deref()
  if (player == null || !player.isPlaying?.()) return

  healthDev *= HEALTH_DEV_DECAY_MUL

  if (!player.isAtLiveHead?.()) {
    // Attempt to catch back up to live head if buffer health was too bad and we went out of live head range
    if (desyncTime < 0) desyncTime = now
    if ((now - desyncTime) < (liveHeadUpdateDeltaTime * MAX_DESYNC_TICKS)) player.setPlaybackRate?.(MAX_SYNC_RATE)
    return
  }

  const currentHealth = Number(player.getBufferHealth?.()) * 1e3
  const currentLatency = Number(player.getRawLiveLatency?.()) * 1e3
  if (isNaN(currentHealth) || isNaN(currentLatency) || !isFinite(currentLatency)) return

  if (desyncTime >= 0) desyncTime = -1

  healthAvg = ((healthAvg * (HEALTH_AVG_SAMPLE_SIZE - 1)) + currentHealth) / HEALTH_AVG_SAMPLE_SIZE
  healthDev = max(healthDev, abs(currentHealth - healthAvg) * HEALTH_DEV_MUL)
  latencyAvg = ((latencyAvg * (LATENCY_AVG_SAMPLE_SIZE - 1)) + currentLatency) / LATENCY_AVG_SAMPLE_SIZE

  const targetHealth = max(liveHeadUpdateDeltaTime * 2, healthDev) + healthDev

  let targetLatency: number
  switch (true) {
    case healthAvg > (targetHealth + healthDev):
      // Decrease latency if buffer health is sufficient
      targetLatency = (round(latencyAvg / LATENCY_STEP) - 1) * LATENCY_STEP
      break
    case healthAvg < (targetHealth - healthDev) && (now - desyncTime) >= (liveHeadUpdateDeltaTime * MAX_DESYNC_TICKS):
      // Increase latency if buffer health is insufficient and wasn't catching up from desync
      targetLatency = (round(latencyAvg / LATENCY_STEP) + 1) * LATENCY_STEP
      break
    default:
      // Use current latency by default
      targetLatency = round(latencyAvg / LATENCY_STEP) * LATENCY_STEP
      break
  }

  const latencyDelta = currentLatency - targetLatency
  latencyDeltaAvg = ((latencyDeltaAvg * (LATENCY_AVG_SAMPLE_SIZE - 1)) + latencyDelta) / LATENCY_AVG_SAMPLE_SIZE

  const playbackRate = abs(latencyDeltaAvg) < LATENCY_TOLERANCE ? 1 : max(MIN_SYNC_RATE, min(MAX_SYNC_RATE, (liveHeadUpdateDeltaTime + latencyDelta) / liveHeadUpdateDeltaTime))
  player.setPlaybackRate?.(playbackRate)

  defineProperty(window, 'ytp_live_head', {
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

const startLiveHeadUpdate = (): void => {
  if (liveHeadUpdateTimer != null) return

  lastLiveHeadUpdateTime = Date.now()
  liveHeadUpdateDeltaTime = SYNC_INTERVAL
  liveHeadUpdateTimer = setInterval(liveHeadUpdate, SYNC_INTERVAL)
}

const stopLiveHeadUpdate = (): void => {
  if (liveHeadUpdateTimer == null) return

  clearInterval(liveHeadUpdateTimer)
  liveHeadUpdateTimer = null

  const player = getYTPInstance(YTPInstanceType.APP)?.playerRef?.deref()
  if (player == null) return

  // Reset playback rate for normal playback
  player.setPlaybackRate?.(1)
}

const updatePlayerResponse = (data: YTValueData<YTResponse.Mapped<'player'>>): void => {
  const playerConfig = data.playerConfig
  const videoDetails = data.videoDetails

  if (playerConfig == null || !videoDetails?.isLive) return stopLiveHeadUpdate()

  if (isYTLiveBehaviourEnabled(YTLiveBehaviourMask.LOW_LATENCY)) {
    videoDetails.isLowLatencyLiveStream = true

    const playbackStartPolicy = playerConfig.mediaCommonConfig?.serverPlaybackStartConfig?.playbackStartPolicy
    playbackStartPolicy?.resumeMinReadaheadPolicy?.forEach(policy => policy.minReadaheadMs = 50)
    playbackStartPolicy?.startMinReadaheadPolicy?.forEach(policy => policy.minReadaheadMs = 50)

    startLiveHeadUpdate()
  }

  if (isYTLiveBehaviourEnabled(YTLiveBehaviourMask.FORCE_DVR) && !videoDetails.isLiveDvrEnabled) {
    videoDetails.isLiveDvrEnabled = true

    if (playerConfig.mediaCommonConfig?.useServerDrivenAbr) {
      playerConfig.mediaCommonConfig.useServerDrivenAbr = false
      playerConfig.daiConfig ??= {
        daiType: 'DAI_TYPE_CLIENT_STITCHED',
        enableDai: true
      }
    }
  }
}

export default class YTPlayerLiveModule extends Feature {
  public constructor() {
    super('live')
  }

  protected activate(): boolean {
    registerYTValueProcessor(YTResponse.mapped.player, updatePlayerResponse)

    registerYTConfigMenuItemGroup('live-stream', [
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: LIVE_BEHAVIOUR_KEY,
        icon: YTRenderer.enums.IconType.CLOCK,
        text: 'Low Latency',
        description: 'Actively adjust playback rate to achieve lowest possible latency based on buffer health',
        mask: YTLiveBehaviourMask.LOW_LATENCY,
        signals: [YTEndpoint.enums.SignalActionType.POPUP_BACK, YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE]
      },
      {
        type: YTConfigMenuItemType.TOGGLE,
        key: LIVE_BEHAVIOUR_KEY,
        icon: YTRenderer.enums.IconType.FAST_REWIND,
        text: 'Force DVR',
        description: 'Enable seeking for livestream even if it was disabled by the creator (might affect latency)',
        mask: YTLiveBehaviourMask.FORCE_DVR,
        signals: [YTEndpoint.enums.SignalActionType.POPUP_BACK, YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE]
      }
    ])

    return true
  }

  protected deactivate(): boolean {
    stopLiveHeadUpdate()

    return false
  }
}