import { registerOverlayPage } from '@ext/common/preload/overlay'
import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTCommon, YTEndpoint, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { YTKevlarMethodDefineCallback, YTPlayerCreateCallback } from '@ext/custom/youtube/module/core/bootstrap'
import YTOfflinePage from '@ext/custom/youtube/pages/offline'
import { decodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import { getNonce } from '@ext/custom/youtube/utils/crypto'
import { getYTLocalEntitiesByType, getYTLocalEntityByKey, getYTLocalEntityByType, getYTLocalMediaIndex, putYTLocalEntity, YTLocalEntity, YTLocalMediaType } from '@ext/custom/youtube/utils/local'
import { defineYTReduxMethod, updateYTReduxStoreLocalEntities, YTReduxEntities, YTReduxMethodType } from '@ext/custom/youtube/utils/redux'
import { ytuiShowToast } from '@ext/custom/youtube/utils/ytui'
import { entries } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTPLAYER-OFFLINE')

const REDUX_METHOD_PATTERNS: [type: YTReduxMethodType, regexp: RegExp, filter?: (fn: Function) => boolean][] = [
  [YTReduxMethodType.GetStore, /[a-zA-Z_$][\w$]+\|\|\([a-zA-Z_$][\w$]+=[a-zA-Z_$][\w$]+\(\)\);return [a-zA-Z_$][\w$]+/s, fn => 'store' in fn()],
  [YTReduxMethodType.GetAllDownloads, /playbackData.*?sort.*?streamDownloadTimestamp.*?map/s],
  [YTReduxMethodType.GetManualDownloads, /filter.*?downloadedVideoEntities.*?videoEntity.*?mainDownloadsListEntity.*?sort.*?addedTimestampMillis.*?map/s],
  [YTReduxMethodType.GetSmartDownloads, /sort.*?addedTimestampMillis.*?map.*?downloadedVideoEntities.*?filter.*?videoEntity/s]
]
const TRANSFER_DOWNLOAD_STATE_MAP = {
  'TRANSFER_STATE_COMPLETE': 'DOWNLOAD_STATE_COMPLETE',
  'TRANSFER_STATE_FAILED': 'DOWNLOAD_STATE_FAILED',
  'TRANSFER_STATE_PAUSED_BY_USER': 'DOWNLOAD_STATE_PAUSED',
  'TRANSFER_STATE_TRANSFER_IN_QUEUE': 'DOWNLOAD_STATE_PENDING_DOWNLOAD',
  'TRANSFER_STATE_TRANSFERRING': 'DOWNLOAD_STATE_DOWNLOAD_IN_PROGRESS'
} satisfies Partial<Record<YTLocalEntity<EntityType.transfer>['data']['transferState'], YTLocalEntity<EntityType.downloadStatusEntity>['data']['downloadState']>>

const delayedReduxMethodMatches: Array<[kevlar: Record<string, unknown>, name: string, fn: Function]> = []
const reduxCache = new Map<YTReduxMethodType, [key: string, value: unknown]>()

const getReduxCacheKey = (entities?: YTReduxEntities): string => {
  return entries(entities?.mainVideoDownloadStateEntity ?? {}).map(([key, value]) => `${key}:${value.downloadStatusEntity.downloadState}`).join()
}

const syncDownloadsListEntity = async (): Promise<void> => {
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
}

const syncVideoEntities = async (): Promise<void> => {
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
}

const matchReduxMethod = (kevlar: Record<string, unknown>, name: string, fn: Function, delayFilterExec = true): void => {
  const body = String(fn)

  const pattern = REDUX_METHOD_PATTERNS.find(pattern => pattern[1].test(body))
  if (pattern == null) return

  const [type, _regexp, filter] = pattern

  if (filter != null) {
    if (delayFilterExec) {
      delayedReduxMethodMatches.push([kevlar, name, fn])
      return
    }
    if (!filter(fn)) return
  }

  defineYTReduxMethod(type, fn as (...args: unknown[]) => unknown)
  switch (type) { // NOSONAR
    case YTReduxMethodType.GetStore:
      Promise.all([syncDownloadsListEntity(), syncVideoEntities()]).then(updateYTReduxStoreLocalEntities).catch(error => {
        logger.warn('sync entities error:', error)
      })
      break
    default:
      kevlar[name] = new Hook(fn as (entities?: YTReduxEntities) => unknown).install(ctx => {
        const cacheKey = getReduxCacheKey(ctx.args[0])

        let cacheEntry = reduxCache.get(type)
        if (cacheEntry?.[0] !== cacheKey) {
          cacheEntry = [cacheKey, ctx.origin.apply(ctx.self, ctx.args)]
          reduxCache.set(type, cacheEntry)
        }

        ctx.returnValue = cacheEntry[1]
        return HookResult.EXECUTION_CONTINUE
      }).call
      break
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
  const quality = YTCommon.enums.MediaFormatVideoQuality[index?.format?.quality as keyof typeof YTCommon.enums.MediaFormatVideoQuality]
  if (quality != null && quality > YTCommon.enums.MediaFormatVideoQuality.large) data.cotn = getNonce(16)

  return true
}

export default class YTPlayerOfflineModule extends Feature {
  public constructor() {
    super('offline')
  }

  protected activate(): boolean {
    YTKevlarMethodDefineCallback.registerCallback(matchReduxMethod)
    YTPlayerCreateCallback.registerCallback(() => delayedReduxMethodMatches.splice(0).forEach(args => matchReduxMethod(...args, false)))

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