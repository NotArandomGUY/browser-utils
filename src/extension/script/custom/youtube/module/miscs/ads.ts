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

const enum ModifierMode {
  DISABLED = 0,
  PLAYER_INLINE_V1_SIGNED,
  PLAYER_SCREEN,
  PLAYER_INLINE_V1,
  PLAYER_INLINE_V2,
  __COUNT__
}

const inlinePlayerSignatureCache = new Map<string, [sign: Uint8Array<ArrayBuffer> | null, expire: number]>()

let isFetchApiAds = false
let modifierMode: ModifierMode = ModifierMode.__COUNT__ - 1
let unmuteVideoId: string | undefined

const processWatchEndpoint = (data: YTValueData<YTEndpoint.Mapped<'watchEndpoint'>>): void => {
  const { params, videoId } = data

  if (params == null || videoId == null) return

  const playerParams = new PlayerParams().deserialize(bufferFromString(decodeURIComponent(params), 'base64url'))
  if (!playerParams.isInlinePlaybackV1) return

  const now = Date.now()
  Array.from(inlinePlayerSignatureCache.entries()).forEach(([key, [_, expire]]) => expire <= now && inlinePlayerSignatureCache.delete(key))
  inlinePlayerSignatureCache.set(videoId, [playerParams.sign, now + INLINE_PLAYER_SIGNATURE_CACHE_TTL])
}

const processPlayerResponse = (data: YTValueData<YTResponse.Mapped<'player'>>): void => {
  const { playabilityStatus, playerConfig, videoDetails } = data

  const audioConfig = playerConfig?.audioConfig
  if (audioConfig?.muteOnStart && unmuteVideoId === videoDetails?.videoId) delete audioConfig.muteOnStart

  if (modifierMode <= 0 || playabilityStatus?.status !== 'UNPLAYABLE') return

  logger.debug('switching modifier mode:', --modifierMode)

  playabilityStatus.status = 'LIVE_STREAM_OFFLINE'
  delete playabilityStatus.errorScreen

  setTimeout(() => {
    dispatchYTSignalAction(YTEndpoint.enums.SignalActionType.RELOAD_PLAYER)
    dispatchYTSignalAction(YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE)
  }, 1e3)
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

    registerYTInnertubeRequestProcessor('player', ({ context, params, playbackContext, videoId }) => {
      if (params.isInlinePlaybackV1 || playbackContext?.contentPlaybackContext?.currentUrl?.startsWith('/shorts/')) return

      switch (modifierMode) {
        case ModifierMode.PLAYER_SCREEN: {
          const client = context?.client
          if (client != null) {
            client.clientScreen = 'CHANNEL'
            break
          }
        }
        // falls through
        case ModifierMode.PLAYER_INLINE_V1_SIGNED: {
          const entry = inlinePlayerSignatureCache.get(videoId!)
          if (entry == null) break

          // NOTE: salt/key id/magic[5 bytes] + sign(video id + params? (e.g. inline=1))[16 bytes]
          params.sign = entry?.[0] ?? null
        }
        // falls through
        case ModifierMode.PLAYER_INLINE_V1:
          params.isInlinePlaybackMuted = false
          params.isInlinePlaybackV1 = true
          break
        case ModifierMode.PLAYER_INLINE_V2:
          params.isInlinePlaybackV2 = true
          unmuteVideoId = videoId
          break
      }
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