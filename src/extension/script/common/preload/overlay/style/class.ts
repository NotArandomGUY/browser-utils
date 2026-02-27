type Slice<
  TValue,
  TCount extends number,
  _Sliced extends readonly unknown[] = readonly [],
> = _Sliced['length'] extends TCount ? TValue
  : TValue extends readonly [infer F, ...infer R] ? Slice<readonly [...R], TCount, readonly [..._Sliced, F]>
  : TValue
type CamelToKebab<TValue extends string> = TValue extends `${infer L}${infer R}`
  ? R extends Uncapitalize<R> ? `${Lowercase<L>}${CamelToKebab<R>}` : `${Lowercase<L>}-${CamelToKebab<R>}`
  : TValue

type LiteralProcessLimit = 10

export type ClassModifiers = readonly string[]
export type ClassElement = readonly [element: string, ...modifiers: ClassModifiers]
export type ClassBlocks = readonly (string | undefined)[]

type BuildModifiers<
  TPrefix extends string,
  TModifiers extends ClassModifiers,
  _Processed extends readonly unknown[] = [],
> = _Processed['length'] extends LiteralProcessLimit ? string
  : TModifiers['length'] extends 0 ? ''
  : TModifiers['length'] extends 1 ? `${TPrefix}--${TModifiers[0]}`
  : `${TPrefix}--${TModifiers[0]} ${BuildModifiers<TPrefix, Slice<TModifiers, 1>, [..._Processed, TModifiers[0]]>}`
type BuildElement<
  TPrefix extends string,
  TElement extends ClassElement,
> = TElement['length'] extends 0 ? ''
  : TElement['length'] extends 1 ? `${TPrefix}${CamelToKebab<TElement[0]>}`
  : `${TPrefix}${CamelToKebab<TElement[0]>} ${BuildModifiers<
    `${TPrefix}${CamelToKebab<TElement[0]>}`,
    Slice<TElement, 1>
  >}`
type BuildBlocks<
  TBlocks extends ClassBlocks,
  _Processed extends readonly unknown[] = [],
> = _Processed['length'] extends LiteralProcessLimit ? string
  : TBlocks['length'] extends 0 ? ''
  : TBlocks['length'] extends 1 ? TBlocks[0] extends string ? `${CamelToKebab<TBlocks[0]>}__` : ''
  : `${BuildBlocks<readonly [TBlocks[0]]>}${BuildBlocks<Slice<TBlocks, 1>, [..._Processed, TBlocks[0]]>}`

export type BuildClass<B extends ClassBlocks, E extends ClassElement> = BuildElement<BuildBlocks<B>, E>

export interface ClassNameProps<B extends ClassBlocks = ClassBlocks> {
  parentClass: B
}

export function buildClass<
  const B extends ClassBlocks = [],
  const E extends string = string,
  const M extends ClassModifiers = [],
>(...blocks: [...B, E, M]): BuildClass<B, readonly [E, ...M]> {
  const [element, modifiers] = blocks.splice(-2) as [E, M]
  const prefix = [
    ...(blocks.filter((block) => block != null) as string[]),
    element,
  ].map((p) => p.replace(/([^^])([A-Z])/g, '$1-$2').toLowerCase()).join('__')

  return [
    prefix,
    ...modifiers.map((modifier) => `${prefix}--${modifier}`),
  ].join(' ') as BuildClass<B, readonly [E, ...M]>
}
