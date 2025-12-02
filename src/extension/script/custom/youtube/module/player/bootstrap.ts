import { registerYTPlayerCreateCallback } from '@ext/custom/youtube/module/core/bootstrap'
import { defineProperty, getOwnPropertyNames, getPrototypeOf, keys, values } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const LOGGER_OVERRIDE_ID = `logovr-${Date.now()}`

const STYLE_SHEET = [
  // FIX: leanback animated overlay virtual list bug
  '.app-quality-root .ytLrAnimatedOverlayHiding .ytLrAnimatedOverlayContainer{opacity:0!important;display:block!important}',
  // player stats
  ':root .ytp-sfn{margin:0;background:rgba(28,28,28,.5);border-radius:4px;color:#fff;position:absolute;left:1em;top:1em;z-index:64;min-width:26em;font-size:11px}',
  ':root .ytp-sfn .ytp-sfn-content{padding:5px}',
  ':root .ytp-sfn .ytp-sfn-content>div>div{display:inline-block;font-weight:500;padding:0 .5em;text-align:right;width:10em}',
  ':root .ytp-sfn .ytp-sfn-cpn{font-family:Consolas,Monaco,monospace;font-size:12px}',
  ':root .ytp-sfn .ytp-horizonchart{display:inline-block;margin:2px;position:relative;vertical-align:bottom}',
  ':root .ytp-sfn .ytp-horizonchart>span{display:inline-block;position:absolute}',
  // leanback watch controls background style
  '.app-quality-root .ytLrWatchDefaultControl .ytLrWatchDefaultControlsBackground,.app-quality-root .ytLrWatchDefaultPivot .ytLrWatchDefaultControlsBackground{background:-webkit-linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.41) 67.43%,rgba(0,0,0,.7) 100%)!important;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.41) 67.43%,rgba(0,0,0,.7) 100%)!important}',
  // leanback live chat styles
  '.ytLrLiveChatHost{text-shadow:.125rem .125rem .15rem #0f0f0f;width:19.375rem}',
  '.ytLrLiveChatMessageList{margin:2.75rem 2.5rem 2.75rem 2rem;width:14.875rem}',
  '.ytLrLiveChatClientMessageHost,.ytLrLiveChatPaidMessageRendererHost,.ytLrLiveChatTextMessageRendererHost{background-color:#0f0f0f1f!important;border-radius:.125rem}',
  '.ytLrLiveChatClientMessageHost{padding:.125rem}',
  '.ytLrLiveChatPaidMessageRendererHeader{border-radius:.125rem .125rem 0 0;padding:.125rem;text-shadow:none}',
  '.ytLrLiveChatPaidMessageRendererBody{background-color:initial!important;border-radius:0 0 .125rem .125rem;padding:.125rem}',
  '.ytLrLiveChatTextMessageRendererContent{padding:.125rem .125rem .125rem 0}',
  '.ytLrLiveChatTextMessageRendererBody{margin-top:.025rem}',
  '.app-quality-root .ytLrLiveChatTextMessageRendererAuthorName{display:inline}',
  '.ytLrLiveChatPaidMessageRendererAuthorPhoto,.ytLrLiveChatTextMessageRendererAuthorPhoto{height:1.25rem;width:1.25rem;left:.125rem;margin-top:.125rem}',
  '.ytLrLiveChatPaidMessageRendererHasImage .ytLrLiveChatPaidMessageRendererHeader,.ytLrLiveChatPaidMessageRendererHasImage .ytLrLiveChatPaidMessageRendererBody{padding-left:1.5rem}',
  '.ytLrLiveChatTextMessageRendererContentHasImage{margin-left:1.5rem}'
].join('\n')

const STAT_METHOD_MAP = {
  bandwidth: 'getBandWidth',
  bufferhealth: 'getBufferHealth',
  networkactivity: 'getNetworkActivity',
  livelatency: 'getLiveLatency',
  rawlivelatency: 'getRawLiveLatency'
} satisfies Record<string, keyof YTPVideoPlayerInstance>

export const enum YTPInstanceType {
  APP,
  VIDEO_PLAYER
}

export interface YTPDisposableInstance {
  dispose?(): void
}

export interface YTPVideoDataInstance extends YTPDisposableInstance {
  isAd?(): boolean
  isDaiEnabled?(): boolean
  isEmbedsShortsMode?(): boolean
  isLoaded?(): boolean
  isOtf?(): boolean
  setData?(data: object | undefined): void
}

export interface YTPAppInstance extends YTPDisposableInstance {
  playerRef?: WeakRef<YTPVideoPlayerInstance>

  mediaElement: object | null

  enqueueVideoByPlayerVars?(...args: unknown[]): void
  getInternalApi(): Record<string, (...args: unknown[]) => unknown>
  loadVideoByPlayerVars?(...args: unknown[]): void
}

export interface YTPVideoPlayerInstance extends YTPDisposableInstance {
  loop: boolean
  playbackRate: number
  playerType: number
  videoData?: YTPVideoDataInstance

  subscribe?<T, A extends unknown[]>(event: string, callback: (this: T, ...args: A) => void, instance: T): number
  unsubscribe?<T, A extends unknown[]>(event: string, callback: (this: T, ...args: A) => void, instance: T): boolean

  getBandWidth?(): number
  getBufferHealth?(): number
  getCurrentTime?(): number
  getDuration?(): number
  getLiveLatency?(): number
  getNetworkActivity?(): number
  getPlaybackQuality?(): string
  getPlaybackRate?(): number
  getPreferredQuality?(): string
  getRawLiveLatency?(): number
  getVolume?(): number
  isAtLiveHead?(): boolean
  isBackground?(): boolean
  isFullscreen?(): boolean
  isGapless?(): boolean
  isPlaying?(): number
  pauseVideo?(): void
  playVideo?(): void
  sendAbandonmentPing?(): void
  setMediaElement?(element: HTMLElement): void
  setPlaybackRate?(rate: number): void
  stopVideo?(): void
}

let ctor: string | null = null

const instances = {
  [YTPInstanceType.APP]: new Set<WeakRef<YTPAppInstance>>(),
  [YTPInstanceType.VIDEO_PLAYER]: new Set<WeakRef<YTPVideoPlayerInstance>>()
}

type YTPInstanceOf<T extends YTPInstanceType> = typeof instances[T] extends Set<WeakRef<infer I>> ? I : never

const flatObjectValues = (obj: object, depth = 1): unknown[] => {
  let values = Object.values(obj)
  if (depth > 1) {
    values = values.concat(values.filter(v => v != null && typeof v === 'object').flatMap(v => flatObjectValues(v, depth - 1)))
  }
  return values
}

const cleanWeakRefSet = <T extends WeakKey>(refSet: Set<WeakRef<T>>, targetValue?: T): void => {
  for (const ref of refSet) {
    const value = ref.deref()
    if (value == null || value === targetValue) refSet.delete(ref)
  }
}

const onCreateLogger = (instance: object): boolean => {
  if (instance == null || 'logger' in instance) return false

  const proto = getPrototypeOf(instance)

  if (proto[LOGGER_OVERRIDE_ID]) return true
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

  return true
}

const onCreateAppInstance = (instance?: YTPAppInstance): void => {
  if (instance == null) return

  instances[YTPInstanceType.APP].add(new WeakRef(instance))
  if (instance.dispose != null) {
    instance.dispose = new Hook(instance.dispose, false).install(ctx => {
      cleanWeakRefSet(instances[YTPInstanceType.APP], ctx.self as typeof instance)
      return HookResult.EXECUTION_IGNORE
    }).call
  }
}

const onCreateVideoPlayerInstance = (instance?: YTPVideoPlayerInstance): void => {
  if (instance == null) return

  instances[YTPInstanceType.VIDEO_PLAYER].add(new WeakRef(instance))
  if (instance.dispose != null) {
    instance.dispose = new Hook(instance.dispose, false).install(ctx => {
      cleanWeakRefSet(instances[YTPInstanceType.VIDEO_PLAYER], ctx.self as typeof instance)
      return HookResult.EXECUTION_IGNORE
    }).call
  }

  setTimeout(() => {
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

    const apps = getAllYTPInstance(YTPInstanceType.APP)
    for (const app of apps) {
      if (flatObjectValues(app, 3).find(v => v === instance) != null) {
        app.playerRef = new WeakRef(instance)
        break
      }
    }
  }, 1)
}

const onCreateInstance = (instance: object): boolean => {
  defineProperty(instance, 'logger', {
    configurable: true,
    set(logger) {
      defineProperty(instance, 'logger', {
        configurable: true,
        writable: true,
        value: logger
      })

      if (!onCreateLogger(logger)) return

      switch (logger?.tag) {
        case 'App':
          onCreateAppInstance(instance as YTPAppInstance)
          break
        case 'VideoPlayer':
          onCreateVideoPlayerInstance(instance as YTPVideoPlayerInstance)
          break
      }
    }
  })

  return true
}

const onCreateYTPlayer = (container: HTMLElement): void => {
  Object.prototype.hasOwnProperty = new Hook(Object.prototype.hasOwnProperty).install(ctx => { // NOSONAR
    if (ctx.self === container) {
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

export const getAllYTPInstance = <T extends YTPInstanceType>(type: T): YTPInstanceOf<T>[] => {
  return Array.from(instances[type]?.values() as SetIterator<WeakRef<YTPInstanceOf<T>>> ?? []).map(ref => ref.deref()).filter(value => value != null)
}

export const getYTPInstance = <T extends YTPInstanceType>(type: T): YTPInstanceOf<T> | null => {
  return instances[type]?.values().next().value?.deref() as YTPInstanceOf<T> ?? null
}

export default class YTPlayerBootstrapModule extends Feature {
  public constructor() {
    super('bootstrap')
  }

  protected activate(): boolean {
    registerYTPlayerCreateCallback(onCreateYTPlayer)

    window.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style')
      style.textContent = STYLE_SHEET
      document.body.appendChild(style)
    })

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