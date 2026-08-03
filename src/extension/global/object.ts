const { assign, create, defineProperties, defineProperty, entries, freeze, fromEntries, getOwnPropertyDescriptor, getOwnPropertyDescriptors, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf, is, isExtensible, isFrozen, isSealed, keys, preventExtensions, seal, setPrototypeOf, values } = Object

export function getPropertyDescriptor(o: object, p: PropertyKey): PropertyDescriptor | undefined {
  const parents = new Set<object>()
  while (!parents.has(o)) {
    const descriptor = getOwnPropertyDescriptor(o, p)
    if (descriptor != null) return descriptor

    parents.add(o)
    o = getPrototypeOf(o)
  }
}

export function syncPropertyDescriptors(source: object, target: object): void {
  defineProperties(target, fromEntries(entries(getOwnPropertyDescriptors(source)).map(([key, ndesc]) => {
    const hdesc = getOwnPropertyDescriptor(target, key)
    if (hdesc?.configurable === false) return null

    const { configurable, enumerable } = ndesc
    const { writable, value, get, set } = hdesc ?? ndesc

    return [key, {
      configurable,
      enumerable,
      ...((get != null || set != null) ? { get, set } : { writable, value })
    }]
  }).filter(e => e != null)))
}

export function findPropertyChain(root: unknown, target: unknown, maxDepth: number, filter?: (key: string) => boolean): string[] | null {
  if (typeof root !== 'object' || root == null || maxDepth < 1) return null

  let pairs = entries(root)
  if (filter != null) {
    pairs = pairs.filter(([key]) => filter(key))
  }

  const pair = pairs.find(entry => entry[1] === target)
  if (pair != null) return [pair[0]]

  for (const [key, value] of pairs) {
    const chain = findPropertyChain(value, target, maxDepth - 1, filter)
    if (chain != null) return [key, ...chain]
  }

  return null
}

export function observePropertyChain<T extends object>(root: unknown, chain: string[], callback: (value: T) => void): void {
  if (typeof root !== 'object' || root == null) return

  const key = chain[0]
  if (key == null) return

  let value: unknown

  const get = (): unknown => value
  const set = (v: unknown): void => {
    value = v
    observePropertyChain(value, chain.slice(1), callback)
  }

  set(root[key as keyof typeof root])
  defineProperty(root, key, { configurable: true, enumerable: true, get, set })

  if (chain.length > 1) return

  callback(value as T)
}

export { assign, create, defineProperties, defineProperty, entries, freeze, fromEntries, getOwnPropertyDescriptor, getOwnPropertyDescriptors, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf, is, isExtensible, isFrozen, isSealed, keys, preventExtensions, seal, setPrototypeOf, values }

