import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { removeYTEndpointPre, YTEndpoint, YTEndpointData, YTEndpointSchemaMap } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, removeYTRendererPost, removeYTRendererPre, setYTServiceTrackingOverride, YTLoggingDirectivesSchema, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

interface YTGlobal {
  ytUtilActivityCallback_: () => void
}

const logger = new Logger('YT-PREMIUM')

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

function updateNextResponse(data: YTRendererData<YTRenderer<'nextResponse'>>): boolean {
  delete data.adEngagementPanels

  return true
}

function filterReel(data: YTEndpointData<YTEndpoint<'reelWatchEndpoint'>>): boolean {
  return data.adClientParams == null
}

function generateActivity(): void {
  if (Math.random() > 0.15) return

  const ytglobal = window.ytglobal as YTGlobal
  if (ytglobal == null) return

  const now = Date.now()
  window._lact = now
  if (window._fact == null || window._fact == -1) window._fact = now

  ytglobal.ytUtilActivityCallback_?.()
}

export default class YTPremiumModule extends Feature {
  protected activate(): boolean {
    setYTServiceTrackingOverride('CSI', 'yt_ad', '0')
    setYTServiceTrackingOverride('CSI', 'yt_red', '1')

    registerYTRendererPreProcessor(YTLoggingDirectivesSchema, updateLoggingDirectives)
    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], updatePlayerResponse)
    registerYTRendererPreProcessor(YTRendererSchemaMap['nextResponse'], updateNextResponse)

    removeYTEndpointPre(YTEndpointSchemaMap['adsControlFlowOpportunityReceivedCommand'])
    removeYTEndpointPre(YTEndpointSchemaMap['reelWatchEndpoint'], filterReel)
    removeYTRendererPre(YTRendererSchemaMap['adPlacementRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['bkaEnforcementMessageViewModel'])
    removeYTRendererPre(YTRendererSchemaMap['mealbarPromoRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['playerLegacyDesktopWatchAdsRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['youThereRenderer'])
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

    setInterval(generateActivity, 15e3)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}