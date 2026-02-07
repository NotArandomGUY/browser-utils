import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { ytuiShowToast } from '@ext/custom/youtube/utils/ytui'
import { Feature } from '@ext/lib/feature'

const IGNORE_PLAYABILITY_STATUS = new Set<YTValueData<YTRenderer.Component<'playerPlayabilityStatus'>>['status']>([
  'OK',
  'LIVE_STREAM_OFFLINE'
])

const updatePlayerHeartbeatResponse = (data: YTValueData<YTResponse.Mapped<'playerHeartbeat'>>): void => {
  const { status, errorCode } = data.playabilityStatus ?? { errorCode: 'SERVER_ERROR' }

  if (IGNORE_PLAYABILITY_STATUS.has(status)) return

  data.playabilityStatus = { status: 'OK' }
  data.stopHeartbeat = true

  ytuiShowToast(`Video playback could be interrupted (status=${status ?? 'UNKNOWN'}, error=${errorCode ?? 'NONE'})`, 15e3)
}

export default class YTPlayerHeartbeatModule extends Feature {
  public constructor() {
    super('heartbeat')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    cleanupCallbacks.push(
      registerYTValueProcessor(YTResponse.mapped.playerHeartbeat, updatePlayerHeartbeatResponse)
    )

    return true
  }
}