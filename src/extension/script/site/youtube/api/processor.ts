import Logger from '@ext/lib/logger'
import { YTObjectSchema, ytv_enp, ytv_ren, YTValueSchema, YTValueType } from '@ext/site/youtube/api/types/common'
import { YTEndpointOuterData, YTEndpointOuterSchema, YTEndpointSchemaMap } from '@ext/site/youtube/api/types/endpoint'
import { YTRendererKey, YTRendererMixinSchema, YTRendererSchemaMap } from '@ext/site/youtube/api/types/renderer'
import { onPostProcessYTEndpoint, onPreProcessYTEndpoint } from './endpoint'
import { onPostProcessYTRenderer, onPreProcessYTRenderer } from './renderer'

const logger = new Logger('YT-PROCESSOR')

const ENDPOINT_SCHEMA = {
  ...YTEndpointOuterSchema,
  ...Object.fromEntries(Object.entries(YTEndpointSchemaMap).map(e => [e[0], ytv_enp(e[1])]))
} satisfies YTObjectSchema

const RENDERER_SCHEMA = {
  ...YTRendererMixinSchema,
  ...Object.fromEntries(Object.entries(YTRendererSchemaMap).map(e => [e[0], ytv_ren(Object.assign(e[1], YTRendererMixinSchema))]))
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

function processYTValueSchema<P = null>(schema: YTValueSchema, value: unknown, parent: P): boolean { // NOSONAR
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
        if (schema.enum[value] == null) throwMismatchTypeError(Object.keys(schema.enum).filter((v, i, a) => a.indexOf(v) === i).join('|'), value, true)
      } else {
        throw new Error('invalid schema enum definition')
      }
      break
    case YTValueType.OBJECT:
      if (typeof value !== 'object') throwMismatchTypeError('object', value)
      for (const key in value) {
        processYTObjectFieldSchema(schema.key, schema.value, key, value)
      }
      break
    case YTValueType.SCHEMA: {
      if (typeof value !== 'object') throwMismatchTypeError('object', value)
      let isNotEmpty = false
      for (const key in value) {
        isNotEmpty = processYTSchemaFieldSchema(schema.schema, key, value) || isNotEmpty
      }
      if (!isNotEmpty) return false
      break
    }
    case YTValueType.ARRAY:
      if (!Array.isArray(value)) throwMismatchTypeError('array', value)
      for (let i = value.length - 1; i >= 0; i--) {
        if (processYTArrayValueSchema(schema.value, i, value)) continue

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
          if (!processYTSchemaFieldSchema(ENDPOINT_SCHEMA, key, value)) return false
        }
        break
      }

      if (!onPreProcessYTEndpoint(value, endpointSchema, parent as YTEndpointOuterData | null)) {
        logger.trace('pre processor removed endpoint:', endpointSchema, value)
        return false
      }

      for (const key in value) {
        processYTSchemaFieldSchema(endpointSchema, key, value)
      }

      if (!onPostProcessYTEndpoint(value, endpointSchema, parent as YTEndpointOuterData | null)) {
        logger.trace('post processor removed endpoint:', endpointSchema, value)
        return false
      }
      break
    }
    case YTValueType.RENDERER: {
      if (typeof value !== 'object') throwMismatchTypeError('object', value)

      if (schema.schema == null) {
        for (const key in value) {
          if (!processYTSchemaFieldSchema(RENDERER_SCHEMA, key, value)) return false
        }
        break
      }

      const rendererSchema = Object.assign(schema.schema, YTRendererMixinSchema)

      if (!onPreProcessYTRenderer(value, rendererSchema)) {
        logger.trace('pre processor removed renderer:', rendererSchema, value)
        return false
      }

      for (const key in value) {
        processYTSchemaFieldSchema(rendererSchema, key, value)
      }

      if (!onPostProcessYTRenderer(value, rendererSchema)) {
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

function processYTObjectFieldSchema(keySchema: YTValueSchema, valueSchema: YTValueSchema, key: unknown, value: object): void {
  try {
    if (!processYTValueSchema(keySchema, key, value)) {
      delete value[key as keyof typeof value]
      logger.trace('key processor removed field:', keySchema, valueSchema, key, value)
      return
    }

    if (!processYTValueSchema(valueSchema, value[key as keyof typeof value], value)) {
      delete value[key as keyof typeof value]
      logger.trace('value processor removed field:', keySchema, valueSchema, key, value)
    }
  } catch (error) {
    logger.debug('object field error:', errorMessage(error), keySchema, valueSchema, key, value)
  }
}

function processYTSchemaFieldSchema(schema: YTObjectSchema, key: string, value: object): boolean {
  try {
    const fieldSchema = schema[key]
    if (fieldSchema == null) throw new Error('unhandled field')

    const fieldValue = value[key as keyof typeof value]
    if (fieldValue == null) return false

    if (!processYTValueSchema(fieldSchema, fieldValue, value)) {
      delete value[key as keyof typeof value]
      logger.trace('value processor removed field:', fieldValue, schema, key, value)
      return false
    }
  } catch (error) {
    logger.debug('schema field error:', errorMessage(error), schema, key, value)
  }

  return true
}

function processYTArrayValueSchema(schema: YTValueSchema, index: number, value: unknown[]): boolean {
  try {
    return processYTValueSchema(schema, value[index], value)
  } catch (error) {
    logger.debug('array index error:', errorMessage(error), schema, index, value)
    return true
  }
}

export function processYTRenderer(renderer: YTRendererKey, value: unknown): void {
  const schema = YTRendererSchemaMap[renderer]
  if (schema == null) {
    logger.warn('schema not found for renderer:', renderer)
    return
  }

  try {
    processYTValueSchema(ytv_ren(schema), value, null)
  } catch (error) {
    logger.warn('renderer processor error:', errorMessage(error), renderer, value)
  }
}