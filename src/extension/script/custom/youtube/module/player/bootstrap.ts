import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { isYTLoggedIn, YTConfigInitCallback, YTPlayerCreateCallback, YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { registerYTInnertubeRequestProcessor, YTInnertubeRequest } from '@ext/custom/youtube/module/core/network'
import { URLSearchParams } from '@ext/global/network'
import { defineProperty, findPropertyChain, fromEntries, keys, observePropertyChain, values } from '@ext/global/object'
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
  ['web_watch_pip_context_menu_button'],

  // use WEB po token on TVHTML5
  ['html5_generate_content_po_token'],
  ['html5_generate_session_po_token'],
  ['html5_onesie_attach_po_token'],
  ['html5_non_onesie_attach_po_token'],
  ['html5_use_shared_owl_instance'],
  ['html5_web_po_token_disable_caching']
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
  [YTPInstanceType.APP, /(logger[A-Za-z("'._=\s]+App)|(publish\(["']applicationInitialized)/],
  [YTPInstanceType.VIDEO_PLAYER, /(logger[A-Za-z("'._=\s]+VideoPlayer)|(new\s+Map.*?bufferhealth)/]
] satisfies [YTPInstanceType, RegExp][]
const StatMethodMap = {
  bandwidth: 'getBandWidth',
  bufferhealth: 'getBufferHealth',
  networkactivity: 'getNetworkActivity',
  livelatency: 'getLiveLatency',
  rawlivelatency: 'getRawLiveLatency'
} satisfies Record<string, keyof YTPVideoPlayerInstance>
const JsonPrefix = ')]}\'\n'

export const enum YTPInstanceType {
  APP,
  VIDEO_PLAYER
}

export interface YTPDisposableInstance {
  dispose?(): void
}

export interface YTPEventTargetInstance extends YTPDisposableInstance {
  subscribe?<T, A extends unknown[]>(event: string, callback: (this: T, ...args: A) => void, instance?: T): number
  unsubscribe?<T, A extends unknown[]>(event: string, callback: (this: T, ...args: A) => void, instance?: T): boolean
  publish?<A extends unknown[]>(event: string, ...args: A): void
}

export interface YTPVideoDataInstance extends YTPDisposableInstance {
  videoId?: string
  cotn?: string

  isAd?(): boolean
  isDaiEnabled?(): boolean
  isEmbedsShortsMode?(): boolean
  isLoaded?(): boolean
  isOtf?(): boolean
  setData?(data?: object): void
}

export interface YTPAppInstance extends YTPDisposableInstance {
  playerRef?: WeakRef<YTPVideoPlayerInstance>

  mediaElement?: object | null
  template?: {
    element?: HTMLElement
  }

  enqueueVideoByPlayerVars?(...args: unknown[]): void
  getInternalApi(): Record<string, (...args: unknown[]) => unknown>
  loadVideoByPlayerVars?(...args: unknown[]): void
}

export interface YTPVideoPlayerInstance extends YTPEventTargetInstance {
  loop: boolean
  playbackRate: number
  playerType: number
  videoData?: YTPVideoDataInstance

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

let baseCtor: string | undefined
let mainApp: YTPInstanceOf<YTPInstanceType.APP> | undefined

export const YTPlayerContextConfigCallback = new Callback<[config: YTPlayerWebPlayerContextConfig]>()
export const YTPlayerInstanceCreateCallback = new Callback<YTPInstanceCallbackParams>()

type YTPInstanceOf<T extends YTPInstanceType> = typeof instancesByType[T] extends Set<WeakRef<infer I>> ? I : never
type YTPInstanceCallbackParams = { [T in YTPInstanceType]: [type: T, instance: YTPInstanceOf<T>] }[YTPInstanceType]

const onCreateInstanceType = (type: YTPInstanceType, instance: YTPDisposableInstance): YTPDisposableInstance => {
  setTimeout(() => YTPlayerInstanceCreateCallback.invoke(...[type, instance] as YTPInstanceCallbackParams), 1)

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

const onCreateInstanceGeneric = (instance: object): void => {
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
}

const onCreateYTPlayerWithGlobal = (playerGlobal: Record<string, Function>): void => {
  for (const key in playerGlobal) {
    const value = playerGlobal[key]
    if (typeof value !== 'function') continue

    for (const [type, regexp] of CtorRegexpList) {
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
        if (fn === baseCtor) onCreateInstanceGeneric(instance)

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

const processInnertubeRequest = (isGuestOnly: boolean, { context }: YTInnertubeRequest, headers: Headers): void => {
  if (isGuestOnly && isYTLoggedIn()) return

  const client = context?.client
  if (client == null) return

  const override = PLAYER_CLIENT_OVERRIDE[client.clientName!]
  if (override == null) return

  const [name, version] = override
  client.clientName = name
  client.clientVersion = version

  headers.delete('authorization')
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

export const getYTPInstances = <T extends YTPInstanceType>(type: T): YTPInstanceOf<T>[] => {
  return Array.from(instancesByType[type]?.values() as SetIterator<WeakRef<YTPInstanceOf<T>>> ?? []).map(ref => ref.deref()).filter(value => value != null)
}

export const getYTPMainApp = (): YTPInstanceOf<YTPInstanceType.APP> | undefined => {
  if (mainApp?.template?.element?.closest(MainPlayerParentSelector) == null) {
    mainApp = getYTPInstances(YTPInstanceType.APP).find(app => app.template?.element?.closest(MainPlayerParentSelector) != null)
  }
  return mainApp
}

export const getYTPMainPlayer = (): YTPInstanceOf<YTPInstanceType.VIDEO_PLAYER> | undefined => {
  return getYTPMainApp()?.playerRef?.deref()
}

export default class YTPlayerBootstrapModule extends Feature {
  public constructor() {
    super('bootstrap')
  }

  protected activate(): boolean {
    YTConfigInitCallback.registerCallback(ytcfg => processPlayerContextConfig(ytcfg.get('WEB_PLAYER_CONTEXT_CONFIGS')))
    YTPlayerCreateCallback.registerCallback(onCreateYTPlayer)
    YTPlayerInstanceCreateCallback.registerCallback((type, instance) => {
      switch (type) {
        case YTPInstanceType.APP:
          getYTPInstances(YTPInstanceType.VIDEO_PLAYER).some(playerInstance => {
            const chain = findPropertyChain(instance, playerInstance, 3, key => key !== 'mediaElement')
            if (chain == null) return false

            observePropertyChain(instance, chain, (playerInstance: YTPVideoPlayerInstance) => {
              logger.debug('player instance changed')
              instance.playerRef = new WeakRef(playerInstance)
            })
            return true
          })
          return
        case YTPInstanceType.VIDEO_PLAYER:
          values(instance).forEach(prop => {
            if (prop == null || typeof prop !== 'object') return

            for (const key in prop) {
              const value = prop[key]
              if (value == null || !(value instanceof Map)) continue

              for (const stat in StatMethodMap) {
                if (!value.has(stat)) continue

                instance[StatMethodMap[stat as keyof typeof StatMethodMap]] = value.get(stat)
              }
            }
          })
          return
      }
    })

    registerYTValueProcessor(YTRenderer.components.transportControlsAction, updateTransportControlsAction)

    registerYTInnertubeRequestProcessor('att/get', processInnertubeRequest.bind(null, false))
    registerYTInnertubeRequestProcessor('player', (request, headers) => {
      const { playbackContext } = request

      if (!playbackContext?.reloadPlaybackContext?.['reloadPlaybackParams']?.token) delete playbackContext?.reloadPlaybackContext

      processInnertubeRequest(true, request, headers)
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