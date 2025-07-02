import Logger from '@ext/lib/logger'
import { YTEndpointData, YTEndpointSchema } from '@ext/site/youtube/api/types/common'
import { YTEndpoint, YTEndpointOuterData } from '@ext/site/youtube/api/types/endpoint'
import { OVERRIDE_TRACKING_PARAMS } from './renderer'

export { YTEndpointData, YTEndpointSchema } from '@ext/site/youtube/api/types/common'
export * from '@ext/site/youtube/api/types/endpoint'

export type YTEndpointProcessor<S extends YTEndpointSchema = YTEndpointSchema> = (data: YTEndpointData, schema: S, parent: YTEndpointOuterData | null) => Promise<boolean> | boolean

const logger = new Logger('YT-ENDPOINT')

const preProcessorMap = new Map<YTEndpointSchema, Array<YTEndpointProcessor>>()
const postProcessorMap = new Map<YTEndpointSchema, Array<YTEndpointProcessor>>()

function removeNode<S extends YTEndpointSchema>(data: YTEndpointData<S>, schema: S): boolean {
  logger.debug('remove node:', data, schema)
  return false
}

function removeNodeFiltered<S extends YTEndpointSchema>(filter: (data: YTEndpointData<S>) => boolean, data: YTEndpointData<S>, schema: S): boolean {
  return filter(data) ? true : removeNode(data, schema)
}

export function registerYTEndpointPreProcessor<S extends YTEndpointSchema>(schema: S, processor: YTEndpointProcessor<S>): void {
  let processors = preProcessorMap.get(schema)
  if (processors == null) {
    processors = []
    preProcessorMap.set(schema, processors)
  }

  processors.push(processor as YTEndpointProcessor)
}

export function registerYTEndpointPostProcessor<S extends YTEndpointSchema>(schema: S, processor: YTEndpointProcessor<S>): void {
  let processors = postProcessorMap.get(schema)
  if (processors == null) {
    processors = []
    postProcessorMap.set(schema, processors)
  }

  processors.push(processor as YTEndpointProcessor)
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

export async function onPreProcessYTEndpoint<S extends YTEndpointSchema>(data: YTEndpointData<S>, schema: S, parent: YTEndpointOuterData | null): Promise<boolean> {
  if (parent?.clickTrackingParams != null) parent.clickTrackingParams = OVERRIDE_TRACKING_PARAMS

  const processors = preProcessorMap.get(schema)
  if (processors == null) return true

  for (const processor of processors) {
    if (!await processor(data, schema, parent)) return false
  }

  return true
}

export async function onPostProcessYTEndpoint<S extends YTEndpointSchema>(data: YTEndpointData<S>, schema: S, parent: YTEndpointOuterData | null): Promise<boolean> {
  const processors = postProcessorMap.get(schema)
  if (processors == null) return true

  for (const processor of processors) {
    if (!await processor(data, schema, parent)) return false
  }

  return true
}