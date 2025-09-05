import { assign, entries, fromEntries, keys } from '@ext/global/object'
import Logger from '@ext/lib/logger'
import { onPostProcessYTEndpoint, onPreProcessYTEndpoint } from '@ext/site/youtube/api/endpoint'
import { onPostProcessYTRenderer, onPreProcessYTRenderer } from '@ext/site/youtube/api/renderer'
import { YTObjectSchema, ytv_enp, ytv_ren, YTValueSchema, YTValueType } from '@ext/site/youtube/api/types/common'
import { YTEndpointOuterData, YTEndpointOuterSchema, YTEndpointSchemaMap } from '@ext/site/youtube/api/types/endpoint'
import { YTRendererKey, YTRendererMixinSchema, YTRendererSchemaMap } from '@ext/site/youtube/api/types/renderer'

const logger = new Logger('YTAPI-PROCESSOR')

const ENDPOINT_SCHEMA = {
  ...YTEndpointOuterSchema,
  ...fromEntries(entries(YTEndpointSchemaMap).map(e => [e[0], ytv_enp(e[1])]))
} satisfies YTObjectSchema

const RENDERER_SCHEMA = {
  ...YTRendererMixinSchema,
  ...fromEntries(entries(YTRendererSchemaMap).map(e => [e[0], ytv_ren(assign(e[1], YTRendererMixinSchema))]))
} satisfies YTObjectSchema

class MismatchTypeError extends Error {
  public constructor(expectedType: string, actualType: string) {
    super(`expected '${expectedType}' got '${actualType}'`)

    this.name = 'mismatch type'
  }
}

function throwMismatchTypeError(expectedType: string, value: unknown, isType = false): never {
  throw new MismatchTypeError(expectedType, isType ? String(value) : typeof value)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function processYTObjectFieldSchema(keySchema: YTValueSchema, valueSchema: YTValueSchema, key: unknown, value: object): Promise<void> {
  try {
    if (!await processYTValueSchema(keySchema, key, value)) {
      delete value[key as keyof typeof value]
      logger.trace('key processor removed field:', keySchema, valueSchema, key, value)
      return
    }

    if (!await processYTValueSchema(valueSchema, value[key as keyof typeof value], value)) {
      delete value[key as keyof typeof value]
      logger.trace('value processor removed field:', keySchema, valueSchema, key, value)
    }
  } catch (error) {
    logger.debug('object field error:', errorMessage(error), keySchema, valueSchema, key, value)
  }
}

async function processYTSchemaFieldSchema(schema: YTObjectSchema, key: string, value: object): Promise<boolean> {
  try {
    const fieldSchema = schema[key]
    if (fieldSchema == null) throw new Error('unhandled field')

    const fieldValue = value[key as keyof typeof value]
    if (fieldValue == null) return false

    if (!await processYTValueSchema(fieldSchema, fieldValue, value)) {
      delete value[key as keyof typeof value]
      logger.trace('value processor removed field:', fieldValue, schema, key, value)
      return false
    }
  } catch (error) {
    logger.debug('schema field error:', errorMessage(error), schema, key, value)
  }

  return true
}

async function processYTArrayValueSchema(schema: YTValueSchema, index: number, value: unknown[]): Promise<boolean> {
  try {
    return await processYTValueSchema(schema, value[index], value)
  } catch (error) {
    logger.debug('array index error:', errorMessage(error), schema, index, value)
    return true
  }
}

export async function processYTValueSchema<P = null>(schema: YTValueSchema, value: unknown, parent: P): Promise<boolean> { // NOSONAR
  if (value == null) return false

  switch (schema.type) {
    case YTValueType.UNKNOWN:
      break
    case YTValueType.BOOLEAN:
      if (typeof value !== 'boolean') throwMismatchTypeError('boolean', value)
      break
    case YTValueType.NUMBER:
      if (typeof value !== 'number') throwMismatchTypeError('number', value)
      break
    case YTValueType.STRING:
      if (typeof value !== 'string') throwMismatchTypeError('string', value)
      if (schema.enum == null) break
      if (Array.isArray(schema.enum)) {
        if (!schema.enum.includes(value)) throwMismatchTypeError(schema.enum.join('|'), value, true)
      } else if (typeof schema.enum === 'object') {
        if (schema.enum[value.split(':')[0]] == null) throwMismatchTypeError(keys(schema.enum).filter((v, i, a) => a.indexOf(v) === i).join('|'), value, true)
      } else {
        throw new Error('invalid schema enum definition')
      }
      break
    case YTValueType.OBJECT:
      if (typeof value !== 'object') throwMismatchTypeError('object', value)
      for (const key in value) {
        await processYTObjectFieldSchema(schema.key, schema.value, key, value)
      }
      break
    case YTValueType.SCHEMA: {
      if (typeof value !== 'object') throwMismatchTypeError('object', value)
      let isNotEmpty = false
      for (const key in value) {
        isNotEmpty = (await processYTSchemaFieldSchema(schema.schema, key, value)) || isNotEmpty
      }
      if (!isNotEmpty) return false
      break
    }
    case YTValueType.ARRAY:
      if (!Array.isArray(value)) throwMismatchTypeError('array', value)
      for (let i = value.length - 1; i >= 0; i--) {
        if (await processYTArrayValueSchema(schema.value, i, value)) continue

        value.splice(i, 1)
        logger.trace('value processor removed index:', schema.value, i, value)
      }
      if (value.length === 0) return false
      break
    case YTValueType.ENDPOINT: {
      if (typeof value !== 'object') throwMismatchTypeError('object', value)

      const endpointSchema = schema.schema
      if (endpointSchema == null) {
        for (const key in value) {
          if (!await processYTSchemaFieldSchema(ENDPOINT_SCHEMA, key, value)) return false
        }
        break
      }

      if (!await onPreProcessYTEndpoint(value, endpointSchema, parent as YTEndpointOuterData | null)) {
        logger.trace('pre processor removed endpoint:', endpointSchema, value)
        return false
      }

      for (const key in value) {
        await processYTSchemaFieldSchema(endpointSchema, key, value)
      }

      if (!await onPostProcessYTEndpoint(value, endpointSchema, parent as YTEndpointOuterData | null)) {
        logger.trace('post processor removed endpoint:', endpointSchema, value)
        return false
      }
      break
    }
    case YTValueType.RENDERER: {
      if (typeof value !== 'object') throwMismatchTypeError('object', value)

      if (schema.schema == null) {
        for (const key in value) {
          if (!await processYTSchemaFieldSchema(RENDERER_SCHEMA, key, value)) return false
        }
        break
      }

      const rendererSchema = assign(schema.schema, YTRendererMixinSchema)

      if (!await onPreProcessYTRenderer(value, rendererSchema)) {
        logger.trace('pre processor removed renderer:', rendererSchema, value)
        return false
      }

      for (const key in value) {
        await processYTSchemaFieldSchema(rendererSchema, key, value)
      }

      if (!await onPostProcessYTRenderer(value, rendererSchema)) {
        logger.trace('post processor removed renderer:', rendererSchema, value)
        return false
      }
      break
    }
    default:
      throw new Error('invalid schema value type')
  }

  return true
}

export async function processYTRenderer(renderer: YTRendererKey, value: unknown): Promise<void> {
  const schema = YTRendererSchemaMap[renderer]
  if (schema == null) {
    logger.debug('schema not found for renderer:', renderer)
    return
  }

  try {
    if (!Array.isArray(value)) {
      await processYTValueSchema(ytv_ren(schema), value, null)
      return
    }

    for (const entry of value) {
      await processYTValueSchema(ytv_ren(schema), entry, null)
    }
  } catch (error) {
    logger.warn('renderer processor error:', errorMessage(error), renderer, value)
  }
}