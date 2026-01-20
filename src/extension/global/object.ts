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

export { assign, create, defineProperties, defineProperty, entries, freeze, fromEntries, getOwnPropertyDescriptor, getOwnPropertyDescriptors, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf, is, isExtensible, isFrozen, isSealed, keys, preventExtensions, seal, setPrototypeOf, values }