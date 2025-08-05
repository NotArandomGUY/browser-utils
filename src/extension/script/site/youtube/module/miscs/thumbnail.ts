import { Feature } from '@ext/lib/feature'
import { registerYTEndpointPreProcessor, YTEndpoint, YTEndpointData, YTEndpointSchemaMap } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { YTObjectData, YTThumbnailSchema } from '@ext/site/youtube/api/types/common'

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