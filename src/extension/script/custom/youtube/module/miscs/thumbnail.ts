import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

const updateThumbnails = (data?: YTValueData<YTRenderer.Component<'thumbnail'>>): void => {
  if (data?.thumbnails == null) return

  data.thumbnails = data.thumbnails.map(t => ({ ...t, url: t.url?.replace(/(?<=\/)hq(?=(default|\d)\.)/, 'maxres') }))
}

const updateSetAppBackgroundCommand = (data: YTValueData<YTEndpoint.Mapped<'setAppBackgroundCommand'>>): boolean => {
  updateThumbnails(data.image)

  return true
}

const updateThumbnailRenderer = (data: YTValueData<YTRenderer.Mapped<'liveStreamOfflineSlateRenderer' | 'tileHeaderRenderer'>>): boolean => {
  updateThumbnails(data.thumbnail)

  return true
}

export default class YTMiscsThumbnailModule extends Feature {
  public constructor() {
    super('thumbnail')
  }

  protected activate(): boolean {
    registerYTValueProcessor(YTEndpoint.mapped.setAppBackgroundCommand, updateSetAppBackgroundCommand)
    registerYTValueProcessor(YTRenderer.mapped.liveStreamOfflineSlateRenderer, updateThumbnailRenderer)
    registerYTValueProcessor(YTRenderer.mapped.tileHeaderRenderer, updateThumbnailRenderer)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}