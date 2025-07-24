import { defineProperty } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { removeYTEndpointPre, YTEndpoint, YTEndpointData, YTEndpointSchemaMap } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, removeYTRendererPost, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { registerYTInnertubeRequestProcessor } from '@ext/site/youtube/module/core/network'

const logger = new Logger('YTMISCS-ADS')

function updateNextResponse(data: YTRendererData<YTRenderer<'nextResponse'>>): boolean {
  delete data.adEngagementPanels

  return true
}

function filterReel(data: YTEndpointData<YTEndpoint<'reelWatchEndpoint'>>): boolean {
  return data.adClientParams == null
}

export default class YTMiscsAdsModule extends Feature {
  public constructor() {
    super('miscs-ads')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['nextResponse'], updateNextResponse)

    removeYTEndpointPre(YTEndpointSchemaMap['adsControlFlowOpportunityReceivedCommand'])
    removeYTEndpointPre(YTEndpointSchemaMap['reelWatchEndpoint'], filterReel)
    removeYTRendererPre(YTRendererSchemaMap['adPlacementRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['bkaEnforcementMessageViewModel'])
    removeYTRendererPre(YTRendererSchemaMap['playerLegacyDesktopWatchAdsRenderer'])
    removeYTRendererPost(YTRendererSchemaMap['adPlayerOverlayRenderer'])
    removeYTRendererPost(YTRendererSchemaMap['adSlotRenderer'])
    removeYTRendererPost(YTRendererSchemaMap['topBannerImageTextIconButtonedLayoutViewModel'])

    registerYTInnertubeRequestProcessor('player', ({ params }) => {
      if (params.isInlinePlayback) return

      params.isInlinePlaybackMuted = false
      params.isInlinePlayback = true
    })

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]

      if (node instanceof HTMLScriptElement) {
        if (!node.src.includes('doubleclick.net')) return HookResult.EXECUTION_IGNORE

        logger.debug('intercepted script element from append', node)

        ctx.returnValue = node
        node.dispatchEvent(new Event('load'))

        return HookResult.EXECUTION_CONTINUE
      }

      return HookResult.EXECUTION_IGNORE
    })
    defineProperty(window, 'google_ad_status', { configurable: true, enumerable: true, value: null })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}