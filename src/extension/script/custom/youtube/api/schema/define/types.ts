import type * as endpoint from '../endpoint'
import type * as renderer from '../renderer'
import type * as response from '../response'

type MaxRecursion = 20
type TOpGT<A extends number, B extends number, S extends void[] = []> = S['length'] extends A ? false : S['length'] extends B ? true : TOpGT<A, B, [...S, void]>
type TOpLT<A extends number, B extends number, S extends void[] = []> = S['length'] extends B ? false : S['length'] extends A ? true : TOpLT<A, B, [...S, void]>
type TOpSub<A extends number, B extends number, I extends void[] = [], O extends void[] = []> = TOpLT<A, B> extends true ? never : TOpLT<I['length'], A> extends true ? TOpSub<A, B, [...I, void], TOpLT<I['length'], B> extends true ? O : [...O, void]> : O['length']

export const enum YTValueType {
  UNKNOWN,
  BOOLEAN,
  NUMBER,
  STRING,
  OBJECT,
  SCHEMA,
  ARRAY,
  ENDPOINT,
  RENDERER,
  RESPONSE
}

export type YTValueSchema =
  { type: YTValueType.UNKNOWN } |
  { type: YTValueType.BOOLEAN } |
  { type: YTValueType.NUMBER } |
  { type: YTValueType.STRING, enum?: string[] | Record<string, unknown> } |
  { type: YTValueType.OBJECT, key: YTValueSchemaOf<YTValueType.NUMBER | YTValueType.STRING>, value: YTValueSchema } |
  { type: YTValueType.SCHEMA, schema: YTObjectSchema } |
  { type: YTValueType.ARRAY, value: YTValueSchema } |
  { type: YTValueType.ENDPOINT, schema?: YTObjectSchema } |
  { type: YTValueType.RENDERER, schema?: YTObjectSchema } |
  { type: YTValueType.RESPONSE, schema?: YTObjectSchema }
export type YTValueSchemaOf<T extends YTValueSchema['type']> = { [O in T]: Extract<YTValueSchema, { type: O }> }[T]

export type YTValueData<S extends YTValueSchema = YTValueSchema, RL extends number = MaxRecursion> = TOpGT<RL, 0> extends true ? (
  S extends YTValueSchemaOf<YTValueType.UNKNOWN> ? unknown :
  S extends YTValueSchemaOf<YTValueType.BOOLEAN> ? boolean :
  S extends YTValueSchemaOf<YTValueType.NUMBER> ? number :
  S extends YTValueSchemaOf<YTValueType.STRING> ? S['enum'] extends string[] ? S['enum'][number] : S['enum'] extends Record<string, unknown> ? keyof S['enum'] : string :
  S extends YTValueSchemaOf<YTValueType.OBJECT> ? Record<YTValueData<S['key'], TOpSub<RL, 1>>, YTValueData<S['value'], TOpSub<RL, 1>>> :
  S extends YTValueSchemaOf<YTValueType.SCHEMA> ? YTObjectData<S['schema'], TOpSub<RL, 1>> :
  S extends YTValueSchemaOf<YTValueType.ARRAY> ? YTValueData<S['value'], TOpSub<RL, 1>>[] :
  S extends YTValueSchemaOf<YTValueType.ENDPOINT> ? (S['schema'] extends YTObjectSchema ? YTObjectData<S['schema'], TOpSub<RL, 1>> : { [K in endpoint.MappedKey]?: YTValueData<endpoint.Mapped<K>, TOpSub<RL, 1>> }) :
  S extends YTValueSchemaOf<YTValueType.RENDERER> ? (S['schema'] extends YTObjectSchema ? YTObjectData<S['schema'], TOpSub<RL, 1>> : { [K in renderer.MappedKey]?: YTValueData<renderer.Mapped<K>, TOpSub<RL, 1>> }) :
  S extends YTValueSchemaOf<YTValueType.RESPONSE> ? (S['schema'] extends YTObjectSchema ? YTObjectData<S['schema'], TOpSub<RL, 1>> : { [K in response.MappedKey]?: YTValueData<response.Mapped<K>, TOpSub<RL, 1>> }) :
  never
) : any
export type YTValueParent<S extends YTValueSchema> = S extends { type: YTValueType.ENDPOINT, schema: YTObjectSchema } ? YTValueData<{ type: YTValueType.ENDPOINT }> : (object | null)

export type YTObjectSchema<P extends string = string> = { [prop in P]: YTValueSchema }
export type YTObjectData<S extends YTObjectSchema = YTObjectSchema, RL extends number = MaxRecursion> = { -readonly [P in keyof S]?: YTValueData<S[P], RL> }