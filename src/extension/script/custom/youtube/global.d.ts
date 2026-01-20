declare interface YTConfig {
  init_: boolean
  data_: { [key: string]: unknown }
  obfuscatedData_: unknown[]
  msgs: { [key: string]: string }

  d(): { [key: string]: unknown }
  get<T>(key: string, defaultValue?: T): T
  set(key: string, value: unknown): void
  set(data: { [key: string]: unknown }): void
}

declare interface YTEnvironment {
  client_data: object
  country: string
  server_time: number
  platform_detail: string
  is_tvhtml5_rtl: boolean
  experiments: number[]
  flags: Record<string, unknown>
  is_dogfooder: boolean
  platform: string
  browser_engine_version: string
  experiments_token: string
  is_fishfooder: boolean
  engine: string
  visitor_data: string
  browser: string
  browser_engine: string
  theme: string
  model: string
  browser_version: string
  client_version: string
  client_name: string
  brand: string
  feature_switches: Record<string, unknown>
  os: string
  os_version: string
  has_touch_support: boolean
  start_time: number
  server_ua: string
  xsrf_token: string
  engine_version: string
  mdx_theme: string
}

declare interface YTGlobal {
  idbToken_: object

  ytUtilActivityCallback_: () => void
}

declare var _lact: number
declare var _fact: number
declare var _yttv: Record<string, Function>
declare var _yt_player: Record<string, Function>
declare var getInitialCommand: () => object
declare var getInitialData: () => object
declare var loadInitialCommand: (command: object) => void
declare var loadInitialData: (data: object) => void
declare var default_kevlar_base: Record<string, Function>
declare var environment: YTEnvironment | undefined
declare var yt: { config_: object, logging: object }
declare var ytcfg: YTConfig | undefined
declare var ytglobal: YTGlobal | undefined
declare var ytplayer: object | undefined
declare var ytInitialData: object | undefined