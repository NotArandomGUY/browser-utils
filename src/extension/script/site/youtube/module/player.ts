import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const LOGGER_OVERRIDE_ID = `logovr-${Date.now()}`

const STAT_METHOD_MAP = {
  bufferhealth: 'getBufferHealth',
  livelatency: 'getLiveLatency'
} satisfies Record<string, keyof YTVideoPlayer>
const LATENCY_TARGET_STEPS = [60, 30, 25, 20, 15, 10, 7.5, 7, 6, 5, 4, 3, 2.5]
for (let target = 2; target >= 0.5; target -= 0.1) {
  LATENCY_TARGET_STEPS.push(target)
}
const MIN_LATENCY_TARGET = LATENCY_TARGET_STEPS[LATENCY_TARGET_STEPS.length - 1]
const MAX_LATENCY_TARGET = LATENCY_TARGET_STEPS[0]
const BUFFER_HEALTH_THRESHOLD = 1
const MAX_DEVIATION = 0.05
const MIN_SYNC_RATE = 0.9
const MAX_SYNC_RATE = 1.1
const AVG_SAMPLE_SIZE = 10

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

let moduleCtor: Function | null = null
let player: YTVideoPlayer | null = null

let lastSyncLiveHeadTime = 0
let syncLiveHeadDeltaTime = 0
let averageHealth = 0
let averageLatency = 0
let averageLatencyDelta = 0

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

function onAppModuleConstruct(_instance: object): void {
  return
}

function onVideoPlayerModuleConstruct(instance: object): void {
  player = instance as YTVideoPlayer

  for (const prop of Object.values(instance)) {
    if (prop == null || typeof prop !== 'object') continue

    for (const key in prop) {
      const value = prop[key]
      if (value == null || !(value instanceof Map)) continue

      for (const stat in STAT_METHOD_MAP) {
        if (!value.has(stat)) continue

        player[STAT_METHOD_MAP[stat as keyof typeof STAT_METHOD_MAP]] = value.get(stat)
      }
    }
  }
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

  syncLiveHeadDeltaTime = ((syncLiveHeadDeltaTime * (AVG_SAMPLE_SIZE - 1)) + delta) / AVG_SAMPLE_SIZE
  lastSyncLiveHeadTime = now

  if (player == null || !player.isAtLiveHead?.() || !player.isPlaying?.()) return

  const currentHealth = Number(player.getBufferHealth?.())
  const currentLatency = Number(player.getLiveLatency?.())
  if (isNaN(currentHealth) || isNaN(currentLatency)) return

  averageHealth = ((averageHealth * (AVG_SAMPLE_SIZE - 1)) + currentHealth) / AVG_SAMPLE_SIZE
  averageLatency = ((averageLatency * (AVG_SAMPLE_SIZE - 1)) + currentLatency) / AVG_SAMPLE_SIZE

  let targetLatency: number
  switch (true) {
    case averageHealth >= BUFFER_HEALTH_THRESHOLD:
      targetLatency = LATENCY_TARGET_STEPS.find(target => averageLatency > target) ?? MIN_LATENCY_TARGET
      break
    case averageHealth < (BUFFER_HEALTH_THRESHOLD - MAX_DEVIATION):
      targetLatency = LATENCY_TARGET_STEPS.findLast(target => target >= averageLatency) ?? MAX_LATENCY_TARGET
      break
    default:
      targetLatency = LATENCY_TARGET_STEPS.findLast(target => (target + MAX_DEVIATION) >= averageLatency) ?? MAX_LATENCY_TARGET
      break
  }

  const latencyDelta = currentLatency - targetLatency
  averageLatencyDelta = ((averageLatencyDelta * (AVG_SAMPLE_SIZE - 1)) + latencyDelta) / AVG_SAMPLE_SIZE

  const playbackRate = Math.abs(averageLatencyDelta) < MAX_DEVIATION ? 1 : Math.max(MIN_SYNC_RATE, Math.min(MAX_SYNC_RATE, (syncLiveHeadDeltaTime + (latencyDelta * 1e3)) / syncLiveHeadDeltaTime))
  player.setPlaybackRate?.(playbackRate)
}

export default class YTPlayerModule extends Feature {
  protected activate(): boolean {
    // Override player internal modules
    Object.prototype.hasOwnProperty = new Hook(Object.prototype.hasOwnProperty).install(ctx => { // NOSONAR
      if (ctx.self instanceof HTMLDivElement && (ctx.self.id === 'player-api' || ctx.self.classList.contains('ytd-player'))) {
        Function.prototype.call = new Hook(Function.prototype.call).install(ctx => { // NOSONAR
          const fn = ctx.self
          const instance = ctx.args[0]

          let result = HookResult.EXECUTION_IGNORE
          if (moduleCtor == null) {
            const oldKeys = Object.keys(instance).length
            ctx.returnValue = ctx.origin.apply(fn, ctx.args)
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
    syncLiveHeadDeltaTime = 500
    setInterval(syncLiveHeadUpdate, 500)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}