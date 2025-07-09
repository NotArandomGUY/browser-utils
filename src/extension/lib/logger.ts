import { defineProperty } from '@ext/global/object'
import { toDateTimeString } from '@ext/lib/time'

const { now } = Date

export const enum LogLevel {
  TRACE = 0,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  SILENT
}

const fromLogLevel = (level: LogLevel): string => {
  switch (level) {
    case LogLevel.TRACE:
      return 'TRACE'
    case LogLevel.DEBUG:
      return 'DEBUG'
    case LogLevel.INFO:
      return 'INFO'
    case LogLevel.WARN:
      return 'WARN'
    case LogLevel.ERROR:
      return 'ERROR'
    case LogLevel.SILENT:
      return 'SILENT'
    default:
      return 'UNKNOWN'
  }
}

const toLogLevel = (level: string | null, defaultLevel = LogLevel.INFO): LogLevel => {
  switch (level?.trim().toUpperCase()) {
    case 'TRACE':
      return LogLevel.TRACE
    case 'DEBUG':
      return LogLevel.DEBUG
    case 'INFO':
      return LogLevel.INFO
    case 'WARN':
      return LogLevel.WARN
    case 'ERROR':
      return LogLevel.ERROR
    case 'SILENT':
      return LogLevel.SILENT
    default:
      return defaultLevel
  }
}

const logWrapper = <TArgs extends any[]>(
  log: (prefix: string, ...args: TArgs) => void,
  type: string,
  prefix: string,
  ...args: TArgs
): void => {
  log(`\x1b[m[${toDateTimeString(now())}][${type}\x1b[m][${prefix}]`, ...args)
}

const debug = logWrapper.bind(null, console.debug, '\x1b[96mDBG')
const info = logWrapper.bind(null, console.log, '\x1b[92mINF')
const warn = logWrapper.bind(null, console.warn, '\x1b[93mWRN')
const error = logWrapper.bind(null, console.error, '\x1b[91mERR')
const trace = logWrapper.bind(null, console.debug, '\x1b[95mTRC')

const loggers = new Set<string>()

export default class Logger {
  private readonly prefix: string
  private readonly isEval: boolean
  private level: LogLevel

  public constructor(prefix: string, isEval = false) {
    this.prefix = prefix
    this.isEval = isEval
    this.level = LogLevel.SILENT

    this.trace = this.trace.bind(this)
    this.debug = this.debug.bind(this)
    this.info = this.info.bind(this)
    this.warn = this.warn.bind(this)
    this.error = this.error.bind(this)

    loggers.add(prefix)

    this.loadLevelFromStorage()
    globalThis.addEventListener('storage', this.loadLevelFromStorage.bind(this))
  }

  public trace(...args: any[]): void {
    if (this.level > LogLevel.TRACE) return
    trace(this.prefix, ...this.formatArgs(args))
  }

  public debug(...args: any[]): void {
    if (this.level > LogLevel.DEBUG) return
    debug(this.prefix, ...this.formatArgs(args))
  }

  public info(...args: any[]): void {
    if (this.level > LogLevel.INFO) return
    info(this.prefix, ...this.formatArgs(args))
  }

  public warn(...args: any[]): void {
    if (this.level > LogLevel.WARN) return
    warn(this.prefix, ...this.formatArgs(args))
  }

  public error(...args: any[]): void {
    if (this.level > LogLevel.ERROR) return
    error(this.prefix, ...this.formatArgs(args))
  }

  private loadLevelFromStorage(event?: StorageEvent) {
    try {
      const key = `bulog-[${this.prefix}]`
      if (event != null && event.key !== key) return

      const load = globalThis.localStorage?.getItem?.bind(globalThis.localStorage)
      const level = toLogLevel(load?.(key), toLogLevel(load?.('bulog-default')))
      if (level === this.level) return

      this.level = level
    } catch {
      this.level = LogLevel.INFO
    }
  }

  private formatArgs<A extends unknown[]>(args: A): A {
    return this.isEval ? args.map(arg => typeof arg === 'function' ? arg() : arg) as A : args
  }
}

if (!('buLogLevel' in globalThis)) {
  defineProperty(globalThis, 'buLogLevel', {
    configurable: false,
    writable: false,
    value(prefix?: string, level?: string | number) {
      if (prefix == null || level == null) return loggers.values()

      if (!('localStorage' in globalThis)) return

      const key = `bulog-[${prefix}]`
      const oldValue = globalThis.localStorage.getItem(key)
      const newValue = fromLogLevel(typeof level === 'string' ? toLogLevel(level) : level)

      globalThis.localStorage.setItem(key, newValue)
      globalThis.dispatchEvent(new StorageEvent('storage', {
        key,
        oldValue,
        newValue,
        storageArea: globalThis.localStorage,
        url: location.href
      }))
    }
  })
}