import { assign, defineProperties, defineProperty } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { updateCanvasStyle } from '@ext/site/viu/module/render'
import { loadWebpackObjectByExportName, loadWebpackObjectByPropName } from '@ext/site/viu/module/webpack'
import { VIU_STATE } from '@ext/site/viu/state'
import { PlayerAPI, PlayerConfig, PlayerEvent, SourceConfig } from '@ext/types/bitmovin-player/bitmovinplayer'

const enum ReloadStreamState {
  NONE,
  PAUSED,
  PLAYING
}

type GetProductStreamMethod = (info: { ccsProductId: string, isBlocked: boolean, timeDiff: number }) => void

const logger = new Logger('VIU-PLAYER')

let currentStreamId: string = ''
let currentVideo: HTMLVideoElement | null = null
let reloadStreamState: ReloadStreamState = ReloadStreamState.NONE
let reloadTimer: number | null = null

let bitmovinPlayer: PlayerAPI | null = null
let jwPlayer: jwplayer.JWPlayer | null = null

let getProductStream: GetProductStreamMethod = () => { /* NOOP */ }

function reloadPlayerSrc(): void {
  if (reloadTimer == null) {
    logger.warn('reload timer is null')
    return
  }

  const ccsProductId = VIU_STATE.ccsProductIdMap.get(VIU_STATE.currentProductId)
  if (ccsProductId == null) {
    logger.warn('failed to find ccsProductId of productId:', VIU_STATE.currentProductId)
    return
  }

  getProductStream({ ccsProductId, isBlocked: false, timeDiff: 0 })

  clearTimeout(reloadTimer)
  reloadTimer = -1
}

function onBitmovinPlayerConfig(config: PlayerConfig): void {
  if (config.advertising != null) {
    config.advertising.adBreaks?.splice(0)
    config.advertising.strategy = {
      shouldPlayAdBreak() {
        return false
      },
      shouldPlaySkippedAdBreaks() {
        return []
      }
    }
  }

  config.analytics = undefined
}

function onBitmovinPlayerInit(): void {
  if (bitmovinPlayer == null) return

  logger.debug('init bitmovin player')

  bitmovinPlayer.on(<PlayerEvent>'playing', setTimeout.bind(null, updateCanvasStyle, 1e3))
  bitmovinPlayer.on(<PlayerEvent>'paused', setTimeout.bind(null, updateCanvasStyle, 500))
  bitmovinPlayer.on(<PlayerEvent>'sourceloaded', () => {
    if (reloadStreamState === ReloadStreamState.NONE) return

    switch (reloadStreamState) {
      case ReloadStreamState.PAUSED:
        bitmovinPlayer?.pause()
        break
      case ReloadStreamState.PLAYING:
        bitmovinPlayer?.play()
        break
    }

    reloadStreamState = ReloadStreamState.NONE
  })

  const nativeLoad = bitmovinPlayer.load
  async function overrideLoad(source: SourceConfig, forceTechnology?: string, disableSeeking?: boolean): Promise<void> {
    if (bitmovinPlayer == null) return

    if (reloadTimer != null && reloadTimer >= 0) {
      clearTimeout(reloadTimer)
      reloadTimer = null
    }
    reloadTimer = window.setTimeout(reloadPlayerSrc, 14400e3) // 4h

    logger.debug('player load source:', source, forceTechnology, disableSeeking)

    if (source.analytics != null) delete source.analytics

    for (const [id, url] of VIU_STATE.streamSourceMap) {
      if (url !== source.hls) continue
      if (id === currentStreamId) break

      logger.info('load stream:', id)
      currentStreamId = id
      break
    }

    await nativeLoad.call(bitmovinPlayer, source, forceTechnology, disableSeeking)

    const video = bitmovinPlayer.getVideoElement()
    if (currentVideo === video) return

    logger.debug('player video element created/changed')

    video.addEventListener('loadedmetadata', () => {
      if (VIU_STATE.stream == null) return

      logger.debug('video metadata updated, stop current stream')

      VIU_STATE.stream = null
    })
    video.addEventListener('canplay', async () => {
      if (VIU_STATE.stream != null) return

      if (!('captureStream' in video) || typeof video.captureStream !== 'function') {
        logger.warn('capture stream not available')
        return
      }

      logger.debug('video can play, capture stream')

      for (let i = 0; i < 10; i++) {
        const stream: MediaStream = video.captureStream()
        if (stream.getVideoTracks().length === 0 || stream.getAudioTracks().length === 0) {
          await new Promise<void>(resolve => setTimeout(resolve, 1e3))
          continue
        }

        VIU_STATE.stream = stream
        break
      }
    })

    currentVideo = video
  }

  defineProperty(bitmovinPlayer, 'load', {
    get() {
      return overrideLoad
    },
    set(v) {
      logger.trace('set player.load', v)
    }
  })
}

function onBitmovinPlayerModuleLoad(exports: { Player: unknown }): void {
  const nativePlayerCtor = <new (containerElement: HTMLElement, config: PlayerConfig) => PlayerAPI>exports.Player
  const overridePlayerCtor = function (containerElement: HTMLElement, config: PlayerConfig): PlayerAPI {
    onBitmovinPlayerConfig(config)
    bitmovinPlayer = new nativePlayerCtor(containerElement, config)
    onBitmovinPlayerInit()
    return bitmovinPlayer
  }
  assign(overridePlayerCtor, nativePlayerCtor)
  defineProperty(exports, 'Player', {
    get() {
      return overridePlayerCtor
    },
    set(v) {
      logger.trace('set exports.Player', v)
    }
  })
}

function onJWPlayerInit() {
  if (jwPlayer == null) return

  logger.info('create jwplayer')

  const { setup } = jwPlayer

  jwPlayer.setup = (options: Partial<jwplayer.PlayerConfig & {
    onAdBreakStart?: () => void
    onAdBreakEnd?: () => void
    onAdPlay?: () => void
    onAdPause?: () => void
    onAdRequest?: () => void
    onAdBlock?: () => void
    vodMeta: Partial<{
      adBreaks: []
      adSpec: Partial<{ midrolls: [], postrolls: [], prerolls: [] }>
      enableAdSchedule: boolean
    }>
  }>): jwplayer.JWPlayer => {
    logger.debug('player setup:', options)

    const { vodMeta } = options

    if (options.advertising) delete options.advertising
    if (options.ga) delete options.ga
    if (options.onAdBreakStart) delete options.onAdBreakStart
    if (options.onAdBreakEnd) delete options.onAdBreakEnd
    if (options.onAdPlay) delete options.onAdPlay
    if (options.onAdPause) delete options.onAdPause
    if (options.onAdRequest) delete options.onAdRequest
    if (options.onAdBlock) delete options.onAdBlock
    if (vodMeta) {
      vodMeta.adBreaks?.splice(0)
      vodMeta.adSpec?.midrolls?.splice(0)
      vodMeta.adSpec?.postrolls?.splice(0)
      vodMeta.adSpec?.prerolls?.splice(0)
      vodMeta.enableAdSchedule = false
    }

    return setup.call(jwPlayer, options)
  }
}

function initJWPlayerModule(): void {
  let nativePlayerCtor: (JWPlayerStatic & { _: object, utils: object, vid: HTMLVideoElement }) | null = null

  const overridePlayerCtor = function (query?: string | number | Element): jwplayer.JWPlayer {
    if (nativePlayerCtor == null) throw new Error('Player constructor not found')

    const player = nativePlayerCtor(query)
    if (query instanceof HTMLElement) {
      jwPlayer = player
      onJWPlayerInit()
    }
    return player
  }

  defineProperties(overridePlayerCtor, {
    '_': {
      enumerable: true,
      get: () => nativePlayerCtor?._,
      set: (v) => nativePlayerCtor ? nativePlayerCtor._ = v : null
    },
    'utils': {
      enumerable: true,
      get: () => nativePlayerCtor?.utils,
      set: (v) => nativePlayerCtor ? nativePlayerCtor.utils = v : null
    },
    'vid': {
      enumerable: true,
      get: () => nativePlayerCtor?.vid,
      set: (v) => nativePlayerCtor ? nativePlayerCtor.vid = v : null
    },
    'key': {
      enumerable: true,
      get: () => nativePlayerCtor?.key,
      set: (v) => nativePlayerCtor ? nativePlayerCtor.key = v : null
    }
  })

  defineProperty(window, 'jwplayer', {
    enumerable: true,
    get() {
      return nativePlayerCtor == null ? null : overridePlayerCtor
    },
    set(v) {
      nativePlayerCtor = v
    }
  })
}

function onProductInfoModuleLoad(value: { getProductStream: GetProductStreamMethod }): void {
  getProductStream = value.getProductStream
}

export function onNetworkPlaybackDistribute(): void {
  if (reloadTimer !== -1 || bitmovinPlayer == null) return

  logger.info('reload stream:', currentStreamId)

  reloadStreamState = bitmovinPlayer.isPlaying() ? ReloadStreamState.PLAYING : ReloadStreamState.PAUSED
  bitmovinPlayer.load({ hls: VIU_STATE.streamSourceMap.get(currentStreamId), options: { startOffset: bitmovinPlayer.getCurrentTime() } })
}

export function playerIsPlaying(): boolean {
  return bitmovinPlayer?.isPlaying() ?? (jwPlayer?.getState() === 'playing')
}

export function playerPlay(): void {
  bitmovinPlayer?.play()
  jwPlayer?.play()
}

export function playerPause(): void {
  bitmovinPlayer?.pause()
  jwPlayer?.pause()
}

export function playerSeek(time: number): void {
  bitmovinPlayer?.seek(time)
  jwPlayer?.seek(time)
}

export function playerGetCurrentTime(): number {
  return bitmovinPlayer?.getCurrentTime() ?? jwPlayer?.getCurrentTime() ?? 0
}

export function playerGetDuration(): number {
  return bitmovinPlayer?.getDuration() ?? jwPlayer?.getDuration() ?? 0
}

export function playerGetVolume(): number {
  return bitmovinPlayer?.getVolume() ?? jwPlayer?.getVolume() ?? 0
}

export function playerGetMute(): boolean {
  return bitmovinPlayer?.isMuted() ?? jwPlayer?.getMute() ?? false
}

export function playerGetSubtitle(): string {
  if (bitmovinPlayer != null) {
    return bitmovinPlayer.getVideoElement()?.parentElement?.querySelector<HTMLDivElement>('.bmpui-subtitle-region-container')?.innerText ?? ''
  }

  return ''
}

export function playerSetVolume(volume: number): void {
  bitmovinPlayer?.setVolume(volume)
  jwPlayer?.setVolume(volume)
}

export function playerSetMute(state: boolean): void {
  if (state) {
    bitmovinPlayer?.mute()
  } else {
    bitmovinPlayer?.unmute()
  }

  jwPlayer?.setMute(state)
}

export default class ViuPlayerModule extends Feature {
  protected activate(): boolean {
    initJWPlayerModule()
    loadWebpackObjectByExportName('Player', onBitmovinPlayerModuleLoad)
    loadWebpackObjectByPropName('getProductStream', onProductInfoModuleLoad)

    window.reloadPlayerSrc = reloadPlayerSrc

    window.addEventListener('load', () => {
      const style = document.createElement('style')
      style.textContent = 'video { filter: blur(0) !important; }'
      document.head.appendChild(style)
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}