import { registerYTValueFilter, registerYTValueProcessor, YTValueProcessorType } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { YTServerAdDelayCallback } from '@ext/custom/youtube/module/player/ump'
import { defineProperty } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTMISCS-ADS')

let isFetchApiAds = false

const updateNextResponse = (data: YTValueData<YTResponse.Mapped<'next'>>): boolean => {
  delete data.adEngagementPanels

  return true
}

const filterReel = (data: YTValueData<YTEndpoint.Mapped<'reelWatchEndpoint'>>): boolean => {
  return data.adClientParams == null
}

export default class YTMiscsAdsModule extends Feature {
  public constructor() {
    super('ads')
  }

  protected activate(): boolean {
    YTServerAdDelayCallback.registerCallback(() => {
      if (isFetchApiAds) return

      isFetchApiAds = true
      throw new Response(null, { status: 403 })
    })

    registerYTValueFilter(YTEndpoint.mapped.adsControlFlowOpportunityReceivedCommand)
    registerYTValueFilter(YTEndpoint.mapped.reelWatchEndpoint, filterReel)
    registerYTValueFilter(YTRenderer.mapped.adPlacementRenderer)
    registerYTValueFilter(YTRenderer.mapped.bannerPromoRenderer)
    registerYTValueFilter(YTRenderer.mapped.bkaEnforcementMessageViewModel)
    registerYTValueFilter(YTRenderer.mapped.playerLegacyDesktopWatchAdsRenderer)
    registerYTValueFilter(YTRenderer.mapped.adPlayerOverlayRenderer, null, YTValueProcessorType.POST)
    registerYTValueFilter(YTRenderer.mapped.adSlotRenderer, null, YTValueProcessorType.POST)
    registerYTValueFilter(YTRenderer.mapped.topBannerImageTextIconButtonedLayoutViewModel, null, YTValueProcessorType.POST)
    registerYTValueProcessor(YTResponse.mapped.next, updateNextResponse)

    registerYTInnertubeRequestProcessor('player', ({ params, playbackContext }) => {
      if (params.isInlinePlayback || playbackContext?.contentPlaybackContext?.currentUrl?.startsWith('/shorts/')) return

      params.isInlinePlaybackMuted = false
      params.isInlinePlayback = true
      // NOTE: some flags that might be useless, but kept for reference later
      /*
      params.b78 = false
      params.b79 = false
      params.sign = null
      */
    })

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]

      if (node instanceof HTMLScriptElement) {
        if (!node.src.includes('doubleclick.net')) return HookResult.EXECUTION_PASSTHROUGH

        logger.debug('intercepted script element from append', node)

        ctx.returnValue = node
        node.dispatchEvent(new Event('load'))

        return HookResult.EXECUTION_CONTINUE
      }

      return HookResult.EXECUTION_PASSTHROUGH
    })
    defineProperty(window, 'google_ad_status', { configurable: true, enumerable: true, value: null })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}