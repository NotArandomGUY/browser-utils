import { assign, defineProperty } from '@ext/global/object'
import Logger from '@ext/lib/logger'
import { isProxyBound, proxyBind } from '@ext/lib/proxy/bind'
import PrimitiveProxy from '@ext/lib/proxy/primitive'
import { ToInvoke, ToObjectType } from '@ext/lib/proxy/type'

const FakeSymbol = Symbol()
const apply = Function.prototype.apply

export interface ProxyChainOptions<T = object> {
  trace?: (string | symbol)[]
  target?: T
  construct?: boolean
  invoke?: boolean | ToInvoke<T>
  primitive?: unknown
  readonly?: boolean

  fixedProperties?: boolean
  properties?: { [K in keyof ToObjectType<T>]?: ProxyChainOptions<ToObjectType<T>[K]> }
  ignoreProperties?: (keyof ToObjectType<T>)[]
  instance?: ProxyChainOptions
  return?: ProxyChainOptions<T extends () => unknown ? ReturnType<T> : never>
  ignoreReturn?: boolean
}

const createTarget = <T>(options: ProxyChainOptions<T>): ToObjectType<T> => {
  if (options.target != null) return new PrimitiveProxy(options.target)

  return assign(function () { }, {
    apply: undefined,
    call: undefined,
    [FakeSymbol]: true,
    [Symbol.toPrimitive]() {
      return options.primitive
    }
  }) as unknown as ToObjectType<T>
}

const isRawProperty = <T, P extends keyof ToObjectType<T>>(options: ProxyChainOptions<T>, p: P, v: ToObjectType<T>[P]): boolean => {
  // do not proxy if ignored
  if (options.ignoreProperties?.includes(p)) return true

  if (v != null) {
    // avoid proxy for toPrimitive
    if (p === Symbol.toPrimitive) return true

    // proxy existing property
    return false
  }

  // do not proxy if fixed property is enabled and property options does not exists
  if (options.fixedProperties && options.properties?.[p] == null) return true

  // hack for promise resolve
  if (p === 'then') return true

  // create fake proxied property
  return false
}

class ProxyChainImpl<T> {
  public static assign<T = object>(target: object, name: string, options: ProxyChainOptions<T> = {}): ToObjectType<T> {
    const value = new ProxyChain({ ...options, trace: [...options.trace ?? [], name] })
    defineProperty(target, name, { get() { return value }, set() { } })
    return value as ToObjectType<T>
  }

  public constructor(options: ProxyChainOptions<T> = {}) {
    const trace = options.trace ?? ['<proxy>']
    const logger = new Logger(trace.map(t => String(t)).join('.'))

    return new Proxy<ToObjectType<T>>(createTarget(options), { // NOSONAR
      apply(target, thisArg, argArray) {
        if (options.invoke === false) throw new TypeError('is not a function')

        if (typeof options.invoke === 'function') return options.invoke.apply(thisArg, argArray)

        logger.trace('invoke:', argArray)

        let value = options.return?.target
        if (value == null && typeof target === 'function' && !(FakeSymbol in target)) {
          value = apply.call(target, thisArg, argArray)
          if (value == null) return value
        }
        if (options.ignoreReturn) return value

        return new ProxyChain({
          fixedProperties: options.fixedProperties,
          trace: [...trace, '<return>'],
          ...options.return,
          target: value
        })
      },
      construct(_target, argArray) {
        if (options.construct === false) throw new TypeError('is not a constructor')

        logger.trace('construct:', argArray)
        return new ProxyChain({
          fixedProperties: options.fixedProperties,
          trace: [...trace, '<instance>'],
          ...options.instance
        })
      },
      has(target, p) {
        return options.fixedProperties ? Reflect.has(target, p) : true
      },
      get(target, p) {
        logger.trace('get property:', p)
        let value: ToObjectType<T>[keyof ToObjectType<T>]
        try {
          value = Reflect.get(target, p)
        } catch {
          value = target[p as keyof typeof target]
        }

        if (isRawProperty(options, p as keyof ToObjectType<T>, value)) return value

        const proxy = new ProxyChain<typeof value>({
          target: typeof value === 'function' && !isProxyBound(value) ? proxyBind(value, target) as typeof value : value,
          fixedProperties: options.fixedProperties,
          trace: [...trace, p],
          ...options.properties?.[p as keyof ToObjectType<T>]
        })
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

type ProxyChainConstructor = new <T = object>(options?: ProxyChainOptions<T>) => T

const ProxyChain = ProxyChainImpl as Omit<typeof ProxyChainImpl, 'new'> & ProxyChainConstructor

export default ProxyChain