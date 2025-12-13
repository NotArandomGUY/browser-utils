import { registerOverlayPage } from '@ext/common/preload/overlay'
import { registerYTEndpointPreProcessor, YTEndpoint, YTEndpointSchemaMap } from '@ext/custom/youtube/api/endpoint'
import { YTEndpointData } from '@ext/custom/youtube/api/types/common'
import { YTConfigInitCallback } from '@ext/custom/youtube/module/core/bootstrap'
import YTOfflinePage from '@ext/custom/youtube/pages/offline'
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
    YTConfigInitCallback.registerCallback(() => updateYTReduxStoreLocalEntities())

    registerYTEndpointPreProcessor(YTEndpointSchemaMap['entityUpdateCommand'], updateEntityUpdateCommand)

    registerOverlayPage('Downloads', YTOfflinePage)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}