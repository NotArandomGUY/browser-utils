import { proxyBind } from '@ext/lib/proxy/bind'
import { ToObjectType } from '@ext/lib/proxy/type'

interface PrimitiveValue<T> {
  value: T
}

class PrimitiveProxyImpl<T> { // NOSONAR
  public constructor(target: T) {
    switch (typeof target) {
      case 'object':
      case 'function':
        return target as PrimitiveProxyImpl<T> // NOSONAR
    }

    return new Proxy<PrimitiveValue<T>>({ value: target }, { // NOSONAR
      get(target, p) {
        const primitive = Reflect.get(target, 'value')
        if (p === Symbol.toPrimitive) return () => primitive

        const value = primitive?.[p as keyof typeof primitive]
        return typeof value === 'function' ? proxyBind(value, primitive) : value
      }
    })
  }
}

type PrimitiveProxyConstructor = new <T = unknown>(target: T) => ToObjectType<T>

const PrimitiveProxy = PrimitiveProxyImpl as Omit<typeof PrimitiveProxyImpl, 'new'> & PrimitiveProxyConstructor

export default PrimitiveProxy