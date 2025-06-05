import type { AdvertisingConfig } from '../advertising/ConfigAPI';
import type { DRMConfig } from '../drm/ConfigAPI';
import type { GoogleCastRemoteControlConfig as InternalGoogleCastRemoteControlConfig } from '../remotecontrol/GoogleCastRemoteControlConfig';
import type { WebSocketRemoteControlConfig as InternalWebSocketRemoteControlConfig } from '../remotecontrol/WebSocketRemoteControlConfig';
import type { SubtitleTrack } from '../subtitles/API';
import type { VRConfig } from '../vr/ConfigAPI';
import type { HttpHeaders, NetworkConfig } from './NetworkAPI';
import type { LogCallback, LogLevel, PlayerEventCallback, Technology } from './PlayerAPI';
export interface ProgressiveSourceConfig {
    /**
     * The URL to the progressive video file.
     */
    url: string;
    /**
     * The MIME type of the video file, e.g. “video/mp4” or “video/webm”.
     */
    type?: string;
    /**
     * Can be used to specify which bitrate the a progressive source has. Providing multiple progressive
     * sources with different bitrates allows the users to manually select qualities.
     * Please note that no automatic quality switching will happen.
     */
    bitrate?: number;
    /**
     * Sets the source/quality which the player will use per default. Should be set to `true` at only one object
     * within the progressive array. If no element has set this attribute to `true`, the first object in the array
     * will be used per default.
     */
    preferred?: boolean;
    /**
     * Specifies the label to be displayed in the quality selection in the player’s settings window.
     */
    label?: string;
}
export interface SourceConfigOptions {
    /**
     * Send credentials and cookies along with cross origin manifest (HLS and MPEG-DASH) requests.
     * Must be supported by the server. Default is `false`.
     */
    manifestWithCredentials?: boolean;
    /**
     * Send credentials and cookies along with cross origin (HLS and MPEG-DASH) segment requests.
     * Must be supported by the server. Default is `false`.
     */
    withCredentials?: boolean;
    /**
     * Send credentials and cookies along with cross origin HLS manifest requests.
     * Must be supported by the server. Default is `false`.
     */
    hlsManifestWithCredentials?: boolean;
    /**
     * Send credentials and cookies along with cross origin HLS segment requests.
     * Must be supported by the server. Default is `false`.
     */
    hlsWithCredentials?: boolean;
    /**
     * Send credentials and cookies along with cross origin MPEG-DASH manifest requests.
     * Must be supported by the server. Default is `false`.
     */
    dashManifestWithCredentials?: boolean;
    /**
     * Send credentials and cookies along with cross origin MPEG-DASH segment requests.
     * Must be supported by the server. Default is `false`.
     */
    dashWithCredentials?: boolean;
    /**
     * If set to `true`, this will keep the poster image visible during playback, e.g. for audio-only streams.
     */
    persistentPoster?: boolean;
    /**
     * The position in fractional seconds to start playback from.
     * @since 7.1
     * @deprecated use StartOffset instead
     */
    startTime?: number;
    /**
     * The position where the stream should be started. Number can be positive or negative depending on the used
     * {@link TimelineReferencePoint}. Invalid numbers will be corrected according to the stream boundaries. For VOD this
     * is applied at the time the stream is loaded, for LIVE when the playback starts.
     *
     * Example:
     * ```js
     * // Start a VOD stream at 10.5 seconds
     * {
     *  startOffset: 10.5,
     *  startOffsetTimelineReference: TimelineReferencePoint.Start // also the default value
     * }
     *
     * // Start a LIVE stream 20 seconds behind the live edge
     * {
     *   startOffset: -20,
     *   startOffsetTimelineReference: TimelineReferencePoint.End // also the default value
     * }
     * ```
     *
     * @since 8.9.0
     */
    startOffset?: number;
    /**
     * Timeline reference point to calculate {@link SourceConfigOptions.startOffset} from.
     * Default for live: `TimelineReferencePoint.End`
     * Default for VOD: `TimelineReferencePoint.Start`
     */
    startOffsetTimelineReference?: TimelineReferencePoint;
    /**
     * Specify the priority of audio codecs for this source. If more than one audio codec is available this order will
     * be respected while finding a codec which is supported by the current browser. Default is
     * {@link PlaybackConfig.audioCodecPriority}
     * @since 7.6
     */
    audioCodecPriority?: string[];
    /**
     * Specify the priority of video codecs for this source. If more than one video codec is available this order will
     * be respected while finding a codec which is supported by the current browser. Default is
     * {@link PlaybackConfig.videoCodecPriority}
     * @since 7.6
     */
    videoCodecPriority?: string[];
    headers?: HttpHeaders;
    /**
     * With this callback it's possible to override the player's default behavior regarding the recreation of
     * SourceBuffers when switching periods.
     *
     * The downside of SourceBuffer recreation is a prolonged transition time with possible black frames between the
     * periods. The upside is increased stability: not recreating SourceBuffers may result in
     * `PLAYBACK_VIDEO_DECODING_ERROR`, or a stuck video element on many platforms. This also depends on the playing
     * content itself.
     *
     * The Bitmovin player is taking a fairly offensive approach on SourceBuffer recreation, meaning it will recreate
     * the SourceBuffers when there is any risk that the content might get stuck.
     *
     * @param sourcePeriodInfo The information of the period the player is switching away from.
     * @param targetPeriodInfo The information of the period the player is switching into.
     * @param suggestion The default behavior suggested by the player, `true` for recreation, `false` for reusing.
     * @return `true` for SourceBuffer recreation, `false` for re-using.
     * @since 8.87.0
     */
    shouldRecreateSourceBuffersOnPeriodSwitch?: (sourcePeriodInfo: PeriodInformation, targetPeriodInfo: PeriodInformation, suggestion: boolean) => boolean;
}
/**
 * Information about a period that is relevant for the decision on whether to recreate SourceBuffers or not.
 */
export interface PeriodInformation {
    /**
     * The ID of the period.
     */
    periodId: string;
    /**
     * Information about the content of the period, one entry per available track.
     */
    contentInformation: PeriodContentInformation[];
}
/**
 * Content information about one track inside the Period.
 */
export interface PeriodContentInformation {
    /**
     * The codec of the content.
     */
    codec: string;
    /**
     * The mime type of the content, expressed in the format `content-type/container-format` (e.g. `video/mp4`).
     */
    mimeType: string;
    /**
     * Whether the content is DRM-protected.
     */
    isDrmProtected: boolean;
}
export declare enum TimelineReferencePoint {
    /**
     * `startOffset` will be calculated from the beginning of the stream or DVR window.
     */
    Start = "start",
    /**
     * `startOffset` will be calculated from the end of the stream or the live edge in case of a live stream with DVR
     * window.
     */
    End = "end",
    /**
     * Specify the default starting point for live(same as End) or VOD(same as Start).
     *
     * @hidden - not implemented yet
     */
    CurrentTime = "currenttime"
}
export interface ThumbnailTrack {
    /**
     * The URL to the associated file.
     */
    url: string;
}
export interface TrackMetadata {
    /**
     * Unique identifier of the track.
     */
    id?: string;
    /**
     * Mime type of the track.
     */
    mimeType?: string;
    /**
     * Language of the track. Only applicable for audio and subtitles, otherwise `undefined`.
     */
    lang?: string;
}
export interface QualityMetadata {
    /**
     * Unique identifier of the quality.
     */
    id: string;
    /**
     * Mime type of the quality.
     */
    mimeType: string;
    /**
     * Bitrate of the quality.
     */
    bitrate: number;
    /**
     * Width of the quality. Only applicable for video tracks, otherwise `undefined`.
     */
    width: number;
    /**
     * Height of the quality. Only applicable for video tracks, otherwise `undefined`.
     */
    height: number;
    /**
     * The quality ranking as given in the manifest. `undefined` if not present.
     */
    qualityRanking?: number;
    /**
     * Frame rate of the quality. Only applicable for video tracks, otherwise `undefined`.
     */
    frameRate?: number;
}
/**
 * An object with callback functions to provide labels for audio tracks, qualities and subtitle tracks.
 */
export interface SourceLabelingConfig {
    /**
     * A function that generates a label for a track, usually an audio track.
     * @param track Object with metadata about the track for which the label should be generated. The id field is
     *   populated when used for HLS, the mimeType when used for DASH.
     */
    tracks?: (track: TrackMetadata) => string;
    /**
     * A function that generates a label for a quality, usually a video quality.
     * @param quality Object with metadata about the quality for which the label should be generated.
     */
    qualities?: (quality: QualityMetadata) => string;
    /**
     * A function that generates a label for a subtitle.
     * @param subtitle The subtitle for which the label should be generated.
     */
    subtitles?: (subtitle: SubtitleTrack) => string;
}
/**
 * The source object is passed into {@link PlayerAPI.load} to load a new source.
 *
 * Example:
 * ```js
 * player.load({
 *   dash: 'http://path/to/mpd/file.mpd',
 *   hls: 'http://path/to/hls/playlist/file.m3u8',
 *   progressive: [{
 *     url: 'http://path/to/mp4',
 *     type: 'video/mp4',
 *     bitrate: 500000,
 *     label: 'Low'
 *   }, {
 *     url: 'http://path/to/another-mp4',
 *     type: 'video/mp4',
 *     bitrate: 1000000,
 *     label: 'Mid'
 *     preferred: true
 *   }, {
 *     url: 'http://path/to/another-mp4',
 *     type: 'video/mp4',
 *     bitrate: 2500000,
 *     label: 'High'
 *   }],
 *   poster: 'images/poster.jpg',
 *   subtitleTracks: [{
 *     url: 'http://path/to/subtitles/vtt/file.vtt',
 *     id: 'track-0',
 *     lang: 'en'
 *   }],
 *   thumbnailTrack: {
 *     url: 'http://path/to/thumbnail/vtt/file.vtt',
 *   },
 *   drm: {
 *     widevine: {
 *       LA_URL: 'https://mywidevine.licenseserver.com/'
 *     },
 *     playready: {
 *       LA_URL: 'https://myplayready.licenseserver.com/'
 *     }
 *   },
 *   labeling: {
 *     hls: {
 *       qualities: (quality) => {
 *         return quality.height + 'p';
 *       }
 *     },
 *     dash: {
 *       qualities: (quality) => {
 *         return quality.height + 'p';
 *       }
 *     }
 *   }
 * });
 * ```
 */
export interface SourceConfig {
    /**
     * The URL to the MPEG-DASH manifest file (MPD, Media Presentation Description) for the video to play.
     * The file has to be a valid MPD.
     */
    dash?: string;
    /**
     * An URL to an HLS playlist file (M3U8). The file has to be a valid M3U8 playlist.
     */
    hls?: string;
    /**
     * An Array of objects to video files, used for progressive download as fallback. Is only used when all
     * other methods fail. Multiple progressive files can be used, e.g. .mp4 and .webm files to support as
     * many browsers as possible.
     */
    progressive?: string | ProgressiveSourceConfig[];
    /**
     * An URL to a SmoothStreaming manifest file (xml or ismc). The file has to be a valid smooth streaming manifest
     * file.
     */
    smooth?: string;
    /**
     * An URL pointing to a WHEP endpoint.
     */
    whep?: string;
    /**
     * The URL to a preview image displayed until the video starts. Make sure JavaScript is allowed
     * to access it, i.e. CORS (for the HTML5/JavaScript player) must be enabled and a crossdomain.xml has to
     * be there if it’s not the same server as the website.
     */
    poster?: string;
    /**
     * The DRM object should be included into the source object.
     */
    drm?: DRMConfig;
    /**
     * An object specifying advanced source specific options.
     */
    options?: SourceConfigOptions;
    /**
     * An array of external subtitle tracks.
     */
    subtitleTracks?: SubtitleTrack[];
    /**
     * A thumbnail track.
     * Note: An externally set thumbnail track has precedence over thumbnail tracks found in the stream itself.
     */
    thumbnailTrack?: ThumbnailTrack;
    /**
     * Configuration for VR and omnidirectional (360°) video.
     */
    vr?: VRConfig;
    /**
     * The title of the video source.
     */
    title?: string;
    /**
     * The description of the video source.
     */
    description?: string;
    /**
     * Labeling config for the different stream types.
     */
    labeling?: SourceLabelingStreamTypeConfig;
    /**
     * Bitmovin Analytics Configuration used to specify per-stream metadata and other settings.
     */
    analytics?: AnalyticsConfig;
    /**
     * Optional custom metadata. Also sent to a cast receiver on the `load` call.
     */
    metadata?: {
        [key: string]: string;
    };
}
/**
 * Labeling config for the different stream types.
 */
export interface SourceLabelingStreamTypeConfig {
    /**
     * Labeling functions for DASH sources.
     */
    dash?: SourceLabelingConfig;
    /**
     * Labeling functions for HLS sources.
     */
    hls?: SourceLabelingConfig;
}
export interface PreferredTechnology extends Technology {
    /**
     * Set to `true` to exclude this technology from the list of preferred technologies.
     */
    exclude?: boolean;
}
/**
 * Config to determine the initial playback state of the Player.
 *
 * All options passed in this config, will be considered as the starting state of the player, therefore no events will
 * be triggered signaling a potential change compared to the player default logic.
 *
 * Example:
 * ```js
 * playback : {
 *   autoplay: false,
 *   muted: false,
 *   audioLanguage: ['en', 'es', 'de'],
 *   subtitleLanguage: 'en',
 *   preferredTech: [{
 *     player: 'html5',
 *     streaming: 'dash'
 *   }, {
 *     player: 'native',
 *     streaming: 'hls'
 *   }]
 * }
 * ```
 */
export interface PlaybackConfig {
    /**
     * Whether the player starts playing after loading a source or not (`false`, default).
     * Note that unmuted autoplay is blocked on several browsers, check for {@link PlayerEvent.Warning} with code
     * {@link WarningCode.PLAYBACK_COULD_NOT_BE_STARTED} for detecting the blocking.
     */
    autoplay?: boolean;
    /**
     * Whether the sound is muted on startup or not (`false`, default).
     */
    muted?: boolean;
    /**
     * Defines the volume level of the player when started for the first time. Default value is 100.
     */
    volume?: number;
    /**
     * Defines one or more audio languages which should be used
     * in the specified order on start up.
     */
    audioLanguage?: string | string[];
    /**
     * Defines one or more subtitle languages which should be used
     * in the specified order on start up.
     */
    subtitleLanguage?: string | string[];
    /**
     * Determines if the subtitle should be selected by the player per default and
     * kept in sync with the selected audio language.
     * The subtitle will not appear in {@link Subtitles.PlayerSubtitlesAPI.list} and can't be deactivated or activated through
     * the API.
     *
     * Per default subtitle tracks with `forced=true` will be selected.
     * In case of DASH these are subtitles with the role `forced_subtitle` and in case of HLS
     * subtitles with the attribute `FORCED=YES`.
     */
    isForcedSubtitle?: (subtitle: SubtitleTrack) => boolean;
    /**
     * Enables time shift / DVR for live streams. Default is `true` (enabled). If time shift is disabled
     * (set to `false`), the timeline (scrub bar) will not be shown any more.
     */
    timeShift?: boolean;
    /**
     * Whether to allow seeking or not. Default is true.
     */
    seeking?: boolean;
    /**
     * Whether to add the playsinline attribute to the video element or not. This stops videos immediately
     * going fullscreen after starting playback on iOS for example. Default is true.
     */
    playsInline?: boolean;
    /**
     * An array of objects to specify the player and streaming technology order to use. If the first is
     * supported, this technologies are used. If not, the second is tried etc. If none of the specified combinations
     * are supported, then a {@link ErrorCode.SOURCE_NO_SUPPORTED_TECHNOLOGY} will be thrown.
     *
     * Player technologies:
     *  - `html5` refers to the MediaSource Extension (MSE) based JavaScript player
     *  - `native` refers to the browser’s native capabilities are being used, e.g. playing back HLS in Safari on iOS
     *
     * Currently supported combinations:
     * ```js
     * { player: 'html5', streaming: 'dash'}
     * { player: 'html5', streaming: 'hls'}
     * { player: 'html5', streaming: 'smooth'}
     * { player: 'native', streaming: 'hls'}
     * { player: 'native', streaming: 'progressive'}
     * ```
     *
     * Example:
     * ```js
     * preferredTech : [{
     *   player: 'html5',
     *   streaming: 'dash'
     * }, {
     *   player: 'native',
     *   streaming: 'hls'
     * }]
     * ```
     */
    preferredTech?: PreferredTechnology[];
    /**
     * Specify the priority of audi codecs. If more than one audio codec is available this order will be respected
     * while
     * finding a codec which is supported by the current browser.
     * If there is a codec which is not in this priority list, it will be tried only if none of this list are available
     * / supported Default is `['ec-4', 'ac-4', 'ec-3', 'mp4a.a6', 'ac-3', 'mp4a.a5', 'mp4a.40']`
     * @since 7.6
     */
    audioCodecPriority?: string[];
    /**
     * Specify the priority of video codecs for this source. If more than one video codec is available this order will
     * be respected while finding a codec which is supported by the current browser. If there is a codec which is not
     * in this priority list, it will be tried only if none of this list are available / supported.
     * Default is `['dvhe', 'dvh1', 'vvc', 'vvi', 'av1', 'hevc', 'hev', 'hvc', 'vp9', 'avc']`
     * @since 7.6
     */
    videoCodecPriority?: string[];
}
/**
 * Example:
 * ```js
 * style : {
 *   width: '100%',
 *   aspectratio: '16:9',
 * }
 * ```
 */
export interface StyleConfig {
    /**
     * The width of the player. Can have any value including the unit (e.g. px, %, em, vw) usable in CSS,
     * e.g. 500px or 90%. Not more than two options of width, height, and aspect ratio should be given.
     * If no unit is given, 'px' is assumed.
     * If no width is given, the width is controlled via CSS aspect-ratio classes (default)
     */
    width?: string;
    /**
     * The height of the player. Can have any value including the unit (e.g. px, %, em, vh) usable in CSS,
     * e.g. 500px or 90%. Not more than two options of width, height, and aspect ratio should be given.
     * If no unit is give, 'px' is assumed.
     * If no height is given, the height is controlled via CSS aspect-ratio classes (default)
     */
    height?: string;
    /**
     * The aspect ratio of the player, e.g. 16:9, 16:10, 4:3. Not more than two options of width, height,
     * and aspect ratio should be given. Defaults to 16:9.
     */
    aspectratio?: string | number;
    /**
     * A callback to specify the element that the player will add `style` elements to.
     * Defaults to the `head` element.
     */
    container?: () => HTMLElement;
    /**
     * Specifies whether native subtitle rendering should always be enabled for native HLS and progressive files.
     * @hidden
     */
    nativeSubtitles?: boolean;
}
export interface BufferMediaTypeConfig {
    /**
     * The amount of data in seconds the player tries to buffer in advance. Default is `40`.
     *
     * For live streams the lowest value of playlist duration for HLS, `timeShiftBufferDepth` for DASH and
     * this `targetLevel` value is used as a maximum value for the forward buffers.
     */
    forwardduration?: number;
    /**
     * The amount of data in seconds the player keeps buffered after it played over it. Default is `20`.
     */
    backwardduration?: number;
}
/**
 * Configures different kinds of buffer settings for media types defined in {@link MediaType}.
 *
 * Example:
 * ```js
 * buffer: {
 *   [MediaType.Video]: {
 *     [BufferType.ForwardDuration]: 30,
 *     [BufferType.BackwardDuration]: 20,
 *   },
 *   [MediaType.Audio]: {
 *     [BufferType.ForwardDuration]: 50,
 *     [BufferType.BackwardDuration]: 20,
 *   },
 * },
 * ```
 */
export interface BufferConfig {
    /**
     * Configures various settings for the video buffers.
     */
    video?: BufferMediaTypeConfig;
    /**
     * Configures various settings for the audio buffers.
     */
    audio?: BufferMediaTypeConfig;
}
/**
 * A map of query parameter names to values.
 *
 * Example:
 * ```js
 * const query_parameters = {
 *   name: 'value',
 *   'another-name': 'another-value',
 *   // Empty values are allowed
 *   name3: '',
 *   // Names without values are also allowed
 *   name4: null,
 * }
 * ```
 * The resulting query string of the example will be `name=value&another-name=another-value&name3=&name4`.
 */
export interface QueryParameters {
    [name: string]: string;
}
/**
 * A map of [[HttpRequestType]] to HTTP status codes.
 * For the included request types, requests will not be retried if they return those codes.
 *
 * **The key must be a string belonging to [[HttpRequestType]]**
 * @since 8.4
 *
 * Example:
 * ```js
 * disable_retry_for_response_status: {
 *   [HttpRequestType.MANIFEST_DASH]: [ 401 ]
 * }
 *```
 */
export interface ResponseStatusMap {
    [name: string]: number[];
}
export interface PlayStation5Tweaks {
    /**
     * This flag is used to define hardware resources when playing multiple videos at the same time.
     * If playing only a single video, or two videos up with combined resolution up to 4k
     * the `playmode` can be left as "4K" - which is also capable of playing 2K content.
     *
     * - "4K" Informs the underlying video engine that this SourceBuffer will play content above 2K and up to 4K.
     * - "2K" Informs the underlying video engine that this SourceBuffer will not play content above 2K.
     *   Playback of 4K content in this mode will result in an error.
     *
     * When setting playmode, all previous video elements must be destroyed.
     * This cannot change during any form of video playback.
     *
     * Default is "4K"
     * @since 8.88.0
     */
    playmode?: '4K' | '2K';
    /**
     * The pass_through option enables and disables audio pass-through.
     *
     * If enabled, audio is passed through to the AV Receiver to decompress audio.
     * If disabled, the PlayStation® console will decompress audio into LPCM.
     *
     * Only one audio stream can be passed through to the AV Receiver at a time.
     * Attempting to enable pass_through on a second video element when the first is still active
     * will result in an error.
     *
     * Default is false
     * @since 8.88.0
     */
    pass_through?: boolean;
    /**
     * Enables the Enhanced Security Video Mode. This uses a more secure video render pipeline which is required
     * when content is encrypted with PlayReady SL-3000 or Widevine L1, and/or HDR/10-bit content.
     *
     * Playback of PlayReady SL-3000, Widevine L1 and/or HDR/10-bit content both require esvm to be set to true.
     * If it is set to false a decoding error will occur.
     * PlayReady SL-2000, Widevine L2 or L3, unprotected, and/or SDR content, can also be played when esvm is true.
     *
     * When setting esvm, all previous video elements must be destroyed.
     * This cannot change during any form of video playback.
     *
     * Default is false
     * @since 8.88.0
     */
    esvm?: boolean;
}
/**
 * The tweaks configuration is used as an incubator for experimental features and also contains features
 * implemented for specific customers that might not make it into the officially supported feature set.
 *
 * Tweaks are not officially supported and are not guaranteed to be stable, i.e. their naming, functionality
 * and API can change at any time within the tweaks or when being promoted to an official feature and moved into
 * its final configuration namespace.
 * Tweaks are often proof-of-concepts that are quickly implemented for urgent needs of customers. They often do
 * not go through an architectural review and are therefore not signed and approved by the architecture team.
 *
 * Example:
 * ```js
 * tweaks : {
 *   max_buffer_level     : 20,
 *   query_parameters : {
 *     key1: 'value1',
 *     key2: 'value2',
 *     mycustomname: 'another-value'
 *   }
 * }
 * ```
 */
export interface TweaksConfig {
    /**
     * Tweaks are meant for experimental purpose and might often change so we allow the interface
     * to contain any option to avoid possible type checking failures.
     */
    [key: string]: any;
    /**
     * Changes the maximum buffer level in seconds. Default is `40` seconds.
     * For live streams the lowest value of playlist duration for HLS, `timeShiftBufferDepth` for DASH and
     * the `max_buffer_level` is used as a maximum value for the buffer.
     * @deprecated Use {@link BufferMediaTypeConfig.forwardduration} instead.
     */
    max_buffer_level?: number;
    /**
     * Amount of seconds the player buffers before playback starts. Default is `0.9` seconds.
     * This value is restricted to the maximum value of the buffer minus `0.5` seconds.
     */
    startup_threshold?: number;
    /**
     * Amount of seconds the player buffers before playback starts again after a stall. Default is `0.9` seconds.
     * This value is restricted to the maximum value of the buffer minus `0.5` seconds.
     */
    restart_threshold?: number;
    /**
     * Query parameters are added as GET parameters to all request URLs (e.g. manifest, media segments,
     * subtitle files, …). Query_parameters should be an object with key value pairs, where the keys are
     * used as parameter name and the values as parameter values.
     *
     * Example:
     * ```js
     * query_parameters : {
     *   key1: 'value1',
     *   key2: 'value2',
     *   mycustomname: 'another-value'
     * }
     * ```
     * The example above would be translated into `MY_REQUEST_URL?key1=value1&key2=value2&mycustomname=another-value`.
     */
    query_parameters?: QueryParameters;
    /**
     * If enabled the native player used for HLS in Safari would fetch and parse the HLS playlist and trigger
     * {@link PlayerEvent.SegmentPlayback} events carrying segment-specific metadata like `#EXT-X-PROGRAM-DATE-TIME`
     * if present in the manifest. Default is `false`.
     */
    native_hls_parsing?: boolean;
    /**
     * If enabled the native player used for HLS in Safari would fetch and parse the HLS playlist and trigger
     * an {@link PlayerEvent.Error} event if the download of a segment fails and the playback stalls. Default is `false`.
     */
    native_hls_download_error_handling?: boolean;
    /**
     * Enabling this flag prevents the player from downloading any further resource (playlist, segments, ...), when the
     * player is paused. Already issued requests will be finished. Default is `false`.
     */
    stop_download_on_pause?: boolean;
    /**
     * Sets the LOG_LEVEL of the player by calling {@link PlayerAPI.setLogLevel}.
     */
    log_level?: LogLevel;
    /**
     * Sets the license server to the given URL if allowlisted.
     * Default is the bitmovin license server URL.
     */
    licenseServer?: string;
    /**
     * Sets the impression server to the given URL if allowlisted.
     * Default is the bitmovin impression server URL.
     */
    impressionServer?: string;
    /**
     * All HLS variants with a bitrate lower than the given bitrate in bits per second (bps) are considered audio-only
     * variants and removed if there is at least one with a higher bitrate.
     */
    hls_audio_only_threshold_bitrate?: number;
    /**
     * TODO add description
     * @hidden
     */
    segmentLoader?: any;
    /**
     * TODO add description
     * @hidden
     */
    segmentLoaderArgs?: any;
    /**
     * Whether to use the file protocol or not. Used in combination with app_id. Default is false.
     * @hidden
     */
    file_protocol?: boolean;
    /**
     * @hidden
     */
    app_id?: string;
    /**
     * Groups adaptation sets and switches between them based on their `group` attribute instead of the recommended
     * `SupplementalProperty` `urn:mpeg:dash:adaptation-set-switching:2016`. Default is false.
     * @since 8.1
     */
    adaptation_set_switching_without_supplemental_property?: boolean;
    /**
     * If enabled, Edit (`edts`) boxes in MP4 segments which would introduce a segment start time offset are filtered from
     * segments before forwarding them to the decoder. This is required as browsers are handling such boxes differently.
     * This flag ensures consistent cross-browser behavior in this matter and is enabled by default.
     * @since 8.3
     */
    ignore_mp4_edts_box?: boolean;
    /**
     * Disables grouping of audio renditions by name. With this enabled, every audio rendition will be a separate
     * available audio (and not a quality)
     * @hidden
     */
    ignore_hls_audio_groups?: boolean;
    /**
     * If a specific [[HttpRequestType]] has one or more HTTP status codes associated with it via this configuration
     * value, requests of that type will not be retried if they return one of the associated status codes.
     * @since 8.4
     *
     * Example:
     * ```js
     * disable_retry_for_response_status: {
     *   [HttpRequestType.MANIFEST_DASH]: [ 401 ]
     * }
     *```
     */
    disable_retry_for_response_status?: ResponseStatusMap;
    /**
     * This flag indicates whether we prevent the native video element to preload data. Metadata will always be
     * preloaded. In case of native HLS playback on Safari, this will cause e.g. `AudioTracks` not being added, before
     * the playback starts.
     */
    prevent_video_element_preloading?: boolean;
    /**
     * Defines the [scope]() of the `ServiceWorker` that is created in the `bitmovin-serviceworker-client.js` module.
     * @since 8.13.0
     */
    serviceworker_scope?: string;
    /**
     * If set, `keyerror` events will be ignored for Fairplay when more than one `needkey` event was triggered with
     * identical `initData`.
     * @since 8.18.0
     */
    fairplay_ignore_duplicate_init_data_key_errors?: boolean;
    /**
     * Specifies whether the Player should not adjust the target buffer levels after a `QuotaExceededError`.
     * @since 8.25.0
     */
    no_quota_exceeded_adjustment?: boolean;
    /**
     * Makes sure that player initialize period switch and recreate source buffers in case that we are switching
     * from unenctyped to encrypted segments. This fixes the issues with pixelated picture on playready protected
     * HLS stream with unecrypted SSAI in MS Edge.
     * @deprecated As of 8.33.0 new buffer handling covers this case by default so it doesn't have any effect.
     * @since 8.25.1
     */
    segment_encryption_transition_handling?: boolean;
    /**
     * Specifies whether {@link PlayerAPI.seek} is allowed for live streams. By default this is not allowed.
     */
    enable_seek_for_live?: boolean;
    /**
     * Specifies whether live content should resume playback at the playback time before the ad break. This is required
     * in order to be able to use {@link Advertising.AdConfig.replaceContentDuration} for live streams. By default,
     * live content resumes at the live edge.
     * Note: {@link TweaksConfig.enable_seek_for_live} is required if this is set to `true`.
     * @since 8.27.0
     */
    resume_live_content_at_previous_position_after_ad_break?: boolean;
    /**
     * If set, all BaseMediaDecodeTime-stamps will be truncated to 32 bits in length.
     */
    dword_base_media_decode_timestamps?: boolean;
    /**
     * If set, every BaseMediaDecodeTime in data segments will be rewritten, regardless if they exceed 32 bits or not.
     * The tizen or webOS module has to be present and the player should run on Tizen or webOS TV.
     *
     * Using this tweak might cause some unwanted problems when content has short discontinuities (e.g. SSAI streams).
     * Enabling the tweak is only recommended when the playback experience is improved on testing.
     */
    force_base_media_decode_time_rewrite?: boolean;
    /**
     * Indicates if special akamai date time format should be parsed from the segment URL
     * @hidden
     */
    akamai_datetime_parsing?: boolean;
    /**
     * This makes segments to be requested again when seeking backwards as instant quality switch implementation
     * workarounds would stop working
     * @hidden
     */
    clear_buffers_on_seeking_backwards?: boolean;
    /**
     * If set, all invalid MP4 segments will be dropped instead of throwing playback error later on.
     * This may cause a gap but it can also allow the stream continue without interrupting the playback.
     * @hidden
     */
    drop_invalid_segments?: boolean;
    /**
     * If set to true, the BMDT will preserve possible gaps in segments while rewriting timestamps,
     * which may prevent out of sync audio and video.
     */
    preserve_gaps_for_base_media_decode_time_rewrite?: boolean;
    /**
     * Gaps in content that are smaller than this value will not be skipped. This tweak should be used if gap skipping
     * is unnecessary: some browsers are able to play through small gaps in content without getting stuck.
     *
     * Default value is 0, which means that all encountered gaps will be skipped.
     */
    min_size_for_gap_skipping?: number;
    /**
     * If set, software decryption is used over the browser's WebCrypto API for anything that the player manually
     * decrypts. E.g. for decrypting segments of DASH ClearKey-protected and HLS AES-128-encrypted streams.
     *
     * Note: Proper DRM-protection such as Widevine and PlayReady is not affected by this tweak as decryption of such must
     * be handled by the browser's CDM.
     */
    force_software_decryption?: boolean;
    /**
     * Maximum number of retries when network request fails for the provided manifest.
     * Applies for both master and variant playlist in case of Hls.
     *
     * Default value is 2.
     *
     */
    max_retries?: number;
    /**
     * The number of retries per CDN if a download error occurred in VoD streams
     * By default the player will retry 2 times.
     */
    max_cdn_retries?: number;
    /**
     * Amount of times to retry a failed MPD download before throwing an error for failed download.
     * By default the player will retry 2 times.
     */
    max_mpd_retries?: number;
    /**
     * The time in seconds to wait before trying to download the MPD again after a download error occurred.
     * By default the player will retry in half a second
     */
    mpd_retry_delay?: number;
    /**
     * The time in seconds that the MPD age for live streams may exceed the minimumUpdatePeriod, before it should be
     * considered outdated. By default the player will use 5 seconds.
     */
    mpd_update_period_tolerance?: number;
    /**
     * When set, CEA-708 captions are parsed when present in the source stream, instead of CEA-608.
     * By default CEA-608 captions are parsed.
     */
    parse_cea_708_caption?: boolean;
    /**
     * PlayStation 5 Platform tweaks
     */
    playstation_5?: PlayStation5Tweaks;
    /**
     * When set, the playback times of the segments between HLS playlist are synced using
     * media sequence number during quality switch.
     *
     * Default is `false`.
     */
    hls_sync_segment_playback_time_via_media_sequence?: boolean;
    /**
     * When set, the player will parse the manifest in a worker thread. This can improve the performance of the player
     * when the manifest is large.
     *
     * Default is `false`.
     */
    hls_parse_manifest_in_worker?: boolean;
    /**
     * When set, the SourceBuffers will be cleared between segments with different discontinuities that otherwise
     * have matching properties. This tweak can be used to switch this behaviour off for certain streams to gain
     * more performance and seamless playback between discontinuity boundaries.
     *
     * Default is `true`.
     *
     * @since v8.93.0
     */
    hls_clear_buffers_on_discontinuity_switches?: boolean;
    /**
     * When set, the player will use the `fetch` API to download segments using HTTP chunked transfer encoding (CTE)
     * instead of the `XMLHttpRequest` API.
     * In combination with chunked CMAF content this can be used to achieve low-latency streaming.
     */
    chunked_cmaf_streaming?: boolean;
    /**
     * Whether the player should parse and process `emsg` boxes from MP4 segments.
     *
     * Note: This tweak is limited to the MSE-based player (i.e. if {@link PlayerAPI.getPlayerType} returns
     * {@link PlayerType.Html5}) and has no effect for the native player ({@link PlayerType.Native}).
     *
     * Default is `true.`
     *
     * @since v8.98.0
     */
    parse_emsg_boxes?: boolean;
    /**
     * Configuration options for WISH ABR logic.
     * You can enable the logic by setting {@link AdaptationConfig.logic} to {@link AdaptationLogicType.WISH}.
     */
    wish_abr_params?: WishAbrConfig;
    /**
     * Defines the duration in seconds after which the backup stream penalization is considered to be expired.
     * The penalty is applied when a playlist, or one of its segments, has failed to load, and the player has
     * triggerd failover to a backup stream.
     *
     * Default is 30 seconds.
     */
    hls_backup_stream_penalty_duration?: number;
    /**
     * If set, the player checks all available DRM licenses when the key status for a KID updates.
     *
     * Instead of surfacing an error once the KID becomes unusable on a license, the key status for the KID is checked
     * across all licenses. Only if the KID is not usable on any of the licenses an error is thrown.
     *
     * Default is `true`.
     *
     * @since v8.140.2, v8.144.0
     */
    check_all_drm_licenses_for_kid?: boolean;
    /**
     * Whether the native player used for HLS on Safari should subscribe to `cuechange` events from the metadata TextTrack
     * and relay ID3 events as {@link PlayerEvent.Metadata} events.
     *
     * Note: This tweak has no effect if the MSE-based player (i.e. {@link PlayerType.Html5}) is used.
     *
     * Default is `true`.
     *
     * @since v8.158.0
     */
    hls_parse_native_metadata?: boolean;
    /**
     * Use `ManagedMediaSource` over regular `MediaSource` when both are available.
     *
     * Default is `true`.
     */
    prefer_managed_media_source?: boolean;
}
/**
 * Example:
 * ```js
 * cast : {
 *   enable                 : true,
 *   application_id         : 'A12B45C6'
 * }
 * ```
 */
export interface CastConfig {
    /**
     * ChromeCast support is disabled (`false`) per default. To enable it, set this attribute to `true`.
     */
    enable?: boolean;
    /**
     * The ChromeCast application ID retrieved from Google when a Cast receiver app is registered. To use
     * ChromeCast with player version 6 an higher, it is not necessary to use this option. For versions
     * pre v6, please use ‘121122A0’, or your dedicated ID, in case you want to use a custom ChromeCast
     * receiver app.
     *
     * Starting with player 6, the application ID needs only be set if you want to use your own custom receiver app.
     * By default, Bitmovin's Cast receiver app is used.
     */
    application_id?: string;
    /**
     * A custom message namespace as defined in the Cast receiver app. To use ChromeCast, it is not necessary
     * to use this option! This is only needed if one wants to create a custom ChromeCast receiver app.
     */
    message_namespace?: string;
    /**
     * A URL to a CSS file the Chromecast receiver app loads. Can be used to style the receiver app.
     * @since 7.1
     */
    receiverStylesheetUrl?: string;
}
export declare enum AdaptationLogicType {
    /**
     * Buffer-based logic that switches quality based on buffer health (i.e. current buffer level).
     *
     * @deprecated Use {@link AdaptationLogicType.DOWNLOAD_PREDICTION} instead.
     * @hidden
     */
    BUFFER = "v1",
    /**
     * Buffer-based logic that considers fill state and fill rate to make quality decisions.
     *
     * @deprecated Use {@link AdaptationLogicType.DOWNLOAD_PREDICTION} instead.
     * @hidden
     */
    BUFFER_FILL_RATE = "v2",
    /**
     * Default adaptation logic. It uses a hybrid approach that builds on top of the buffer-based rules of
     * {@link AdaptationLogicType.BUFFER_FILL_RATE} and adds a prediction algorithm that estimates the download
     * time of segments. Downloads that exceed the expected download time, may be cancelled to prevent stalls.
     */
    DOWNLOAD_PREDICTION = "v3",
    /**
     * Adaptation logic tailored to low-latency streaming of chunked CMAF live content.
     *
     * Should only ever be used in combination with {@link TweaksConfig.chunked_cmaf_streaming}.
     */
    LOW_LATENCY = "low-latency-v1",
    /**
     * Based on the paper: M. Nguyen [et al.], "WISH: User-centric Bitrate Adaptation for HTTP Adaptive Streaming on
     * Mobile Devices," @see {@link https://dx.doi.org/10.1109/MMSP53017.2021.9733605}.
     *
     * WISH employs a Weighted Sum model to achieve high QoE for video streaming, while allowing to express preferences
     * that allow to trade off data usage, stall events, and video quality. @see {@link TweaksConfig.wish_abr_params}
     *
     * @since 8.136.0
     */
    WISH = "wish"
}
export declare enum RttEstimationMethod {
    /**
     * Uses the weighted average of the round-trip-times measured for the previous downloads, with newest
     * samples having the highest weights.
     */
    WeightedAverage = "weightedaverage",
    /**
     * Uses the median of the round-trip-times measured for the previous downloads. May perform better
     * on low-performant devices.
     */
    Median = "median"
}
/**
 * Example:
 * ```js
 * adaptation : {
 *   desktop: {
 *     bitrates: {
 *       minSelectableAudioBitrate: '128kbps',
 *       maxSelectableAudioBitrate: '320kbps',
 *       minSelectableVideoBitrate: '900kbps',
 *       maxSelectableVideoBitrate: Infinity
 *     }
 *   },
 *   mobile: {
 *     bitrates: {
 *       minSelectableAudioBitrate: 0,
 *       maxSelectableAudioBitrate: '256000bps',
 *       minSelectableVideoBitrate: 0,
 *       maxSelectableVideoBitrate: '2.5mbps'
 *     }
 *   }
 * }
 * ```
 */
export interface AdaptationConfig extends DynamicAdaptationConfig {
    /**
     * The bitrate the player should start playback with. If this option doesn’t exist
     * in the configuration, the player will try to find the best startup bitrate automatically.
     */
    startupBitrate?: Bitrate;
    /**
     * The maximum bitrate the player should start playback with.
     * Has no effect if {@link startupBitrate} is used.
     */
    maxStartupBitrate?: Bitrate;
    /**
     * The player automatically cancels requests if it takes too long and retries in a lower quality (default, `false`).
     * This behavior can be disabled by setting this option to `true`.
     */
    disableDownloadCancelling?: boolean;
    /**
     * Specifies whether the player preloads the content (default: `true` for VOD, `false` for live streams) or not.
     */
    preload?: boolean;
    /**
     * Specifies whether qualities that must not be switched to should be removed when parsing the manifest or
     * not. Qualities which must not be switched to can be specified by {@link bitrates} or {@link resolution}.
     * Default is false.
     */
    exclude?: boolean;
    /**
     * Lower and upper bitrate boundaries to limit qualities.
     */
    bitrates?: BitrateLimitationConfig;
    /**
     * The maximum PSNR difference that is allowed for chosen representation when Quality Optimized Streaming Data
     * is present.
     * @hidden
     */
    qualityThreshold?: number;
    /**
     * The maximum PSNR value above which it doesn't make much sense. Netflix has said that scores under 35 dB will show
     * encoding artifacts, while scores over 45 dB produce no perceptible quality improvements.
     * @hidden
     */
    qualityUpperThreshold?: number;
    /**
     * Defines the type/version of adaptation logic to be used.
     * Default is {@link AdaptationLogicType.DOWNLOAD_PREDICTION}.
     */
    logic?: AdaptationLogicType;
    /**
     * A callback function to customize the player's adaptation logic that is called before the player tries to download
     * a new video segment.
     *
     * Example:
     * ```js
     * const conf = {
     *   ...
     *   adaptation: {
     *     desktop: {
     *       onVideoAdaptation: (data) => {
     *         // Do your custom logic
     *         return newRepresentationId;
     *       }
     *     },
     *     mobile: {
     *       onVideoAdaptation: (data) => {
     *         // Do your custom logic
     *         return newRepresentationId;
     *       }
     *     },
     *   }
     * };
     * ```
     *
     * To simply restrict video qualities to the current video player size, use {@link limitToPlayerSize}.
     *
     * @param data An object carrying the <code>suggested</code> attribute, holding the suggested representation/quality
     *   ID the player would select
     * @return A valid representation/quality ID which the player should use, based on your custom logic (either
     *   <code>data.suggested</code> to switch to the player's suggested quality, or a {@link VideoQuality.id})
     * @see {@link PlayerAPI.getAvailableVideoQualities} to get a list of all available video qualities
     */
    onVideoAdaptation?: (data: VideoAdaptationData) => string;
    /**
     * A callback function to customize the player's adaptation logic that is called before the player tries to download
     * a new audio segment.
     *
     * Example:
     * ```js
     * const conf = {
     *   ...
     *   adaptation: {
     *     desktop: {
     *       onAudioAdaptation: (data) => {
     *         // Do your custom logic
     *         return newRepresentationId;
     *       }
     *     },
     *     mobile: {
     *       onAudioAdaptation: (data) => {
     *         // Do your custom logic
     *         return newRepresentationId;
     *       }
     *     },
     *   }
     * };
     * ```
     *
     * @param data An object carrying the <code>suggested</code> attribute, holding the suggested representation/quality
     *   ID the player would select
     * @return A valid representation/quality ID which the player should use, based on your custom logic (either
     *   <code>data.suggested</code> to switch to the player's suggested quality, or a {@link AudioQuality.id})
     * @see {@link PlayerAPI.getAvailableAudioQualities} to get a list of all available audio qualities
     */
    onAudioAdaptation?: (data: AudioAdaptationData) => string;
    /**
     * Defines what method shall be used to estimate the round-trip-time of the network based on the measured RTTs of
     * previous downloads. Possible values are {@link RttEstimationMethod.WeightedAverage} and
     * {@link RttEstimationMethod.Median}. The {@link RttEstimationMethod.Median} estimation method may perform better
     * on low-performance devices. Default value is {@link RttEstimationMethod.WeightedAverage}. Can only be used with the
     * 'v3' {@link logic}.
     */
    rttEstimationMethod?: RttEstimationMethod;
}
/**
 * Parts of the {@link AdaptationConfig} which can be changed at runtime.
 */
export interface DynamicAdaptationConfig {
    /**
     * Defines the balance between quality (i.e. bitrate) and stability in a range of [0, 1].
     * A value of 0 means that the player will aim to play the best possible quality, potentially at the cost of lower playback stability.
     * A value of 1 means that the player will aim for the highest stability with the least amount of stalls,
     * while potentially sacrificing quality.
     * This is only relevant when using the Low Latency adaptation logic.
     *
     * Default is `0.5`.
     */
    qualityStabilityBalance?: number;
    /**
     * Lower and upper resolution boundaries. Use `0` for no limitation for minimum selectable width/height and
     * `Infinity` for no limitation for maximum selectable width/height.
     */
    resolution?: VideoSizeLimitationConfig;
    /**
     * Limits the automatically selected quality to the player size, so the player won't select quality
     * levels with a higher resolution than the video element. This is disabled (`false`) per default.
     */
    limitToPlayerSize?: boolean;
}
interface AdaptationData {
    /**
     * The ID of the representation that the player selected, which is the same ID as returned through the
     * {@link AudioQuality} and {@link VideoQuality} objects from {@link PlayerAPI.getAvailableAudioQualities} and
     * {@link PlayerAPI.getAvailableVideoQualities}.
     */
    suggested: string;
    isAd: boolean;
    representations: {
        bandwidth: number;
        id: string;
    }[];
}
export interface VideoAdaptationData extends AdaptationData {
}
export interface AudioAdaptationData extends AdaptationData {
}
export interface BitrateLimitationConfig {
    /**
     * Lower bitrate boundary for audio qualities. All qualities below this threshold will not be selected by
     * the ABR logic. These qualities are still available for manual quality selection unless the {@link PreferredTechnology.exclude}
     * flag is set to `true`.
     * Can be set to `0` for no limitation.
     */
    minSelectableAudioBitrate?: Bitrate;
    /**
     * Upper bitrate boundary for audio qualities. All qualities above this threshold will not be selected by
     * the ABR logic. These qualities are still available for manual quality selection unless the {@link PreferredTechnology.exclude}
     * flag is set to `true`.
     * Can be set to `Infinity` for no limitation.
     */
    maxSelectableAudioBitrate?: Bitrate;
    /**
     * Lower bitrate boundaries for video qualities. All qualities below this threshold will not be selected by
     * the ABR logic. These qualities are still available for manual quality selection unless the {@link PreferredTechnology.exclude}
     * flag is set to `true`.
     * Can be set to `0` for no limitation.
     */
    minSelectableVideoBitrate?: Bitrate;
    /**
     * Upper bitrate boundary for video qualities. All qualities above this threshold will not be selected by
     * the ABR logic. These qualities are still available for manual quality selection unless the {@link PreferredTechnology.exclude}
     * flag is set to `true`.
     * Can be set to `Infinity` for no limitation.
     */
    maxSelectableVideoBitrate?: Bitrate;
}
export interface VideoSizeLimitationConfig {
    /**
     * Lower video height boundary for video qualities. All qualities below this threshold will not be selected by
     * the ABR logic. These qualities are still available for manual quality selection unless the
     * {@link AdaptationConfig.exclude} flag is set to `true`.
     * Can be set to `0` for no limitation.
     */
    minSelectableVideoHeight?: number;
    /**
     * Upper video height boundary for video qualities. All qualities above this threshold will not be selected by
     * the ABR logic. These qualities are still available for manual quality selection unless the
     * {@link AdaptationConfig.exclude} flag is set to `true`.
     * Can be set to `0` for no limitation.
     */
    maxSelectableVideoHeight?: number;
    /**
     * Lower video width boundary for video qualities. All qualities below this threshold will not be selected by
     * the ABR logic. These qualities are still available for manual quality selection unless the
     * {@link AdaptationConfig.exclude} flag is set to `true`.
     * Can be set to `0` for no limitation.
     */
    minSelectableVideoWidth?: number;
    /**
     * Upper video width boundary for video qualities. All qualities above this threshold will not be selected by
     * the ABR logic. These qualities are still available for manual quality selection unless the
     * {@link AdaptationConfig.exclude} flag is set to `true`.
     * Can be set to `0` for no limitation.
     */
    maxSelectableVideoWidth?: number;
}
/**
 * Specifies a bitrate either as number in bits per second (bps) or as a string with the unit, such as `mbps`
 * (megabits per second),
 * `kbps` (kilobits per second) or `bps` (bits per second). Example: `'5000kbps'`
 */
export type Bitrate = number | string;
/**
 * Adaptation configurations for different platforms. Most options are not applicable for the `native`
 * player technologies due to technical limitations.
 */
export interface AdaptationPlatformConfig extends AdaptationConfig {
    desktop?: AdaptationConfig;
    mobile?: AdaptationConfig;
}
/**
 * Example:
 * ```js
 * location : {
 *   vr: 'MY_VR_FOLDER/my_bitmovinplayer-vr.js',
 *   ui: 'MY_JS_FOLDER/my_bitmovinplayer-ui.js',
 *   ui_css: 'MY_CSS_FOLDER/my_bitmovinplayer-ui.css',
 *   cast: 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1',
 *   google_ima: 'https://imasdk.googleapis.com/js/sdkloader/ima3.js'
 * }
 * ```
 */
export interface LocationConfig {
    /**
     * Specifies the path, relative or absolute, to the [Bitmovin Player UI](
     * https://github.com/bitmovin/bitmovin-player-ui/)/skin JavaScript file.
     *
     * Default name: `bitmovinplayer-ui.js`
     */
    ui?: string;
    /**
     * Specifies the path, relative or absolute, to the style sheet of the [Bitmovin Player UI](
     * https://github.com/bitmovin/bitmovin-player-ui/)/skin.
     *
     * Default name: `bitmovinplayer-ui.css`
     */
    ui_css?: string;
    /**
     * The URL of the Google Cast Chrome Sender API library.
     *
     * Default URL: https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1
     */
    cast?: string;
    /**
     * The URL of the Google IMA Framework.
     *
     * Default URL: https://imasdk.googleapis.com/js/sdkloader/ima3.js
     *
     * @deprecated Use {@link "Advertising.Ima".ImaAdvertisingConfig.sdkUrl | ImaAdvertisingConfig.sdkUrl}  instead.
     */
    google_ima?: string;
    /**
     * Specifies the path, relative or absolute, to the service worker JS file.
     *
     * If no URL is provided but the `bitmovin-serviceworker.js` module is added, the setup will fail
     * with {@link WarningCode.SETUP_SERVICE_WORKER_LOCATION_MISSING}
     *
     * Preconditions for the `ServiceWorker` to work:
     * - This property has to be set to the URL of a `ServiceWorker` implementation
     * - This file has to be placed on the same level as the serving HTML page
     * - The content source used with the player has to enable CORS
     *
     * Supported events when ServiceWorker is enabled:
     * - {@link PlayerEvent.MetadataParsed} and {@link PlayerEvent.Metadata} for the metadata present in the HLS playlist:
     *    - {@link MetadataType.DATERANGE}
     *    - {@link MetadataType.CUETAG}
     *    - {@link MetadataType.CUSTOM}
     *    - {@link MetadataType.SCTE}
     * - {@link PlayerEvent.SegmentPlayback}
     * - {@link PlayerEvent.VideoDownloadQualityChanged}
     *
     * Supported API with ServiceWorker:
     * - {@link PlayerAPI.getPlaybackVideoData}
     * - {@link PlayerAPI.getDownloadedVideoData}
     */
    serviceworker?: string;
}
export interface LogsConfig {
    /**
     * Enable (`true`, default) or disable the Bitmovin credits in the browser's console.
     */
    bitmovin?: boolean;
    /**
     * Sets the log level for debug output, warnings and errors sent to the browser console.
     *
     * Please note that especially DEBUG but also LOG level should not be used for production environments as
     * this can decrease performance, especially for long-term playback, due to the amount of log messages.
     *
     * Available values are:
     *  - `bitmovin.player.LogLevel.DEBUG`
     *  - `bitmovin.player.LogLevel.LOG`
     *  - `bitmovin.player.LogLevel.WARN` (default)
     *  - `bitmovin.player.LogLevel.ERROR`
     *  - `bitmovin.player.LogLevel.OFF`
     */
    level?: LogLevel;
    /**
     * This callback will be called for every message that would be logged to the console regardless of the configured log
     * level.
     */
    onLog?: LogCallback;
}
export interface LicensingConfig {
    /**
     * Can be used to set the delay (in milliseconds) until the licensing call is issued.
     * Maximum value is 30000 (30 seconds).
     */
    delay?: number;
}
/**
 * A mapping of {@link PlayerEvent} values to event handler callback functions.
 *
 * Events can also be dynamically added and removed through {@link PlayerAPI.on} and {@link PlayerAPI.off}.
 *
 * Example:
 * ```js
 * events : {
 *   [PlayerEvent.SourceLoaded]: (data) => {
 *     console.log('version: ' + this.getVersion() + ', onReady Event data: ', data);
 *   },
 *   [PlayerEvent.Play]: (data) => {
 *     // do awesome stuff
 *   },
 *   [PlayerEvent.Error]: (data) => {
 *     console.error('An error occurred:', data);
 *   }
 * }
 * ```
 */
export interface EventConfig {
    [event: string]: PlayerEventCallback;
}
export interface RemoteControlCustomReceiverConfig {
    /**
     * Arbitrary configuration values that are sent to the remote control receiver.
     */
    [key: string]: string | undefined;
    /**
     * A URL to a stylesheet that customizes the receiver UI style.
     */
    receiverStylesheetUrl?: string;
}
/**
 * Configuration interface for remote control of Google Cast (e.g. Chromecast) receivers.
 *
 * Example (enable casting with Bitmovin receiver app and custom style):
 * ```js
 * {
 *   type: 'googlecast',
 *   customReceiverConfig: {
 *     receiverStylesheetUrl: 'https://mycdn.com/mycustomreceiverstyle.css',
 *   },
 * }
 * ```
 *
 * Example (custom receiver):
 * ```js
 * {
 *   type: 'googlecast',
 *   receiverApplicationId: '1234ABCD',
 *   customReceiverConfig: {
 *     customPropertyName: 'customValue',
 *   },
 * }
 * ```
 *
 */
export interface GoogleCastRemoteControlConfig extends InternalGoogleCastRemoteControlConfig {
    type: 'googlecast';
}
/**
 * Configuration interface for WebSocket-based player remote control.
 * Requires a running WebSocket server available at
 * https://github.com/bitmovin/bitmovin-player-remote-websocketserver.
 *
 * Example:
 * ```js
 * {
 *   type: 'websocket',
 *   url: 'ws://your-server-ip:29100',
 *   customReceiverConfig: {
 *     receiverStylesheetUrl: 'https://mycdn.com/mycustomreceiverstyle.css',
 *   },
 * }
 * ```
 */
export interface WebSocketRemoteControlConfig extends InternalWebSocketRemoteControlConfig {
    type: 'websocket';
}
/**
 * Configuration interface for properties used for live streams.
 *
 * Example:
 * ```js
 * {
 *   synchronization: [{
 *     method: LiveSynchronizationMethod.HttpHead,
 *     serverUrl: 'http://time.akamai.com',
 *   }],
 * }
 * ```
 */
export interface LiveConfig {
    synchronization?: SynchronizationConfigEntry[];
    lowLatency?: LowLatencyConfig;
}
/**
 * Allows controlling the player's storage behavior.
 */
export interface StorageConfig {
    /**
     * Controls whether the browser may access the Web Storage API which consists of
     * - `window.localStorage`
     * - `window.sessionStorage`
     *
     * If the device would not support the `localStorage`, the player would
     * then fallback to use `document.cookie`.
     *
     * If set to true, the player will not store anything in either one.
     * If set to false (default case), the player will store information about DRM licenses,
     * bandwidth measurements and VAST ad information.
     */
    disableStorageApi?: boolean;
}
/**
 * Method to be used for time server response parsing
 */
export declare enum LiveSynchronizationMethod {
    /**
     * The time information is in the response HTTP 'Date' header.
     */
    HttpHead = "httphead",
    /**
     * The time information is in the response body in xs:date format.
     */
    HttpXsDate = "httpxsdate",
    /**
     * The time information is in the response body a ISO 8601 timestamp.
     */
    HttpIso = "httpiso"
}
export interface SynchronizationConfigEntry {
    /**
     * Method how to extract the time information from the time server response.
     */
    method: LiveSynchronizationMethod;
    /**
     * URL of the time server
     */
    serverUrl: string;
}
/**
 * Placeholder type for the Bitmovin Player UI's UIConfig.
 * https://github.com/bitmovin/bitmovin-player-ui
 */
export type UIConfig = any;
export interface CollectorConfig {
    backendUrl?: string;
    enabled?: boolean;
    cookiesEnabled?: boolean;
    cookiesDomain?: string;
    origin?: string;
}
export interface AnalyticsDebugConfig {
    fields?: string[];
}
export interface AnalyticsConfig {
    debug?: boolean | AnalyticsDebugConfig;
    key?: string;
    playerKey?: string;
    player?: string;
    cdnProvider?: string;
    videoId?: string;
    title?: string;
    userId?: string;
    customUserId?: string;
    customData1?: any;
    customData2?: any;
    customData3?: any;
    customData4?: any;
    customData5?: any;
    customData6?: any;
    customData7?: any;
    customData8?: any;
    customData9?: any;
    customData10?: any;
    customData11?: any;
    customData12?: any;
    customData13?: any;
    customData14?: any;
    customData15?: any;
    customData16?: any;
    customData17?: any;
    customData18?: any;
    customData19?: any;
    customData20?: any;
    customData21?: any;
    customData22?: any;
    customData23?: any;
    customData24?: any;
    customData25?: any;
    customData26?: any;
    customData27?: any;
    customData28?: any;
    customData29?: any;
    customData30?: any;
    experimentName?: string;
    isLive?: boolean;
    config?: CollectorConfig;
}
/**
 * Configuration for live streams to maintain a certain live latency.
 */
export interface LowLatencyConfig {
    /**
     * The target latency in seconds, i.e. the distance from the stream's live edge to be maintained by the player during
     * playback.
     */
    targetLatency?: number;
    /**
     * Configuration defining catchup to be done if the player exceeds the target latency.
     */
    catchup?: LowLatencySyncConfig;
    /**
     * Configuration defining fallback to be done if the player falls below the target latency.
     */
    fallback?: LowLatencySyncConfig;
}
/**
 * Configuration specifying live latency synchronization (i.e. maintaining latency by catchup/fallback)
 */
export interface LowLatencySyncConfig {
    /**
     * Allowed deviation from target latency before catchup/fallback by changing the playback speed is done.
     */
    playbackRateThreshold?: number;
    /**
     * Allowed deviation from target latency before catchup/fallback by seeking is done.
     */
    seekThreshold?: number;
    /**
     * Playback speed to be used for catchup/fallback.
     */
    playbackRate?: number;
}
/**
 * Configuration options for WISH ABR logic.
 * You can enable the logic by setting {@link AdaptationConfig.logic} to {@link AdaptationLogicType.WISH}.
 */
export type WishAbrConfig = {
    /**
     * This is the δ (delta) parameter of WISH. It indicates the capability to deliver a certain bitrate (δ > 0).
     * i.e. how much the throughput should be, compared to the selected bitrate.
     *
     * Default value is 1. A value larger than 1 will make the logic more conservative.
     */
    TARGET_BITRATE_FACTOR: number;
    /**
     * The ξ (xi) parameter of WISH indicates the proportion of filled buffer (0 < ξ <= 1).
     * i.e. the amount of buffer the player will try to maintain.
     *
     * Default value is 0.8. A value of 1 means that the buffer needs to be full in order to consider switching to a higher quality.
     */
    TARGET_BUFFER_FACTOR: number;
    /**
     * Whether the bitrates should be interpolated linearly or logarithmically.
     * A logarithmic interpolation better reflects human perception as it considers switches across lower qualities
     * to be more visible than switches among higher qualities.
     *
     * Default value is 'log'.
     */
    BITRATE_MODIFIER_FUNCTION_TYPE: 'log' | 'linear';
    /**
     * This config option allows to temporarily disable WISH during startup phase and seeking, in favor of a purely
     * rate-based quality selection. By design WISH always selects the lowest quality when buffer is empty,
     * which may not be ideal on seeking.
     *
     * Default value is false.
     */
    USE_RATE_BASED_SELECTION_ON_SEEKING: boolean;
};
/**
 * The entry point to the player configuration is the {@link PlayerConfig} interface, which is passed into the
 * constructor of the player. There are several ways to do this:
 *
 * 1) When the full player is loaded from the CDN via `<source>` tag:
 *
 * ```js
 * const player = new bitmovin.player.Player(container, config);
 * ```
 *
 * 2) Whe the player is loaded from the CDN via {@link https://requirejs.org/|RequireJS}:
 *
 * ```js
 * requirejs(['<cdn_url>'], (bitmovinplayer) => {
 *   const player = new bitmovinplayer.Player(container, config);
 * });
 * ```
 *
 * 3) When the player is imported from NPM:
 *
 * ```ts
 * import { Player } from 'bitmovin-player';
 * const player = new Player(container, config);
 * ```
 *
 * Example configuration:
 *
 * ```js
 * {
 *   key: 'INSERTPROVIDEDKEYHERE',
 *   playback: {
 *     autoplay: false,
 *     muted: false
 *   },
 *   style: {
 *     width: '90%',
 *     aspectratio: '16/9',
 *   },
 *   events: {
 *     [PlayerEvent.SourceLoaded]: myFunc,
 *     [PlayerEvent.Play]: () => {
 *       // do some awesome stuff
 *     },
 *     [PlayerEvent.Error]: myErrorHandlingFunc
 *   },
 *   tweaks: {
 *     startup_threshold?: 5;
 *   },
 *   advertising: {
 *     adBreaks: [{
 *       tag: {
 *         url: 'http://your.ad.provider/manifest.xml',
 *         type: 'vast',
 *       },
 *     }],
 *   }
 * }
 * ```
 *
 * Example source:
 *
 * ```js
 * player.load({
 *   dash: 'https://path/to/mpd/file.mpd',
 *   hls: 'https://path/to/hls/playlist/file.m3u8',
 *   smooth: 'https://path/to/manifest/file/Manifest',
 *   progressive: [{
 *     url: 'http://path/to/mp4',
 *     type: 'video/mp4'
 *   }, {
 *     url: 'http://path/to/webm',
 *     type: 'video/webm'
 *   }],
 *   poster: 'images/poster.jpg',
 *   drm: {
 *     widevine: {
 *       LA_URL: 'https://mywidevine.licenseserver.com/'
 *     },
 *     playready: {
 *       LA_URL: 'https://myplayready.licenseserver.com/'
 *     },
 *     access: {
 *       LA_URL: 'https://myaccess.licenseserver.com/',
 *       authToken: 'INSERT-YOUR-BASE64-ENCODED-AUTH-TOKEN'
 *     },
 *     primetime: {
 *       LA_URL: 'https://myprimetime.licenseserver.com/'
 *     },
 *     fairplay: {
 *       LA_URL: 'https://fairplay.licenseserver.com/',
 *       certificateURL: 'https://fairplay.licenseserver.com/certificate-url'
 *     }
 *   }
 * });
 * ```
 */
export interface PlayerConfig {
    /**
     * Mandatory. A personal key can be found in the bitmovin portal and should be specified here.
     * Do not forget to enter all your domains (subdomains are included) in your account.
     */
    key: string;
    /**
     * Playback config settings.
     */
    playback?: PlaybackConfig;
    /**
     * UX/UI config settings.
     */
    style?: StyleConfig;
    /**
     * A list of callback functions for events. Events can also be dynamically added and removed through
     * {@link PlayerAPI.on} and {@link PlayerAPI.off}.
     *
     * Example:
     * ```js
     * events: {
     *   [PlayerEvent.SourceLoaded]: data => {
     *     console.log('version: ' + player.getVersion() + ', SourceLoaded Event data: ', data);
     *   },
     *   [PlayerEvent.Play]: data => {
     *     // do awesome stuff
     *   },
     *   [PlayerEvent.Error]: data => {
     *     console.error('An error occurred:', data);
     *   }
     * }
     * ```
     */
    events?: EventConfig;
    /**
     * Configures various buffer settings.
     */
    buffer?: BufferConfig;
    /**
     * Tweaks. Use these values only if you know what you are doing.
     */
    tweaks?: TweaksConfig;
    /**
     * Google Cast configuration.
     * @deprecated Use {@link remotecontrol} with {@link GoogleCastRemoteControlConfig} instead.
     */
    cast?: CastConfig;
    /**
     * Configures the adaptation logic.
     */
    adaptation?: AdaptationPlatformConfig;
    /**
     * Allows you to define which ads you want to display and when you want to display them.
     * In order to play ads on your website, you need to specify an ad config.
     */
    advertising?: AdvertisingConfig;
    /**
     * This can be used to specify custom paths to bitmovinplayer-core.min.js,
     * and bitmovinplayer-core.min.css instead of having all files in the same folder.
     */
    location?: LocationConfig;
    /**
     * Can be use to fine tune logging of the player.
     */
    logs?: LogsConfig;
    /**
     * Licensing configuration.
     */
    licensing?: LicensingConfig;
    /**
     * Network configuration.
     */
    network?: NetworkConfig;
    /**
     * Remote control configuration (e.g. Chromecast)
     * @since 7.1
     */
    remotecontrol?: GoogleCastRemoteControlConfig | WebSocketRemoteControlConfig;
    /**
     * UI configuration that is passed to the Bitmovin Player UI if the UI module is loaded. Can also be used
     * to disable the UI in case the UI module is loaded but the UI is not desired.
     */
    ui?: UIConfig | false;
    /**
     * Provide parameters specific to live streams
     */
    live?: LiveConfig;
    /**
     * Allows configuration of the player's access to the Web Storage API.
     *
     * @since v8.91.0
     */
    storage?: StorageConfig;
    /**
     * Bundled Bitmovin Analytics Configuration used to specify metadata and other related info.
     * Can also be used to completely disable Analytics by setting this to `false`
     * in case the Analytics module is loaded, but Analytics is not desired.
     */
    analytics?: AnalyticsConfig | false;
}
export {};
