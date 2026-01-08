import { registerOverlayPage } from '@ext/common/preload/overlay'
import { registerYTEndpointPreProcessor, YTEndpoint, YTEndpointSchemaMap } from '@ext/custom/youtube/api/endpoint'
import { YTEndpointData } from '@ext/custom/youtube/api/types/common'
import { YTConfigInitCallback } from '@ext/custom/youtube/module/core/bootstrap'
import YTOfflinePage from '@ext/custom/youtube/pages/offline'
import { decodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import { getYTLocalEntitiesByType, getYTLocalEntityByType, putYTLocalEntity } from '@ext/custom/youtube/utils/local'
import { updateYTReduxStoreLocalEntities } from '@ext/custom/youtube/utils/redux'
import { Feature } from '@ext/lib/feature'

const updateEntityUpdateCommand = (data: YTEndpointData<YTEndpoint<'entityUpdateCommand'>>): boolean => {
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

export default class YTPlayerOfflineModule extends Feature {
  public constructor() {
    super('offline')
  }

  protected activate(): boolean {
    YTConfigInitCallback.registerCallback(async () => {
      try {
        // Remove manual downloads from main downloads list
        const mainDownloadsListEntity = await getYTLocalEntityByType(EntityType.mainDownloadsListEntity, true)
        const videoDownloadContextEntities = await getYTLocalEntitiesByType(EntityType.videoDownloadContextEntity, true)
        if (mainDownloadsListEntity == null || videoDownloadContextEntities.length === 0) return

        const downloads = mainDownloadsListEntity.data.downloads
        if (!Array.isArray(downloads)) return

        let isAllValid = true
        for (const download of downloads) {
          const entityId = decodeEntityKey(download.videoItem).entityId

          const downloadContextEntity = videoDownloadContextEntities.find(entity => decodeEntityKey(entity.key).entityId === entityId)
          if (downloadContextEntity?.data.offlineModeType === 'OFFLINE_MODE_TYPE_AUTO_OFFLINE') continue

          downloads.splice(downloads.indexOf(download), 1)
          isAllValid = false
        }
        if (isAllValid) return

        await putYTLocalEntity<EntityType.mainDownloadsListEntity>(mainDownloadsListEntity, true)
      } finally {
        await updateYTReduxStoreLocalEntities()
      }
    })

    registerYTEndpointPreProcessor(YTEndpointSchemaMap['entityUpdateCommand'], updateEntityUpdateCommand)

    registerOverlayPage('Downloads', YTOfflinePage)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}