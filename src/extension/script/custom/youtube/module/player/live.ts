import { YTSignalActionType } from '@ext/custom/youtube/api/endpoint'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { YTIconType } from '@ext/custom/youtube/api/types/icon'
import { getYTConfigBool, registerYTConfigMenuItem, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { getYTPInstance, YTPInstanceType } from '@ext/custom/youtube/module/player/bootstrap'
import { abs, max, min, round } from '@ext/global/math'
import { defineProperty } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'

const LIVE_BEHAVIOUR_KEY = 'live-behaviour'
const HEALTH_AVG_SAMPLE_SIZE = 20
const HEALTH_DEV_MUL = 1.05
const HEALTH_DEV_DECAY_MUL = 0.95
const LATENCY_AVG_SAMPLE_SIZE = 8
const LATENCY_STEP = 100
const LATENCY_TOLERANCE = 50
const SYNC_INTERVAL = 250
const MIN_SYNC_RATE = 0.95
const MAX_SYNC_RATE = 1.05

const CONFIG_DISABLE_TEXT = 'Disable (Default Behaviour)'
const CONFIG_ENABLE_TEXT = 'Enable'

export const enum YTLiveBehaviourMask {
  LOW_LATENCY = 0x01,
  FORCE_DVR = 0x02
}

let lastSyncLiveHeadTime = 0
let syncLiveHeadDeltaTime = 0
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
  const delta = max(1, now - lastSyncLiveHeadTime)

  syncLiveHeadDeltaTime = (syncLiveHeadDeltaTime + delta) / 2
  lastSyncLiveHeadTime = now

  if (!isYTLiveBehaviourEnabled(YTLiveBehaviourMask.LOW_LATENCY)) return

  const player = getYTPInstance(YTPInstanceType.APP)?.playerRef?.deref()
  if (player == null || !player.isPlaying?.()) return

  if (!player.isAtLiveHead?.()) {
    // Attempt to catch back up to live head if buffer health was too bad and we went out of live head range
    if (desyncTime < 0) desyncTime = now
    if ((now - desyncTime) < (syncLiveHeadDeltaTime * 2)) {
      player.setPlaybackRate?.(MAX_SYNC_RATE)
      return
    }

    // Reset playback rate if not at live head
    const playbackRate = Number(player.getPlaybackRate?.())
    if (isNaN(playbackRate) || playbackRate === 1 || playbackRate < MIN_SYNC_RATE || playbackRate > MAX_SYNC_RATE) return

    player.setPlaybackRate?.(1)
    return
  }

  const currentHealth = Number(player.getBufferHealth?.()) * 1e3
  const currentLatency = Number(player.getRawLiveLatency?.()) * 1e3
  if (isNaN(currentHealth) || isNaN(currentLatency)) return

  if (desyncTime >= 0) desyncTime = -1

  healthAvg = ((healthAvg * (HEALTH_AVG_SAMPLE_SIZE - 1)) + currentHealth) / HEALTH_AVG_SAMPLE_SIZE
  healthDev = max(healthDev * HEALTH_DEV_DECAY_MUL, abs(currentHealth - healthAvg) * HEALTH_DEV_MUL)
  latencyAvg = ((latencyAvg * (LATENCY_AVG_SAMPLE_SIZE - 1)) + currentLatency) / LATENCY_AVG_SAMPLE_SIZE

  const targetHealth = max(syncLiveHeadDeltaTime * 2, healthDev) + healthDev

  let targetLatency: number
  switch (true) {
    case healthAvg > (targetHealth + healthDev):
      // Decrease latency if buffer health is sufficient
      targetLatency = (round(latencyAvg / LATENCY_STEP) - 1) * LATENCY_STEP
      break
    case healthAvg < (targetHealth - healthDev):
      // Increase latency if buffer health is insufficient
      targetLatency = (round(latencyAvg / LATENCY_STEP) + 1) * LATENCY_STEP
      break
    default:
      // Use current latency by default
      targetLatency = round(latencyAvg / LATENCY_STEP) * LATENCY_STEP
      break
  }

  const latencyDelta = currentLatency - targetLatency
  latencyDeltaAvg = ((latencyDeltaAvg * (LATENCY_AVG_SAMPLE_SIZE - 1)) + latencyDelta) / LATENCY_AVG_SAMPLE_SIZE

  const playbackRate = abs(latencyDeltaAvg) < LATENCY_TOLERANCE ? 1 : max(MIN_SYNC_RATE, min(MAX_SYNC_RATE, (syncLiveHeadDeltaTime + latencyDelta) / syncLiveHeadDeltaTime))
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

const updatePlayerResponse = (data: YTRendererData<YTRenderer<'playerResponse'>>): boolean => {
  const playerConfig = data.playerConfig
  const videoDetails = data.videoDetails

  if (playerConfig == null || !videoDetails?.isLive) return true

  if (isYTLiveBehaviourEnabled(YTLiveBehaviourMask.LOW_LATENCY)) {
    videoDetails.isLowLatencyLiveStream = true

    const startMinReadaheadPolicy = playerConfig.mediaCommonConfig?.serverPlaybackStartConfig?.playbackStartPolicy?.startMinReadaheadPolicy
    if (startMinReadaheadPolicy != null && startMinReadaheadPolicy.length > 0) {
      startMinReadaheadPolicy.forEach(policy => policy.minReadaheadMs ??= 50)
    }
  }

  if (isYTLiveBehaviourEnabled(YTLiveBehaviourMask.FORCE_DVR) && !videoDetails.isLiveDvrEnabled) {
    videoDetails.isLiveDvrEnabled = true

    if (playerConfig.mediaCommonConfig?.useServerDrivenAbr && playerConfig.daiConfig == null) {
      playerConfig.daiConfig = {
        daiType: 'DAI_TYPE_CLIENT_STITCHED',
        enableDai: true
      }
    }
  }

  return true
}

export default class YTPlayerLiveModule extends Feature {
  public constructor() {
    super('live')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)

    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: LIVE_BEHAVIOUR_KEY,
      disabledIcon: YTIconType.CLOCK,
      disabledText: `Live Low Latency: ${CONFIG_DISABLE_TEXT}`,
      enabledIcon: YTIconType.CLOCK,
      enabledText: `Live Low Latency: ${CONFIG_ENABLE_TEXT}`,
      defaultValue: false,
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE],
      mask: YTLiveBehaviourMask.LOW_LATENCY
    })
    registerYTConfigMenuItem({
      type: YTConfigMenuItemType.TOGGLE,
      key: LIVE_BEHAVIOUR_KEY,
      disabledIcon: YTIconType.CLOCK,
      disabledText: `Live DVR: ${CONFIG_DISABLE_TEXT}`,
      enabledIcon: YTIconType.CLOCK,
      enabledText: `Live DVR: ${CONFIG_ENABLE_TEXT}`,
      defaultValue: false,
      signals: [YTSignalActionType.POPUP_BACK, YTSignalActionType.SOFT_RELOAD_PAGE],
      mask: YTLiveBehaviourMask.FORCE_DVR
    })

    lastSyncLiveHeadTime = Date.now()
    syncLiveHeadDeltaTime = SYNC_INTERVAL
    setInterval(liveHeadUpdate, SYNC_INTERVAL)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}