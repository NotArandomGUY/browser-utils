import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { YTConfigInitCallback, YTPlayerCreateCallback, YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { URLSearchParams } from '@ext/global/network'
import { defineProperties, defineProperty, findPropertyPath, fromEntries, getOwnPropertyDescriptor, getOwnPropertyNames, getPrototypeOf, keys, values } from '@ext/global/object'
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
const GetPresentingPlayerRegexp = /this\.([a-zA-Z_$][\w$]*)\(\).+"setPresenting"/s
const TemplateMapPropRegexp = /this\.(.*?)\[['"`]{{.*?}}['"`]\]/
const StatsMethodList = [
  ['bandwidth', 'getBandWidth'],
  ['bufferhealth', 'getBufferHealth'],
  ['networkactivity', 'getNetworkActivity'],
  ['livelatency', 'getLiveLatency'],
  ['rawlivelatency', 'getRawLiveLatency']
] satisfies [string, keyof YTPVideoPlayer][]
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

export interface YTPPlayerState extends YTPObject {
  state?: number

  isPaused?(): boolean
  isPlaying?(): boolean
  isOrWillBePlaying?(): boolean
  isCued?(): boolean
  isBuffering?(): boolean
  isError?(): boolean
  isSuspended?(): boolean
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
  [YTPVideoPlayerSymbol]?: YTPVideoPlayer

  debugInfo?: YTPTemplate

  mediaElement?: object | null
  template?: Partial<YTPTemplate>

  enqueueVideoByPlayerVars?(...args: unknown[]): void
  getInternalApi?(): Record<string, (...args: unknown[]) => unknown>
  loadVideoByPlayerVars?(...args: unknown[]): void
}

export interface YTPVideoPlayer extends YTPEventTarget {
  [YTPVideoStatsMapSymbol]?: Map<string, () => number>
  [YTPVideoPlayerSymbol]?: YTPVideoPlayer

  getBandWidth?(): number | undefined
  getBufferHealth?(): number | undefined
  getNetworkActivity?(): number | undefined
  getLiveLatency?(): number | undefined
  getRawLiveLatency?(): number | undefined

  getCurrentTime?(): number
  getDuration?(): number
  getPlaybackQuality?(): string
  getPlaybackRate?(): number
  getPlayerState?(): YTPPlayerState
  getPreferredQuality?(): string
  getVideoData?(): YTPVideoData
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
export const YTPVideoStatsMapSymbol = Symbol()
export const YTPVideoPlayerSymbol = Symbol()
export const YTPObjectPrototypeSymbol = Symbol()

export const YTPlayerContextConfigCallback = new Callback<[config: YTPlayerWebPlayerContextConfig]>()
export const YTPObjectDefineCallback = new Callback<YTPObjectDefineCallbackParams>()
export const YTPObjectCreateCallback = new Callback<YTPObjectCreateCallbackParams>()

const appRefs = new Set<WeakRef<YTPInstanceOf<YTPObjectType.APP>>>()

let unregisterPlayerCreateCallback: (() => void) | undefined
let baseCtor: Function | undefined
let mainApp: YTPInstanceOf<YTPObjectType.APP> | undefined

const matchCtor = (body: string): YTPObjectType | null => {
  const index = CtorRegexpList.findIndex(entry => entry[1].test(body))
  if (index < 0) return null

  return CtorRegexpList.splice(index, 1)[0][0]
}

const onCreateTemplateElement = (template: YTPTemplate, element: HTMLElement): void => {
  if (!element.classList.contains('ytp-sfn')) return

  requestAnimationFrame(() => {
    getYTPApps().some(app => {
      if (findPropertyPath(app, value => value === template, 5) == null) return false

      app.debugInfo = template
      return true
    })
    onCreateObjectType(YTPObjectType.TEMPLATE_VIDEO_INFO, template)
  })
}

const onCreateObjectType = (type: YTPObjectType, object: YTPObject): YTPObject => {
  if (type === YTPObjectType.APP && object.dispose != null) {
    object.dispose = new Hook(object.dispose, false).install(() => {
      for (const ref of appRefs) {
        const value = ref.deref()
        if (value == null || value === object) appRefs.delete(ref)
      }
      return HookResult.EXECUTION_PASSTHROUGH
    }).call
    appRefs.add(new WeakRef(object as YTPInstanceOf<YTPObjectType.APP>))
  }
  setTimeout(() => YTPObjectCreateCallback.invoke(...[type, object] as YTPObjectCreateCallbackParams), 1)

  return object
}

const onCreateObjectGeneric = (object: object): void => {
  const prototype = getPrototypeOf(object)
  if (prototype == null) return

  let type = prototype[YTPObjectPrototypeSymbol] as YTPObjectType | null
  if (type == null) {
    type = matchCtor(prototype.constructor.toString())
    if (type == null) return

    defineProperty(prototype, YTPObjectPrototypeSymbol, { enumerable: false, value: type })
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

    const type = matchCtor(value.toString())
    if (type == null) continue

    playerGlobal[key] = new Proxy(value, {
      construct(target, argArray, newTarget) {
        return onCreateObjectType(type, Reflect.construct(target, argArray, newTarget))
      }
    })

    defineProperty(prototype, YTPObjectPrototypeSymbol, { enumerable: false, value: type })
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

export const getYTPApps = (): YTPInstanceOf<YTPObjectType.APP>[] => {
  return Array.from(appRefs.values()).map(ref => ref.deref()).filter(app => app != null)
}

export const getYTPMainApp = (): YTPInstanceOf<YTPObjectType.APP> | undefined => {
  if (mainApp?.template?.element?.closest(MainPlayerParentSelector) == null) {
    mainApp = getYTPApps().find(app => app.template?.element?.closest(MainPlayerParentSelector) != null)
  }
  return mainApp
}

export const getYTPMainPlayer = (): YTPInstanceOf<YTPObjectType.VIDEO_PLAYER> | undefined => {
  return getYTPMainApp()?.[YTPVideoPlayerSymbol]
}

export default class YTPlayerBootstrapModule extends Feature {
  public constructor() {
    super('bootstrap')
  }

  protected activate(): boolean {
    unregisterPlayerCreateCallback = YTPlayerCreateCallback.registerCallback(onCreateYTPlayer)

    YTConfigInitCallback.registerCallback(ytcfg => processPlayerContextConfig(ytcfg.get('WEB_PLAYER_CONTEXT_CONFIGS')))
    YTPObjectDefineCallback.registerCallback((type, prototype) => {
      switch (type) {
        case YTPObjectType.APP:
          for (const key of getOwnPropertyNames(prototype)) {
            const value = prototype[key]
            if (typeof value !== 'function' || value.prototype === prototype) continue

            const method = GetPresentingPlayerRegexp.exec(value.toString())?.[1]
            if (method == null) continue

            defineProperty(prototype, YTPVideoPlayerSymbol, {
              get(this: { get?(): YTPVideoPlayer | undefined }) {
                const proxy = this[method as 'get']?.()
                if (proxy == null) return null

                let player = proxy[YTPVideoPlayerSymbol]
                if (player == null) {
                  player = values(proxy).find(value => value != null && getPrototypeOf(value)[YTPObjectPrototypeSymbol] != null) ?? proxy
                  proxy[YTPVideoPlayerSymbol] = player
                }

                return player
              }
            })
            return
          }
          return
        case YTPObjectType.VIDEO_PLAYER:
          defineProperties(prototype, fromEntries(StatsMethodList.map(([key, method]) => [
            method,
            {
              configurable: true,
              value(this: YTPVideoPlayer) {
                return this[YTPVideoStatsMapSymbol]?.get(key)?.()
              }
            } satisfies PropertyDescriptor
          ])))
          return
        case YTPObjectType.TEMPLATE: {
          if (getOwnPropertyDescriptor(prototype, 'createElement') == null) return

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
                onCreateTemplateElement(self, element)
                ctx.returnValue = element

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
          return
        }
        case YTPObjectType.TEMPLATE_VIDEO_PLAYER:
          YTPObjectDefineCallback.invoke(YTPObjectType.TEMPLATE, getPrototypeOf(getPrototypeOf(prototype)))
          return
      }
    })
    YTPObjectCreateCallback.registerCallback((type, object) => {
      if (type !== YTPObjectType.VIDEO_PLAYER) return

      findPropertyPath(object, value => {
        if (value instanceof Map && StatsMethodList.some(([key]) => value.has(key))) {
          object[YTPVideoStatsMapSymbol] = value
          return true
        }

        return false
      }, 2)
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