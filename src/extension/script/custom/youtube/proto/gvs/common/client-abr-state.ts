import ClientCapabilities from '@ext/custom/youtube/proto/gvs/common/client-capabilities'
import MediaCapabilities from '@ext/custom/youtube/proto/gvs/common/media-capabilities'
import PlaybackAuthorization from '@ext/custom/youtube/proto/gvs/common/playback-authorization'
import { pbf_bin, pbf_bol, pbf_flt, pbf_i32, pbf_i64, pbf_msg, pbf_si32, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const ClientAbrState = createMessage({
  /*@__MANGLE_PROP__*/timeSinceLastManualFormatSelectionMs: pbf_i64(13),
  /*@__MANGLE_PROP__*/lastManualDirection: pbf_si32(14),
  /*@__MANGLE_PROP__*/lastManualSelectedResolution: pbf_i32(16),
  /*@__MANGLE_PROP__*/detailedNetworkType: pbf_i32(17),
  /*@__MANGLE_PROP__*/clientViewportWidth: pbf_i32(18),
  /*@__MANGLE_PROP__*/clientViewportHeight: pbf_i32(19),
  /*@__MANGLE_PROP__*/clientBitrateCapBytesPerSec: pbf_i64(20),
  /*@__MANGLE_PROP__*/stickyResolution: pbf_i32(21),
  /*@__MANGLE_PROP__*/clientViewportIsFlexible: pbf_bol(22),
  /*@__MANGLE_PROP__*/bandwidthEstimate: pbf_i64(23),
  /*@__MANGLE_PROP__*/minAudioQuality: pbf_i32(24),
  /*@__MANGLE_PROP__*/maxAudioQuality: pbf_i32(25),
  /*@__MANGLE_PROP__*/videoQualitySetting: pbf_i32(26),
  /*@__MANGLE_PROP__*/audioRoute: pbf_i32(27),
  /*@__MANGLE_PROP__*/playerTimeMs: pbf_i64(28),
  /*@__MANGLE_PROP__*/timeSinceLastSeek: pbf_i64(29),
  /*@__MANGLE_PROP__*/dataSaverMode: pbf_bol(30),
  /*@__MANGLE_PROP__*/networkMeteredState: pbf_i32(32),
  visibility: pbf_i32(34),
  playbackRate: pbf_flt(35),
  /*@__MANGLE_PROP__*/elapsedWallTimeMs: pbf_i64(36),
  /*@__MANGLE_PROP__*/mediaCapabilities: pbf_msg(38, MediaCapabilities),
  /*@__MANGLE_PROP__*/timeSinceLastActionMs: pbf_i64(39),
  /*@__MANGLE_PROP__*/enabledTrackTypesBitfield: pbf_i32(40),
  /*@__MANGLE_PROP__*/maxPacingRate: pbf_i32(43),
  /*@__MANGLE_PROP__*/playerState: pbf_i64(44),
  /*@__MANGLE_PROP__*/drcEnabled: pbf_bol(46),
  i48: pbf_i32(48),
  i50: pbf_i32(50),
  i51: pbf_i32(51),
  /*@__MANGLE_PROP__*/sabrReportRequestCancellationInfo: pbf_i32(54),
  /*@__MANGLE_PROP__*/disableStreamingXhr: pbf_bol(56),
  i57: pbf_i64(57),
  /*@__MANGLE_PROP__*/preferVp9: pbf_bol(58),
  /*@__MANGLE_PROP__*/av1QualityThreshold: pbf_i32(59),
  i60: pbf_i32(60),
  isPrefetch: pbf_bol(61),
  /*@__MANGLE_PROP__*/sabrSupportQualityConstraints: pbf_bol(62),
  /*@__MANGLE_PROP__*/sabrLicenseConstraint: pbf_bin(63),
  /*@__MANGLE_PROP__*/allowProximaLiveLatency: pbf_i32(64),
  /*@__MANGLE_PROP__*/sabrForceProxima: pbf_i32(66),
  i67: pbf_i32(67),
  /*@__MANGLE_PROP__*/sabrForceMaxNetworkInterruptionDurationMs: pbf_i64(68),
  audioTrackId: pbf_str(69),
  /*@__MANGLE_PROP__*/isSmooth: pbf_bol(71),
  /*@__MANGLE_PROP__*/clientCapabilities: pbf_msg(72, ClientCapabilities),
  /*@__MANGLE_PROP__*/enableVoiceBoost: pbf_bol(76),
  /*@__MANGLE_PROP__*/playbackAuthorization: pbf_msg(79, PlaybackAuthorization)
})

export default ClientAbrState