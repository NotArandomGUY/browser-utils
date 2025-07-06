type Slice<T, N extends number, O extends readonly any[] = readonly []> = O['length'] extends N ? T : T extends readonly [infer F, ...infer R] ? Slice<readonly [...R], N, readonly [...O, F]> : T

export type ClassNameParts = readonly (string | undefined)[]
export type ClassNameList = readonly ClassNameParts[]
export type ClassNameParams = ClassNameParts | ClassNameList

type MergeParts<P extends ClassNameParts> = P['length'] extends 0 ? '' : P[0] extends string ? P['length'] extends 1 ? `${P[0]}` : `${P[0]}--${MergeParts<Slice<P, 1>>}` : MergeParts<Slice<P, 1>>
type MergeList<L extends ClassNameList> = L['length'] extends 0 ? '' : L['length'] extends 1 ? `${MergeParts<L[0]>}` : `${MergeParts<L[0]>} ${MergeList<Slice<L, 1>>}`

export type ClassName<P extends ClassNameParams> = P extends ClassNameParts ? MergeParts<P> : P extends ClassNameList ? MergeList<P> : never

export interface ClassNameProps<P extends string | undefined = string | undefined> {
  parentClassName: P
}

export function buildClass<const P extends ClassNameParams>(...p: P): ClassName<P> {
  if (p.length === 0) return '' as ClassName<P>

  let size = p.findIndex(c => Array.isArray(c))
  if (size < 0) size = p.length

  let parts: ClassNameParts
  if (size === 0) {
    parts = p[0] as ClassNameParts
    size++
  } else {
    parts = p.slice(0, size) as ClassNameParts
  }

  return [parts.filter(c => c != null).join('--'), buildClass(...p.slice(size) as [])].filter(c => c.length > 0).join(' ') as ClassName<P>
}