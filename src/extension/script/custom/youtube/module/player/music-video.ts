import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTCommon, YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

const DISABLE_AUDIO_ONLY_MV_TYPES = new Set<`${YTCommon.enums.MusicVideoType}`>([
  YTCommon.enums.MusicVideoType.MUSIC_VIDEO_TYPE_OMV,
  YTCommon.enums.MusicVideoType.MUSIC_VIDEO_TYPE_UGC
])

const updatePlayerVideoDetails = (data: YTValueData<YTRenderer.Component<'playerVideoDetails'>>): void => {
  if (DISABLE_AUDIO_ONLY_MV_TYPES.has(data.musicVideoType!)) delete data.musicVideoType
}

export default class YTPlayerMusicVideoModule extends Feature {
  public constructor() {
    super('music-video')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    cleanupCallbacks.push(
      registerYTValueProcessor(YTRenderer.components.playerVideoDetails, updatePlayerVideoDetails)
    )

    return true
  }
}