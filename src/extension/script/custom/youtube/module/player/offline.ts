import { registerOverlayPage } from '@ext/common/preload/overlay'
import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { YTConfigInitCallback } from '@ext/custom/youtube/module/core/bootstrap'
import YTOfflinePage from '@ext/custom/youtube/pages/offline'
import { decodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import { YTOfflineMediaStreamQuality } from '@ext/custom/youtube/proto/ytom/stream'
import { getNonce } from '@ext/custom/youtube/utils/crypto'
import { getYTLocalEntitiesByType, getYTLocalEntityByType, getYTLocalMediaIndex, putYTLocalEntity, YTLocalMediaType } from '@ext/custom/youtube/utils/local'
import { getYTReduxMethodEntry, updateYTReduxStoreLocalEntities, YTReduxMethodType } from '@ext/custom/youtube/utils/redux'
import { keys } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const DOWNLOAD_METHODS = [YTReduxMethodType.GetManualDownloads, YTReduxMethodType.GetSmartDownloads] as const

const logger = new Logger('YTPLAYER-OFFLINE')

const downloadsCache: Array<[string, object[]] | null> = DOWNLOAD_METHODS.map(() => null)

const cleanupMainDownloadsList = async (): Promise<void> => {
  try {
    const mainDownloadsListEntity = await getYTLocalEntityByType(EntityType.mainDownloadsListEntity, true)
    const videoDownloadContextEntities = await getYTLocalEntitiesByType(EntityType.videoDownloadContextEntity, true)
    if (mainDownloadsListEntity == null || videoDownloadContextEntities.length === 0) return

    const downloads = mainDownloadsListEntity.data.downloads
    if (!Array.isArray(downloads)) return

    let hasInvalid = false
    for (const download of downloads) {
      const entityId = decodeEntityKey(download.videoItem).entityId

      const downloadContextEntity = videoDownloadContextEntities.find(entity => decodeEntityKey(entity.key).entityId === entityId)
      if (downloadContextEntity?.data.offlineModeType === 'OFFLINE_MODE_TYPE_AUTO_OFFLINE') continue

      downloads.splice(downloads.indexOf(download), 1)
      hasInvalid = true
    }
    if (hasInvalid) await putYTLocalEntity<EntityType.mainDownloadsListEntity>(mainDownloadsListEntity, true)
  } catch (error) {
    logger.warn('process entities error:', error)
  }
}

const updateEntityUpdateCommand = (data: YTValueData<YTEndpoint.Mapped<'entityUpdateCommand'>>): boolean => {
  const mutations = data.entityBatchUpdate?.mutations
  if (!Array.isArray(mutations)) return true

  for (const mutation of mutations) {
    const policy = mutation?.payload?.offlineVideoPolicy
    if (policy == null) continue

    policy.expirationTimestamp = 'Infinity'
    policy.lastUpdatedTimestampSeconds = 'Infinity'
  }

  return true
}

const updatePlayerResponse = async (data: YTValueData<YTResponse.Mapped<'player'>>): Promise<boolean> => {
  const videoId = data.videoDetails?.videoId
  if (videoId == null) return true

  const index = await getYTLocalMediaIndex(videoId, YTLocalMediaType.VIDEO)
  const quality = YTOfflineMediaStreamQuality[index?.format?.quality as keyof typeof YTOfflineMediaStreamQuality]
  if (quality != null && quality > YTOfflineMediaStreamQuality.large) data.cotn = getNonce(16)

  return true
}

export default class YTPlayerOfflineModule extends Feature {
  public constructor() {
    super('offline')
  }

  protected activate(): boolean {
    YTConfigInitCallback.registerCallback(async () => {
      await cleanupMainDownloadsList()
      await updateYTReduxStoreLocalEntities()

      DOWNLOAD_METHODS.forEach((type, idx) => {
        const entry = getYTReduxMethodEntry(type)
        if (entry == null) return

        default_kevlar_base[entry[0]] = new Hook(entry[1] as (entities: Record<string, Record<string, object>>) => object[]).install(ctx => {
          const cacheKey = keys(ctx.args[0]?.mainVideoDownloadStateEntity ?? {}).join()

          let cacheEntry = downloadsCache[idx]
          if (cacheEntry?.[0] !== cacheKey) {
            cacheEntry = [cacheKey, ctx.origin.apply(ctx.self, ctx.args)]
            downloadsCache[idx] = cacheEntry
          }

          ctx.returnValue = cacheEntry[1]
          return HookResult.EXECUTION_CONTINUE
        }).call
      })
    })

    registerYTValueProcessor(YTEndpoint.mapped.entityUpdateCommand, updateEntityUpdateCommand)
    registerYTValueProcessor(YTResponse.mapped.player, updatePlayerResponse)

    registerOverlayPage('Downloads', YTOfflinePage)

    window.ytglobal = window.ytglobal ?? {} as typeof ytglobal
    ytglobal!['idbToken_'] = {}

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}