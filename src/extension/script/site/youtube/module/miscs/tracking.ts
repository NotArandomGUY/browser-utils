import { Feature } from '@ext/lib/feature'
import { registerYTRendererPreProcessor, setYTServiceTrackingOverride, YTLoggingDirectivesSchema, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

function updateLoggingDirectives(data: YTRendererData<typeof YTLoggingDirectivesSchema>): boolean {
  delete data.clientVeSpec
  delete data.visibility

  return true
}

function updatePlayerResponse(data: YTRendererData<YTRenderer<'playerResponse'>>): boolean {
  delete data.playbackTracking?.ptrackingUrl
  delete data.playbackTracking?.qoeUrl
  delete data.playbackTracking?.atrUrl
  delete data.playbackTracking?.googleRemarketingUrl
  delete data.playbackTracking?.youtubeRemarketingUrl

  return true
}

export default class YTMiscsTrackingModule extends Feature {
  public constructor() {
    super('miscs-tracking')
  }

  protected activate(): boolean {
    setYTServiceTrackingOverride('CSI', 'yt_ad', '0')
    setYTServiceTrackingOverride('CSI', 'yt_red', '1')

    registerYTRendererPreProcessor(YTLoggingDirectivesSchema, updateLoggingDirectives)
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}