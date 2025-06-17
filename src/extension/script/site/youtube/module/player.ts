import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const LOGGER_OVERRIDE_ID = `logovr-${Date.now()}`

const STAT_METHOD_MAP = {
  bufferhealth: 'getBufferHealth',
  livelatency: 'getLiveLatency'
} satisfies Record<string, keyof YTVideoPlayer>
const HEALTH_AVG_SAMPLE_SIZE = 20
const HEALTH_DEV_MUL = 1.05
const HEALTH_DEV_DECAY_MUL = 0.95
const LATENCY_AVG_SAMPLE_SIZE = 8
const LATENCY_STEP = 100
const LATENCY_TOLERANCE = 50
const SYNC_INTERVAL = 250
const MIN_SYNC_RATE = 0.9
const MAX_SYNC_RATE = 1.1

interface YTVideoPlayer {
  loop: boolean
  playbackRate: number
  videoData: object

  getBufferHealth?(): number
  getLiveLatency?(): number
  getPreferredQuality?(): string
  isAtLiveHead?(): boolean
  isBackground?(): boolean
  isFullscreen?(): boolean
  isGapless?(): boolean
  isPlaying?(): number
  playVideo?(): void
  sendAbandonmentPing?(): void
  setMediaElement?(element: HTMLElement): void
  setPlaybackRate?(rate: number): void
}

let moduleCtor: string | null = null
let player: YTVideoPlayer | null = null

let isSyncLiveHeadEnabled = false
let lastSyncLiveHeadTime = 0
let syncLiveHeadDeltaTime = 0
let healthAvg = 0
let healthDev = 0
let latencyAvg = 0
let latencyDeltaAvg = 0

function onLoggerConstruct(instance: object): void {
  const proto = Object.getPrototypeOf(instance)

  if (proto[LOGGER_OVERRIDE_ID]) return
  proto[LOGGER_OVERRIDE_ID] = true

  // Override logger methods
  Object.getOwnPropertyNames(proto).forEach(m => {
    if (m === 'constructor') return

    const method = Logger.prototype[m as keyof typeof Logger.prototype] ?? Logger.prototype.debug
    proto[m] = function (...args: unknown[]): void {
      let instance = this.instance
      if (instance == null) {
        instance = new Logger(`YT-PLAYER-<${this.tag ?? 'unknown'}>`, true)
        this.instance = instance
      }
      method.apply(instance, args)
    }
  })
}

function onAppModuleConstruct(instance: object): void {
  if (instance == null) return

  Object.defineProperty(window, 'ytpm_app', { configurable: true, enumerable: false, value: instance })
}

function onVideoPlayerModuleConstruct(instance: object): void {
  if (instance == null) return

  player = instance as YTVideoPlayer
  Object.defineProperty(window, 'ytpm_videoplayer', { configurable: true, enumerable: false, value: instance })

  Object.values(instance).forEach(prop => {
    if (prop == null || typeof prop !== 'object') return

    for (const key in prop) {
      const value = prop[key]
      if (value == null || !(value instanceof Map)) continue

      for (const stat in STAT_METHOD_MAP) {
        if (!value.has(stat)) continue

        player![STAT_METHOD_MAP[stat as keyof typeof STAT_METHOD_MAP]] = value.get(stat)
      }
    }
  })
}

function onModuleConstruct(instance: object): boolean {
  Object.defineProperty(instance, 'logger', {
    configurable: true,
    set(logger) {
      onLoggerConstruct(logger)
      Object.defineProperty(instance, 'logger', {
        configurable: true,
        writable: true,
        value: logger
      })

      setTimeout(() => {
        switch (logger?.tag) {
          case 'App':
            onAppModuleConstruct(instance)
            break
          case 'VideoPlayer':
            onVideoPlayerModuleConstruct(instance)
            break
        }
      }, 1)
    }
  })

  return true
}

function syncLiveHeadUpdate(): void {
  const now = Date.now()
  const delta = Math.max(1, now - lastSyncLiveHeadTime)

  syncLiveHeadDeltaTime = (syncLiveHeadDeltaTime + delta) / 2
  lastSyncLiveHeadTime = now

  if (!isSyncLiveHeadEnabled || player == null || !player.isAtLiveHead?.() || !player.isPlaying?.()) return

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

  Object.defineProperty(window, 'ytpm_syncstat', {
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

export function getSyncLiveHeadEnable(): boolean {
  return isSyncLiveHeadEnabled
}

export function setSyncLiveHeadEnable(state: boolean): void {
  isSyncLiveHeadEnabled = state
  player?.setPlaybackRate?.(1)
}

export default class YTPlayerModule extends Feature {
  protected activate(): boolean {
    // Override player internal modules
    Object.prototype.hasOwnProperty = new Hook(Object.prototype.hasOwnProperty).install(ctx => { // NOSONAR
      if (ctx.self instanceof HTMLDivElement && (ctx.self.id === 'player-api' || ctx.self.classList.contains('ytd-player'))) {
        Function.prototype.call = new Hook(Function.prototype.call).install(ctx => { // NOSONAR
          const fn = ctx.self.toString()
          const instance = ctx.args[0]

          let result = HookResult.EXECUTION_IGNORE
          if (moduleCtor == null) {
            const oldKeys = Object.keys(instance).length
            ctx.returnValue = ctx.origin.apply(ctx.self, ctx.args)
            const newKeys = Object.keys(instance).length

            if (oldKeys === newKeys) return HookResult.EXECUTION_CONTINUE

            moduleCtor = fn
            result = HookResult.EXECUTION_CONTINUE
          }

          if (fn !== moduleCtor || onModuleConstruct(instance)) return result

          Function.prototype.call = ctx.origin // NOSONAR
          return HookResult.ACTION_UNINSTALL | result
        }).call
      }

      return HookResult.EXECUTION_IGNORE
    }).call

    lastSyncLiveHeadTime = Date.now()
    syncLiveHeadDeltaTime = SYNC_INTERVAL
    setInterval(syncLiveHeadUpdate, SYNC_INTERVAL)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}