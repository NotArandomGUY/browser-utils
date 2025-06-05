import type { Ad, AdBreak, DownloadTiming } from '../advertising/API';
import type { AdConfig } from '../advertising/ConfigAPI';
import type { ModuleName } from '../ModuleName';
import type { SubtitleTrack } from '../subtitles/API';
import type { VTTProperties } from '../subtitles/vtt/API';
import type { ViewingDirection } from '../vr/API';
import type { ErrorCode } from './deficiency/ErrorCode';
import type { WarningCode } from './deficiency/WarningCode';
import type { HttpRequestType } from './NetworkAPI';
import type { AudioQuality, AudioTrack, Quality, VideoQuality, ViewMode } from './PlayerAPI';
export declare enum PlayerEvent {
    /**
     * Is fired when the player has enough data to start playback
     *
     * The semantic of the Event changed in player version 8. Before v8 it was used to signal the end of the setup
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Ready constant.
     *
     * @event
     * @since v8.0
     */
    Ready = "ready",
    /**
     * Is fired when the player enters the play state.
     *
     * The passed event is of type {@link PlaybackEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Play constant.
     *
     * @event
     * @since v4.0
     */
    Play = "play",
    /**
     * Is fired when the player actually has started playback.
     * The passed event is of type {@link PlaybackEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Playing constant.
     *
     * @event
     * @instance
     * @since v7.3
     */
    Playing = "playing",
    /**
     * Is fired when the player enters the pause state.
     * The passed event is of type {@link PlaybackEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Paused constant.
     *
     * @event
     * @since v7.0
     */
    Paused = "paused",
    /**
     * Is fired periodically during seeking. Only applies to VoD streams, please refer to {@link TimeShift} for live.
     * The passed event is of type {@link SeekEvent}.
     *
     * It is only triggered through a public API call.
     *
     * Using the {@link SourceConfigOptions.startOffset} does not trigger this event.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Seek constant.
     *
     * @event
     * @since v4.0
     */
    Seek = "seek",
    /**
     * Is fired when seeking has been finished and data is available to continue playback. Only applies to VoD streams,
     * please refer to {@link TimeShifted} for live.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * It is only triggered through a public API call.
     *
     * Using the {@link SourceConfigOptions.startOffset} does not trigger this event.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Seeked constant.
     *
     * @event
     * @since v4.0
     */
    Seeked = "seeked",
    /**
     * Is fired periodically during time shifting. Only applies to live streams, please refer to {@link Seek} for VoD.
     * The passed event is of type {@link TimeShiftEvent}.
     *
     * It is only triggered through a public API call.
     *
     * Using the {@link SourceConfigOptions.startOffset} does not trigger this event.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.TimeShift constant.
     *
     * @event
     * @since v5.0
     */
    TimeShift = "timeshift",
    /**
     * Is fired when time shifting has been finished and data is available to continue playback. Only applies to live
     * streams, please refer to {@link Seeked} for VoD.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * It is only triggered through a public API call.
     *
     * Using the {@link SourceConfigOptions.startOffset} does not trigger this event.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.TimeShifted constant.
     *
     * @event
     * @since v5.0
     */
    TimeShifted = "timeshifted",
    /**
     * Is fired when the volume is changed.
     * The passed event is of type {@link VolumeChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VolumeChanged constant.
     *
     * @event
     * @since v7.0
     */
    VolumeChanged = "volumechanged",
    /**
     * Is fired when the player is muted.
     * The passed event is of type {@link UserInteractionEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Muted constant.
     *
     * @event
     * @since v7.0
     */
    Muted = "muted",
    /**
     * Is fired when the player is unmuted.
     * The passed event is of type {@link UserInteractionEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Unmuted constant.
     *
     * @event
     * @since v7.0
     */
    Unmuted = "unmuted",
    /**
     * Is fired when the player size is updated.
     * The passed event is of type {@link PlayerResizedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.PlayerResized constant.
     *
     * @event
     * @since v8.0
     */
    PlayerResized = "playerresized",
    /**
     * Is fired when the playback of the current video has finished.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.PlaybackFinished constant.
     *
     * @event
     * @since v4.0
     */
    PlaybackFinished = "playbackfinished",
    /**
     * Is fired when an error is encountered during setup (e.g. HTML5/JS cannot be used) or during playback.
     * The passed event is of type {@link ErrorEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Error constant.
     *
     * @event
     * @since v4.0
     */
    Error = "error",
    /**
     * Is fired when something happens which is not as serious as an error but could potentially affect playback or other
     * functionalities.
     * The passed event is of type {@link WarningEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Warning constant.
     *
     * @event
     * @since v5.1
     */
    Warning = "warning",
    /**
     * Is fired when the player begins to stall and to buffer due to an empty buffer.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.StallStarted constant.
     *
     * @event
     * @since v7.0
     */
    StallStarted = "stallstarted",
    /**
     * Is fired when the player ends stalling due to enough data in the buffer.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.StallEnded constant.
     *
     * @event
     * @since v7.0
     */
    StallEnded = "stallended",
    /**
     * Is fired when the audio track is changed. It is also fired when a newly added track becomes enabled after the
     * {@link SourceLoaded} event. In this case and if no other track was enabled before, the `sourceAudio` property
     * will be set to `null`.
     * The passed event is of type {@link AudioChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AudioChanged constant.
     *
     * @event
     * @since v7.0
     */
    AudioChanged = "audiochanged",
    /**
     * Is fired when a new audio track is added.
     * The passed event is of type {@link AudioTrackEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AudioAdded constant.
     *
     * @event
     * @since v7.1.4 / v7.2.0
     */
    AudioAdded = "audioadded",
    /**
     * Is fired when an existing audio track is removed.
     * The passed event is of type {@link AudioTrackEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AudioRemoved constant.
     *
     * @event
     * @since v7.1.4 / v7.2.0
     */
    AudioRemoved = "audioremoved",
    /**
     * Is fired when changing the video quality is triggered by using setVideoQuality.
     * The passed event is of type {@link VideoQualityChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VideoQualityChanged constant.
     *
     * @event
     * @since v7.3.1
     */
    VideoQualityChanged = "videoqualitychanged",
    /**
     * Is fired when changing the audio quality is triggered by using setAudioQuality.
     * The passed event is of type {@link AudioQualityChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AudioQualityChanged constant.
     *
     * @event
     * @since v7.3.1
     */
    AudioQualityChanged = "audioqualitychanged",
    /**
     * Is fired when changing the downloaded video quality is triggered, either by using setVideoQuality or due to
     * automatic dynamic adaptation.
     * The passed event is of type {@link VideoDownloadQualityChangeEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VideoDownloadQualityChange constant.
     *
     * @event
     * @since v4.0
     */
    VideoDownloadQualityChange = "videodownloadqualitychange",
    /**
     * Is fired when changing the downloaded audio quality is triggered, either by using setAudioQuality or due to
     * automatic dynamic adaptation.
     * The passed event is of type {@link AudioDownloadQualityChangeEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AudioDownloadQualityChange constant.
     *
     * @event
     * @since v4.0
     */
    AudioDownloadQualityChange = "audiodownloadqualitychange",
    /**
     * Is fired when the downloaded video quality has been changed successfully. It is (not necessarily directly)
     * preceded by an VideoDownloadQualityChange event.
     * The passed event is of type {@link VideoDownloadQualityChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VideoDownloadQualityChanged constant.
     *
     * @event
     * @since v7.0
     */
    VideoDownloadQualityChanged = "videodownloadqualitychanged",
    /**
     * Is fired when the downloaded audio quality has been changed successfully. It is (not necessarily directly)
     * preceded by an AudioDownloadQualityChange event.
     * The passed event is of type {@link AudioDownloadQualityChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AudioDownloadQualityChanged constant.
     *
     * @event
     * @since v7.0
     */
    AudioDownloadQualityChanged = "audiodownloadqualitychanged",
    /**
     * Is fired when the displayed video quality changed.
     * The passed event is of type {@link VideoPlaybackQualityChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VideoPlaybackQualityChanged constant.
     *
     *
     * @event
     * @since v7.0
     */
    VideoPlaybackQualityChanged = "videoplaybackqualitychanged",
    /**
     * Is fired when the played audio quality changed.
     * The passed event is of type {@link AudioPlaybackQualityChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AudioPlaybackQualityChanged constant.
     *
     * @event
     * @since v7.0
     */
    AudioPlaybackQualityChanged = "audioplaybackqualitychanged",
    /**
     * Is fired when the current playback time has changed.
     * The passed event is of type {@link PlaybackEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.TimeChanged constant.
     *
     * @event
     * @since v4.0
     */
    TimeChanged = "timechanged",
    /**
     * Is fired when a subtitle is parsed from a stream, manifest or subtitle file.
     * The passed event is of type {@link SubtitleCueParsedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CueParsed constant.
     *
     * @event
     * @since v7.6
     */
    CueParsed = "cueparsed",
    /**
     * Is fired when a subtitle entry transitions into the active status.
     * The passed event is of type {@link SubtitleCueEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CueEnter constant.
     *
     * @event
     * @since v4.0
     */
    CueEnter = "cueenter",
    /**
     * Is fired when either the start time, end time, or content of a cue changes.
     * The passed event is of type {@link SubtitleCueEvent}.
     *
     * For example, it is fired when a WebVTT cue contains timestamp tags:
     * ```
     * 00:00:00.000 --> 00:00:05.000
     * Welcome to the<00:00:02.000> Bitmovin Player!
     * ```
     * This would result in the following events:
     * - `t = 0`: {@link CueEnter}:
     * ```
     * {
     *   start: 0,
     *   end: 5,
     *   html: '<span>Welcome to the<span class="cue-future" style="visibility:hidden;"> Bitmovin Player!</span></span>',
     *   text: 'Welcome to the Bitmovin Player!',
     *   (...)
     * }
     * ```
     * - `t = 2`: {@link CueUpdate}:
     * ```
     * {
     *   start: 0,
     *   end: 5,
     *   html: '<span><span class="cue-past">Welcome to the</span> Bitmovin Player!</span>',
     *   text: 'Welcome to the Bitmovin Player!',
     *   (...)
     * }
     * ```
     * - `t = 5`: {@link CueExit}
     *
     * Note that the {@link SubtitleCueEvent.text} property does not change and always contains the full text content
     * of the cue.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CueUpdate constant.
     *
     * @event
     * @since v7.1
     */
    CueUpdate = "cueupdate",
    /**
     * Is fired when an active subtitle entry transitions into the inactive status.
     * The passed event is of type {@link SubtitleCueEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CueExit constant.
     *
     * @event
     * @since v4.0
     */
    CueExit = "cueexit",
    /**
     * Is fired when a segment is played back.
     * The passed event is of type {@link SegmentPlaybackEvent}.
     *
     * For HLS streams being played in the `native` player technology, the {@link TweaksConfig.native_hls_parsing}
     * option needs to be enabled to receive this event.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.SegmentPlayback constant.
     *
     * @event
     * @since v6.1
     */
    SegmentPlayback = "segmentplayback",
    /**
     * Is fired after metadata (i.e. ID3 tags in HLS and EMSG in DASH) is parsed and when currentTime
     * progresses to a point beyond the start of the metadata event.
     * The passed event is of type {@link MetadataEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Metadata constant.
     *
     * @event
     * @since v4.0
     */
    Metadata = "metadata",
    /**
     * Is fired as soon as metadata (i.e. ID3 tags in HLS and EMSG in DASH) is parsed.
     * The passed event is of type {@link MetadataParsedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.MetadataParsed constant.
     *
     * @event
     * @since v7.6
     */
    MetadataParsed = "metadataparsed",
    /**
     * Is fired when DateRange metadata content changes while the metadata is active.
     * The passed event is of type {@link MetadataChangedEvent}
     *
     * Also accessible via the `bitmovin.player.PlayerEvent.MetadataChanged` constant.
     *
     * @event
     * @since v8.5
     */
    MetadataChanged = "metadatachanged",
    /**
     * Is fired before a new video segment is downloaded.
     * The passed event is of type {@link VideoAdaptationEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VideoAdaptation constant.
     *
     * @event
     * @since v4.0
     */
    VideoAdaptation = "videoadaptation",
    /**
     * Is fired before a new audio segment is downloaded.
     * The passed event is of type {@link AudioAdaptationEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AudioAdaptation constant.
     *
     * @event
     * @since v4.0
     */
    AudioAdaptation = "audioadaptation",
    /**
     * Is fired immediately after a download finishes successfully, or if all retries of a download failed.
     * The passed event is of type {@link DownloadFinishedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.DownloadFinished constant.
     *
     * @event
     * @since v4.0
     */
    DownloadFinished = "downloadfinished",
    /**
     * Is fired when a segment download has been finished, whether successful or not.
     * The passed event is of type {@link SegmentRequestFinishedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.SegmentRequestFinished constant.
     *
     * @event
     * @since v6.0
     */
    SegmentRequestFinished = "segmentrequestfinished",
    /**
     * Is fired when the ad manifest has been successfully loaded.
     * The passed event is of type {@link AdManifestLoadedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdManifestLoaded constant.
     *
     * @event
     * @since v4.0
     */
    AdManifestLoaded = "admanifestloaded",
    /**
     * Is fired when the playback of an ad has been started.
     * The passed event is of type {@link AdEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdStarted constant.
     *
     * @event
     * @since v4.1
     */
    AdStarted = "adstarted",
    /**
     * Is fired when an overlay ad has been started.
     * The passed event is of type {@link AdEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.OverlayAdStarted constant.
     *
     * @event
     * @since v8.0
     */
    OverlayAdStarted = "overlayadstarted",
    /**
     * Is fired when the playback of an ad has progressed over a quartile boundary.
     * The passed event is of type {@link AdQuartileEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdQuartile constant.
     *
     * @event
     * @since v7.4.6
     */
    AdQuartile = "adquartile",
    /**
     * Is fired when an ad has been skipped.
     * The passed event is of type {@link AdEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdSkipped constant.
     *
     * @event
     * @since v4.1
     */
    AdSkipped = "adskipped",
    /**
     * Is fired when the user clicks on the ad.
     * The passed event is of type {@link AdClickedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdClicked constant.
     *
     * @event
     * @since v4.3
     */
    AdClicked = "adclicked",
    /**
     * Is fired when the user interacts with an ad. For now this is only fired if a VPAID `AdInteraction` event occurs.
     * The passed event is of type {@link AdInteractionEvent}.
     *
     * @event
     * @since v8.25.0
     */
    AdInteraction = "adinteraction",
    /**
     * Is fired when VPAID ad changes its linearity.
     * The passed event is of type {@link AdLinearityChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdLinearityChanged constant.
     *
     * @event
     * @since v6.0
     */
    AdLinearityChanged = "adlinearitychanged",
    /**
     * Is fired when the playback of an ad break has started. Several {@link AdStarted} and
     * {@link AdFinished} events can follow before the ad break closes with an
     * {@link AdBreakFinished} event.
     * The passed event is of type {@link AdBreakEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdBreakStarted constant.
     *
     * @event
     * @since v7.5.4
     */
    AdBreakStarted = "adbreakstarted",
    /**
     * Is fired when the playback of an ad break has ended. Is preceded by a @see {@link AdBreakStarted} event.
     * This event is currently only supported for the ad client typ 'ima'.
     * The passed event is of type {@link AdBreakEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdBreakFinished constant.
     *
     * @event
     * @since v7.5.4
     */
    AdBreakFinished = "adbreakfinished",
    /**
     * Is fired when the playback of an ad has been finished.
     * The passed event is of type {@link AdEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdFinished constant.
     *
     * @event
     * @since v4.1
     */
    AdFinished = "adfinished",
    /**
     * Is fired when ad playback fails.
     * The passed event is of type {@link ErrorEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.AdError constant.
     *
     * @event
     * @since v6.0
     */
    AdError = "aderror",
    /**
     * This event is fired when the VR viewing direction changes. The minimal interval between two consecutive event
     * callbacks is specified through {@link VR.PlayerVRAPI.setViewingDirectionChangeEventInterval}.
     * The passed event is of type {@link VRViewingDirectionChangeEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VRViewingDirectionChange constant.
     *
     * @event
     * @since v7.2
     */
    VRViewingDirectionChange = "vrviewingdirectionchange",
    /**
     * This event is fired when the VR viewing direction did not change more than the specified threshold in the last
     * interval, after the {@link VRViewingDirectionChange} event was triggered. The threshold can be set through
     * {@link VR.PlayerVRAPI.setViewingDirectionChangeThreshold}.
     * The passed event is of type {@link VRViewingDirectionChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VRViewingDirectionChanged constant.
     *
     * @event
     * @since v7.2
     */
    VRViewingDirectionChanged = "vrviewingdirectionchanged",
    /**
     * Is fired when the stereo mode during playback of VR content changes.
     * The passed event is of type {@link VRStereoChangedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.VRStereoChanged constant.
     *
     * @event
     * @since v6.0
     */
    VRStereoChanged = "vrstereochanged",
    /**
     * Is fired when casting to another device, such as a ChromeCast, is available.
     * The passed event is of type {@link CastAvailableEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CastAvailable constant.
     *
     * @event
     * @since v4.0
     */
    CastAvailable = "castavailable",
    /**
     * Is fired when the casting is stopped.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CastStopped constant.
     *
     * @event
     * @since v7.0
     */
    CastStopped = "caststopped",
    /**
     * Is fired when the casting has been initiated, but the user still needs to choose which device should be used.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CastStart constant.
     *
     * @event
     * @since v4.0
     */
    CastStart = "caststart",
    /**
     * Is fired when the Cast app is either launched successfully or an active Cast session is resumed successfully.
     * The passed event is of type {@link CastStartedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CastStarted constant.
     *
     * @event
     * @since v7.0
     */
    CastStarted = "caststarted",
    /**
     * Is fired when the user has chosen a cast device and the player is waiting for the device to get ready for
     * playback.
     * The passed event is of type {@link CastWaitingForDeviceEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.CastWaitingForDevice constant.
     *
     * @event
     * @since v4.0
     */
    CastWaitingForDevice = "castwaitingfordevice",
    /**
     * Is fired when a new source has finished loading.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.SourceLoaded constant.
     *
     * @event
     * @since v4.2
     */
    SourceLoaded = "sourceloaded",
    /**
     * Is fired when the current source has been unloaded.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.SourceUnloaded constant.
     *
     * @event
     * @since v4.2
     */
    SourceUnloaded = "sourceunloaded",
    /**
     * Is fired when a period switch starts.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.PeriodSwitch constant.
     *
     * @event
     * @since v6.2
     */
    PeriodSwitch = "periodswitch",
    /**
     * Is fired when a period switch was performed.
     * The passed event is of type {@link PeriodSwitchedEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.PeriodSwitched constant.
     *
     * @event
     * @since v4.0
     */
    PeriodSwitched = "periodswitched",
    /**
     * Is fired if the player is paused or in buffering state and the timeShift offset has exceeded the available
     * timeShift window.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.DVRWindowExceeded constant.
     *
     * @event
     * @since v4.0
     */
    DVRWindowExceeded = "dvrwindowexceeded",
    /**
     * Is fired when a new subtitles/captions track is added, for example using the addSubtitle API call or when
     * in-stream closed captions are encountered.
     * The passed event is of type {@link SubtitleEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.SubtitleAdded constant.
     *
     * @event
     * @since v4.0
     */
    SubtitleAdded = "subtitleadded",
    /**
     * Is fired when an external subtitle file has been removed so it is possible to update the controls accordingly.
     * The passed event is of type {@link SubtitleEvent}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.SubtitleRemoved constant.
     *
     * @event
     * @since v4.0
     */
    SubtitleRemoved = "subtitleremoved",
    /**
     * Is fired when the airplay playback target picker is shown.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * @event
     * @since v7.1
     */
    ShowAirplayTargetPicker = "showairplaytargetpicker",
    /**
     * Is fired when the airplay playback target turned available.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * @event
     * @since v7.1
     */
    AirplayAvailable = "airplayavailable",
    /**
     * Is fired when a media element starts or stops AirPlay playback.
     * The passed event is of type {@link AirplayChangedEvent}.
     *
     * @event
     * @since v7.8.4
     */
    AirplayChanged = "airplaychanged",
    /**
     * Is fired when the player instance is destroyed.
     * The passed event is of type {@link PlayerEventBase}.
     *
     * Also accessible via the bitmovin.player.PlayerEvent.Destroy constant.
     *
     * @event
     * @since v7.2
     */
    Destroy = "destroy",
    /**
     * Is fired when the playback speed is changed.
     * The passed event is of type {@link PlaybackSpeedChangedEvent}.
     *
     * @event
     * @since v7.8
     */
    PlaybackSpeedChanged = "playbackspeedchanged",
    /**
     * Is fired when the duration of a source changes. Is not fired for the initial duration of a source.
     * The passed event is of type {@link DurationChangedEvent}.
     *
     * @event
     * @since v8.19
     */
    DurationChanged = "durationchanged",
    /**
     * Is fired when the player's {@link ViewMode} is changed, e.g. with a call to {@link PlayerAPI.setViewMode}.
     * The passed event is of type {@link ViewModeChangedEvent}.
     *
     * @event
     * @since v8.0
     */
    ViewModeChanged = "viewmodechanged",
    /**
     * Is fired when a module exposes a public API and the API is ready to be used and available at
     * `playerInstance.{namespace}`, e.g. `player.vr` for the VR module.
     * The passed event is of type {@link ModuleReadyEvent}.
     *
     * @event
     * @since v8.0
     */
    ModuleReady = "moduleready",
    /**
     * Is fired when a subtitle is being enabled.
     * The passed event is of type {@link SubtitleEvent}.
     *
     * @event
     * @since v8.0
     */
    SubtitleEnable = "subtitleenable",
    /**
     * Is fired when a subtitle got enabled.
     * The passed event is of type {@link SubtitleEvent}.
     *
     * @event
     * @since v8.0
     */
    SubtitleEnabled = "subtitleenabled",
    /**
     * Is fired when a subtitle is being disabled.
     * The passed event is of type {@link SubtitleEvent}.
     *
     * @event
     * @since v8.0
     */
    SubtitleDisable = "subtitledisable",
    /**
     * Is fired when a subtitle got disabled.
     * The passed event is of type {@link SubtitleEvent}.
     *
     * @event
     * @since v8.0
     */
    SubtitleDisabled = "subtitledisabled",
    /**
     * Is fired when one ore more video representations have been added to the stream.
     * The passed event is of type {@link VideoQualityEvent}.
     *
     * @event
     * @since v8.2
     */
    VideoQualityAdded = "videoqualityadded",
    /**
     * Is fired when one ore more video representations have been removed from the stream.
     * The passed event is of type {@link VideoQualityEvent}.
     *
     * @event
     * @since v8.2
     */
    VideoQualityRemoved = "videoqualityremoved",
    /**
     * Is fired when one ore more audio representations have been added to the stream.
     * The passed event is of type {@link AudioQualityEvent}.
     *
     * @event
     * @since v8.2
     */
    AudioQualityAdded = "audioqualityadded",
    /**
     * Is fired when one ore more audio representations have been removed from the stream.
     * The passed event is of type {@link AudioQualityEvent}.
     *
     * @event
     * @since v8.2
     */
    AudioQualityRemoved = "audioqualityremoved",
    /**
     * Is fired when the target latency for playback of a live stream changes.
     * The passed event is of type {@link TargetLatencyChangedEvent}.
     * @event
     * @since v8.3
     */
    TargetLatencyChanged = "targetlatencychanged",
    /**
     * Is fired when the mode of the latency control mechanism changes.
     * The passed event is of type {@link LatencyModeChangedEvent}.
     * @event
     * @since v8.3
     */
    LatencyModeChanged = "latencymodechanged",
    /**
     * Is fired after the licence call succeeded and the license is valid.
     * The passed event is of type {@link LicenseValidatedEvent}.
     * @event
     * @since v8.10
     */
    LicenseValidated = "licensevalidated",
    /**
     * Is fired after a DRM license request has finished and the returned license has been added to the key session.
     * This event is not dispatched for FairPlay DRM.
     *
     * The passed event is of type {@link DrmLicenseAddedEvent}
     *
     * @event
     * @since 8.51
     */
    DrmLicenseAdded = "drmlicenseadded",
    /**
     * Is fired when the player's aspect ratio is changed, e.g. with a call to {@link PlayerAPI.setAspectRatio}.
     * The passed event is of type {@link AspectRatioChangedEvent}.
     *
     * @event
     * @since v8.74
     */
    AspectRatioChanged = "aspectratiochanged"
}
export interface PlayerEventBase {
    /**
     * The time at which this event was fired
     */
    timestamp: number;
    /**
     * Event type, e.g. 'play'
     */
    type: PlayerEvent;
}
/**
 * Events which can be triggered by user interaction as well as internally.
 * The issuer is to determine whether this was triggered internally ('api') or by the UI ('ui')
 */
export interface UserInteractionEvent extends PlayerEventBase {
    /**
     * The issuer of this event, as passed into the according API method. 'api' by default if no issuer was specified.
     *
     * @see {@link PlayerAPI.play}
     * @see {@link PlayerAPI.pause}
     * @see {@link PlayerAPI.seek}
     * @see {@link PlayerAPI.timeShift}
     * @see {@link PlayerAPI.setVolume}
     * @see {@link PlayerAPI.mute}
     * @see {@link PlayerAPI.unmute}
     */
    issuer?: string;
}
export interface PlaybackEvent extends PlayerEventBase, UserInteractionEvent {
    /**
     * Current playback time (in seconds)
     */
    time: number;
}
export interface SeekEvent extends UserInteractionEvent {
    /**
     * The current position (in seconds)
     */
    position: number;
    /**
     * The target position (in seconds)
     */
    seekTarget: number;
}
/**
 * Event to signal a timeshift event
 */
export interface TimeShiftEvent extends UserInteractionEvent {
    /**
     * The position from which we start the timeshift (currentTime before the timeshift)
     */
    position: number;
    /**
     * The position to which we want to jump for the timeshift ( currentTime after timeshift has completed)
     */
    target: number;
}
export interface VolumeChangedEvent extends UserInteractionEvent {
    /**
     * The volume before the event has been triggered
     */
    sourceVolume: number;
    /**
     * The new selected volume
     */
    targetVolume: number;
}
export interface PlayerResizedEvent extends PlayerEventBase {
    /**
     * new width (ex : "1920px")
     */
    width: string;
    /**
     * new height (ex : "1080px")
     */
    height: string;
}
export interface ErrorEvent extends PlayerEventBase {
    /**
     * The error code used to identify the occurred error
     */
    code: ErrorCode;
    /**
     * The name of the error
     */
    name: string;
    /**
     * The message associated with the error
     */
    message?: string;
    /**
     * Additional data
     */
    data?: {
        [key: string]: any;
    };
    /**
     * Unique source identifier string to distinguish the event per source
     * @hidden
     */
    sourceIdentifier?: string;
    /**
     * A link to a detailed troubleshooting guide for the current error event.
     */
    troubleShootLink: string;
}
export interface WarningEvent extends PlayerEventBase {
    /**
     * The warning code used to identify the occurred warning
     */
    code: WarningCode;
    /**
     * The warning name to explain the reason for the warning
     */
    name: string;
    /**
     * The warning message to explain the reason for the warning
     */
    message: string;
    /**
     * Additional data
     */
    data: {
        [key: string]: any;
    };
}
export interface AudioChangedEvent extends PlaybackEvent {
    /**
     * Previous audio track or null if no audio track was enabled before
     */
    sourceAudio: AudioTrack | null;
    /**
     * New audio track
     */
    targetAudio: AudioTrack;
}
export interface AirplayChangedEvent extends PlaybackEvent {
    /**
     * Airplay status
     */
    airplayEnabled: boolean;
}
export interface AudioTrackEvent extends PlaybackEvent {
    /**
     * The affected audio track
     */
    track: AudioTrack;
}
export interface MediaQualityChangeEvent<Q extends Quality> extends PlayerEventBase {
    /**
     * Previous quality or null if no quality was set before.
     */
    sourceQuality?: Q | null;
    /**
     * ID of the previous quality or null if no quality was set before.
     */
    sourceQualityId: string | null;
    /**
     * New quality
     */
    targetQuality?: Q;
    /**
     * ID of the new quality.
     */
    targetQualityId: string;
}
export interface DrmKidErrorEvent extends PlayerEventBase {
    affectedKid: string;
}
export interface VideoDownloadQualityChangeEvent extends MediaQualityChangeEvent<VideoQuality> {
}
export interface AudioDownloadQualityChangeEvent extends MediaQualityChangeEvent<AudioQuality> {
}
export interface VideoDownloadQualityChangedEvent extends MediaQualityChangeEvent<VideoQuality> {
}
export interface AudioDownloadQualityChangedEvent extends MediaQualityChangeEvent<AudioQuality> {
}
export interface MediaPlaybackQualityChangeEvent<Q extends Quality> extends PlayerEventBase {
    /**
     * Previous quality
     */
    sourceQuality: Q;
    /**
     * New quality
     */
    targetQuality: Q;
}
export interface VideoPlaybackQualityChangedEvent extends MediaPlaybackQualityChangeEvent<VideoQuality> {
}
export interface AudioPlaybackQualityChangedEvent extends MediaPlaybackQualityChangeEvent<AudioQuality> {
}
export interface VideoQualityChangedEvent extends MediaQualityChangeEvent<VideoQuality> {
}
export interface AudioQualityChangedEvent extends MediaQualityChangeEvent<AudioQuality> {
}
export interface TimeChangedEvent extends PlaybackEvent {
    /**
     * Current absolute time in seconds
     * Only available on safari native player
     * @hidden
     */
    relativeTime?: number;
}
export interface SegmentPlaybackEvent extends PlayerEventBase {
    /**
     * segment URL
     */
    url: string;
    /**
     * segment Unique ID
     */
    uid: string;
    /**
     * media mime type
     */
    mimeType: string;
    /**
     * Playback time of the segment in seconds
     */
    playbackTime: number;
    /**
     * UTC wall-clock time in milliseconds for the segment's presentation in case of a live stream.
     */
    wallClockTime: number;
    /**
     * Playback time encoded in the segment
     */
    presentationTimestamp: number;
    /**
     * segment duration
     */
    duration: number;
    /**
     * coding parameters
     */
    mediaInfo: {
        bitrate?: number;
        sampleRate?: number;
        frameRate?: number;
        width?: number;
        height?: number;
    };
    /**
     * optional time string, based on the `#EXT-X-PROGRAM-DATE-TIME` HLS tag.
     */
    dateTime?: string;
    /**
     * ID of the representation this segment belongs to
     */
    representationId: string;
    /**
     * optional number based on `#EXT-X-DISCONTINUITY-SEQUENCE` and `#EXT-X-DISCONTINUITY` HLS tags
     */
    discontinuitySequenceNumber?: number;
    /**
     * optional experimental data
     */
    EXPERIMENTAL?: {
        /**
         * A list of all custom HLS tags that are associated to this segment. Global custom HLS tags are associated to the
         * first segment. Custom tags in master playlists are not parsed.
         */
        hlsAttributes?: string[];
    };
}
export interface DurationChangedEvent extends PlayerEventBase {
    /**
     * The duration before the change happened.
     */
    from: number;
    /**
     * The duration after the change happened.
     */
    to: number;
}
export interface PlaybackSpeedChangedEvent extends PlayerEventBase {
    /**
     * The playback speed before the change happened.
     */
    from: number;
    /**
     * The playback speed after the change happened.
     */
    to: number;
}
export interface PeriodSwitchObject {
    periodId: string;
}
export interface PeriodSwitchedEvent extends PlayerEventBase {
    sourcePeriod: PeriodSwitchObject;
    targetPeriod: PeriodSwitchObject;
}
/**
 * The supported types of timed metadata.
 */
export declare enum MetadataType {
    /**
     * HLS `#EXT-X-CUE-OUT`, `#EXT-X-CUE-OUT-CONT` and `#EXT-X-CUE-IN` tags are surfaced with this type.
     */
    CUETAG = "CUETAG",
    /**
     * HLS `#EXT-X-DATERANGE` tags are surfaced with this type.
     */
    DATERANGE = "DATERANGE",
    /**
     * DASH `EventStream` events (also known as `MPD Events`) are surfaced with this type.
     */
    EVENT_STREAM = "EVENT-STREAM",
    /**
     * All custom, i.e. unknown/unsupported HLS tags are surfaced with this type.
     */
    CUSTOM = "CUSTOM",
    /**
     * HLS `#EXT-X-SCTE35` tags are surfaced with this type.
     */
    SCTE = "SCTE",
    /**
     * ID3 tags from MPEG-2 Transport Stream container formats are surfaced with this type.
     * See {@link MetadataType.EMSG} for the MP4 equivalent.
     */
    ID3 = "ID3",
    /**
     * EMSG data from MP4 container formats are surfaced with this type.
     * See {@link MetadataType.ID3} for the MPEG-2 TS equivalent.
     *
     * @since v8.81.0 EMSG version 1 is also supported, prior to v8.81.0 only version 0 was supported.
     */
    EMSG = "EMSG",
    /**
     * Used for custom messages between the sender and the remote receiver, such as a Chromecast receiver app.
     * Refer to {@link PlayerAPI.addMetadata} for details.
     */
    CAST = "CAST"
}
export interface MetadataEvent extends PlayerEventBase {
    /**
     * The type of the published metadata. See {@link MetadataType} for details of the different MetadataType values.
     */
    metadataType: MetadataType;
    /**
     * The metadata object as encountered in the stream.
     */
    metadata: Object;
    /**
     * The start time of the event.
     */
    start?: number;
    /**
     * The end time of the event.
     */
    end?: number;
}
export interface MetadataChangedEvent extends MetadataEvent {
}
export interface MetadataParsedEvent extends MetadataEvent {
    /**
     * @deprecated It is recommended to use {@link MetadataParsedEvent.metadata}.
     */
    data: Object;
    /**
     * ID of the period / discontinuity the metadata is originating.
     * @hidden
     */
    periodId?: string;
}
export interface AdaptationEvent extends PlayerEventBase {
    /**
     * The id of the suggested representation
     */
    representationID: string;
}
export interface VideoAdaptationEvent extends AdaptationEvent {
}
export interface AudioAdaptationEvent extends AdaptationEvent {
}
export interface DownloadFinishedEvent extends PlayerEventBase {
    /**
     * The HTTP status code of the request. Status code 0 means a network or CORS error happened.
     */
    httpStatus: number;
    /**
     * Indicates whether the request was successful (true) or failed (false).
     */
    success: boolean;
    /**
     * The URL of the request.
     */
    url: string;
    /**
     * The time needed to finish the request.
     */
    downloadTime: number;
    /**
     * The size of the downloaded data, in bytes.
     */
    size: number;
    /**
     * Most requests are re-tried a few times if they fail. This marks how many attempts have been made.
     * Starts at 1.
     */
    attempt: number;
    /**
     * Most requests are re-tried a few times if they fail. This marks the maximum amount of tries to
     * fulfill the request.
     */
    maxAttempts: number;
    /**
     * Specifies which type of request this was. Valid types are currently manifest, media, and
     * license (for DRM license requests).
     */
    downloadType: HttpRequestType;
    /**
     * The time-to-first-byte for this request in seconds.
     */
    timeToFirstByte: number;
    /**
     * The MIME type of the downloaded data.
     */
    mimeType: string;
}
export interface SegmentRequestFinishedEvent extends PlayerEventBase {
    /**
     * The HTTP status code of the request. Status code 0 means a network or CORS error happened.
     */
    httpStatus: number;
    /**
     * Indicates whether the request was successful (true) or failed (false).
     */
    success: boolean;
    /**
     * The URL of the request.
     */
    url: string;
    /**
     * The time needed to finish the request.
     */
    downloadTime: number;
    /**
     * The time-to-first-byte for this request in seconds.
     * Returns -1 in case no bytes were received, i.e. the request has been cancelled before receiving the headers.
     */
    timeToFirstByte: number;
    /**
     * The size of the downloaded data, in bytes.
     */
    size: number;
    /**
     * The expected size of the segment in seconds.
     */
    duration: number;
    /**
     * The mimeType of the segment
     */
    mimeType: string;
    /**
     * The Unique ID of the downloaded segment
     */
    uid: string;
    /**
     * Indicates whether the segment is an init segment (true) or not (false).
     */
    isInit: boolean;
}
export interface AdBreakEvent extends PlayerEventBase {
    adBreak: AdBreak;
}
export interface AdManifestLoadedEvent extends AdBreakEvent {
    adConfig: AdConfig;
    downloadTiming: DownloadTiming;
}
export interface AdEvent extends PlayerEventBase {
    ad: Ad;
}
export declare enum AdQuartile {
    FIRST_QUARTILE = "firstQuartile",
    MIDPOINT = "midpoint",
    THIRD_QUARTILE = "thirdQuartile"
}
export interface AdQuartileEvent extends PlayerEventBase {
    /**
     * Quartile that has already been watched by the user.
     */
    quartile: AdQuartile;
}
export interface AdClickedEvent extends PlayerEventBase {
    /**
     * The click through url of the ad
     */
    clickThroughUrl: string;
}
export interface AdInteractionEvent extends PlayerEventBase {
    /**
     * Interaction id
     */
    id?: string;
    /**
     * Interaction type
     */
    interactionType: AdInteractionType;
}
export declare enum AdInteractionType {
    Vpaid = "vpaid"
}
export interface AdLinearityChangedEvent extends PlayerEventBase {
    /**
     * True if the ad is linear
     */
    isLinear: boolean;
}
export interface CastAvailableEvent extends PlayerEventBase {
    /**
     * True if receivers have been detected on the network or if the remote implementation cannot detect receivers.
     * False if no receivers have been detected or receivers went offline.
     * @since 7.5.3
     */
    receiverAvailable: boolean;
}
export interface CastWaitingForDeviceEvent extends PlayerEventBase {
    castPayload: {
        currentTime: number;
        deviceName: string;
        timestamp: number;
        type: string;
    };
}
export interface CastStartedEvent extends PlayerEventBase {
    /**
     * Friendly name of the connected remote Cast device
     */
    deviceName: string;
    /**
     * True if an existing session is resumed, false if a new session has been established
     */
    resuming: boolean;
}
export interface SubtitleEvent extends PlayerEventBase {
    subtitle: SubtitleTrack;
}
export interface MediaQualityEvent<Q extends Quality> extends PlayerEventBase {
    quality: Q;
}
export interface AudioQualityEvent extends MediaQualityEvent<AudioQuality> {
}
export interface VideoQualityEvent extends MediaQualityEvent<VideoQuality> {
}
export interface VRStereoChangedEvent extends PlayerEventBase {
    /**
     * True if the player is in stereo mode, false otherwise
     */
    stereo: boolean;
}
export interface VRViewingDirectionChangeEvent extends PlayerEventBase {
    direction: ViewingDirection;
}
export interface VRViewingDirectionChangedEvent extends VRViewingDirectionChangeEvent {
}
/**
 * Event which is fired when a subtitle cue
 * - should be shown ({@link PlayerEvent.CueEnter})
 * - changes ({@link PlayerEvent.CueUpdate})
 * - should be hidden ({@link PlayerEvent.CueExit})
 */
export interface SubtitleCueEvent extends PlayerEventBase {
    /**
     * The id of the associated subtitle track defined in {@link SubtitleTrack.id}
     */
    subtitleId: string;
    /**
     * The playback time when the subtitle should be rendered
     *
     * @see {@link PlayerAPI.getCurrentTime}
     */
    start: number;
    /**
     * The playback time when the subtitle should be hidden
     *
     * @see {@link PlayerAPI.getCurrentTime}
     */
    end: number;
    /**
     * The textual content of this subtitle
     */
    text: string;
    /**
     * The textual content prepared to be put into a html element
     */
    html?: string;
    /**
     * Data-URL containing the image data.
     */
    image?: string;
    /**
     * The region in which the subtitle should be displayed.
     * Will be filled with information of the region attribute in TTML subtitle cues
     */
    region?: string;
    /**
     * The style information of the region in which this subtitle should be displayed.
     * Will be filled with the style information provided in the head of the TTML document if it matches the current
     * cue's region attribute.
     */
    regionStyle?: string;
    /**
     * Only relevant for CEA-captions, provides information about where the cue should be positioned on a grid of
     * 15 character rows times 32 columns.
     * See https://dvcs.w3.org/hg/text-tracks/raw-file/default/608toVTT/608toVTT.html#positioning-in-cea-608
     * for detailed explanation.
     */
    position?: SubtitleCuePosition;
    /**
     * Options for WebVTT subtitle styling and positioning, including region settings.
     */
    vtt?: VTTProperties;
}
/**
 * Positioning information for CEA captions.
 */
export interface SubtitleCuePosition {
    /**
     * Number of the row (range from 0 to 14)
     */
    row: number;
    /**
     * Number of the column (range from 0 to 31)
     */
    column: number;
}
export interface SubtitleCueParsedEvent extends SubtitleCueEvent {
    /**
     * @hidden
     */
    periodId: string;
}
export interface ViewModeChangedEvent extends PlayerEventBase {
    from: ViewMode;
    to: ViewMode;
    legacy: boolean;
}
export interface ModuleReadyEvent extends PlayerEventBase {
    name: ModuleName;
}
export interface TargetLatencyChangedEvent extends PlayerEventBase {
    from: number;
    to: number;
}
export declare enum LatencyMode {
    /**
     * The player is playing at the target latency.
     */
    Idle = "idle",
    /**
     * The player is behind the target latency and performing catchup.
     */
    Catchup = "catchup",
    /**
     * The player is ahead of the target latency and performing fallback.
     */
    Fallback = "fallback",
    /**
     * Controlling the latency is temporarily disabled due to not playing at the live edge or a user-defined
     * playback speed (i.e. unequal to 1) being set.
     */
    Suspended = "suspended"
}
export interface LatencyModeChangedEvent extends PlayerEventBase {
    from: LatencyMode;
    to: LatencyMode;
}
export interface LicenseValidatedEvent extends PlayerEventBase {
    /**
     * Additional data provided via the licensing backend
     */
    data: {
        [key: string]: any;
    };
}
export interface DrmLicenseAddedEvent extends PlayerEventBase {
    /**
     * Information about the license which just became active.
     */
    license: DrmLicense;
}
export interface AspectRatioChangedEvent extends PlayerEventBase {
    /**
     * The previously set aspect ratio of the player.
     */
    from: number;
    /**
     * The newly set aspect ratio of the player.
     */
    to: number;
}
export interface DrmLicense {
    id: string;
    keySystemString: string;
    keyIds: string[];
}
/**
 * @hidden
 * TypeDoc does not support computed properties yet so we hide this for now. Once they are supported, we can replace
 * the manual mappings in the {@link PlayerEvent} docs ("The passed event is of type ...") with this map.
 *
 * https://github.com/TypeStrong/typedoc/issues/941
 */
export interface PlayerEventMap {
    [PlayerEvent.Ready]: PlayerEventBase;
    [PlayerEvent.Play]: PlaybackEvent;
    [PlayerEvent.Playing]: PlaybackEvent;
    [PlayerEvent.Paused]: PlaybackEvent;
    [PlayerEvent.Seek]: SeekEvent;
    [PlayerEvent.Seeked]: PlayerEventBase;
    [PlayerEvent.TimeShift]: TimeShiftEvent;
    [PlayerEvent.TimeShifted]: TimeShiftEvent;
    [PlayerEvent.VolumeChanged]: VolumeChangedEvent;
    [PlayerEvent.Muted]: UserInteractionEvent;
    [PlayerEvent.Unmuted]: UserInteractionEvent;
    [PlayerEvent.PlayerResized]: PlayerResizedEvent;
    [PlayerEvent.PlaybackFinished]: PlaybackEvent;
    [PlayerEvent.Error]: ErrorEvent;
    [PlayerEvent.Warning]: WarningEvent;
    [PlayerEvent.StallStarted]: PlayerEventBase;
    [PlayerEvent.StallEnded]: PlayerEventBase;
    [PlayerEvent.AudioChanged]: AudioChangedEvent;
    [PlayerEvent.AudioAdded]: AudioTrackEvent;
    [PlayerEvent.AudioRemoved]: AudioTrackEvent;
    [PlayerEvent.VideoQualityChanged]: VideoQualityChangedEvent;
    [PlayerEvent.AudioQualityChanged]: AudioQualityChangedEvent;
    [PlayerEvent.VideoDownloadQualityChange]: VideoDownloadQualityChangeEvent;
    [PlayerEvent.AudioDownloadQualityChange]: AudioDownloadQualityChangeEvent;
    [PlayerEvent.VideoDownloadQualityChanged]: VideoDownloadQualityChangedEvent;
    [PlayerEvent.AudioDownloadQualityChanged]: AudioDownloadQualityChangedEvent;
    [PlayerEvent.VideoPlaybackQualityChanged]: VideoPlaybackQualityChangedEvent;
    [PlayerEvent.AudioPlaybackQualityChanged]: AudioPlaybackQualityChangedEvent;
    [PlayerEvent.TimeChanged]: PlaybackEvent;
    [PlayerEvent.CueParsed]: SubtitleCueParsedEvent;
    [PlayerEvent.CueEnter]: SubtitleCueEvent;
    [PlayerEvent.CueUpdate]: SubtitleCueEvent;
    [PlayerEvent.CueExit]: SubtitleCueEvent;
    [PlayerEvent.SegmentPlayback]: SegmentPlaybackEvent;
    [PlayerEvent.Metadata]: MetadataEvent;
    [PlayerEvent.MetadataParsed]: MetadataParsedEvent;
    [PlayerEvent.MetadataChanged]: MetadataChangedEvent;
    [PlayerEvent.VideoAdaptation]: VideoAdaptationEvent;
    [PlayerEvent.AudioAdaptation]: AudioAdaptationEvent;
    [PlayerEvent.DownloadFinished]: DownloadFinishedEvent;
    [PlayerEvent.SegmentRequestFinished]: SegmentRequestFinishedEvent;
    [PlayerEvent.AdManifestLoaded]: AdManifestLoadedEvent;
    [PlayerEvent.AdStarted]: AdEvent;
    [PlayerEvent.OverlayAdStarted]: AdEvent;
    [PlayerEvent.AdQuartile]: AdQuartileEvent;
    [PlayerEvent.AdSkipped]: AdEvent;
    [PlayerEvent.AdClicked]: AdClickedEvent;
    [PlayerEvent.AdInteraction]: AdInteractionEvent;
    [PlayerEvent.AdLinearityChanged]: AdLinearityChangedEvent;
    [PlayerEvent.AdBreakStarted]: AdBreakEvent;
    [PlayerEvent.AdBreakFinished]: AdBreakEvent;
    [PlayerEvent.AdFinished]: AdEvent;
    [PlayerEvent.AdError]: ErrorEvent;
    [PlayerEvent.VRViewingDirectionChange]: VRViewingDirectionChangeEvent;
    [PlayerEvent.VRViewingDirectionChanged]: VRViewingDirectionChangedEvent;
    [PlayerEvent.VRStereoChanged]: VRStereoChangedEvent;
    [PlayerEvent.CastAvailable]: CastAvailableEvent;
    [PlayerEvent.CastStopped]: PlayerEventBase;
    [PlayerEvent.CastStart]: PlayerEventBase;
    [PlayerEvent.CastStarted]: CastStartedEvent;
    [PlayerEvent.CastWaitingForDevice]: CastWaitingForDeviceEvent;
    [PlayerEvent.SourceLoaded]: PlayerEventBase;
    [PlayerEvent.SourceUnloaded]: PlayerEventBase;
    [PlayerEvent.PeriodSwitch]: PlayerEventBase;
    [PlayerEvent.PeriodSwitched]: PeriodSwitchedEvent;
    [PlayerEvent.DVRWindowExceeded]: PlayerEventBase;
    [PlayerEvent.SubtitleAdded]: SubtitleEvent;
    [PlayerEvent.SubtitleRemoved]: SubtitleEvent;
    [PlayerEvent.ShowAirplayTargetPicker]: PlayerEventBase;
    [PlayerEvent.AirplayAvailable]: PlayerEventBase;
    [PlayerEvent.AirplayChanged]: AirplayChangedEvent;
    [PlayerEvent.Destroy]: PlayerEventBase;
    [PlayerEvent.PlaybackSpeedChanged]: PlaybackSpeedChangedEvent;
    [PlayerEvent.DurationChanged]: DurationChangedEvent;
    [PlayerEvent.ViewModeChanged]: ViewModeChangedEvent;
    [PlayerEvent.ModuleReady]: ModuleReadyEvent;
    [PlayerEvent.SubtitleEnable]: SubtitleEvent;
    [PlayerEvent.SubtitleEnabled]: SubtitleEvent;
    [PlayerEvent.SubtitleDisable]: SubtitleEvent;
    [PlayerEvent.SubtitleDisabled]: SubtitleEvent;
    [PlayerEvent.VideoQualityAdded]: VideoQualityEvent;
    [PlayerEvent.VideoQualityRemoved]: VideoQualityEvent;
    [PlayerEvent.AudioQualityAdded]: AudioQualityEvent;
    [PlayerEvent.AudioQualityRemoved]: AudioQualityEvent;
    [PlayerEvent.TargetLatencyChanged]: TargetLatencyChangedEvent;
    [PlayerEvent.LatencyModeChanged]: LatencyModeChangedEvent;
    [PlayerEvent.LicenseValidated]: LicenseValidatedEvent;
    [PlayerEvent.DrmLicenseAdded]: DrmLicenseAddedEvent;
    [PlayerEvent.AspectRatioChanged]: AspectRatioChangedEvent;
}
