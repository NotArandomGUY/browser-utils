import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkState } from '@ext/lib/intercept/network'
import { registerYTRendererPreProcessor, setYTServiceTrackingOverride, YTLoggingDirectivesSchema, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { registerYTInnertubeRequestProcessor } from '@ext/site/youtube/module/core/network'

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

function updateSearchResponse(data: YTRendererData<YTRenderer<'searchResponse'>>): boolean {
  delete data.responseContext?.visitorData

  return true
}

export default class YTMiscsTrackingModule extends Feature {
  public constructor() {
    super('tracking')
  }

  protected activate(): boolean {
    setYTServiceTrackingOverride('CSI', 'yt_ad', '0')
    setYTServiceTrackingOverride('CSI', 'yt_red', '1')

    registerYTRendererPreProcessor(YTLoggingDirectivesSchema, updateLoggingDirectives)
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)
    registerYTRendererPreProcessor(YTRendererSchemaMap['searchResponse'], updateSearchResponse)

    registerYTInnertubeRequestProcessor('player', ({ params }) => {
      params.searchQuery = null
    })
    registerYTInnertubeRequestProcessor('search', request => {
      request.context.client.visitorData = ''

      delete request.suggestionSearchParams
      delete request.webSearchboxStatsUrl
    })

    addInterceptNetworkCallback(ctx => {
      if (ctx.state !== NetworkState.UNSENT) return

      ctx.request.headers.delete('x-goog-visitor-id')
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}