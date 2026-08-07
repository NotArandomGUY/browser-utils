import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { getYTConfigBool, registerYTConfigMenuItemGroup, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { YTPApp, YTPObjectCreateCallback, YTPObjectType, YTPVideoPlayer, YTPVideoPlayerSymbol } from '@ext/custom/youtube/module/player/bootstrap'
import { abs, max, min, round } from '@ext/global/math'
import { defineProperty } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import van from 'vanjs-core'

const { div, span } = van.tags

const LIVE_BEHAVIOUR_KEY = 'live-behaviour'
const SYNC_INTERVAL = 50
const MIN_SYNC_RATE = 0.95
const MAX_SYNC_RATE = 1.05
// most livestream have a 5s segment length, wait for roughly 3 segments, maybe adjust this per stream in the future?
const BUFFER_AVG_SAMPLE_SIZE = (1e3 / SYNC_INTERVAL) * 15 // ~15s of samples
const BUFFER_DEV_MUL = 1.05
const BUFFER_DEV_DECAY_MUL = 1 - ((SYNC_INTERVAL / 5e3) * 0.05) // decay 5% over 5s
const BUFFER_MIN_DECAY_MUL = 0.975
const LATENCY_AVG_SAMPLE_SIZE = (1e3 / SYNC_INTERVAL) * 2 // ~2s of samples
const LATENCY_STEP = 100
const LATENCY_TOLERANCE = 50

const ActiveLiveHeadSymbol = Symbol()

export const enum YTLiveBehaviourMask {
  LOW_LATENCY = 0x01,
  FORCE_DVR = 0x02
}

const enum ActiveLiveHeadState {
  UNINIT = 0,
  PAUSED,
  BUFFER,
  DESYNC,
  INSYNC
}

class ActiveLiveHead {
  private readonly app_: YTPApp
  private readonly timer_: ReturnType<typeof setInterval>
  private state_: ActiveLiveHeadState = ActiveLiveHeadState.UNINIT
  private videoId_: string | undefined
  private updateTimestamp_: number = 0
  private updateInterval_: number = 0
  private bufferMin_: number = 0
  private bufferAvg_: number = 0
  private bufferDev_: number = 0
  private bufferTarget_: number = 0
  private latencyAvg_: number = 0
  private latencyDev_: number = 0
  private latencyTarget_: number = 0
  private playbackRate_: number = 1

  public constructor(app: YTPApp) {
    this.app_ = app
    this.timer_ = setInterval(this.update.bind(this), SYNC_INTERVAL)

    app.addOnDisposeCallback?.(this.dispose, this)
  }

  public dispose(): void {
    this.changeState_(ActiveLiveHeadState.PAUSED)
    clearInterval(this.timer_)
  }

  public update(): void {
    const now = Date.now()
    const delta = max(1, now - this.updateTimestamp_)
    const interval = (this.updateInterval_ + delta) / 2

    this.updateTimestamp_ = now
    this.updateInterval_ = interval

    const player = this.app_[YTPVideoPlayerSymbol]
    if (player == null) return

    const videoData = player.getVideoData?.()
    const playerState = player.getPlayerState?.()

    // Pause if video is paused or not live playback or low latency option is disabled
    if (!videoData?.isLivePlayback || !playerState?.isPlaying?.() || !isYTLiveBehaviourEnabled(YTLiveBehaviourMask.LOW_LATENCY)) return this.changeState_(ActiveLiveHeadState.PAUSED, player)

    // Reinitialize on video change
    const videoId = videoData.videoId
    if (videoId !== this.videoId_) {
      this.videoId_ = videoId
      this.changeState_(ActiveLiveHeadState.UNINIT, player)
      return
    }

    // Wait for buffering
    if (playerState.isBuffering?.()) {
      this.changeState_(ActiveLiveHeadState.BUFFER, player)
      this.updateDebugInfo_()
      return
    }

    switch (this.state_) {
      case ActiveLiveHeadState.UNINIT:
      case ActiveLiveHeadState.PAUSED:
      case ActiveLiveHeadState.BUFFER:
        this.changeState_(player.isAtLiveHead?.() ? ActiveLiveHeadState.INSYNC : ActiveLiveHeadState.DESYNC, player)
        return
      case ActiveLiveHeadState.DESYNC:
        this.updateBufferSamples_(player)
        if (player.isAtLiveHead?.()) {
          this.changeState_(ActiveLiveHeadState.INSYNC, player)
          break
        }

        // TODO: pause on manual seek?
        break
      case ActiveLiveHeadState.INSYNC:
        this.updateBufferSamples_(player)
        if (!player.isAtLiveHead?.()) {
          this.changeState_(ActiveLiveHeadState.DESYNC, player)
          break
        }
        this.updateLatencySamples_(player)

        this.updateBufferTarget_()
        this.updateLatencyTarget_()

        this.updatePlaybackRate_(player)
        break
      default:
        this.changeState_(ActiveLiveHeadState.UNINIT, player)
        return
    }
    this.updateDebugInfo_()
  }

  private updateDebugInfo_(): void {
    const debugInfo = this.app_.debugInfo
    if (debugInfo == null) return

    const { state_, bufferMin_, bufferAvg_, bufferDev_, bufferTarget_, latencyAvg_, latencyDev_, latencyTarget_, playbackRate_ } = this
    debugInfo.update?.({
      bu_alh_style: '',
      bu_alh: [
        `S${state_}`,
        `x${playbackRate_.toFixed(2)}`,
        `B:${(bufferTarget_ / 1e3).toFixed(2)} ~B:${(bufferAvg_ / 1e3).toFixed(2)} ±B:${(bufferDev_ / 1e3).toFixed(2)} <B:${(bufferMin_ / 1e3).toFixed(2)}`,
        `L:${(latencyTarget_ / 1e3).toFixed(2)} ~L:${(latencyAvg_ / 1e3).toFixed(2)} ±L:${(latencyDev_ / 1e3).toFixed(2)}`
      ].join('/')
    })
  }

  private updateBufferSamples_(player: YTPVideoPlayer): void {
    const buffer = Number(player.getBufferHealth?.()) * 1e3
    if (isNaN(buffer) || !isFinite(buffer)) return

    const avg = ((this.bufferAvg_ * (BUFFER_AVG_SAMPLE_SIZE - 1)) + buffer) / BUFFER_AVG_SAMPLE_SIZE
    const dev = max(this.bufferDev_ * BUFFER_DEV_DECAY_MUL, abs(buffer - avg) * BUFFER_DEV_MUL)

    this.bufferAvg_ = avg
    this.bufferDev_ = dev
  }

  private updateBufferTarget_(): void {
    const { updateInterval_, bufferMin_, bufferDev_ } = this

    this.bufferTarget_ = max(updateInterval_ * 2, bufferMin_, bufferDev_) + bufferDev_
  }

  private updateLatencySamples_(player: YTPVideoPlayer): void {
    const latency = Number(player.getRawLiveLatency?.()) * 1e3
    if (isNaN(latency) || !isFinite(latency)) return

    const avg = ((this.latencyAvg_ * (LATENCY_AVG_SAMPLE_SIZE - 1)) + latency) / LATENCY_AVG_SAMPLE_SIZE
    const dev = ((this.latencyDev_ * (LATENCY_AVG_SAMPLE_SIZE - 1)) + abs(this.latencyTarget_ - avg)) / LATENCY_AVG_SAMPLE_SIZE

    this.latencyAvg_ = avg
    this.latencyDev_ = dev
  }

  private updateLatencyTarget_(): void {
    const { bufferAvg_, bufferDev_, bufferTarget_, latencyAvg_ } = this

    let target = round(latencyAvg_ / LATENCY_STEP)
    switch (true) {
      case bufferAvg_ > (bufferTarget_ + bufferDev_):
        // Decrease latency if buffer is sufficient
        target = (target - 1) * LATENCY_STEP
        break
      case bufferAvg_ < (bufferTarget_ - bufferDev_):
        // Increase latency if buffer is insufficient
        target = (target + 1) * LATENCY_STEP
        break
      default:
        // Maintain current latency
        target *= LATENCY_STEP
        break
    }
    this.latencyTarget_ = target
  }

  private updatePlaybackRate_(player: YTPVideoPlayer): void {
    const latency = Number(player.getRawLiveLatency?.()) * 1e3
    if (isNaN(latency) || !isFinite(latency)) return

    const { updateInterval_, latencyDev_, latencyTarget_ } = this

    let playbackRate: number
    if (latencyDev_ < LATENCY_TOLERANCE) {
      playbackRate = 1
    } else {
      playbackRate = max(MIN_SYNC_RATE, min(MAX_SYNC_RATE, (updateInterval_ + (latency - latencyTarget_)) / updateInterval_))
    }
    this.playbackRate_ = playbackRate

    player.setPlaybackRate?.(playbackRate)
  }

  private changeState_(state: ActiveLiveHeadState, player?: YTPVideoPlayer): void {
    const { app_, state_ } = this

    if (state_ === state) return

    // Reset buffer on unpause
    if (state_ <= ActiveLiveHeadState.PAUSED && state > ActiveLiveHeadState.PAUSED) {
      const buffer = Number(player?.getBufferHealth?.()) * 1e3
      if (!isNaN(buffer) && isFinite(buffer)) {
        this.bufferMin_ = 0
        this.bufferAvg_ = buffer
        this.bufferDev_ = 0
      }
    }

    switch (state) {
      case ActiveLiveHeadState.PAUSED:
        // Reset playback rate back to normal
        player?.setPlaybackRate?.(1)

        // Hide debug info
        app_.debugInfo?.updateValue('bu_alh_style', 'display:none')
        break
      case ActiveLiveHeadState.BUFFER:
        // Only update min buffer on transition from playing to buffering
        if (state_ < ActiveLiveHeadState.BUFFER) break

        this.bufferMin_ = (this.bufferMin_ + this.bufferAvg_) / 2
        break
      case ActiveLiveHeadState.DESYNC:
        // Lower min buffer on desync to avoid getting stuck at the edge of live head
        if (state_ > ActiveLiveHeadState.DESYNC) this.bufferMin_ *= BUFFER_MIN_DECAY_MUL

        // Attempt to catch back up to live head
        player?.setPlaybackRate?.(MAX_SYNC_RATE)
        break
      case ActiveLiveHeadState.INSYNC: {
        const latency = Number(player?.getRawLiveLatency?.()) * 1e3
        if (!isNaN(latency) && isFinite(latency)) {
          this.latencyAvg_ = latency
          this.latencyDev_ = 0
          this.latencyTarget_ = latency
        }
        break
      }
    }

    this.state_ = state
  }
}

export const isYTLiveBehaviourEnabled = (mask: YTLiveBehaviourMask): boolean => {
  return getYTConfigBool(LIVE_BEHAVIOUR_KEY, false, mask)
}

const updatePlayerResponse = (data: YTValueData<YTResponse.Mapped<'player'>>): void => {
  const { videoDetails, playerConfig, streamingData } = data

  if (playerConfig == null || !videoDetails?.isLive) return

  if (isYTLiveBehaviourEnabled(YTLiveBehaviourMask.LOW_LATENCY)) {
    videoDetails.isLowLatencyLiveStream = true

    const playbackStartPolicy = playerConfig.mediaCommonConfig?.serverPlaybackStartConfig?.playbackStartPolicy
    playbackStartPolicy?.resumeMinReadaheadPolicy?.forEach(policy => policy.minReadaheadMs = 50)
    playbackStartPolicy?.startMinReadaheadPolicy?.forEach(policy => policy.minReadaheadMs = 50)
  }

  if (isYTLiveBehaviourEnabled(YTLiveBehaviourMask.FORCE_DVR) && !videoDetails.isLiveDvrEnabled && streamingData?.adaptiveFormats?.some(f => f.url)) {
    videoDetails.isLiveDvrEnabled = true
    playerConfig.daiConfig = {
      ...playerConfig.daiConfig,
      daiType: 'DAI_TYPE_CLIENT_STITCHED',
      enableDai: true
    }
  }
}

export default class YTPlayerLiveModule extends Feature {
  public constructor() {
    super('live')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    cleanupCallbacks.push(
      YTPObjectCreateCallback.registerCallback((type, object) => {
        switch (type) {
          case YTPObjectType.APP:
            if (ActiveLiveHeadSymbol in object) return

            defineProperty(object, ActiveLiveHeadSymbol, { enumerable: false, value: new ActiveLiveHead(object) })
            return
          case YTPObjectType.TEMPLATE_VIDEO_INFO: {
            const content = object.element.querySelector<HTMLDivElement>('div.ytp-sfn-content')
            if (content == null) return

            const container = div(div('Active Live Head'), span())
            object.define('bu_alh_style', container, 'style')
            object.define('bu_alh', container.lastChild!, 'child')
            object.updateValue('bu_alh_style', 'display:none')
            content.append(container)
            return
          }
        }
      }),
      registerYTConfigMenuItemGroup('live-stream', [
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: LIVE_BEHAVIOUR_KEY,
          icon: YTRenderer.enums.IconType.CLOCK,
          text: 'Low Latency',
          description: 'Actively adjust playback rate to achieve lowest possible latency based on buffer health',
          mask: YTLiveBehaviourMask.LOW_LATENCY,
          signals: [YTEndpoint.enums.SignalActionType.CLOSE_POPUP, YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE, YTEndpoint.enums.SignalActionType.RELOAD_PLAYER]
        },
        {
          type: YTConfigMenuItemType.TOGGLE,
          key: LIVE_BEHAVIOUR_KEY,
          icon: YTRenderer.enums.IconType.FAST_REWIND,
          text: 'Force DVR',
          description: 'Enable seeking for livestream when possible (might affect latency)',
          mask: YTLiveBehaviourMask.FORCE_DVR,
          signals: [YTEndpoint.enums.SignalActionType.CLOSE_POPUP, YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE, YTEndpoint.enums.SignalActionType.RELOAD_PLAYER]
        }
      ]),
      registerYTValueProcessor(YTResponse.mapped.player, updatePlayerResponse)
    )

    return true
  }
}