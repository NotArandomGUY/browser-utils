import { defineProperty } from '@ext/global/object'
import { YTObjectSchema, YTValueSchema, YTValueType } from './types'

export const YT_VALUE_UNKNOWN = { type: YTValueType.UNKNOWN } as const
export const YT_VALUE_BOOLEAN = { type: YTValueType.BOOLEAN } as const
export const YT_VALUE_NUMBER = { type: YTValueType.NUMBER } as const
export const YT_VALUE_STRING = { type: YTValueType.STRING } as const
export const YT_VALUE_ENDPOINT = { type: YTValueType.ENDPOINT } as const
export const YT_VALUE_RENDERER = { type: YTValueType.RENDERER } as const
export const YT_VALUE_RESPONSE = { type: YTValueType.RESPONSE } as const

export function ytv_unk(): { type: YTValueType.UNKNOWN } {
  return YT_VALUE_UNKNOWN
}
export function ytv_bol(): { type: YTValueType.BOOLEAN } {
  return YT_VALUE_BOOLEAN
}
export function ytv_num(): { type: YTValueType.NUMBER } {
  return YT_VALUE_NUMBER
}
export function ytv_str<const E extends string[] | Record<string, unknown>>(): { type: YTValueType.STRING }
export function ytv_str<const E extends string[] | Record<string, unknown>>(e: E): { type: YTValueType.STRING, enum: E }
export function ytv_str<const E extends string[] | Record<string, unknown>>(e?: E): { type: YTValueType.STRING, enum?: E } {
  return e == null ? YT_VALUE_STRING : { type: YTValueType.STRING, enum: e }
}
export function ytv_obj<const K extends YTValueSchema, const V extends YTValueSchema>(k: K, v: V): { type: YTValueType.OBJECT, key: K, value: V } {
  return { type: YTValueType.OBJECT, key: k, value: v }
}
export function ytv_sch<const S extends YTObjectSchema>(s: S): { type: YTValueType.SCHEMA, schema: S }
export function ytv_sch<const S extends YTObjectSchema>(s: () => S): { type: YTValueType.SCHEMA, schema: S }
export function ytv_sch<const S extends YTObjectSchema>(s: S | (() => S)): { type: YTValueType.SCHEMA, schema: S } {
  return {
    type: YTValueType.SCHEMA,
    get schema() {
      if (typeof s === 'function') s = s()
      defineProperty(this, 'schema', { value: s })
      return s
    }
  }
}
export function ytv_arr<const V extends YTValueSchema>(v: V): { type: YTValueType.ARRAY, value: V } {
  return { type: YTValueType.ARRAY, value: v }
}