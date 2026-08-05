import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { YTConfigInitCallback, YTPlayerCreateCallback, YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { URLSearchParams } from '@ext/global/network'
import { defineProperties, defineProperty, findPropertyChain, fromEntries, getOwnPropertyDescriptor, getPrototypeOf, keys, observePropertyChain, values } from '@ext/global/object'
import Callback from '@ext/lib/callback'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import { addInterceptNetworkCallback, NetworkContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTPLAYER-BOOTSTRAP')

const PLAYER_EXPERIMENT_FLAGS: [key: string, value?: string][] = [
  // prefer sticky resolution
  ['html5_perf_cap_override_sticky', 'false'],
  ['html5_ustreamer_cap_override_sticky', 'false'],

  // sabr usually have a smoother buffer, but prevent csdai seeking in some cases
  ['html5_enable_sabr_csdai', 'false'],

  // try to avoid dropping resolution with sabr live
  ['html5_disable_bandwidth_cofactors_for_sabr_live'],
  ['html5_live_quality_cap', '0'],
  ['html5_sabr_live_timing'],
  ['html5_streaming_resilience'],

  // enable miniplayer & pip context menu buttons
  ['web_player_miniplayer_in_context_menu'],
  ['web_watch_pip_context_menu_button']
]
const PLAYER_STYLE_SHEET = [
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

const MainPlayerParentSelector = 'ytd-player,ytlr-player'
const CtorRegexpList = [
  [YTPObjectType.APP, /(logger[A-Za-z("'._=\s]+App)|(this(\.[a-zA-Z_$][\w$]*){2}\(["']applicationInitialized["']\))/],
  [YTPObjectType.VIDEO_PLAYER, /(logger[A-Za-z("'._=\s]+VideoPlayer)|(new\s+Map.*?bufferhealth)/],
  // matching from global
  [YTPObjectType.TEMPLATE, /this\.element\s*=\s*this\.createElement/],
  // matching from create hook
  [YTPObjectType.TEMPLATE_VIDEO_PLAYER, /html5-video-player/]
] satisfies [YTPObjectType, RegExp][]
const TemplateMapPropRegexp = /this\.(.*?)\[['"`]{{.*?}}['"`]\]/
const StatMethodMap = {
  bandwidth: 'getBandWidth',
  bufferhealth: 'getBufferHealth',
  networkactivity: 'getNetworkActivity',
  livelatency: 'getLiveLatency',
  rawlivelatency: 'getRawLiveLatency'
} satisfies Record<string, keyof YTPVideoPlayer>
const JsonPrefix = ')]}\'\n'

export interface YTPObject {
  dispose?(): void
  addOnDisposeCallback?(callback: () => void): void
  addOnDisposeCallback?<T>(callback: (this: T) => void, thisArg: T): void
}

export interface YTPEventTarget extends YTPObject {
  subscribe?<T, A extends unknown[]>(event: string, callback: (this: T, ...args: A) => void, thisArg?: T): number
  unsubscribe?<T, A extends unknown[]>(event: string, callback: (this: T, ...args: A) => void, thisArg?: T): boolean
  publish?<A extends unknown[]>(event: string, ...args: A): void
}

export interface YTPVideoData extends YTPObject {
  videoId?: string
  cotn?: string
  isLivePlayback?: boolean

  isAd?(): boolean
  isDaiEnabled?(): boolean
  isEmbedsShortsMode?(): boolean
  isLoaded?(): boolean
  isOtf?(): boolean
  getPlayerResponse?(): object
  getWatchNextResponse?(): object
  getReelItemWatchResponse?(): object
  getResolveUrlResponse?(): object
  getHeartbeatResponse?(): object
  getEmbeddedPlayerResponse?(): object
  setData?(data?: object): void
}

export interface YTPApp extends YTPObject {
  playerRef?: WeakRef<YTPVideoPlayer>
  ytpsfnRef?: WeakRef<YTPTemplate>

  mediaElement?: object | null
  template?: Partial<YTPTemplate>

  enqueueVideoByPlayerVars?(...args: unknown[]): void
  getInternalApi(): Record<string, (...args: unknown[]) => unknown>
  loadVideoByPlayerVars?(...args: unknown[]): void
}

export interface YTPVideoPlayer extends YTPEventTarget {
  loop: boolean
  playbackRate: number
  playerType: number
  videoData?: YTPVideoData

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

export interface YTPTemplate extends YTPObject {
  [YTPTemplateMapSymbol]: Record<`{{${string}}}`, [Node, 'child' | 'style']>

  element: HTMLElement

  createElement(this: YTPTemplate, template: object, svg?: boolean): HTMLElement
  define(this: YTPTemplate, key: string, node: Node, type: 'child' | 'style'): void
  update(this: YTPTemplate, data: Record<string, string | number[]>): void
  updateValue(this: YTPTemplate, key: string, value: string | number[]): void
}

export const enum YTPObjectType {
  APP,
  VIDEO_PLAYER,
  TEMPLATE,
  TEMPLATE_VIDEO_INFO,
  TEMPLATE_VIDEO_PLAYER
}

type YTPInstanceOf<T extends YTPObjectType> = {
  [YTPObjectType.APP]: YTPApp
  [YTPObjectType.VIDEO_PLAYER]: YTPVideoPlayer
  [YTPObjectType.TEMPLATE]: YTPTemplate
  [YTPObjectType.TEMPLATE_VIDEO_INFO]: YTPTemplate
  [YTPObjectType.TEMPLATE_VIDEO_PLAYER]: YTPTemplate
}[T]
type YTPObjectDefineCallbackParams = { [T in YTPObjectType]: [type: T, prototype: any] }[YTPObjectType]
type YTPObjectCreateCallbackParams = { [T in YTPObjectType]: [type: T, object: YTPInstanceOf<T>] }[YTPObjectType]

export const YTPTemplateMapSymbol = Symbol()
export const YTPObjectPrototypeSymbol = Symbol()

export const YTPlayerContextConfigCallback = new Callback<[config: YTPlayerWebPlayerContextConfig]>()
export const YTPObjectDefineCallback = new Callback<YTPObjectDefineCallbackParams>()
export const YTPObjectCreateCallback = new Callback<YTPObjectCreateCallbackParams>()

const objectsMap = {
  [YTPObjectType.APP]: new Set(),
  [YTPObjectType.VIDEO_PLAYER]: new Set()
} satisfies Partial<{ [T in YTPObjectType]: Set<WeakRef<YTPInstanceOf<T>>> }>

let unregisterPlayerCreateCallback: (() => void) | undefined
let baseCtor: Function | undefined
let mainApp: YTPInstanceOf<YTPObjectType.APP> | undefined

const onCreateObjectType = (type: YTPObjectType, object: YTPObject): YTPObject => {
  const objects = objectsMap[type as keyof typeof objectsMap] as Set<WeakRef<YTPObject>>
  if (objects != null && object.dispose != null) {
    object.dispose = new Hook(object.dispose, false).install(() => {
      for (const ref of objects) {
        const value = ref.deref()
        if (value == null || value === object) objects.delete(ref)
      }
      return HookResult.EXECUTION_PASSTHROUGH
    }).call
    objects.add(new WeakRef(object))
  }
  setTimeout(() => YTPObjectCreateCallback.invoke(...[type, object] as YTPObjectCreateCallbackParams), 1)

  return object
}

const onCreateObjectGeneric = (object: object): void => {
  const prototype = getPrototypeOf(object)
  if (prototype == null) return

  const body = prototype.constructor.toString()
  const type = CtorRegexpList.find(entry => entry[1].test(body))?.[0]
  if (type == null) return

  if (!(YTPObjectPrototypeSymbol in prototype)) {
    defineProperty(prototype, YTPObjectPrototypeSymbol, { enumerable: false, value: undefined })
    YTPObjectDefineCallback.invoke(type, prototype)
  }

  onCreateObjectType(type, object)
}

const onCreateYTPlayerWithGlobal = (playerGlobal: Record<string | symbol, unknown>): void => {
  for (const key in playerGlobal) {
    const value = playerGlobal[key]
    if (typeof value !== 'function') continue

    const prototype = value.prototype
    if (prototype == null) continue

    const body = value.toString()
    const type = CtorRegexpList.find(entry => entry[1].test(body))?.[0]
    if (type == null) continue

    playerGlobal[key] = new Proxy(value, {
      construct(target, argArray, newTarget) {
        return onCreateObjectType(type, Reflect.construct(target, argArray, newTarget))
      }
    })
    YTPObjectDefineCallback.invoke(type, prototype)
  }
}

const onCreateYTPlayer = (container: HTMLElement): void => {
  unregisterPlayerCreateCallback?.()

  const playerGlobal = window._yt_player
  if (playerGlobal != null) return onCreateYTPlayerWithGlobal(playerGlobal)

  Object.prototype.hasOwnProperty = new Hook(Object.prototype.hasOwnProperty).install(ctx => { // NOSONAR
    if (ctx.self === container) {
      Function.prototype.call = new Hook(Function.prototype.call).install(ctx => { // NOSONAR
        const callable = ctx.self
        const object = ctx.args[0]

        let result = HookResult.EXECUTION_PASSTHROUGH
        if (baseCtor == null) {
          const oldKeys = keys(object).length
          ctx.returnValue = ctx.origin.apply(ctx.self, ctx.args)
          const newKeys = keys(object).length

          if (oldKeys === newKeys) return HookResult.EXECUTION_CONTINUE

          baseCtor = callable
          result = HookResult.EXECUTION_CONTINUE
        }
        if (callable === baseCtor) onCreateObjectGeneric(object)

        return result
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

const processResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url: { pathname, searchParams }, response } = ctx

  if (pathname !== '/tv_config') return

  try {
    const data = await response.clone().text()
    const isPrefixed = data.startsWith(JsonPrefix)
    const config = JSON.parse(isPrefixed ? data.slice(JsonPrefix.length) : data)

    if (searchParams.has('action_get_config')) {
      const { webPlayerContextConfig } = config

      processPlayerContextConfig(webPlayerContextConfig)
    }

    ctx.response = new Response(`${isPrefixed ? JsonPrefix : ''}${JSON.stringify(data)}`, {
      status: response.status,
      headers: fromEntries(response.headers.entries())
    })
  } catch (error) {
    logger.warn('process tv config error:', error)
  }
}

const updateTransportControlsAction = (data: YTValueData<YTRenderer.Component<'transportControlsAction'>>): void => {
  const button = data.button?.buttonRenderer
  if (button && data.type === 'TRANSPORT_CONTROLS_BUTTON_TYPE_SPEED_BUTTON') button.isDisabled = false
}

export const getYTPObjects = <T extends keyof typeof objectsMap>(type: T): YTPInstanceOf<T>[] => {
  return Array.from(objectsMap[type]?.values() as SetIterator<WeakRef<YTPInstanceOf<T>>> ?? []).map(ref => ref.deref()).filter(value => value != null)
}

export const getYTPMainApp = (): YTPInstanceOf<YTPObjectType.APP> | undefined => {
  if (mainApp?.template?.element?.closest(MainPlayerParentSelector) == null) {
    mainApp = getYTPObjects(YTPObjectType.APP).find(app => app.template?.element?.closest(MainPlayerParentSelector) != null)
  }
  return mainApp
}

export const getYTPMainPlayer = (): YTPInstanceOf<YTPObjectType.VIDEO_PLAYER> | undefined => {
  return getYTPMainApp()?.playerRef?.deref()
}

export default class YTPlayerBootstrapModule extends Feature {
  public constructor() {
    super('bootstrap')
  }

  protected activate(): boolean {
    unregisterPlayerCreateCallback = YTPlayerCreateCallback.registerCallback(onCreateYTPlayer)

    YTConfigInitCallback.registerCallback(ytcfg => processPlayerContextConfig(ytcfg.get('WEB_PLAYER_CONTEXT_CONFIGS')))
    YTPObjectDefineCallback.registerCallback((type, prototype) => {
      if (type === YTPObjectType.TEMPLATE_VIDEO_PLAYER) {
        YTPObjectDefineCallback.invoke(YTPObjectType.TEMPLATE, getPrototypeOf(getPrototypeOf(prototype)))
        return
      }
      if (type !== YTPObjectType.TEMPLATE || getOwnPropertyDescriptor(prototype, 'createElement') == null) return

      const templateMapProp = TemplateMapPropRegexp.exec(prototype.updateValue?.toString())?.[1]
      if (templateMapProp == null) return

      defineProperties(prototype, {
        [YTPTemplateMapSymbol]: {
          configurable: true,
          get() {
            return this[templateMapProp]
          }
        },
        createElement: {
          configurable: true,
          value: new Hook(prototype.createElement as YTPTemplate['createElement']).install(ctx => {
            const { origin, self, args } = ctx

            self.createElement = origin
            const element = origin.apply(self, args)
            ctx.returnValue = element

            if (element.classList.contains('ytp-sfn')) {
              requestAnimationFrame(() => {
                getYTPObjects(YTPObjectType.APP).some(app => { // NOSONAR
                  if (findPropertyChain(app, self, 5) == null) return false

                  app.ytpsfnRef = new WeakRef(self)
                  return true
                })
                onCreateObjectType(YTPObjectType.TEMPLATE_VIDEO_INFO, self)
              })
            }

            return HookResult.EXECUTION_CONTINUE
          }).call
        },
        define: {
          configurable: true,
          value(this: YTPTemplate, key: string, node: Node, type: 'child' | 'style') {
            this[YTPTemplateMapSymbol][`{{${key}}}`] = [node, type]
          }
        }
      })
    })
    YTPObjectCreateCallback.registerCallback((type, object) => {
      switch (type) {
        case YTPObjectType.APP:
          getYTPObjects(YTPObjectType.VIDEO_PLAYER).some(player => {
            const chain = findPropertyChain(object, player, 3, key => key !== 'mediaElement')
            if (chain == null) return false

            observePropertyChain(object, chain, (playerInstance: YTPVideoPlayer) => {
              logger.debug('player instance changed')
              object.playerRef = new WeakRef(playerInstance)
            })
            return true
          })
          return
        case YTPObjectType.VIDEO_PLAYER:
          values(object).forEach(prop => {
            if (prop == null || typeof prop !== 'object') return

            for (const key in prop) {
              const value = prop[key]
              if (value == null || !(value instanceof Map)) continue

              for (const stat in StatMethodMap) {
                if (!value.has(stat)) continue

                object[StatMethodMap[stat as keyof typeof StatMethodMap]] = value.get(stat)
              }
            }
          })
          return
      }
    })

    registerYTValueProcessor(YTRenderer.components.transportControlsAction, updateTransportControlsAction)

    registerYTInnertubeRequestProcessor('player', (request) => {
      const { playbackContext } = request

      if (!playbackContext?.reloadPlaybackContext?.['reloadPlaybackParams']?.token) delete playbackContext?.reloadPlaybackContext
    })

    addInterceptNetworkCallback(async ctx => {
      if (ctx.state === NetworkState.SUCCESS) await processResponse(ctx)
    })

    addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style')
      style.textContent = PLAYER_STYLE_SHEET
      document.body.appendChild(style)
    })

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]

      // Remove player pause overlay
      if (node instanceof HTMLDivElement && node.classList.contains('ytp-pause-overlay')) return HookResult.EXECUTION_CONTINUE

      return HookResult.EXECUTION_PASSTHROUGH
    })

    // Fail properly on invalid tests to unlock higher qualities
    const isTypeSupported = window.MediaSource?.isTypeSupported
    if (isTypeSupported != null) {
      MediaSource.isTypeSupported = new Hook(isTypeSupported).install(ctx => {
        const type = String(ctx.args[0])
        if (/;\s*\w+=(99+|\d000000+|invalid\w*|nope)$/.test(type)) {
          ctx.returnValue = false
          return HookResult.EXECUTION_RETURN
        }
        return HookResult.EXECUTION_PASSTHROUGH
      }).call
    }

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}