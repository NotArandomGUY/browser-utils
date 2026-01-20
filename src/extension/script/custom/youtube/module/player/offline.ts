import { registerOverlayPage } from '@ext/common/preload/overlay'
import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { YTConfigInitCallback } from '@ext/custom/youtube/module/core/bootstrap'
import YTOfflinePage from '@ext/custom/youtube/pages/offline'
import { decodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import { YTOfflineMediaStreamQuality } from '@ext/custom/youtube/proto/ytom/stream'
import { getNonce } from '@ext/custom/youtube/utils/crypto'
import { getYTLocalEntitiesByType, getYTLocalEntityByKey, getYTLocalEntityByType, getYTLocalMediaIndex, putYTLocalEntity, YTLocalEntity, YTLocalMediaType } from '@ext/custom/youtube/utils/local'
import { getYTReduxMethodEntry, updateYTReduxStoreLocalEntities, YTReduxEntities, YTReduxMethodType } from '@ext/custom/youtube/utils/redux'
import { ytuiShowToast } from '@ext/custom/youtube/utils/ytui'
import { entries } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const DOWNLOAD_METHODS = [YTReduxMethodType.GetAllDownloads, YTReduxMethodType.GetManualDownloads, YTReduxMethodType.GetSmartDownloads] as const
const TRANSFER_DOWNLOAD_STATE_MAP = {
  'TRANSFER_STATE_COMPLETE': 'DOWNLOAD_STATE_COMPLETE',
  'TRANSFER_STATE_FAILED': 'DOWNLOAD_STATE_FAILED',
  'TRANSFER_STATE_PAUSED_BY_USER': 'DOWNLOAD_STATE_PAUSED',
  'TRANSFER_STATE_TRANSFER_IN_QUEUE': 'DOWNLOAD_STATE_PENDING_DOWNLOAD',
  'TRANSFER_STATE_TRANSFERRING': 'DOWNLOAD_STATE_DOWNLOAD_IN_PROGRESS'
} satisfies Partial<Record<YTLocalEntity<EntityType.transfer>['data']['transferState'], YTLocalEntity<EntityType.downloadStatusEntity>['data']['downloadState']>>

const logger = new Logger('YTPLAYER-OFFLINE')

const reduxCache: Array<[string, object[]] | null> = DOWNLOAD_METHODS.map(() => null)

const getReduxCacheKey = (entities?: YTReduxEntities): string => {
  return entries(entities?.mainVideoDownloadStateEntity ?? {}).map(([key, value]) => `${key}:${value.downloadStatusEntity.downloadState}`).join()
}

const syncDownloadsListEntity = async (): Promise<void> => {
  try {
    const mainDownloadsListEntity = await getYTLocalEntityByType(EntityType.mainDownloadsListEntity, true)
    const videoDownloadContextEntities = await getYTLocalEntitiesByType(EntityType.videoDownloadContextEntity, true)
    if (mainDownloadsListEntity == null || videoDownloadContextEntities.length === 0) return

    const downloads = mainDownloadsListEntity.data.downloads
    if (!Array.isArray(downloads)) return

    // Convert to entityId here to avoid doing it in each .find call
    videoDownloadContextEntities.forEach(entity => entity.key = decodeEntityKey(entity.key).entityId ?? entity.key)

    let hasInvalid = false
    for (const download of downloads) {
      const entityId = decodeEntityKey(download.videoItem).entityId

      const downloadContextEntity = videoDownloadContextEntities.find(entity => entity.key === entityId)
      if (downloadContextEntity?.data.offlineModeType === 'OFFLINE_MODE_TYPE_AUTO_OFFLINE') continue

      downloads.splice(downloads.indexOf(download), 1)
      hasInvalid = true
    }
    if (hasInvalid) await putYTLocalEntity<EntityType.mainDownloadsListEntity>(mainDownloadsListEntity, true)
  } catch (error) {
    logger.warn('process entities error:', error)
  }
}

const syncVideoEntities = async (): Promise<void> => {
  try {
    const mainVideoEntities = await getYTLocalEntitiesByType(EntityType.mainVideoEntity, true)
    if (mainVideoEntities.length === 0) return

    await Promise.all(mainVideoEntities.map(async ({ data }) => {
      const downloadState = await getYTLocalEntityByKey<EntityType.mainVideoDownloadStateEntity>(data.downloadState, true)
      if (downloadState == null) return

      const [downloadStatus, playbackData] = await Promise.all([
        getYTLocalEntityByKey<EntityType.downloadStatusEntity>(downloadState.data.downloadStatusEntity.key, true),
        getYTLocalEntityByKey<EntityType.playbackData>(downloadState.data.playbackData, true)
      ])
      if (downloadStatus == null || playbackData == null) return

      if (playbackData.data.transfer == null) {
        downloadStatus.data.downloadState = 'DOWNLOAD_STATE_USER_DELETED'
        await putYTLocalEntity<EntityType.downloadStatusEntity>(downloadStatus, true)

        ytuiShowToast(`Deleted invalid download '${data.videoId}'`, 5e3)
        return
      }

      const transfer = await getYTLocalEntityByKey<EntityType.transfer>(playbackData.data.transfer, true)
      if (transfer == null) return

      const mappedState = TRANSFER_DOWNLOAD_STATE_MAP[transfer.data.transferState as keyof typeof TRANSFER_DOWNLOAD_STATE_MAP]
      if (mappedState == null) return

      if (downloadState.data.downloadStatusEntity.downloadState !== mappedState) {
        downloadState.data.downloadStatusEntity.downloadState = mappedState
        await putYTLocalEntity<EntityType.mainVideoDownloadStateEntity>(downloadState, true)
      }
      if (downloadStatus.data.downloadState !== mappedState) {
        downloadStatus.data.downloadState = mappedState
        await putYTLocalEntity<EntityType.downloadStatusEntity>(downloadStatus, true)
      }
    }))
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
      await updateYTReduxStoreLocalEntities()

      DOWNLOAD_METHODS.forEach((type, idx) => {
        const entry = getYTReduxMethodEntry(type)
        if (entry == null) return

        default_kevlar_base[entry[0]] = new Hook(entry[1]).install(ctx => {
          const cacheKey = getReduxCacheKey(ctx.args[0])

          let cacheEntry = reduxCache[idx]
          if (cacheEntry?.[0] !== cacheKey) {
            cacheEntry = [cacheKey, ctx.origin.apply(ctx.self, ctx.args)]
            reduxCache[idx] = cacheEntry
          }

          ctx.returnValue = cacheEntry[1]
          return HookResult.EXECUTION_CONTINUE
        }).call
      })

      await Promise.all([syncDownloadsListEntity(), syncVideoEntities()])
      await updateYTReduxStoreLocalEntities(0)
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