import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { removeYTEndpointPre, YTEndpoint, YTEndpointData, YTEndpointSchemaMap } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, removeYTRendererPost, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

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
    Object.defineProperty(window, 'google_ad_status', { configurable: true, enumerable: true, value: null })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}