import { registerYTEndpointPreProcessor, YTEndpoint, YTEndpointData, YTEndpointSchemaMap } from '@ext/custom/youtube/api/endpoint'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { YTObjectData, YTThumbnailSchema } from '@ext/custom/youtube/api/types/common'
import { Feature } from '@ext/lib/feature'

const updateThumbnails = (data?: YTObjectData<typeof YTThumbnailSchema>): void => {
  if (data?.thumbnails == null) return

  data.thumbnails = data.thumbnails.map(t => ({ ...t, url: t.url?.replace(/(?<=\/)hq(?=(default|\d)\.)/, 'maxres') }))
}

const updateSetAppBackgroundCommand = (data: YTEndpointData<YTEndpoint<'setAppBackgroundCommand'>>): boolean => {
  updateThumbnails(data.image)

  return true
}

const updateThumbnailRenderer = (data: YTRendererData<YTRenderer<'liveStreamOfflineSlateRenderer' | 'tileHeaderRenderer'>>): boolean => {
  updateThumbnails(data.thumbnail)

  return true
}

export default class YTMiscsThumbnailModule extends Feature {
  public constructor() {
    super('thumbnail')
  }

  protected activate(): boolean {
    registerYTEndpointPreProcessor(YTEndpointSchemaMap['setAppBackgroundCommand'], updateSetAppBackgroundCommand)
    registerYTRendererPreProcessor(YTRendererSchemaMap['liveStreamOfflineSlateRenderer'], updateThumbnailRenderer)
    registerYTRendererPreProcessor(YTRendererSchemaMap['tileHeaderRenderer'], updateThumbnailRenderer)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}