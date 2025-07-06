import { defineProperty, getOwnPropertyNames, getPrototypeOf, keys, values } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { registerCreateYTPlayerCallback } from '@ext/site/youtube/module/core/bootstrap'

const LOGGER_OVERRIDE_ID = `logovr-${Date.now()}`

const STAT_METHOD_MAP = {
  bufferhealth: 'getBufferHealth',
  livelatency: 'getLiveLatency'
} satisfies Record<string, keyof YTPVideoPlayerInstance>

export const enum YTPInstanceType {
  APP,
  VIDEO_PLAYER
}

export interface YTPAppInstance {
  mediaElement: HTMLMediaElement | null
}

export interface YTPVideoPlayerInstance {
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

let ctor: string | null = null

const instances: Partial<{
  [YTPInstanceType.APP]: YTPAppInstance
  [YTPInstanceType.VIDEO_PLAYER]: YTPVideoPlayerInstance
}> = {}

function onCreateLogger(instance: object): void {
  const proto = getPrototypeOf(instance)

  if (proto[LOGGER_OVERRIDE_ID]) return
  proto[LOGGER_OVERRIDE_ID] = true

  // Override logger methods
  getOwnPropertyNames(proto).forEach(m => {
    if (m === 'constructor') return

    const method = Logger.prototype[m as keyof typeof Logger.prototype] ?? Logger.prototype.debug
    proto[m] = function (...args: unknown[]): void {
      let instance = this.instance
      if (instance == null) {
        instance = new Logger(`YTPLAYER-<${this.tag ?? 'unknown'}>`, true)
        this.instance = instance
      }
      method.apply(instance, args)
    }
  })
}

function onCreateAppInstance(instance?: YTPAppInstance): void {
  if (instance == null) return

  instances[YTPInstanceType.APP] = instance
}

function onCreateVideoPlayerInstance(instance?: YTPVideoPlayerInstance): void {
  if (instance == null) return

  instances[YTPInstanceType.VIDEO_PLAYER] = instance

  values(instance).forEach(prop => {
    if (prop == null || typeof prop !== 'object') return

    for (const key in prop) {
      const value = prop[key]
      if (value == null || !(value instanceof Map)) continue

      for (const stat in STAT_METHOD_MAP) {
        if (!value.has(stat)) continue

        instance[STAT_METHOD_MAP[stat as keyof typeof STAT_METHOD_MAP]] = value.get(stat)
      }
    }
  })
}

function onCreateInstance(instance: object): boolean {
  defineProperty(instance, 'logger', {
    configurable: true,
    set(logger) {
      onCreateLogger(logger)

      defineProperty(instance, 'logger', {
        configurable: true,
        writable: true,
        value: logger
      })

      setTimeout(() => {
        switch (logger?.tag) {
          case 'App':
            onCreateAppInstance(instance as YTPAppInstance)
            break
          case 'VideoPlayer':
            onCreateVideoPlayerInstance(instance as YTPVideoPlayerInstance)
            break
        }
      }, 1)
    }
  })

  return true
}

function onCreateYTPlayer(): void {
  Object.prototype.hasOwnProperty = new Hook(Object.prototype.hasOwnProperty).install(ctx => { // NOSONAR
    if (ctx.self instanceof HTMLDivElement && (ctx.self.id === 'player-api' || ctx.self.classList.contains('ytd-player'))) {
      Function.prototype.call = new Hook(Function.prototype.call).install(ctx => { // NOSONAR
        const fn = ctx.self.toString()
        const instance = ctx.args[0]

        let result = HookResult.EXECUTION_IGNORE
        if (ctor == null) {
          const oldKeys = keys(instance).length
          ctx.returnValue = ctx.origin.apply(ctx.self, ctx.args)
          const newKeys = keys(instance).length

          if (oldKeys === newKeys) return HookResult.EXECUTION_CONTINUE

          ctor = fn
          result = HookResult.EXECUTION_CONTINUE
        }

        if (fn !== ctor || onCreateInstance(instance)) return result

        Function.prototype.call = ctx.origin // NOSONAR
        return HookResult.ACTION_UNINSTALL | result
      }).call
    }

    return HookResult.EXECUTION_IGNORE
  }).call
}

export function getYTPInstance<T extends YTPInstanceType>(type: T): typeof instances[T] | null {
  return instances[type] ?? null
}

export default class YTPlayerBootstrapModule extends Feature {
  public constructor() {
    super('player-bootstrap')
  }

  protected activate(): boolean {
    registerCreateYTPlayerCallback(onCreateYTPlayer)

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]

      // Remove player pause overlay
      if (node instanceof HTMLDivElement && node.classList.contains('ytp-pause-overlay')) return HookResult.EXECUTION_CONTINUE

      return HookResult.EXECUTION_IGNORE
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}