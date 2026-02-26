type Slice<T, N extends number, O extends readonly unknown[] = readonly []> = O['length'] extends N ? T
  : T extends readonly [infer F, ...infer R] ? Slice<readonly [...R], N, readonly [...O, F]>
  : T

export type ClassModifiers = readonly string[]
export type ClassElement = readonly [element: string, ...modifiers: ClassModifiers]
export type ClassBlocks = readonly (string | undefined)[]

type BuildModifiers<
  E extends string,
  M extends ClassModifiers,
  L extends readonly unknown[] = [],
> = L['length'] extends 10 ? string
  : M['length'] extends 0 ? ''
  : M['length'] extends 1 ? `${E}--${M[0]}`
  : `${E}--${M[0]} ${BuildModifiers<E, Slice<M, 1>, [...L, unknown]>}`
type BuildElement<E extends ClassElement, P extends string> = E['length'] extends 0 ? ''
  : E['length'] extends 1 ? `${P}${E[0]}`
  : `${P}${E[0]} ${BuildModifiers<`${P}${E[0]}`, Slice<E, 1>>}`
type BuildBlocks<
  B extends ClassBlocks,
  L extends readonly unknown[] = [],
> = L['length'] extends 10 ? string
  : B['length'] extends 0 ? ''
  : B['length'] extends 1 ? B[0] extends string ? `${B[0]}__` : ''
  : `${BuildBlocks<[B[0]]>}${BuildBlocks<Slice<B, 1>, [...L, unknown]>}`

export type BuildClass<B extends ClassBlocks, E extends ClassElement> = BuildElement<E, BuildBlocks<B>>

export interface ClassNameProps<B extends ClassBlocks = ClassBlocks> {
  parentClass: B
}

export const buildClass = <
  const B extends ClassBlocks = [],
  const E extends string = string,
  const M extends ClassModifiers = [],
>(...blocks: [...B, E, M]): BuildClass<B, readonly [E, ...M]> => {
  const [element, modifiers] = blocks.splice(-2) as [E, M]
  const prefix = [...blocks.filter((block) => block != null), element].join('__')

  return [
    prefix,
    ...modifiers.map((modifier) => `${prefix}--${modifier}`),
  ].join(' ') as BuildClass<B, readonly [E, ...M]>
}
