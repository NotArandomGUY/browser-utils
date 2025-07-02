import Logger from '@ext/lib/logger'
import { encodeTrackingParam } from '@ext/site/youtube/api/crypto'
import { YTRendererData, YTRendererSchema } from '@ext/site/youtube/api/types/common'
import { YTRenderer, YTResponseContextSchema } from '@ext/site/youtube/api/types/renderer'

export { YTLoggingDirectivesSchema, YTRendererData, YTRendererSchema } from '@ext/site/youtube/api/types/common'
export * from '@ext/site/youtube/api/types/renderer'

export type YTRendererProcessor<S extends YTRendererSchema = YTRendererSchema> = (data: YTRendererData, schema: S) => Promise<boolean> | boolean

export const OVERRIDE_TRACKING_PARAMS = 'CAAQACIMCAAVAAAAAB0AAAAA'

const logger = new Logger('YTAPI-RENDERER')

const serviceTrackingOverrideConfig: {
  [service: string]: {
    [key: string]: string
  }
} = {}

const preProcessorMap = new Map<YTRendererSchema, Array<YTRendererProcessor>>()
const postProcessorMap = new Map<YTRendererSchema, Array<YTRendererProcessor>>()

function removeNode<S extends YTRendererSchema>(data: YTRendererData<S>, schema: S): boolean {
  logger.debug('remove node:', data, schema)
  return false
}

function removeNodeFiltered<S extends YTRendererSchema>(filter: (data: YTRendererData<S>) => boolean, data: YTRendererData<S>, schema: S): boolean {
  return filter(data) ? true : removeNode(data, schema)
}

export function setYTServiceTrackingOverride(service: string, key: string, value: string): void {
  let serviceOverride = serviceTrackingOverrideConfig[service]
  if (serviceOverride == null) {
    serviceOverride = {}
    serviceTrackingOverrideConfig[service] = serviceOverride
  }
  serviceOverride[key] = value
}

export function registerYTRendererPreProcessor<S extends YTRendererSchema>(schema: S, processor: YTRendererProcessor<S>): void {
  let processors = preProcessorMap.get(schema)
  if (processors == null) {
    processors = []
    preProcessorMap.set(schema, processors)
  }

  processors.push(processor as YTRendererProcessor)
}

export function registerYTRendererPostProcessor<S extends YTRendererSchema>(schema: S, processor: YTRendererProcessor<S>): void {
  let processors = postProcessorMap.get(schema)
  if (processors == null) {
    processors = []
    postProcessorMap.set(schema, processors)
  }

  processors.push(processor as YTRendererProcessor)
}

export function removeYTRendererPre<S extends YTRendererSchema>(schema: S, filter?: (data: YTRendererData<S>) => boolean) {
  registerYTRendererPreProcessor(
    schema,
    filter == null ?
      removeNode :
      removeNodeFiltered.bind(null, filter as (data: YTRendererData<YTRenderer>) => boolean)
  )
}

export function removeYTRendererPost<S extends YTRendererSchema>(schema: S, filter?: (data: YTRendererData<S>) => boolean) {
  registerYTRendererPostProcessor(
    schema,
    filter == null ?
      removeNode :
      removeNodeFiltered.bind(null, filter as (data: YTRendererData<YTRenderer>) => boolean)
  )
}

export async function onPreProcessYTRenderer<S extends YTRendererSchema>(data: YTRendererData<S>, schema: S): Promise<boolean> {
  if (data.clickTrackingParams != null) data.clickTrackingParams = OVERRIDE_TRACKING_PARAMS
  if (data.trackingParams != null) data.trackingParams = OVERRIDE_TRACKING_PARAMS

  const processors = preProcessorMap.get(schema)
  if (processors == null) return true

  for (const processor of processors) {
    if (!await processor(data, schema)) return false
  }

  return true
}

export async function onPostProcessYTRenderer<S extends YTRendererSchema>(data: YTRendererData<S>, schema: S): Promise<boolean> {
  const processors = postProcessorMap.get(schema)
  if (processors == null) return true

  for (const processor of processors) {
    if (!await processor(data, schema)) return false
  }

  return true
}

registerYTRendererPreProcessor(YTResponseContextSchema, (data: YTRendererData<typeof YTResponseContextSchema>) => {
  const { mainAppWebResponseContext, serviceTrackingParams } = data

  if (mainAppWebResponseContext != null) {
    mainAppWebResponseContext.trackingParam = encodeTrackingParam('CioKDnRyYWNraW5nUGFyYW1zEhhDQUFRQUNJTUNBQVZBQUFBQUIwQUFBQUE')
  }

  serviceTrackingParams?.forEach(tracking => {
    if (tracking.service == null) return

    const override = serviceTrackingOverrideConfig[tracking.service]
    if (override == null) return

    tracking.params ??= []
    for (const key in override) {
      const value = override[key]

      const entry = tracking.params.find(p => p.key === key)
      if (entry == null) {
        tracking.params.push({ key, value })
      } else {
        entry.value = value
      }
    }
  })

  return true
})