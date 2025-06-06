const BoundSymbol = Symbol()
const bind = Function.prototype.bind

export function isProxyBound(fn: Function): boolean {
  return BoundSymbol in fn
}

export function proxyBind<F extends Function>(fn: F, thisArg: unknown, ...args: unknown[]): Function
export function proxyBind<T, A extends any[], B extends any[], R>(fn: (this: T, ...args: [...A, ...B]) => R, thisArg: T, ...args: A): (this: T, ...args: B) => R {
  const boundFn = bind.call(fn, thisArg, ...args)
  return new Proxy(boundFn, {
    defineProperty(_target, property, attributes) {
      return Reflect.defineProperty(fn, property, attributes)
    },
    deleteProperty(_target, p) {
      return Reflect.deleteProperty(fn, p)
    },
    get(_target, p, receiver) {
      return Reflect.get(fn, p, receiver)
    },
    getOwnPropertyDescriptor(_target, p) {
      return Reflect.getOwnPropertyDescriptor(fn, p)
    },
    getPrototypeOf(_target) {
      return Reflect.getPrototypeOf(fn)
    },
    has(_target, p) {
      return p === BoundSymbol ? true : Reflect.has(fn, p)
    },
    isExtensible(_target) {
      return Reflect.isExtensible(fn)
    },
    ownKeys(_target) {
      return Reflect.ownKeys(fn)
    },
    preventExtensions(_target) {
      return Reflect.preventExtensions(fn)
    },
    set(_target, p, newValue, receiver) {
      return Reflect.set(fn, p, newValue, receiver)
    }
  })
}