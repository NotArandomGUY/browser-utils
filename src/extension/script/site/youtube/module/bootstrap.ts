import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { YTEndpoint } from '@ext/site/youtube/api/endpoint'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import { YTRenderer, YTRendererData } from '@ext/site/youtube/api/renderer'

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

interface YTPlayer {
  bootstrapPlayerContainer: HTMLElement
  bootstrapWebPlayerContextConfig: object
  bootstrapPlayerResponse: YTRendererData<YTRenderer<'playerResponse'>>
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
let nativeGetInitialData: (() => object) | null = null

function overrideGetInitialData(initData?: YTInitData) {
  initData = (nativeGetInitialData?.() ?? initData ?? {}) as YTInitData
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

export function isYTLoggedIn(): boolean {
  return ytcfg?.get('LOGGED_IN', false) ?? false
}

export default function initYTBootstrapModule(): void {
  // Override config
  ytcfg = Object.assign(window.ytcfg ?? {}, {
    init_: false,
    d() {
      return window.yt && yt.config_ || ytcfg.data_ || (ytcfg.data_ = {})
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

  // Obtain player object
  const ytplayer = window.ytplayer ?? {} as YTPlayer
  Object.defineProperty(window, 'ytplayer', {
    get() {
      return ytplayer
    }
  })

  // Override get initial data with processed initial data
  nativeGetInitialData = window.getInitialData ?? null
  Object.defineProperty(window, 'getInitialData', {
    get() {
      return overrideGetInitialData
    },
    set(v) {
      nativeGetInitialData = v
    }
  })

  // Process bootstrap player response
  let bootstrapPlayerResponse: YTRendererData<YTRenderer<'playerResponse'>> | null = null
  Object.defineProperty(ytplayer, 'bootstrapPlayerResponse', {
    get() {
      return bootstrapPlayerResponse
    },
    set(v) {
      processYTRenderer('playerResponse', v)
      logger.debug('initial player response:', v)
      bootstrapPlayerResponse = v
    }
  })

  // Process initial data before app element ready
  customElements.define = new Hook(customElements.define).install(ctx => {
    const customElement = ctx.args[1]
    if (customElement == null) return HookResult.EXECUTION_IGNORE

    const { connectedCallback } = customElement.prototype ?? {}

    const page = APP_ELEMENT_PAGE_MAP[ctx.args[0].toLowerCase()]
    if (page != null && typeof connectedCallback === 'function') {
      customElement.prototype.connectedCallback = new Hook(connectedCallback).install(() => {
        overrideGetInitialData({ page, response: window.ytInitialData } as YTInitData)

        return HookResult.EXECUTION_IGNORE
      }).call
    }

    return HookResult.EXECUTION_IGNORE
  }).call

  logger.info('bootstrap loaded')
}