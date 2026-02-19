import { registerYTValueFilter, registerYTValueProcessor, YTValueProcessorType } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { registerYTInnertubeRequestProcessor } from '@ext/custom/youtube/module/core/network'
import { getAllYTPInstance, YTPInstanceType } from '@ext/custom/youtube/module/player/bootstrap'
import PlayerParams from '@ext/custom/youtube/proto/player-params'
import { max, min } from '@ext/global/math'
import { defineProperty } from '@ext/global/object'
import { waitMs, waitUntil } from '@ext/lib/async'
import { bufferFromString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTMISCS-ADS')

const MODIFIER_MODE_KEY = 'bu-ab-prm-mode'
const INLINE_PLAYER_SIGNATURE_CACHE_TTL = 3600e3 // 1 hour

const enum ModifierMode {
  DISABLED = 0,
  PLAYER_INLINE_V1_SIGNED,
  PLAYER_SCREEN,
  PLAYER_INLINE_V1,
  PLAYER_INLINE_V2,
  IDLE
}

const inlinePlayerSignatureCache = new Map<string, [sign: Uint8Array<ArrayBuffer> | null, expire: number]>()

let modifierMode: ModifierMode = max(ModifierMode.DISABLED, min(ModifierMode.IDLE, Number(sessionStorage.getItem(MODIFIER_MODE_KEY)) || ModifierMode.IDLE))
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
  const { adSlots, playabilityStatus, playerConfig, videoDetails } = data

  const videoId = videoDetails?.videoId
  if (videoId == null || playabilityStatus == null) return

  const audioConfig = playerConfig?.audioConfig
  if (audioConfig && unmuteVideoId === videoId) delete audioConfig.muteOnStart

  const isPlayable = playabilityStatus.status !== 'UNPLAYABLE' && !adSlots?.length
  if (isPlayable || modifierMode <= 0) return

  sessionStorage.setItem(MODIFIER_MODE_KEY, String(--modifierMode))
  logger.debug('switching modifier mode:', modifierMode)

  playabilityStatus.status = 'LIVE_STREAM_OFFLINE'
  waitMs(500).then(() => waitUntil(() => {
    const player = getAllYTPInstance(YTPInstanceType.VIDEO_PLAYER).find(({ videoData }) => videoData?.videoId === videoId)
    if (player == null) return false

    logger.debug('reloading player', player)

    player.publish?.('signatureexpired')
    return true
  }))
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