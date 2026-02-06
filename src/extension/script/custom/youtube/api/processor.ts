import { YTEndpoint, YTObjectSchema, YTRenderer, YTResponse, YTValueData, YTValueParent, YTValueSchema, YTValueSchemaOf, YTValueType } from '@ext/custom/youtube/api/schema'
import { keys } from '@ext/global/object'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTAPI-PROCESSOR')

export type YTValueFilter<S extends YTValueSchema = YTValueSchema> = (data: YTValueData<S>, schema: S, parent: YTValueParent<S>) => boolean
export type YTValueProcessor<S extends YTValueSchema = YTValueSchema> = (data: YTValueData<S>, schema: S, parent: YTValueParent<S>) => Promise<void> | void

export const enum YTValueProcessorType {
  PRE = 0,
  POST = 1
}

type TypeOf<T = void> = T extends void ? {
  'boolean': boolean
  'number': number
  'object': object
  'string': string
} : T extends keyof TypeOf ? TypeOf[T] : never

const filterMap = new Map<YTValueSchema, [pre: Array<YTValueFilter>, post: Array<YTValueFilter>]>()
const processorMap = new Map<YTValueSchema, [pre: Array<YTValueProcessor>, post: Array<YTValueProcessor>]>()

class DeleteChildError extends Error {
  private readonly params_: unknown[]

  public constructor(reason: string, parent: unknown, key: unknown, value: unknown, schema: YTValueSchema) {
    super(`delete child [${key}] reason: ${reason}`)

    this.params_ = [value, schema, parent]
  }

  /*@__MANGLE_PROP__*/public printDebugLog(): void {
    const { message, params_ } = this

    logger.trace(message, ...params_)
  }
}

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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function deleteYTValueProcessor<S extends YTValueSchema>(data: YTValueData<S>, schema: S, parent: YTValueParent<S>): boolean {
  logger.debug('filtered value:', data, schema, parent)
  return false
}

function filterYTValueProcessor<S extends YTValueSchema>(filter: (data: YTValueData<S>) => boolean, data: YTValueData<S>, schema: S, parent: YTValueParent<S>): boolean {
  return filter(data) ? true : deleteYTValueProcessor<S>(data, schema, parent)
}

async function invokeYTValueProcessor<S extends YTValueSchema>(data: YTValueData<S>, schema: S, parent: YTValueParent<S>, type = YTValueProcessorType.PRE): Promise<boolean> {
  if (filterMap.get(schema)?.[type].some(filter => !filter(data, schema, parent))) return false

  const processors = processorMap.get(schema)?.[type]
  if (processors != null) await Promise.all(processors.map(processor => Promise.resolve(processor(data, schema, parent))))

  return true
}

async function processYTArrayEntry(schema: YTValueSchema, index: number, parent: unknown[]): Promise<void> {
  try {
    const value = parent[index]
    if (!await processYTValue(schema, value, parent)) throw new DeleteChildError('value', parent, index, value, schema)
  } catch (error) {
    if (error instanceof DeleteChildError) {
      parent.splice(index, 1)
      return error.printDebugLog()
    }
    logger.debug('array entry error:', errorMessage(error), schema, index, parent)
  }
}

async function processYTObjectEntry(schema: YTValueSchemaOf<YTValueType.OBJECT>, key: unknown, parent: object): Promise<void> {
  try {
    const value = parent[key as keyof typeof parent]
    if (!await processYTValue(schema.key, key, parent)) throw new DeleteChildError('key', parent, key, value, schema)
    if (!await processYTValue(schema.value, value, parent)) throw new DeleteChildError('value', parent, key, value, schema)
  } catch (error) {
    if (error instanceof DeleteChildError) {
      delete parent[key as keyof typeof parent]
      return error.printDebugLog()
    }
    logger.debug('object entry error:', errorMessage(error), schema, key, parent)
  }
}

async function processYTSchemaEntry(parentSchema: YTObjectSchema, key: string, parent: object): Promise<void> {
  try {
    const schema = parentSchema[key]
    if (schema == null) throw new TypeError('unhandled field')

    const value = parent[key as keyof typeof parent]
    if (!await processYTValue(schema, value, parent)) throw new DeleteChildError('value', parent, key, value, schema)
  } catch (error) {
    if (error instanceof DeleteChildError) {
      delete parent[key as keyof typeof parent]
      return error.printDebugLog()
    }
    logger.debug('schema entry error:', errorMessage(error), parentSchema, key, parent)
  }
}

async function processYTSchemaEntries(
  schema: Required<YTValueSchemaOf<YTValueType.SCHEMA | YTValueType.ENDPOINT | YTValueType.RENDERER | YTValueType.RESPONSE>>,
  value: object,
  parent: object | null
): Promise<boolean> {
  if (!await invokeYTValueProcessor(value, schema, parent, YTValueProcessorType.PRE)) return false
  for (const key in value) await processYTSchemaEntry(schema.schema, key, value)
  return await invokeYTValueProcessor(value, schema, parent, YTValueProcessorType.POST)
}

export function registerYTValueProcessor<S extends YTValueSchema>(schema: S, processor: YTValueProcessor<S>, type = YTValueProcessorType.PRE): () => void {
  let pair = processorMap.get(schema)
  if (pair == null) {
    pair = [[], []]
    processorMap.set(schema, pair)
  }

  let processors: YTValueProcessor[] | null = pair[type]
  if (processors == null) throw new Error('invalid processor type')

  processors.push(processor as YTValueProcessor)

  return () => {
    if (processors == null) return

    processors.splice(processors.indexOf(processor as YTValueProcessor), 1)
    processors = null
  }
}

export function registerYTValueFilter<S extends YTValueSchema>(schema: S, filter?: ((data: YTValueData<S>) => boolean) | null, type = YTValueProcessorType.PRE): () => void {
  let pair = filterMap.get(schema)
  if (pair == null) {
    pair = [[], []]
    filterMap.set(schema, pair)
  }

  let filters: YTValueFilter[] | null = pair[type]
  if (filters == null) throw new Error('invalid filter type')

  const wrappedFilter = (filter == null ? deleteYTValueProcessor<S> : filterYTValueProcessor.bind(null, filter as (data: YTValueData) => boolean)) as YTValueFilter
  filters.push(wrappedFilter)

  return () => {
    if (filters == null) return

    filters.splice(filters.indexOf(wrappedFilter), 1)
    filters = null
  }
}

export async function processYTValue(schema: YTValueSchema, value: unknown, parent: YTValueParent<typeof schema>): Promise<boolean> { // NOSONAR
  if (value == null) return false

  switch (schema.type) {
    case YTValueType.UNKNOWN:
      return invokeYTValueProcessor(value, schema, parent)
    case YTValueType.BOOLEAN:
      assertType('boolean', value)
      return invokeYTValueProcessor(value, schema, parent)
    case YTValueType.NUMBER:
      assertType('number', value)
      return invokeYTValueProcessor(value, schema, parent)
    case YTValueType.STRING:
      assertType('string', value)
      if (schema.enum != null) {
        if (Array.isArray(schema.enum)) {
          if (!schema.enum.includes(value)) throwMismatchTypeError(schema.enum.join('|'), value, true)
        } else if (typeof schema.enum === 'object') {
          if (schema.enum[value.split(':')[0]] == null) throwMismatchTypeError(keys(schema.enum).filter((v, i, a) => a.indexOf(v) === i).join('|'), value, true)
        } else {
          throw new TypeError('invalid schema enum definition')
        }
      }
      return invokeYTValueProcessor(value, schema, parent)
    case YTValueType.OBJECT:
      assertType('object', value)
      if (!await invokeYTValueProcessor(value as Record<string | number, unknown>, schema, parent, YTValueProcessorType.PRE)) return false
      for (const key in value) await processYTObjectEntry(schema, key, value)
      return invokeYTValueProcessor(value as Record<string | number, unknown>, schema, parent, YTValueProcessorType.POST)
    case YTValueType.SCHEMA:
      assertType('object', value)
      return await processYTSchemaEntries(schema, value, parent) && keys(value).length > 0
    case YTValueType.ARRAY:
      if (!Array.isArray(value)) throwMismatchTypeError('array', value)
      if (!await invokeYTValueProcessor(value, schema, parent, YTValueProcessorType.PRE)) return false
      for (let i = value.length - 1; i >= 0; i--) await processYTArrayEntry(schema.value, i, value)
      return await invokeYTValueProcessor(value, schema, parent, YTValueProcessorType.POST) && value.length > 0
    case YTValueType.ENDPOINT:
      assertType('object', value)
      if (schema.schema != null) return processYTSchemaEntries(schema as Required<YTValueSchemaOf<YTValueType.ENDPOINT>>, value, parent)
      if (!await invokeYTValueProcessor(value, schema, parent, YTValueProcessorType.PRE)) return false
      for (const key in value) await processYTSchemaEntry(YTEndpoint.mapped, key, value)
      return await invokeYTValueProcessor(value, schema, parent, YTValueProcessorType.POST) && keys(value).some(key => !YTEndpoint.MappedOuterKeys.includes(key as typeof YTEndpoint.MappedOuterKeys[number]))
    case YTValueType.RENDERER:
    case YTValueType.RESPONSE:
      assertType('object', value)
      if (schema.schema != null) return processYTSchemaEntries(schema as Required<YTValueSchemaOf<YTValueType.RENDERER | YTValueType.RESPONSE>>, value, parent)
      if (!await invokeYTValueProcessor(value, schema, parent, YTValueProcessorType.PRE)) return false
      for (const key in value) await processYTSchemaEntry(YTRenderer.mapped, key, value)
      return await invokeYTValueProcessor(value, schema, parent, YTValueProcessorType.POST) && keys(value).length > 0
    default:
      throw new Error('invalid schema value type')
  }
}

export async function processYTResponse(key: YTResponse.MappedKey, value: unknown): Promise<void> {
  const schema = YTResponse.mapped[key]
  if (schema == null) {
    logger.debug('schema not found for response:', key)
    return
  }

  const begin = performance.now()
  try {
    if (Array.isArray(value)) {
      for (const entry of value) await processYTValue(schema, entry, value)
    } else {
      await processYTValue(schema, value, null)
    }
  } catch (error) {
    logger.warn('response processor error:', errorMessage(error), key, value)
  } finally {
    const delta = performance.now() - begin
    logger.debug(`response processor took: ${delta.toFixed(2)}ms`)
  }
}