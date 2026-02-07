import { registerYTValueFilter, registerYTValueProcessor, YTValueProcessorType } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { dispatchYTSignalAction } from '@ext/custom/youtube/module/core/command'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { YTPlayerServerAdDelayCallback } from '@ext/custom/youtube/module/player/network'
import PlayerParams from '@ext/custom/youtube/proto/player-params'
import { defineProperty } from '@ext/global/object'
import { bufferFromString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTMISCS-ADS')

const INLINE_PLAYER_SIGNATURE_CACHE_TTL = 3600e3 // 1 hour

const inlinePlayerSignatureCache = new Map<string, [sign: Uint8Array<ArrayBuffer> | null, expire: number]>()

let isInlinePlayerSigned = false
let isFetchApiAds = false

const processWatchEndpoint = (data: YTValueData<YTEndpoint.Mapped<'watchEndpoint'>>): void => {
  const { params, videoId } = data

  if (params == null || videoId == null) return

  const playerParams = new PlayerParams().deserialize(bufferFromString(decodeURIComponent(params), 'base64url'))
  if (!playerParams.isInlinePlayback) return

  const now = Date.now()
  Array.from(inlinePlayerSignatureCache.entries()).forEach(([key, [_, expire]]) => expire <= now && inlinePlayerSignatureCache.delete(key))
  inlinePlayerSignatureCache.set(videoId, [playerParams.sign, now + INLINE_PLAYER_SIGNATURE_CACHE_TTL])
}

const processPlayerResponse = (data: YTValueData<YTResponse.Mapped<'player'>>): void => {
  if (isInlinePlayerSigned || data.playabilityStatus?.status !== 'UNPLAYABLE') return

  isInlinePlayerSigned = true

  setTimeout(() => dispatchYTSignalAction(YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE), 1e3)
}

const updateNextResponse = (data: YTValueData<YTResponse.Mapped<'next'>>): void => {
  delete data.adEngagementPanels
}

const filterReel = (data: YTValueData<YTEndpoint.Mapped<'reelWatchEndpoint'>>): boolean => {
  return data.adClientParams == null
}

export default class YTMiscsAdsModule extends Feature {
  public constructor() {
    super('ads')
  }

  protected activate(): boolean {
    YTPlayerServerAdDelayCallback.registerCallback(() => {
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
    registerYTValueProcessor(YTEndpoint.mapped.watchEndpoint, processWatchEndpoint)
    registerYTValueProcessor(YTResponse.mapped.next, updateNextResponse)
    registerYTValueProcessor(YTResponse.mapped.player, processPlayerResponse)

    registerYTInnertubeRequestProcessor('player', ({ params, playbackContext, videoId }) => {
      if (params.isInlinePlayback || playbackContext?.contentPlaybackContext?.currentUrl?.startsWith('/shorts/')) return

      const entry = inlinePlayerSignatureCache.get(videoId!)
      if (isInlinePlayerSigned && entry == null) return

      params.isInlinePlaybackMuted = false
      params.isInlinePlayback = true
      // NOTE: salt/key id/magic[5 bytes] + sign(video id + params? (e.g. inline=1))[16 bytes]
      params.sign = entry?.[0] ?? null
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