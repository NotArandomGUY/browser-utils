import Logger from '@ext/lib/logger'

export interface ProxyChainOptions {
  trace?: (string | symbol)[]
  construct?: boolean
  invoke?: boolean | ((...args: unknown[]) => unknown)
  primitive?: unknown
  readonly?: boolean

  fixedProperties?: boolean
  properties?: Record<number | string | symbol, ProxyChainOptions>
  instance?: ProxyChainOptions
  return?: ProxyChainOptions
}

function createTarget(options: ProxyChainOptions) {
  return class {
    public static [Symbol.toPrimitive]() {
      return options.primitive
    }
  }
}

export default class ProxyChain {
  public static assign(target: object, name: string, options: ProxyChainOptions = {}): ProxyChain {
    const proxy = new ProxyChain({ ...options, trace: [...options.trace ?? [], name] })
    Object.defineProperty(target, name, { get() { return proxy }, set() { } })
    return proxy
  }

  public constructor(options: ProxyChainOptions = {}) {
    const trace = options.trace ?? ['<proxy>']
    const logger = new Logger(trace.map(t => String(t)).join('.'))

    return new Proxy(createTarget(options), { // NOSONAR
      apply(_target, thisArg, argArray) {
        if (options.invoke === false) throw new TypeError('is not a function')

        if (typeof options.invoke === 'function') return options.invoke.apply(thisArg, argArray)

        logger.trace('invoke:', argArray)
        return new ProxyChain({ ...options.return, trace: [...trace, '<return>'] })
      },
      construct(_target, argArray) {
        if (options.construct === false) throw new TypeError('is not a constructor')

        logger.trace('construct:', argArray)
        return new ProxyChain({ ...options.instance, trace: [...trace, '<instance>'] })
      },
      has(target, p) {
        return options.fixedProperties ? Reflect.has(target, p) : true
      },
      get(target, p, receiver) {
        if (Reflect.has(target, p)) return Reflect.get(target, p, receiver)
        if (options.fixedProperties && options.properties?.[p] == null) return undefined

        // hack for promise resolve
        if (p === 'then') return undefined

        logger.trace('get property:', p)
        const proxy = new ProxyChain({ ...options.properties?.[p], trace: [...trace, p] })
        Reflect.set(target, p, proxy)
        return proxy
      },
      set(target, p, newValue, receiver) {
        if (options.readonly) return true

        logger.trace('set property:', p, newValue)
        return Reflect.set(target, p, newValue, receiver)
      }
    })
  }
}