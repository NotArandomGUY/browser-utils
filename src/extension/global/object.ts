const { assign, create, defineProperties, defineProperty, entries, freeze, fromEntries, getOwnPropertyDescriptor, getOwnPropertyDescriptors, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf, is, isExtensible, isFrozen, isSealed, keys, preventExtensions, seal, setPrototypeOf, values } = Object

export type FindPropertyPathPredicate = (value: unknown, key: string, depth: number) => boolean

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

export function findPropertyPath(root: object, matcher: FindPropertyPathPredicate, maxDepth: number, filter?: FindPropertyPathPredicate): string[] | null {
  const walkObject = (object: unknown, depth: number): string[] | null => {
    if (typeof object !== 'object' || object == null || depth >= maxDepth) return null

    let pairs = entries(object)
    if (filter != null) {
      pairs = pairs.filter(([key, value]) => filter(value, key, depth))
    }

    const pair = pairs.find(([key, value]) => matcher(value, key, depth))
    if (pair != null) return [pair[0]]

    for (const [key, value] of pairs) {
      const path = walkObject(value, depth + 1)
      if (path != null) return [key, ...path]
    }

    return null
  }

  return walkObject(root, 0)
}

export function observePropertyPath<T extends object>(root: unknown, path: string[], callback: (value: T) => void): void {
  if (typeof root !== 'object' || root == null) return

  const key = path[0]
  if (key == null) return

  let value: unknown

  const get = (): unknown => value
  const set = (v: unknown): void => {
    value = v
    observePropertyPath(value, path.slice(1), callback)
  }

  set(root[key as keyof typeof root])
  defineProperty(root, key, { configurable: true, enumerable: true, get, set })

  if (path.length > 1) return

  callback(value as T)
}

export { assign, create, defineProperties, defineProperty, entries, freeze, fromEntries, getOwnPropertyDescriptor, getOwnPropertyDescriptors, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf, is, isExtensible, isFrozen, isSealed, keys, preventExtensions, seal, setPrototypeOf, values }

