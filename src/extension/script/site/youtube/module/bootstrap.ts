import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { YTEndpoint } from '@ext/site/youtube/api/endpoint'
import { processYTRenderer, processYTValueSchema } from '@ext/site/youtube/api/processor'
import { YTRenderer, YTRendererData } from '@ext/site/youtube/api/renderer'
import { ytv_enp, YTValueData, YTValueType } from '@ext/site/youtube/api/types/common'
import { onBeforeCreateYTPlayer } from '@ext/site/youtube/module/player'

type YTInitDataResponse = {
  page: 'browse' | 'channel'
  response: YTRendererData<YTRenderer<'browseResponse'>>
} | {
  page: 'search'
  response: YTRendererData<YTRenderer<'searchResponse'>>
} | {
  page: 'shorts',
  response: YTRendererData<YTRenderer<'reelReelItemWatchResponse'>>
} | {
  page: 'watch'
  response: YTRendererData<YTRenderer<'nextResponse'>>
} | {
  page: 'live_chat'
  response: YTRendererData<YTRenderer<'liveChatGetLiveChatResponse'>>
}

type YTInitData = YTInitDataResponse & Partial<{
  endpoint: YTEndpoint
  playerResponse: YTRendererData<YTRenderer<'playerResponse'>>
  reelWatchSequenceResponse: object
  url: string
  previousCsn: string
}>

interface YTConfig {
  init_: boolean
  data_: { [key: string]: unknown }
  obfuscatedData_: unknown[]
  msgs: { [key: string]: string }

  d(): { [key: string]: unknown }
  get<T>(key: string, defaultValue?: T): T
  set(key: string, value: unknown): void
  set(data: { [key: string]: unknown }): void
}

interface YTInnertubeContext {
  client: {
    hl: string
    gl: string
    remoteHost: string
    deviceMake: string
    deviceModel: string
    visitorData: string
    userAgent: string
    clientName: string
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
  }
  user: {
    lockedSafetyMode: boolean
  }
  request: {
    useSsl: boolean
  }
  clickTracking: {
    clickTrackingParams: string
  }
}

interface YTPlayerConfig {
  args?: Partial<{
    author: string
    length_seconds: string
    raw_player_response: YTRendererData<YTRenderer<'playerResponse'>>
    title: string
    ucid: string
    video_id: string
  }>
}

interface YTPlayerWebPlayerContextConfig {
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
}

interface YTPlayerGlobal {
  bootstrapPlayerContainer: HTMLElement
  bootstrapWebPlayerContextConfig: YTPlayerWebPlayerContextConfig
  bootstrapPlayerResponse: YTRendererData<YTRenderer<'playerResponse'>>
  config: YTPlayerConfig
}

interface YTSearchboxSettings {
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

const logger = new Logger('YT-BOOTSTRAP')

const APP_ELEMENT_PAGE_MAP: Record<string, YTInitDataResponse['page']> = {
  'yt-live-chat-app': 'live_chat'
}

let ytcfg: YTConfig

async function getProcessedInitialCommand(initCommand: YTValueData<{ type: YTValueType.ENDPOINT }>): Promise<YTValueData<{ type: YTValueType.ENDPOINT }>> {
  processYTValueSchema(ytv_enp(), initCommand, null)

  logger.debug('initial command:', initCommand)

  return initCommand
}

async function getProcessedInitialData(initData: YTInitData): Promise<YTInitData> {
  switch (initData.page) {
    case 'browse':
    case 'channel':
      processYTRenderer('browseResponse', initData.response)
      break
    case 'search':
      processYTRenderer('searchResponse', initData.response)
      break
    case 'shorts':
      processYTRenderer('reelReelItemWatchResponse', initData.response)
      break
    case 'watch':
      processYTRenderer('nextResponse', initData.response)
      break
    case 'live_chat':
      processYTRenderer('liveChatGetLiveChatResponse', initData.response)
      break
    default:
      logger.warn('unhandled page type', initData)
      break
  }

  logger.debug('initial data:', initData)

  return initData
}

function createPlayer(create: (...args: unknown[]) => void, container: HTMLElement, config?: YTPlayerConfig, webPlayerContextConfig?: YTPlayerWebPlayerContextConfig): void {
  logger.debug('create player:', container, config, webPlayerContextConfig)

  if (webPlayerContextConfig != null) {
    webPlayerContextConfig.enableCsiLogging = false
  }

  processYTRenderer('playerResponse', config?.args?.raw_player_response)

  onBeforeCreateYTPlayer()
  create(container, config, webPlayerContextConfig)
}

export function isYTLoggedIn(): boolean {
  return ytcfg?.get('LOGGED_IN', false) ?? false
}

export default class YTBootstrapModule extends Feature {
  protected activate(): boolean {
    // Override config
    ytcfg = Object.assign(window.ytcfg ?? {}, {
      init_: false,
      d() {
        return window.yt && yt.config_ || ytcfg.data_ || (ytcfg.data_ = new Proxy({}, {
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

          if (!ytcfg.init_) {
            data = Object.assign(ytcfg.d(), data)
            ytcfg.init_ = true
          }

          for (const key in data) {
            ytcfg.set(key, data[key])
          }
          return
        }

        let [key, value] = args as [string, unknown]

        if (!isYTLoggedIn()) {
          switch (key) {
            case 'INNERTUBE_CONTEXT':
              Object.assign((value as YTInnertubeContext).client, {
                browserName: 'Unknown',
                browserVersion: '0.0.0.0',
                osName: 'Linux',
                osVersion: '0.0',
                deviceExperimentId: 'ChxNREF3TURBd01EQXdNREF3TURBd01EQXdNQT09EAAYAA==',
                deviceName: '',
                deviceModel: '',
                platform: 'DESKTOP',
                remoteHost: '0.0.0.0',
                userAgent: ''
              })
              break
            case 'IS_SUBSCRIBER':
              value = true
              break
            case 'SBOX_SETTINGS':
              Object.assign(value as YTSearchboxSettings, {
                SEND_VISITOR_DATA: false,
                VISITOR_DATA: ''
              })
              break
          }
        }

        ytcfg.d()[key] = value
      }
    } as YTConfig)
    Object.defineProperty(window, 'ytcfg', { value: ytcfg, configurable: false, writable: false })

    // Override player application create
    Object.defineProperty(window, 'yt', {
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
      },
      configurable: true,
      writable: true
    })

    // Process initial data for get initial global
    Object.defineProperty(window, 'getInitialCommand', {
      configurable: true,
      get() {
        return undefined
      },
      set(getInitialCommand) {
        if (typeof getInitialCommand !== 'function') {
          logger.warn('invalid get initial command function:', getInitialCommand)
          return
        }

        const initialCommand = getInitialCommand() as YTValueData<{ type: YTValueType.ENDPOINT }>
        getProcessedInitialCommand(initialCommand)
          .catch(error => logger.warn('process initial command error:', error))
          .finally(() => {
            Object.defineProperty(window, 'getInitialCommand', {
              configurable: true,
              writable: true,
              value: () => initialCommand
            })

            if (typeof window.loadInitialCommand === 'function') window.loadInitialCommand(initialCommand)
          })
      }
    })
    Object.defineProperty(window, 'getInitialData', {
      configurable: true,
      get() {
        return undefined
      },
      set(getInitialData) {
        if (typeof getInitialData !== 'function') {
          logger.warn('invalid get initial data function:', getInitialData)
          return
        }

        const initialData = getInitialData() as YTInitData
        getProcessedInitialData(initialData)
          .catch(error => logger.warn('process initial data error:', error))
          .finally(() => {
            Object.defineProperty(window, 'getInitialData', {
              configurable: true,
              writable: true,
              value: () => initialData
            })

            if (typeof window.loadInitialData === 'function') window.loadInitialData(initialData)
          })
      }
    })

    // Process initial data for app element
    customElements.define = new Hook(customElements.define).install(ctx => {
      const customElement = ctx.args[1]
      if (customElement == null) return HookResult.EXECUTION_IGNORE

      const { connectedCallback } = customElement.prototype ?? {}

      const page = APP_ELEMENT_PAGE_MAP[ctx.args[0].toLowerCase()]
      if (page == null || typeof connectedCallback !== 'function') return HookResult.EXECUTION_IGNORE

      customElement.prototype.connectedCallback = new Hook(connectedCallback).install(ctx => {
        logger.debug('custom element connected', customElement, ctx.self)

        getProcessedInitialData({ page, response: window.ytInitialData } as YTInitData)
          .catch(error => logger.warn('process initial data error:', error))
          .finally(() => ctx.origin.apply(ctx.self, ctx.args))

        return HookResult.EXECUTION_CONTINUE
      }).call

      customElements.define = ctx.origin

      return HookResult.EXECUTION_IGNORE | HookResult.ACTION_UNINSTALL
    }).call

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}