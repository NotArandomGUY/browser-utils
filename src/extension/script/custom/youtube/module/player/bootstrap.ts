import { isYTLoggedIn, YTConfigInitCallback, YTPlayerCreateCallback, YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { registerYTInnertubeRequestProcessor, YTInnertubeRequest } from '@ext/custom/youtube/module/core/network'
import { URLSearchParams } from '@ext/global/network'
import { defineProperty, entries, fromEntries, getOwnPropertyNames, getPrototypeOf, keys, values } from '@ext/global/object'
import Callback from '@ext/lib/callback'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import { addInterceptNetworkCallback, NetworkContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTPLAYER-BOOTSTRAP')

const PLAYER_CLIENT_OVERRIDE: Record<string, [name: string, version: string]> = {
  'TVHTML5': ['WEB', '2.20260128.05.00']
}
const PLAYER_EXPERIMENT_FLAGS: [key: string, value?: string][] = [
  // unlock higher quality formats
  ['html5_force_hfr_support'],
  ['html5_tv_ignore_capable_constraint'],

  // sabr usually have a smoother buffer, but prevent csdai seeking in some cases
  ['html5_enable_sabr_csdai', 'false'],
  ['html5_remove_client_sabr_determination', 'true'],

  // try to avoid dropping resolution with sabr live
  ['html5_disable_bandwidth_cofactors_for_sabr_live'],
  ['html5_live_quality_cap', '0'],
  ['html5_sabr_live_timing'],
  ['html5_streaming_resilience'],

  // enable miniplayer & pip context menu buttons
  ['web_player_miniplayer_in_context_menu'],
  ['web_watch_pip_context_menu_button'],

  // use WEB po token on TVHTML5
  ['html5_generate_content_po_token'],
  ['html5_generate_session_po_token'],
  ['html5_onesie_attach_po_token'],
  ['html5_non_onesie_attach_po_token'],
  ['html5_use_shared_owl_instance'],
  ['html5_web_po_token_disable_caching'],
  //['html5_web_po_request_key', 'O43z0dpjhgX20SCx4KAo']
]
const STYLE_SHEET = [
  // FIX: leanback animated overlay virtual list bug
  '.app-quality-root .ytLrAnimatedOverlayHiding .ytLrAnimatedOverlayContainer,.app-quality-root .frHKed .AmQJbe{opacity:0!important;display:block!important}',
  // player stats
  ':root .ytp-sfn{margin:0;background:rgba(28,28,28,.5);border-radius:4px;color:#fff;position:absolute;left:initial;right:1em;top:1em;z-index:64;min-width:26em;font-size:11px}',
  ':root .ytp-sfn .ytp-sfn-content{padding:5px}',
  ':root .ytp-sfn .ytp-sfn-content>div>div{display:inline-block;font-weight:500;padding:0 .5em;text-align:right;width:10em}',
  ':root .ytp-sfn .ytp-sfn-cpn{font-family:Consolas,Monaco,monospace;font-size:12px}',
  ':root .ytp-sfn .ytp-horizonchart{display:inline-block;margin:2px;position:relative;vertical-align:bottom}',
  ':root .ytp-sfn .ytp-horizonchart>span{display:inline-block;position:absolute}',
  // leanback watch controls background style
  '.app-quality-root .ytLrWatchDefaultControl .ytLrWatchDefaultControlsBackground,.app-quality-root .ytLrWatchDefaultPivot .ytLrWatchDefaultControlsBackground{background:-webkit-linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.41) 67.43%,rgba(0,0,0,.7) 100%)!important;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.41) 67.43%,rgba(0,0,0,.7) 100%)!important}',
  // leanback live chat styles
  '.ytLrLiveChatHost,.DEPcRc{text-shadow:.125rem .125rem .15rem #0f0f0f;width:19.375rem}',
  '.ytLrLiveChatMessageList,.JjIq5d{margin:2.75rem 2.5rem 2.75rem 2rem;width:14.875rem}',
  '.ytLrLiveChatClientMessageHost,.ytLrLiveChatPaidMessageRendererHost,.ytLrLiveChatTextMessageRendererHost,.Al763e,.GdyuCd,.SoC2id{background-color:#0f0f0f1f!important;border-radius:.125rem}',
  '.ytLrLiveChatClientMessageHost,.Al763e{padding:.125rem}',
  '.ytLrLiveChatPaidMessageRendererHeader,.LxxQOb{border-radius:.125rem .125rem 0 0;padding:.125rem;text-shadow:none}',
  '.ytLrLiveChatPaidMessageRendererBody,.a8Dqxe{background-color:initial!important;border-radius:0 0 .125rem .125rem;padding:.125rem}',
  '.ytLrLiveChatTextMessageRendererContent,.DBsPxe{padding:.125rem .125rem .125rem 0}',
  '.ytLrLiveChatTextMessageRendererBody,.WIjhVc{margin-top:.025rem}',
  '.app-quality-root .ytLrLiveChatTextMessageRendererAuthorNamem,.app-quality-root .lFzQBb{display:inline}',
  '.ytLrLiveChatPaidMessageRendererAuthorPhoto,.ytLrLiveChatTextMessageRendererAuthorPhoto,.XEjrof,.Z7Lmsc{height:1.25rem;width:1.25rem;left:.125rem;margin-top:.125rem}',
  '.ytLrLiveChatPaidMessageRendererHasImage .ytLrLiveChatPaidMessageRendererHeader,.ytLrLiveChatPaidMessageRendererHasImage .ytLrLiveChatPaidMessageRendererBody,.g01YTe .LxxQOb,.g01YTe .a8Dqxe{padding-left:1.5rem}',
  '.ytLrLiveChatTextMessageRendererContentHasImage,.LRs4Af{margin-left:1.5rem}'
].join('\n')
const JSON_PREFIX = ')]}\'\n'

const CTOR_REGEXP_LIST = [
  [YTPInstanceType.APP, /(logger[A-Za-z("'._=\s]+App)|(publish\(["']applicationInitialized)/],
  [YTPInstanceType.VIDEO_PLAYER, /(logger[A-Za-z("'._=\s]+VideoPlayer)|(new\s+Map.*?bufferhealth)/]
] satisfies [YTPInstanceType, RegExp][]

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
  cotn: string | undefined

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

const instancesByType = {
  [YTPInstanceType.APP]: new Set<WeakRef<YTPAppInstance>>(),
  [YTPInstanceType.VIDEO_PLAYER]: new Set<WeakRef<YTPVideoPlayerInstance>>()
}

let baseCtor: string | null = null

export const YTPlayerContextConfigCallback = new Callback<[config: YTPlayerWebPlayerContextConfig]>()

type YTPInstanceOf<T extends YTPInstanceType> = typeof instancesByType[T] extends Set<WeakRef<infer I>> ? I : never

const findPropertyChain = (parent: unknown, child: unknown, depth: number, excludes: string[] = []): string[] | null => {
  if (parent == null || typeof parent !== 'object' || depth < 1) return null

  for (const [key, value] of entries(parent)) {
    if (excludes.includes(key)) continue

    if (value === child) return [key]

    const chain = findPropertyChain(value, child, depth - 1, excludes)
    if (chain != null) return [key, ...chain]
  }

  return null
}

const observePropertyChain = <T extends object>(parent: unknown, chain: string[], callback: (value: T) => void): void => {
  if (parent == null || typeof parent !== 'object') return

  const key = chain[0]
  if (key == null) return

  let value: unknown

  const get = (): unknown => value
  const set = (v: unknown): void => {
    value = v
    observePropertyChain(value, chain.slice(1), callback)
  }

  set(parent[key as keyof typeof parent])
  defineProperty(parent, key, { configurable: true, enumerable: true, get, set })

  if (chain.length > 1) return

  try {
    callback(value as T)
  } catch (error) {
    logger.warn('property callback error:', error)
  }
}

const onCreateAppInstance = (instance: YTPAppInstance): void => {
  const playerInstances = getAllYTPInstance(YTPInstanceType.VIDEO_PLAYER)

  for (const playerInstance of playerInstances) {
    const chain = findPropertyChain(instance, playerInstance, 3, ['mediaElement'])
    if (chain == null) continue

    observePropertyChain(instance, chain, (playerInstance: YTPVideoPlayerInstance) => {
      logger.debug('player instance changed')
      instance.playerRef = new WeakRef(playerInstance)
    })
    return
  }

  logger.warn('failed to locate player instance')
}

const onCreateVideoPlayerInstance = (instance: YTPVideoPlayerInstance): void => {
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

  const prototype = getPrototypeOf(instance.videoData)
  if (prototype == null) return

  getOwnPropertyNames(prototype).forEach(key => {
    const value = prototype[key as keyof YTPVideoDataInstance]
    if (typeof value !== 'function' || !value.toString().includes('.storyboards')) return

    defineProperty(prototype, key, {
      configurable: true,
      value: new Hook(value as (this: YTPVideoDataInstance, ...args: unknown[]) => unknown).install(ctx => {
        const { self, args } = ctx

        const cotn = self.cotn
        self.cotn = undefined
        ctx.returnValue = ctx.origin.apply(self, args)
        self.cotn = cotn

        return HookResult.EXECUTION_RETURN
      }).call
    })
  })
}

const onCreateInstanceType = (type: YTPInstanceType, instance: YTPDisposableInstance): YTPDisposableInstance => {
  setTimeout(() => {
    switch (type) {
      case YTPInstanceType.APP:
        onCreateAppInstance(instance as YTPAppInstance)
        break
      case YTPInstanceType.VIDEO_PLAYER:
        onCreateVideoPlayerInstance(instance as YTPVideoPlayerInstance)
        break
      default:
        logger.warn('invalid type')
        break
    }
  }, 1)

  if (instance.dispose != null) {
    const instances = instancesByType[type] as Set<WeakRef<YTPDisposableInstance>>

    instance.dispose = new Hook(instance.dispose, false).install(ctx => {
      for (const ref of instances) {
        const value = ref.deref()
        if (value == null || value === instance) instances.delete(ref)
      }
      return HookResult.EXECUTION_PASSTHROUGH
    }).call

    instances.add(new WeakRef(instance))
  }

  return instance
}

const onCreateInstanceGeneric = (instance: object): boolean => {
  defineProperty(instance, 'logger', {
    configurable: true,
    set(value) {
      defineProperty(instance, 'logger', { configurable: true, writable: true, value })
      switch (value?.tag) {
        case 'App':
          onCreateInstanceType(YTPInstanceType.APP, instance)
          break
        case 'VideoPlayer':
          onCreateInstanceType(YTPInstanceType.VIDEO_PLAYER, instance)
          break
      }
    }
  })

  return true
}

const onCreateYTPlayerWithGlobal = (playerGlobal: Record<string, Function>): void => {
  for (const key in playerGlobal) {
    const value = playerGlobal[key]
    if (typeof value !== 'function') continue

    for (const [type, regexp] of CTOR_REGEXP_LIST) {
      if (!regexp.test(value.toString())) continue

      playerGlobal[key] = new Proxy(value, {
        construct(target, argArray, newTarget) {
          return onCreateInstanceType(type, Reflect.construct(target, argArray, newTarget))
        }
      })
      break
    }
  }
}

const onCreateYTPlayer = (container: HTMLElement): void => {
  const playerGlobal = window._yt_player
  if (playerGlobal != null) return onCreateYTPlayerWithGlobal(playerGlobal)

  Object.prototype.hasOwnProperty = new Hook(Object.prototype.hasOwnProperty).install(ctx => { // NOSONAR
    if (ctx.self === container) {
      Function.prototype.call = new Hook(Function.prototype.call).install(ctx => { // NOSONAR
        const fn = ctx.self.toString()
        const instance = ctx.args[0]

        let result = HookResult.EXECUTION_PASSTHROUGH
        if (baseCtor == null) {
          const oldKeys = keys(instance).length
          ctx.returnValue = ctx.origin.apply(ctx.self, ctx.args)
          const newKeys = keys(instance).length

          if (oldKeys === newKeys) return HookResult.EXECUTION_CONTINUE

          baseCtor = fn
          result = HookResult.EXECUTION_CONTINUE
        }

        if (fn !== baseCtor || onCreateInstanceGeneric(instance)) return result

        Function.prototype.call = ctx.origin // NOSONAR
        return HookResult.ACTION_UNINSTALL | result
      }).call
    }

    return HookResult.EXECUTION_PASSTHROUGH
  }).call
}

const processPlayerContextConfig = (webPlayerContextConfig: Record<string, YTPlayerWebPlayerContextConfig>): void => {
  if (webPlayerContextConfig == null) return

  for (const id in webPlayerContextConfig) {
    const config = webPlayerContextConfig[id]
    if (config == null) continue

    const { serializedExperimentFlags } = config

    const flags = new URLSearchParams(serializedExperimentFlags)
    PLAYER_EXPERIMENT_FLAGS.forEach(([k, v]) => flags.set(k, v ?? 'true'))
    config.serializedExperimentFlags = flags.toString()

    YTPlayerContextConfigCallback.invoke(config)
  }
}

const processInnertubeRequest = ({ context }: YTInnertubeRequest): void => {
  if (isYTLoggedIn()) return

  const client = context?.client
  if (client == null) return

  const override = PLAYER_CLIENT_OVERRIDE[client.clientName!]
  if (override == null) return

  const [name, version] = override
  client.clientName = name
  client.clientVersion = version
}

const processResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url: { pathname, searchParams }, response } = ctx

  if (pathname !== '/tv_config') return

  try {
    const data = await response.clone().text()
    const isPrefixed = data.startsWith(JSON_PREFIX)
    const config = JSON.parse(isPrefixed ? data.slice(JSON_PREFIX.length) : data)

    if (searchParams.has('action_get_config')) {
      const { webPlayerContextConfig } = config

      processPlayerContextConfig(webPlayerContextConfig)
    }

    ctx.response = new Response(`${isPrefixed ? JSON_PREFIX : ''}${JSON.stringify(data)}`, {
      status: response.status,
      headers: fromEntries(response.headers.entries())
    })
  } catch (error) {
    logger.warn('process tv config error:', error)
  }
}

export const getAllYTPInstance = <T extends YTPInstanceType>(type: T): YTPInstanceOf<T>[] => {
  return Array.from(instancesByType[type]?.values() as SetIterator<WeakRef<YTPInstanceOf<T>>> ?? []).map(ref => ref.deref()).filter(value => value != null)
}

export const getYTPInstance = <T extends YTPInstanceType>(type: T): YTPInstanceOf<T> | null => {
  return instancesByType[type]?.values().next().value?.deref() as YTPInstanceOf<T> ?? null
}

export default class YTPlayerBootstrapModule extends Feature {
  public constructor() {
    super('bootstrap')
  }

  protected activate(): boolean {
    YTConfigInitCallback.registerCallback(ytcfg => processPlayerContextConfig(ytcfg.get('WEB_PLAYER_CONTEXT_CONFIGS')))
    YTPlayerCreateCallback.registerCallback(onCreateYTPlayer)

    registerYTInnertubeRequestProcessor('att/get', processInnertubeRequest)
    registerYTInnertubeRequestProcessor('player', processInnertubeRequest)

    addInterceptNetworkCallback(async ctx => {
      if (ctx.state === NetworkState.SUCCESS) await processResponse(ctx)
    })

    addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style')
      style.textContent = STYLE_SHEET
      document.body.appendChild(style)
    })

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]

      // Remove player pause overlay
      if (node instanceof HTMLDivElement && node.classList.contains('ytp-pause-overlay')) return HookResult.EXECUTION_CONTINUE

      return HookResult.EXECUTION_PASSTHROUGH
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}