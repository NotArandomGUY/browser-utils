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

declare interface YTGlobal {
  ytUtilActivityCallback_: () => void
}

declare var _lact: number
declare var _fact: number
declare var getInitialCommand: () => object
declare var getInitialData: () => object
declare var loadInitialCommand: (command: object) => void
declare var loadInitialData: (data: object) => void
declare var yt: { config_: object, logging: object }
declare var ytcfg: YTConfig | undefined
declare var ytglobal: YTGlobal | undefined
declare var ytplayer: object | undefined
declare var ytInitialData: object | undefined