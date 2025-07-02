import { YTEndpoint, YTEndpointKey, YTEndpointOuterData } from './endpoint'
import { YTRenderer, YTRendererKey, YTRendererMixinSchema } from './renderer'

type MaxRecursion = 20
type GreaterThan<A extends number, B extends number, S extends any[] = []> = S['length'] extends A ? false : S['length'] extends B ? true : GreaterThan<A, B, [...S, any]>
type LessThan<A extends number, B extends number, S extends any[] = []> = S['length'] extends B ? false : S['length'] extends A ? true : LessThan<A, B, [...S, any]>
type Subtract<A extends number, B extends number, I extends any[] = [], O extends any[] = []> = LessThan<A, B> extends true ? never : LessThan<I['length'], A> extends true ? Subtract<A, B, [...I, any], LessThan<I['length'], B> extends true ? O : [...O, any]> : O['length']

export const enum YTValueType {
  UNKNOWN,
  BOOLEAN,
  NUMBER,
  STRING,
  OBJECT,
  SCHEMA,
  ARRAY,
  ENDPOINT,
  RENDERER
}

export type YTValueSchema =
  { type: YTValueType.UNKNOWN } |
  { type: YTValueType.BOOLEAN } |
  { type: YTValueType.NUMBER } |
  { type: YTValueType.STRING, enum?: string[] | Record<string, string> } |
  { type: YTValueType.OBJECT, key: YTValueSchemaOf<YTValueType.NUMBER | YTValueType.STRING>, value: YTValueSchema } |
  { type: YTValueType.SCHEMA, schema: YTObjectSchema } |
  { type: YTValueType.ARRAY, value: YTValueSchema } |
  { type: YTValueType.ENDPOINT, schema?: YTObjectSchema } |
  { type: YTValueType.RENDERER, schema?: YTObjectSchema }
export type YTValueSchemaOf<T extends YTValueSchema['type']> = { [O in T]: Extract<YTValueSchema, { type: O }> }[T]

export type YTValueData<S extends YTValueSchema = YTValueSchema, RL extends number = MaxRecursion> = GreaterThan<RL, 0> extends true ? (
  S extends YTValueSchemaOf<YTValueType.UNKNOWN> ? unknown :
  S extends YTValueSchemaOf<YTValueType.BOOLEAN> ? boolean :
  S extends YTValueSchemaOf<YTValueType.NUMBER> ? number :
  S extends YTValueSchemaOf<YTValueType.STRING> ? S['enum'] extends string[] ? S['enum'][number] : string :
  S extends YTValueSchemaOf<YTValueType.OBJECT> ? Record<YTValueData<S['key'], Subtract<RL, 1>>, YTValueData<S['value'], Subtract<RL, 1>>> :
  S extends YTValueSchemaOf<YTValueType.SCHEMA> ? YTObjectData<S['schema'], Subtract<RL, 1>> :
  S extends YTValueSchemaOf<YTValueType.ARRAY> ? YTValueData<S['value'], Subtract<RL, 1>>[] :
  S extends YTValueSchemaOf<YTValueType.ENDPOINT> ? (S['schema'] extends YTEndpointSchema ? YTEndpointData<S['schema'], Subtract<RL, 1>> : ({ [K in YTEndpointKey]?: YTEndpointData<YTEndpoint<K>, Subtract<RL, 1>> } & YTEndpointOuterData)) :
  S extends YTValueSchemaOf<YTValueType.RENDERER> ? (S['schema'] extends YTRendererSchema ? YTRendererData<S['schema'], Subtract<RL, 1>> : { [K in YTRendererKey]?: YTRendererData<YTRenderer<K>, Subtract<RL, 1>> }) :
  never
) : any

export type YTObjectSchema<P extends string = string> = { [prop in P]: YTValueSchema }
export type YTObjectData<S extends YTObjectSchema = YTObjectSchema, RL extends number = MaxRecursion> = { -readonly [P in keyof S]?: YTValueData<S[P], RL> }

export type YTEndpointSchema<P extends string = string> = YTObjectSchema<P>
export type YTEndpointData<S extends YTEndpointSchema = YTEndpointSchema, RL extends number = MaxRecursion> = YTObjectData<S, RL>

export type YTRendererSchema<P extends string = string> = YTObjectSchema<P>
export type YTRendererData<S extends YTRendererSchema = YTRendererSchema, RL extends number = MaxRecursion> = YTObjectData<typeof YTRendererMixinSchema, RL> & YTObjectData<S, RL>

const YT_VALUE_UNKNOWN = { type: YTValueType.UNKNOWN } as const
const YT_VALUE_BOOLEAN = { type: YTValueType.BOOLEAN } as const
const YT_VALUE_NUMBER = { type: YTValueType.NUMBER } as const
const YT_VALUE_STRING = { type: YTValueType.STRING } as const

export function ytv_unk(): { type: YTValueType.UNKNOWN } {
  return YT_VALUE_UNKNOWN
}
export function ytv_bol(): { type: YTValueType.BOOLEAN } {
  return YT_VALUE_BOOLEAN
}
export function ytv_num(): { type: YTValueType.NUMBER } {
  return YT_VALUE_NUMBER
}
export function ytv_str<const E extends string[] | Record<string, string>>(): { type: YTValueType.STRING }
export function ytv_str<const E extends string[] | Record<string, string>>(e: E): { type: YTValueType.STRING, enum: E }
export function ytv_str<const E extends string[] | Record<string, string>>(e?: E): { type: YTValueType.STRING, enum?: E } {
  return e == null ? YT_VALUE_STRING : { type: YTValueType.STRING, enum: e }
}
export function ytv_obj<const K extends YTValueSchema, const V extends YTValueSchema>(k: K, v: V): { type: YTValueType.OBJECT, key: K, value: V } {
  return { type: YTValueType.OBJECT, key: k, value: v }
}
export function ytv_sch<const S extends YTObjectSchema>(s: S): { type: YTValueType.SCHEMA, schema: S } {
  return { type: YTValueType.SCHEMA, schema: s }
}
export function ytv_arr<const V extends YTValueSchema>(v: V): { type: YTValueType.ARRAY, value: V } {
  return { type: YTValueType.ARRAY, value: v }
}
export function ytv_enp<const S extends YTEndpointSchema>(): { type: YTValueType.ENDPOINT }
export function ytv_enp<const S extends YTEndpointSchema>(s: S): { type: YTValueType.ENDPOINT, schema: S }
export function ytv_enp<const S extends YTEndpointSchema>(s?: S): { type: YTValueType.ENDPOINT, schema?: S } {
  return { type: YTValueType.ENDPOINT, schema: s }
}
export function ytv_ren<const S extends YTRendererSchema>(): { type: YTValueType.RENDERER }
export function ytv_ren<const S extends YTRendererSchema>(s: S): { type: YTValueType.RENDERER, schema: S }
export function ytv_ren<const S extends YTRendererSchema>(s?: S): { type: YTValueType.RENDERER, schema?: S } {
  return { type: YTValueType.RENDERER, schema: s }
}

export enum YTAddToOfflineButtonState {
  ADD_TO_OFFLINE_BUTTON_STATE_ENABLED = 'ADD_TO_OFFLINE_BUTTON_STATE_ENABLED',
  ADD_TO_OFFLINE_BUTTON_STATE_UNKNOWN = 'ADD_TO_OFFLINE_BUTTON_STATE_UNKNOWN'
}

export enum YTEngagementPanelVisibility {
  ENGAGEMENT_PANEL_VISIBILITY_EXPANDED = 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED',
  ENGAGEMENT_PANEL_VISIBILITY_HIDDEN = 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN'
}

export enum YTLikeStatus {
  DISLIKE = 'DISLIKE',
  INDIFFERENT = 'INDIFFERENT',
  LIKE = 'LIKE'
}

export const YTAccessibilityDataSchema = {
  label: ytv_str()
} satisfies YTObjectSchema

export const YTAccessibilitySchema = {
  accessibilityData: ytv_sch(YTAccessibilityDataSchema)
} satisfies YTObjectSchema

export const YTAdSlotLoggingDataSchema = {
  serializedSlotAdServingDataEntry: ytv_str()
} satisfies YTObjectSchema

export const YTClientResourceSchema = {
  imageName: ytv_str()
} satisfies YTObjectSchema

export const YTDimensionValueSchema = {
  unit: ytv_str(['DIMENSION_UNIT_POINT']),
  value: ytv_num()
} satisfies YTObjectSchema

export const YTEngagementPanelIdentifier = {
  surface: ytv_str(['ENGAGEMENT_PANEL_SURFACE_BROWSE', 'ENGAGEMENT_PANEL_SURFACE_LIVE_CHAT', 'ENGAGEMENT_PANEL_SURFACE_SHORTS', 'ENGAGEMENT_PANEL_SURFACE_WATCH']),
  tag: ytv_str()
} satisfies YTObjectSchema

export const YTImageSourceSchema = {
  clientResource: ytv_sch(YTClientResourceSchema),
  height: ytv_num(),
  url: ytv_str(),
  width: ytv_num()
} satisfies YTObjectSchema

export const YTImageSchema = {
  contentMode: ytv_str(['CONTENT_MODE_SCALE_ASPECT_FILL']),
  imageFormatHint: ytv_str(['IMAGE_FORMAT_ANIMATED_WEBP']),
  processor: ytv_obj(ytv_str(), ytv_unk()),
  sources: ytv_arr(ytv_sch(YTImageSourceSchema))
} satisfies YTObjectSchema

export const YTLoggingDirectivesSchema = {
  attentionLogging: ytv_str(['ATTENTION_LOGGING_BASIC', 'ATTENTION_LOGGING_SCROLL']),
  clientVeSpec: ytv_sch({
    uiType: ytv_num(),
    veCounter: ytv_num()
  }),
  visibility: ytv_sch({
    types: ytv_str()
  }),
  gestures: ytv_sch({
    types: ytv_str()
  })
} satisfies YTRendererSchema

export const YTThumbnailWebExtensionSchema = {
  isPreloaded: ytv_bol()
} satisfies YTObjectSchema

export const YTThumbnailSchema = {
  accessibility: ytv_sch(YTAccessibilitySchema),
  darkColorPalette: ytv_obj(ytv_str(), ytv_num()),
  isOriginalAspectRatio: ytv_bol(),
  lightColorPalette: ytv_obj(ytv_str(), ytv_num()),
  logAsMovingThumbnail: ytv_bol(),
  placeholderColor: ytv_num(),
  thumbnails: ytv_arr(ytv_sch(YTImageSourceSchema)),
  webThumbnailDetailsExtensionData: ytv_sch(YTThumbnailWebExtensionSchema)
} satisfies YTObjectSchema

export const YTEmojiSchema = {
  emojiId: ytv_str(),
  image: ytv_sch(YTThumbnailSchema),
  isCustomEmoji: ytv_bol(),
  isLocked: ytv_bol(),
  multiSelectorThumbnailRow: ytv_arr(ytv_sch({
    thumbnails: ytv_arr(ytv_sch(YTThumbnailSchema))
  })),
  searchTerms: ytv_arr(ytv_str()),
  shortcuts: ytv_arr(ytv_str()),
  supportsSkinTone: ytv_bol(),
  variantIds: ytv_arr(ytv_str())
} satisfies YTObjectSchema

export const YTTextRunSchema = {
  bold: ytv_bol(),
  emoji: ytv_sch(YTEmojiSchema),
  fontFace: ytv_str(['FONT_FACE_ROBOTO_MEDIUM', 'FONT_FACE_ROBOTO_REGULAR']),
  loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
  navigationEndpoint: ytv_enp(),
  text: ytv_str(),
  textColor: ytv_num()
} satisfies YTObjectSchema

export const YTTextSchema = {
  runs: ytv_arr(ytv_sch(YTTextRunSchema)),
  accessibility: ytv_sch(YTAccessibilitySchema),
  simpleText: ytv_str()
} satisfies YTObjectSchema

export const YTUrlSchema = {
  attributionSrcMode: ytv_str(['ATTRIBUTION_SRC_MODE_LABEL_CHROME']),
  baseUrl: ytv_str(),
  elapsedMediaTimeSeconds: ytv_num(),
  offsetMilliseconds: ytv_num(),
  testUrl: ytv_str()
} satisfies YTObjectSchema

export const YTOfflineabilityRendererSchema = {
  addToOfflineButtonState: ytv_str(YTAddToOfflineButtonState),
  contentCheckOk: ytv_bol(),
  formats: ytv_arr(ytv_sch({
    availabilityType: ytv_str(['OFFLINEABILITY_AVAILABILITY_TYPE_PREMIUM_UNLOCKED']),
    formatType: ytv_str(['HD', 'HD_1080', 'LD', 'SD']),
    name: ytv_sch(YTTextSchema),
    savedSettingShouldExpire: ytv_bol()
  })),
  key: ytv_str(),
  loggingDirectives: ytv_ren(YTLoggingDirectivesSchema),
  offlineabilityRenderer: ytv_str(),
  offlineable: ytv_bol(),
  racyCheckOk: ytv_bol()
} satisfies YTRendererSchema