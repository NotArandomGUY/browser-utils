import { registerOverlayPage } from '@ext/common/preload/overlay'
import { processYTEndpoint, processYTResponse } from '@ext/custom/youtube/api/processor'
import { YTResponse, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import YTDevicePage from '@ext/custom/youtube/pages/device'
import { assign, defineProperties, defineProperty, fromEntries } from '@ext/global/object'
import Callback from '@ext/lib/callback'
import { Feature } from '@ext/lib/feature'
import Hook, { CallContext, HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTCORE-BOOTSTRAP')

type YTInitDataResponse = {
  page: 'browse' | 'channel' | 'playlist'
  response: YTValueData<YTResponse.Mapped<'browse'>>
} | {
  page: 'search'
  response: YTValueData<YTResponse.Mapped<'search'>>
} | {
  page: 'shorts',
  response: YTValueData<YTResponse.Mapped<'reelReelItemWatch'>>
} | {
  page: 'watch'
  response: YTValueData<YTResponse.Mapped<'next'>>
} | {
  page: 'live_chat'
  response: YTValueData<YTResponse.Mapped<'liveChatGetLiveChat'>>
}

type YTInitData = YTInitDataResponse & Partial<{
  endpoint: YTValueData<{ type: YTValueType.ENDPOINT }>
  playerResponse: YTValueData<YTResponse.Mapped<'player'>>
  reelWatchSequenceResponse: YTValueData<YTResponse.Mapped<'reelReelWatchSequence'>>
  url: string
  previousCsn: string
}>

export interface YTInnertubeContext {
  client: Partial<{
    hl: string
    gl: string
    remoteHost: string
    deviceMake: string
    deviceModel: string
    visitorData: string
    userAgent: string
    clientName: string
    clientScreen: string
    clientVersion: string
    osName: string
    osVersion: string
    originalUrl: string
    platform: string
    clientFormFactor: string
    configInfo: Record<string, string>
    userInterfaceTheme: string
    timeZone: string
    browserName: string
    browserVersion: string
    acceptHeader: string
    deviceExperimentId: string
    rolloutToken: string
    mainAppWebInfo: Partial<{
      graftUrl: string
      isWebNativeShareAvailable: boolean
      webDisplayMode: 'WEB_DISPLAY_MODE_UNKNOWN' | 'WEB_DISPLAY_MODE_BROWSER' | 'WEB_DISPLAY_MODE_MINIMAL_UI' | 'WEB_DISPLAY_MODE_STANDALONE' | 'WEB_DISPLAY_MODE_FULLSCREEN'
    }>
    tvAppInfo: Partial<{
      appQuality: 'TV_APP_QUALITY_FULL_ANIMATION'
      livingRoomAppMode: 'LIVING_ROOM_APP_MODE_UNSPECIFIED'
      livingRoomPoTokenId: string
      supportsNativeScrolling: boolean
      voiceCapability: {
        hasHardMicSupport: boolean
        hasSoftMicSupport: boolean
      }
      watchPageInfo: {
        combineChannelSdEntrypoints: boolean
        watchPageVersion: string
      }
    }>
  }>
  user: Partial<{
    lockedSafetyMode: boolean
  }>
  request: Partial<{
    consistencyTokenJars: unknown[]
    internalExperimentFlags: unknown[]
    useSsl: boolean
  }>
  clickTracking?: Partial<{
    clickTrackingParams: string
  }>
}

export type YTKevlarProperty<T = unknown> = [kevlar: Record<string, unknown>, name: string, value: T]

export interface YTKevlarInjector {
  addProvider(provider: YTKevlarProvider): void
}

export interface YTKevlarInjectionToken {
  name: string
}

export interface YTKevlarProvider {
  provide: YTKevlarInjectionToken | Function
  useClass?: Function
  useFactory?: () => unknown
  useValue?: unknown
}

export interface YTPlayerConfig {
  args?: Partial<{
    author: string
    length_seconds: string
    raw_player_response: YTValueData<YTResponse.Mapped<'player'>>
    title: string
    ucid: string
    video_id: string
  }>
}

export interface YTPlayerWebPlayerContextConfig {
  transparentBackground: boolean
  showMiniplayerButton: boolean
  externalFullscreen: boolean
  showMiniplayerUiWhenMinimized: boolean
  rootElementId: string
  jsUrl: string
  cssUrl: string
  contextId: string
  eventLabel: string
  contentRegion: string
  hl: string
  hostLanguage: string
  playerStyle: string
  innertubeApiKey: string
  innertubeApiVersion: string
  innertubeContextClientVersion: string
  device: {
    brand: string
    model: string
    browser: string
    browserVersion: string
    os: string
    osVersion: string
    platform: string
    interfaceName: string
    interfaceVersion: string
  }
  serializedExperimentIds: string
  serializedExperimentFlags: string
  cspNonce: string
  canaryState: string
  enableCsiLogging: boolean
  csiPageType: string
  datasyncId: string
  allowWoffleManagement: boolean
  cinematicSettingsAvailable: boolean
  canaryStage: string
  onesieHotConfig: {
    baseUrl: string
    clientKey: string
    encryptedClientKey: string
    keyExpiresInSeconds: number
    onesieUstreamerConfig: string
  }
}

export interface YTPlayerGlobal {
  bootstrapPlayerContainer: HTMLElement
  bootstrapWebPlayerContextConfig: YTPlayerWebPlayerContextConfig
  bootstrapPlayerResponse: YTValueData<YTResponse.Mapped<'player'>>
  config: YTPlayerConfig
}

export interface YTSearchboxSettings {
  HAS_ON_SCREEN_KEYBOARD: boolean
  IS_FUSION: boolean
  IS_POLYMER: boolean
  REQUEST_DOMAIN: string
  REQUEST_LANGUAGE: string
  SEND_VISITOR_DATA: boolean
  SEARCHBOX_BEHAVIOR_EXPERIMENT: string
  SEARCHBOX_ENABLE_REFINEMENT_SUGGEST: boolean
  SEARCHBOX_TAP_TARGET_EXPERIMENT: number
  SEARCHBOX_ZERO_TYPING_SUGGEST_USE_REGULAR_SUGGEST: string
  SUGG_EXP_ID: string
  VISITOR_DATA: string
  SEARCHBOX_HOST_OVERRIDE: string
  HIDE_REMOVE_LINK: false
}

export interface YTPolymerController<Tag extends string = string> {
  is: Tag
  hostElement: YTPolymerElement<Tag>
}

export interface YTPolymerElement<Tag extends string = string> extends HTMLElement {
  is: Tag
  polymerController?: YTPolymerController<Tag>

  [PolymerElementConnectedSymbol]?: boolean
}

const AppTagNameRegexp = /^yt.*-app$/i
const KevlarSingletonRegexp = /[a-zA-Z_$][\w$]+\|\|\([a-zA-Z_$][\w$]+=new\s+[a-zA-Z_$][\w$]+\);return [a-zA-Z_$][\w$]+/s
const KevlarClassDeferCount = 8

const PolymerElementConnectedSymbol = Symbol()

export const YTConfigInitCallback = new Callback<[ytcfg: YTConfig]>()
export const YTKevlarPropertyDefineCallback = new Callback<YTKevlarProperty>()
export const YTKevlarMethodDefineCallback = new Callback<YTKevlarProperty<Function>>()
export const YTKevlarClassDefineCallback = new Callback<YTKevlarProperty<Function>>()
export const YTKevlarAddProviderCallback = new Callback<[provider: YTKevlarProvider]>()
export const YTPlayerCreateCallback = new Callback<[container: HTMLElement, config?: YTPlayerConfig, webPlayerContextConfig?: YTPlayerWebPlayerContextConfig]>()
export const YTPolymerCreateCallback = new Callback<[controller: YTPolymerController]>()
export const YTPolymerConnectCallback = new Callback<[element: YTPolymerElement]>()
export const YTPolymerDisconnectCallback = new Callback<[element: YTPolymerElement]>()

const kevlarClassQueue: YTKevlarProperty<Function>[] = []

let PolymerFakeBaseClass: ((this: YTPolymerController) => void) | undefined
let PolymerFakeBaseClassWithoutHtml: ((this: YTPolymerController) => void) | undefined

let environment: YTEnvironment
let ytcfg: YTConfig

const getDeviceLabel = (): string => {
  const customDeviceLabel = localStorage.getItem('bu-device-label')
  if (customDeviceLabel != null) return customDeviceLabel

  const userAgent = String(globalThis.navigator?.userAgent)

  let browserName: string
  switch (true) {
    case /Firefox/i.test(userAgent):
      browserName = 'Firefox'
      break
    case /Opera|OPR/i.test(userAgent):
      browserName = 'Opera'
      break
    case /Edg/i.test(userAgent):
      browserName = 'Microsoft Edge'
      break
    case /Chrome/i.test(userAgent):
      browserName = 'Chrome'
      break
    case /Safari/i.test(userAgent):
      browserName = 'Safari'
      break
    case /MSIE|Trident/i.test(userAgent):
      browserName = 'Internet Explorer'
      break
    default:
      browserName = 'TV'
      break
  }

  return `YouTube on ${browserName}`
}

const createPlayer = async (create: (...args: unknown[]) => void, container: HTMLElement, config?: YTPlayerConfig, webPlayerContextConfig?: YTPlayerWebPlayerContextConfig): Promise<void> => {
  if (webPlayerContextConfig != null) {
    webPlayerContextConfig.enableCsiLogging = false
  }

  await processYTResponse('player', config?.args?.raw_player_response)
  logger.debug('create player:', container, config, webPlayerContextConfig)

  try {
    await YTPlayerCreateCallback.invokeAsync(container, config, webPlayerContextConfig)
  } catch (error) {
    logger.warn('create player callback error:', error)
  }

  create(container, config, webPlayerContextConfig)
}

const processInitialCommand = async (initCommand: YTValueData<{ type: YTValueType.ENDPOINT }>): Promise<void> => {
  await processYTEndpoint(initCommand)
  logger.debug('initial command:', initCommand)
}

const processInitialData = async (initData: YTInitData): Promise<void> => {
  switch (initData.page) {
    case 'browse':
    case 'channel':
    case 'playlist':
      await processYTResponse('browse', initData.response)
      break
    case 'search':
      await processYTResponse('search', initData.response)
      break
    case 'shorts':
      await processYTResponse('reelReelItemWatch', initData.response)
      await processYTResponse('reelReelWatchSequence', initData.reelWatchSequenceResponse)
      break
    case 'watch':
      await processYTResponse('next', initData.response)
      break
    case 'live_chat':
      await processYTResponse('liveChatGetLiveChat', initData.response)
      break
    default:
      logger.warn('unhandled page type', initData)
      break
  }
  logger.debug('initial data:', initData)
}

const overrideBootstrapLoader = <T>(type: string, processor: (data: T) => Promise<void>): void => {
  const suffix = type.replace(/^[a-z]/, c => c.toUpperCase())

  let onBootstrapLoaded: (data: T) => void

  defineProperties(window, {
    [`loadInitial${suffix}`]: {
      configurable: true,
      set(fn) { onBootstrapLoaded = fn }
    },
    [`getInitial${suffix}`]: {
      configurable: true,
      set(fn) {
        if (typeof fn !== 'function') {
          logger.warn('invalid bootstrap getter function:', fn)
          return
        }

        const data = fn() as T
        processor(data).finally(() => {
          defineProperty(window, `getInitial${suffix}`, {
            configurable: true,
            writable: true,
            value: () => data
          })

          if (typeof onBootstrapLoaded === 'function') onBootstrapLoaded(data)
        })
      }
    }
  })
}

const onPolymerCreate = (controller: YTPolymerController): void => {
  if (typeof controller?.is !== 'string') return

  try {
    YTPolymerCreateCallback.invoke(controller)
  } catch (error) {
    logger.warn('polymer create callback error:', error)
  }
}

const onPolymerConnected = ({ self }: CallContext<YTPolymerElement, unknown[], void>): HookResult => {
  if (typeof self.is !== 'string') return HookResult.EXECUTION_PASSTHROUGH

  // Ignore callbacks during move
  const connected = PolymerElementConnectedSymbol in self
  self[PolymerElementConnectedSymbol] = true
  if (connected) return HookResult.EXECUTION_CONTINUE

  try {
    YTPolymerConnectCallback.invoke(self)
  } catch (error) {
    logger.warn('polymer connect callback error:', error)
  }

  return HookResult.EXECUTION_PASSTHROUGH
}

const onPolymerDisconnected = ({ origin, self, args }: CallContext<YTPolymerElement, unknown[], void>): HookResult => {
  if (typeof self.is !== 'string') return HookResult.EXECUTION_PASSTHROUGH

  self[PolymerElementConnectedSymbol] = false

  requestAnimationFrame(() => {
    // Ignore callbacks during move
    if (self[PolymerElementConnectedSymbol] !== false) return
    delete self[PolymerElementConnectedSymbol]

    try {
      YTPolymerDisconnectCallback.invoke(self)
    } catch (error) {
      logger.warn('polymer disconnect callback error:', error)
    }

    origin.apply(self, args)
  })

  return HookResult.EXECUTION_CONTINUE
}

export const isYTLoggedIn = (): boolean => {
  return ytcfg?.get('LOGGED_IN', false) ?? false
}

export default class YTCoreBootstrapModule extends Feature {
  public constructor() {
    super('bootstrap')
  }

  protected activate(): boolean {
    ytcfg = assign(window.ytcfg ?? {}, {
      'init_': false,
      d() {
        return window.yt && yt['config_'] || ytcfg['data_'] || (ytcfg['data_'] = new Proxy({}, {
          set(target, p, newValue, receiver) {
            if (p === 'CATSTAT' || p === 'DCLKSTAT') logger.debug('set detection stat:', p, newValue)
            return Reflect.set(target, p, newValue, receiver)
          }
        }))
      },
      get(key, defaultValue) {
        return key in ytcfg.d() ? ytcfg.d()[key] : defaultValue
      },
      set(...args) {
        if (args.length <= 1) {
          let data = (args[0] ?? {}) as { [key: string]: unknown }

          if (!ytcfg['init_']) {
            data = assign(ytcfg.d(), data)
            ytcfg['init_'] = true

            try {
              YTConfigInitCallback.invoke(ytcfg)
            } catch (error) {
              logger.warn('config init callback error:', error)
            }
          }

          for (const key in data) {
            ytcfg.set(key, data[key])
          }
          return
        }

        let [key, value] = args as [string, unknown]

        switch (key) {
          case 'EXPERIMENT_FLAGS':
            assign(value as object, {
              html5_offline_playback_position_sync: !!ytcfg.get('LOGGED_IN'),
              json_condensed_response: location.pathname !== '/tv',
              kevlar_remove_page_dom_on_switch: true,
              web_watch_pip: true
            })
            break
          case 'INNERTUBE_CONTEXT':
            assign((value as YTInnertubeContext).client, {
              browserName: undefined,
              browserVersion: undefined,
              osName: undefined,
              osVersion: undefined,
              deviceExperimentId: 'ChxNREF3TURBd01EQXdNREF3TURBd01EQXdNQT09EAAYAA==',
              deviceMake: undefined,
              deviceModel: undefined,
              deviceName: undefined,
              platform: undefined,
              remoteHost: undefined,
              userAgent: undefined
            })
            break
          case 'IS_SUBSCRIBER':
            value = true
            break
          case 'SBOX_SETTINGS':
            if (isYTLoggedIn()) break

            assign(value as YTSearchboxSettings, {
              SEND_VISITOR_DATA: false,
              VISITOR_DATA: ''
            })
            break
          case 'VALID_SESSION_TEMPDATA_DOMAINS':
            value = []
            defineProperty(value, 'push', { configurable: true, writable: true, enumerable: false, value() { } })
            break
        }

        ytcfg.d()[key] = value
      }
    } as YTConfig)

    defineProperties(window, {
      // FIXME: remove this when it's not broken
      documentPictureInPicture: {
        configurable: true,
        writable: true,
        value: undefined
      },

      // Override environment features/flags
      environment: {
        configurable: true,
        get() {
          return environment
        },
        set(v) {
          environment = v

          const { feature_switches, flags } = environment

          const deviceLabel = getDeviceLabel()

          document.title = deviceLabel

          assign(feature_switches ?? {}, {
            mdx_device_label: deviceLabel,
            supports_video_pause_on_blur: false
          })
          assign(flags ?? {}, {
            force_memory_saving_mode: false,
            watch_cap_group: 'none'
          })
        }
      },

      // Override config
      ytcfg: { configurable: false, writable: false, value: ytcfg },

      // Override player application create
      yt: {
        configurable: true,
        writable: true,
        value: {
          player: {
            Application: new Proxy({}, {
              set(target, p, newValue, receiver) {
                if (String(p).startsWith('create') && typeof newValue === 'function') {
                  newValue = createPlayer.bind(target, newValue)
                }
                return Reflect.set(target, p, newValue, receiver)
              }
            })
          }
        }
      },

      // Override polymer controller constructor
      PolymerFakeBaseClass: {
        configurable: true,
        get() {
          return PolymerFakeBaseClass
        },
        set(fn: typeof PolymerFakeBaseClass) {
          if (typeof fn !== 'function') return

          PolymerFakeBaseClass = function () {
            fn.apply<YTPolymerController, void>(this)
            onPolymerCreate(this)
          }
          PolymerFakeBaseClass.prototype = fn.prototype
        }
      },
      PolymerFakeBaseClassWithoutHtml: {
        configurable: true,
        get() {
          return PolymerFakeBaseClassWithoutHtml
        },
        set(fn: typeof PolymerFakeBaseClassWithoutHtml) {
          if (typeof fn !== 'function') return

          PolymerFakeBaseClassWithoutHtml = function () {
            fn.apply<YTPolymerController, void>(this)
            onPolymerCreate(this)
          }
          PolymerFakeBaseClassWithoutHtml.prototype = fn.prototype
        }
      },

      // Override kevlar global
      ...fromEntries(['default_kevlar', 'default_kevlar_base', '_yttv'].map(key => [key, {
        configurable: true,
        set(value) {
          defineProperty(window, key, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: new Proxy(value, {
              set(target, p, newValue, receiver) {
                const set = Reflect.set(target, p, newValue, receiver)
                if (typeof p === 'string') YTKevlarPropertyDefineCallback.invoke(target, p, newValue)
                return set
              }
            })
          })
        }
      }]))
    })

    YTKevlarPropertyDefineCallback.registerCallback((kevlar, name, value) => {
      if (typeof value !== 'function') return

      kevlarClassQueue.push([kevlar, name, value])
      if (kevlarClassQueue.length > KevlarClassDeferCount) YTKevlarClassDefineCallback.invoke(...kevlarClassQueue.shift()!)

      YTKevlarMethodDefineCallback.invoke(kevlar, name, value)
    })
    YTKevlarMethodDefineCallback.registerCallback((kevlar, name, method) => {
      const body = String(method)
      if (!KevlarSingletonRegexp.test(body)) return

      kevlar[name] = new Hook(method as () => object).install(ctx => {
        const { origin, self, args } = ctx
        const instance = origin.apply(self, args) as YTKevlarInjector

        if ('addProvider' in instance) {
          instance.addProvider = new Hook(instance.addProvider).install(ctx => {
            YTKevlarAddProviderCallback.invoke(ctx.args[0])
            return HookResult.EXECUTION_PASSTHROUGH
          }).call
        }

        ctx.returnValue = instance
        return HookResult.ACTION_UNINSTALL | HookResult.EXECUTION_CONTINUE
      }).call
    })
    YTPolymerConnectCallback.registerCallback(element => {
      if (!AppTagNameRegexp.test(element.tagName)) return

      logger.debug('app polymer connected, element:', element)

      // Process remaining kevlar class
      kevlarClassQueue.splice(0).forEach(prop => YTKevlarClassDefineCallback.invoke(...prop))
    })

    // Override bootstrap loading functions
    overrideBootstrapLoader('command', processInitialCommand)
    overrideBootstrapLoader('data', processInitialData)

    customElements.define = new Hook(customElements.define).install(({ args }) => {
      const prototype = args[1]?.prototype as Record<string, (this: YTPolymerElement, ...args: unknown[]) => void>
      if (prototype == null) return HookResult.EXECUTION_PASSTHROUGH

      const { connectedCallback, disconnectedCallback } = prototype

      if (typeof connectedCallback === 'function') {
        prototype.connectedCallback = new Hook(connectedCallback).install(onPolymerConnected).call
      }

      if (typeof disconnectedCallback === 'function') {
        prototype.disconnectedCallback = new Hook(disconnectedCallback).install(onPolymerDisconnected).call
      }

      return HookResult.EXECUTION_PASSTHROUGH
    }).call

    registerOverlayPage('Device', YTDevicePage)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}