import { defineProperty } from '@ext/global/object'
import { YT_VALUE_ENDPOINT, YT_VALUE_RENDERER, YT_VALUE_RESPONSE } from './primitive'
import { YTObjectSchema, YTValueType } from './types'

import * as renderer from '../renderer'
import * as response from '../response'

export function ytv_enp<const S extends YTObjectSchema>(): { type: YTValueType.ENDPOINT }
export function ytv_enp<const S extends YTObjectSchema>(s: S): { type: YTValueType.ENDPOINT, body: S }
export function ytv_enp<const S extends YTObjectSchema>(s: () => S): { type: YTValueType.ENDPOINT, body: S }
export function ytv_enp<const S extends YTObjectSchema>(s?: S | (() => S)): { type: YTValueType.ENDPOINT, body?: S } {
  return s == null ? YT_VALUE_ENDPOINT : {
    type: YTValueType.ENDPOINT,
    get body() {
      const schema = typeof s === 'function' ? s() : s
      defineProperty(this, 'body', { value: schema })
      return schema
    }
  }
}
export function ytv_ren<const S extends YTObjectSchema>(): { type: YTValueType.RENDERER }
export function ytv_ren<const S extends YTObjectSchema>(s: S): { type: YTValueType.RENDERER, body: typeof renderer.components.SchemaBase & S }
export function ytv_ren<const S extends YTObjectSchema>(s: () => S): { type: YTValueType.RENDERER, body: typeof renderer.components.SchemaBase & S }
export function ytv_ren<const S extends YTObjectSchema>(s?: S | (() => S)): { type: YTValueType.RENDERER, body?: typeof renderer.components.SchemaBase & S } {
  return s == null ? YT_VALUE_RENDERER : {
    type: YTValueType.RENDERER,
    get body() {
      const schema = { ...renderer.components.SchemaBase, ...(typeof s === 'function' ? s() : s) }
      defineProperty(this, 'body', { value: schema })
      return schema
    }
  }
}
export function ytv_rvm<const S extends YTObjectSchema>(): { type: YTValueType.RENDERER }
export function ytv_rvm<const S extends YTObjectSchema>(s: S): { type: YTValueType.RENDERER, body: typeof renderer.components.ViewModelBase & S }
export function ytv_rvm<const S extends YTObjectSchema>(s: () => S): { type: YTValueType.RENDERER, body: typeof renderer.components.ViewModelBase & S }
export function ytv_rvm<const S extends YTObjectSchema>(s?: S | (() => S)): { type: YTValueType.RENDERER, body?: typeof renderer.components.ViewModelBase & S } {
  return s == null ? YT_VALUE_RENDERER : {
    type: YTValueType.RENDERER,
    get body() {
      const schema = { ...renderer.components.ViewModelBase, ...(typeof s === 'function' ? s() : s) }
      defineProperty(this, 'body', { value: schema })
      return schema
    }
  }
}
export function ytv_rsp<const S extends YTObjectSchema>(): { type: YTValueType.RESPONSE }
export function ytv_rsp<const S extends YTObjectSchema>(s: S): { type: YTValueType.RESPONSE, body: typeof response.components.SchemaBase & S }
export function ytv_rsp<const S extends YTObjectSchema>(s: () => S): { type: YTValueType.RESPONSE, body: typeof response.components.SchemaBase & S }
export function ytv_rsp<const S extends YTObjectSchema>(s?: S | (() => S)): { type: YTValueType.RESPONSE, body?: typeof response.components.SchemaBase & S } {
  return s == null ? YT_VALUE_RESPONSE : {
    type: YTValueType.RESPONSE,
    get body() {
      const schema = { ...response.components.SchemaBase, ...(typeof s === 'function' ? s() : s) }
      defineProperty(this, 'body', { value: schema })
      return schema
    }
  }
}