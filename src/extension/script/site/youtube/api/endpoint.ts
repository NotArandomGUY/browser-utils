import Logger from '@ext/lib/logger'
import { YTEndpointData, YTEndpointSchema } from '@ext/site/youtube/api/types/common'
import { YTEndpoint, YTEndpointOuterData } from '@ext/site/youtube/api/types/endpoint'
import { OVERRIDE_TRACKING_PARAMS } from './renderer'

export { YTEndpointData, YTEndpointSchema } from '@ext/site/youtube/api/types/common'
export * from '@ext/site/youtube/api/types/endpoint'

const logger = new Logger('YT-ENDPOINT')

const preProcessorMap = new Map<YTEndpointSchema, Array<(data: YTEndpointData, schema: YTEndpointSchema, parent: YTEndpointOuterData | null) => boolean>>()
const postProcessorMap = new Map<YTEndpointSchema, Array<(data: YTEndpointData, schema: YTEndpointSchema, parent: YTEndpointOuterData | null) => boolean>>()

function removeNode<S extends YTEndpointSchema>(data: YTEndpointData<S>, schema: S): boolean {
  logger.debug('remove node:', data, schema)
  return false
}

function removeNodeFiltered<S extends YTEndpointSchema>(filter: (data: YTEndpointData<S>) => boolean, data: YTEndpointData<S>, schema: S): boolean {
  return filter(data) ? true : removeNode(data, schema)
}

export function registerYTEndpointPreProcessor<S extends YTEndpointSchema>(schema: S, processor: (data: YTEndpointData<S>, schema: S, parent: YTEndpointOuterData | null) => boolean): void {
  let processors = preProcessorMap.get(schema)
  if (processors == null) {
    processors = []
    preProcessorMap.set(schema, processors)
  }

  processors.push(processor as (data: YTEndpointData, schema: YTEndpointSchema, parent: YTEndpointOuterData | null) => boolean)
}

export function registerYTEndpointPostProcessor<S extends YTEndpointSchema>(schema: S, processor: (data: YTEndpointData<S>, schema: S, parent: YTEndpointOuterData | null) => boolean): void {
  let processors = postProcessorMap.get(schema)
  if (processors == null) {
    processors = []
    postProcessorMap.set(schema, processors)
  }

  processors.push(processor as (data: YTEndpointData, schema: YTEndpointSchema, parent: YTEndpointOuterData | null) => boolean)
}

export function removeYTEndpointPre<S extends YTEndpointSchema>(schema: S, filter?: (data: YTEndpointData<S>) => boolean) {
  registerYTEndpointPreProcessor(
    schema,
    filter == null ?
      removeNode :
      removeNodeFiltered.bind(null, filter as (data: YTEndpointData<YTEndpoint>) => boolean)
  )
}

export function removeYTEndpointPost<S extends YTEndpointSchema>(schema: S, filter?: (data: YTEndpointData<S>) => boolean) {
  registerYTEndpointPostProcessor(
    schema,
    filter == null ?
      removeNode :
      removeNodeFiltered.bind(null, filter as (data: YTEndpointData<YTEndpoint>) => boolean)
  )
}

export function onPreProcessYTEndpoint<S extends YTEndpointSchema>(data: YTEndpointData<S>, schema: S, parent: YTEndpointOuterData | null): boolean {
  if (parent?.clickTrackingParams != null) parent.clickTrackingParams = OVERRIDE_TRACKING_PARAMS

  const processors = preProcessorMap.get(schema)
  return processors?.find(processor => processor(data, schema, parent) === false) == null
}

export function onPostProcessYTEndpoint<S extends YTEndpointSchema>(data: YTEndpointData<S>, schema: S, parent: YTEndpointOuterData | null): boolean {
  const processors = postProcessorMap.get(schema)
  return processors?.find(processor => processor(data, schema, parent) === false) == null
}