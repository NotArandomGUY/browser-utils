import { registerYTEndpointPreProcessor, YTEndpoint, YTEndpointSchemaMap } from '@ext/custom/youtube/api/endpoint'
import { YTEndpointData } from '@ext/custom/youtube/api/types/common'
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
    registerYTEndpointPreProcessor(YTEndpointSchemaMap['entityUpdateCommand'], updateEntityUpdateCommand)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}