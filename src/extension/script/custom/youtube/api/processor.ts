import { YT_VALUE_ENDPOINT, YTEndpoint, YTObjectSchema, YTRenderer, YTResponse, YTValueData, YTValueSchema, YTValueSchemaOf, YTValueType } from '@ext/custom/youtube/api/schema'
import { assign, keys, setPrototypeOf } from '@ext/global/object'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTAPI-PROCESSOR', true)

export const enum YTValueCallbackType {
  PRE = 0,
  POST = 1
}

export type YTValueStack = Array<[key: unknown, value: unknown]>
export type YTValueCallbackMapping<T> = [pre: Map<YTValueSchema, Array<T>>, post: Map<YTValueSchema, Array<T>>]
export type YTValueFilter<S extends YTValueSchema = YTValueSchema> = (data: YTValueData<S>, ctx: YTValueProcessorContext<S>) => boolean
export type YTValueProcessor<S extends YTValueSchema = YTValueSchema> = (data: YTValueData<S>, ctx: YTValueProcessorContext<S>) => Promise<void> | void

export interface YTValueProcessorConfig {
  fmapping: YTValueCallbackMapping<YTValueFilter>
  pmapping: YTValueCallbackMapping<YTValueProcessor>
}

type TypeOf<T = void> = T extends void ? {
  'boolean': boolean
  'number': number
  'object': object
  'string': string
} : T extends keyof TypeOf ? TypeOf[T] : never

const defaultConfig = createYTValueProcessorConfig(null)

class MismatchTypeError extends TypeError {
  public constructor(expectedType: string, actualType: string) {
    super(`expected '${expectedType}' got '${actualType}'`)
  }
}

function throwMismatchTypeError(expectedType: string, value: unknown, isType = false): never {
  throw new MismatchTypeError(expectedType, isType ? String(value) : typeof value)
}

function assertType<T extends keyof TypeOf>(type: T, value: unknown): asserts value is TypeOf<T> {
  if (typeof value !== type) throwMismatchTypeError(type, value)
}

const copyMapping = <K, V>(src: [pre: Map<K, Array<V>>, post: Map<K, Array<V>>]): typeof src => {
  return src.map(mapping => new Map(Array.from(mapping, ([key, value]) => [key, value.slice()]))) as typeof src
}

export function createYTValueProcessorConfig(base: YTValueProcessorConfig | null = defaultConfig): YTValueProcessorConfig {
  if (base) {
    return {
      fmapping: copyMapping(base.fmapping),
      pmapping: copyMapping(base.pmapping)
    }
  } else {
    return {
      fmapping: [new Map(), new Map()],
      pmapping: [new Map(), new Map()]
    }
  }
}

export class YTValueProcessorContext<S extends YTValueSchema = YTValueSchema> implements YTValueProcessorConfig {
  /*@__MANGLE_PROP__*/public readonly fmapping: YTValueCallbackMapping<YTValueFilter>
  /*@__MANGLE_PROP__*/public readonly pmapping: YTValueCallbackMapping<YTValueProcessor>
  public readonly stack: YTValueStack = []

  public constructor({ fmapping, pmapping }: YTValueProcessorConfig) {
    this.fmapping = fmapping
    this.pmapping = pmapping
  }

  /*@__MANGLE_PROP__*/public mutable(): YTValueProcessorContextMutable<S> {
    setPrototypeOf(this, YTValueProcessorContextMutable.prototype)
    assign(this, createYTValueProcessorConfig(this))

    return this
  }

  public push(value: unknown, key?: unknown): this {
    this.stack.push([key, value])
    return this
  }

  public pop(): this {
    this.stack.pop()
    return this
  }

  public catch(value: unknown): boolean {
    logger.debug(
      () => `[${this.stack.map(entry => String(entry[0] ?? '<value>')).join('.')}] error:`, // NOSONAR
      () => value instanceof Error ? value.message : String(value),
      () => this.stack.slice()
    )
    return true
  }
}

export class YTValueProcessorContextMutable<S extends YTValueSchema = YTValueSchema> extends YTValueProcessorContext<S> {
  /*@__MANGLE_PROP__*/public override mutable(): this {
    return this
  }
}

const deleteYTValueProcessor = <S extends YTValueSchema>(data: YTValueData<S>, ctx: YTValueProcessorContext<S>): boolean => {
  logger.trace('filtered value:', data, ctx)
  return false
}

const filterYTValueProcessor = <S extends YTValueSchema>(filter: (data: YTValueData<S>) => boolean, data: YTValueData<S>, ctx: YTValueProcessorContext<S>): boolean => {
  return filter(data) ? true : deleteYTValueProcessor<S>(data, ctx)
}

const invokeYTValueProcessor = async <S extends YTValueSchema>(
  ctx: YTValueProcessorContext,
  data: YTValueData<S>,
  schema: S,
  type: YTValueCallbackType
): Promise<boolean> => {
  if (ctx.fmapping[type].get(schema)?.some(callback => !callback(data, ctx))) return false

  const promises = ctx.pmapping[type].get(schema)?.map(callback => Promise.resolve(callback(data, ctx)))
  if (promises != null) await Promise.all(promises)

  return true
}

const processYTArrayEntry = async (
  ctx: YTValueProcessorContext,
  schema: YTValueSchema,
  array: unknown[],
  index: number
): Promise<void> => {
  if (await processYTValue(ctx, schema, array[index], index)) return

  array.splice(index, 1)
}

const processYTObjectEntry = async (
  ctx: YTValueProcessorContext,
  schema: YTValueSchemaOf<YTValueType.OBJECT>,
  object: object,
  key: keyof typeof object
): Promise<void> => {
  if (await processYTValue(ctx, schema.key, key, key) && await processYTValue(ctx, schema.value, object[key], key)) return

  delete object[key]
}

const processYTSchemaEntry = async (
  ctx: YTValueProcessorContext,
  body: YTObjectSchema,
  object: object,
  key: keyof typeof object
): Promise<void> => {
  const schema = body[key]
  if (schema == null) {
    ctx.catch(`unhandled field '${key}'`)
    return
  }

  if (await processYTValue(ctx, schema, object[key], key)) return

  delete object[key]
}

const processYTSchemaEntries = async (
  ctx: YTValueProcessorContext,
  schema: Required<YTValueSchemaOf<YTValueType.STRUCT | YTValueType.ENDPOINT | YTValueType.RENDERER | YTValueType.RESPONSE>>,
  value: object
): Promise<boolean> => {
  if (!await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.PRE)) return false
  for (const key in value) await processYTSchemaEntry(ctx, schema.body, value, key as keyof typeof value)
  return await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.POST)
}

const processYTValue = async (ctx: YTValueProcessorContext, schema: YTValueSchema, value: unknown, key?: unknown): Promise<boolean> => { // NOSONAR
  if (value == null) return false

  try {
    ctx.push(value, key)

    switch (schema.type) {
      case YTValueType.UNKNOWN:
        return await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.PRE)
      case YTValueType.BOOLEAN:
        assertType('boolean', value)
        return await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.PRE)
      case YTValueType.NUMBER:
        assertType('number', value)
        return await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.PRE)
      case YTValueType.STRING:
        assertType('string', value)
        if (schema.enum != null && !schema.enum.has(value.split(':', 1)[0])) throwMismatchTypeError(Array.from(schema.enum).join('|'), value, true)
        return await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.PRE)
      case YTValueType.OBJECT:
        assertType('object', value)
        if (!await invokeYTValueProcessor(ctx, value as Record<string | number, unknown>, schema, YTValueCallbackType.PRE)) return false
        for (const key in value) await processYTObjectEntry(ctx, schema, value, key as keyof typeof value)
        return await invokeYTValueProcessor(ctx, value as Record<string | number, unknown>, schema, YTValueCallbackType.POST)
      case YTValueType.STRUCT:
        assertType('object', value)
        return await processYTSchemaEntries(ctx, schema, value) && keys(value).length > 0
      case YTValueType.ARRAY:
        if (!Array.isArray(value)) throwMismatchTypeError('array', value)
        if (!await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.PRE)) return false
        for (let i = value.length - 1; i >= 0; i--) await processYTArrayEntry(ctx, schema.value, value, i)
        return await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.POST) && value.length > 0
      case YTValueType.ENDPOINT:
        assertType('object', value)
        if (schema.body != null) return await processYTSchemaEntries(ctx, schema as Required<YTValueSchemaOf<YTValueType.ENDPOINT>>, value)
        if (!await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.PRE)) return false
        for (const key in value) await processYTSchemaEntry(ctx, YTEndpoint.mapped, value, key as keyof typeof value)
        return await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.POST) && keys(value).some(key => !YTEndpoint.MappedOuterKeys.has(key as YTEndpoint.MappedKey))
      case YTValueType.RENDERER:
      case YTValueType.RESPONSE:
        assertType('object', value)
        if (schema.body != null) return await processYTSchemaEntries(ctx, schema as Required<YTValueSchemaOf<YTValueType.RENDERER | YTValueType.RESPONSE>>, value)
        if (!await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.PRE)) return false
        for (const key in value) await processYTSchemaEntry(ctx, YTRenderer.mapped, value, key as keyof typeof value)
        return await invokeYTValueProcessor(ctx, value, schema, YTValueCallbackType.POST) && keys(value).length > 0
      default:
        throw new TypeError('invalid schema value type')
    }
  } catch (error) {
    return ctx.catch(error)
  } finally {
    ctx.pop()
  }
}

export const registerYTValueFilter = <S extends YTValueSchema>(
  schema: S,
  filter?: ((data: YTValueData<S>) => boolean) | null,
  type = YTValueCallbackType.PRE,
  config: YTValueProcessorConfig | YTValueProcessorContext = defaultConfig
): () => void => {
  if (config instanceof YTValueProcessorContext) config.mutable()

  const mapping = config.fmapping[type]
  if (mapping == null) throw new TypeError('invalid callback type')

  const wrappedFilter = filter == null ? deleteYTValueProcessor<S> : filterYTValueProcessor.bind(null, filter as (data: YTValueData) => boolean)

  let callbacks: Array<YTValueFilter<S>> | null | undefined = mapping.get(schema)
  if (callbacks == null) {
    callbacks = []
    mapping.set(schema, callbacks)
  }
  callbacks.push(wrappedFilter)

  return () => {
    if (callbacks == null) return

    callbacks.splice(callbacks.indexOf(wrappedFilter), 1)
    callbacks = null
  }
}

export const registerYTValueProcessor = <S extends YTValueSchema>(
  schema: S,
  processor: YTValueProcessor<S>,
  type = YTValueCallbackType.PRE,
  config: YTValueProcessorConfig | YTValueProcessorContext = defaultConfig
): () => void => {
  if (config instanceof YTValueProcessorContext) config.mutable()

  const mapping = config.pmapping[type]
  if (mapping == null) throw new TypeError('invalid callback type')

  let callbacks: Array<YTValueProcessor<S>> | null | undefined = mapping.get(schema)
  if (callbacks == null) {
    callbacks = []
    mapping.set(schema, callbacks)
  }
  callbacks.push(processor)

  return () => {
    if (callbacks == null) return

    callbacks.splice(callbacks.indexOf(processor), 1)
    callbacks = null
  }
}

export const processYTEndpoint = async (value: unknown, config = defaultConfig): Promise<void> => {
  const begin = performance.now()

  const ctx = new YTValueProcessorContext(config)
  await processYTValue(ctx, YT_VALUE_ENDPOINT, value, null)

  const delta = performance.now() - begin
  logger.debug(`endpoint processor took: ${delta.toFixed(2)}ms`)
}

export const processYTResponse = async (key: YTResponse.MappedKey, value: unknown, config = defaultConfig): Promise<void> => {
  const schema = YTResponse.mapped[key]
  if (schema == null) {
    logger.debug('schema not found for response:', key)
    return
  }

  const begin = performance.now()

  const ctx = new YTValueProcessorContext(config)
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i--) await processYTValue(ctx, schema, value[i], i)
  } else {
    await processYTValue(ctx, schema, value)
  }

  const delta = performance.now() - begin
  logger.debug(`response '${key}' processor took: ${delta.toFixed(2)}ms`)
}