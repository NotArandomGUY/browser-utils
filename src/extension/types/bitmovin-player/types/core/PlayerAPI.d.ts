import type { PlayerAdvertisingAPI } from '../advertising/API';
import type { ModuleName } from '../ModuleName';
import type { PlayerModuleMissingError } from '../PlayerModuleMissingError';
import type { PlayerSubtitlesAPI } from '../subtitles/API';
import type { PlayerVRAPI } from '../vr/API';
import { ErrorCode } from './deficiency/ErrorCode';
import { PlayerError } from './deficiency/PlayerError';
import type { WarningCode } from './deficiency/WarningCode';
import type { AdQuartile, MetadataType, PlayerEvent, PlayerEventBase } from './Events';
import type { HttpRequestMethod, HttpRequestType, HttpResponseType } from './NetworkAPI';
import type { DynamicAdaptationConfig, LowLatencySyncConfig, PlayerConfig, QueryParameters, SourceConfig } from './PlayerConfigAPI';
import { PlayerType } from './PlayerType';
import { StreamType } from './StreamType';
/**
 * A snapshot of a video frame.
 */
export interface Snapshot {
    /**
     * The width of the image.
     */
    width: number;
    /**
     * The height of the image.
     */
    height: number;
    /**
     * A Base64-encoded string that contains the image.
     */
    data: String;
}
/**
 * Properties of a thumbnail out of a seeking thumbnail preview definition.
 */
export interface Thumbnail {
    /**
     * Start time of the thumbnail.
     */
    start: number;
    /**
     * End time of the thumbnail.
     */
    end: number;
    /**
     * Width of the thumbnail.
     */
    width: number;
    /**
     * Height of the thumbnail.
     */
    height: number;
    /**
     * Horizontal offset of the thumbnail in its spritesheet.
     */
    x: number;
    /**
     * Vertical offset of the thumbnail in its spritesheet.
     */
    y: number;
    /**
     * URL of the spritesheet.
     */
    url: string;
    /**
     * Raw cue data.
     */
    text: string;
}
/**
 * Quality definition of a media representation.
 */
export interface Quality {
    /**
     * The bitrate of the media representation.
     */
    bitrate: number;
    /**
     * The id of the media representation.
     */
    id: string;
    /**
     * The unique id of the current segment.
     * Only set when requesting the video quality through {@link PlayerAPI.getPlaybackVideoData}.
     */
    uid?: string;
    /**
     * The label of the media representation that should be exposed to the user (e.g. in the UI).
     * Only set when requesting qualities through {@link PlayerAPI.getAvailableAudioQualities} and
     * {@link PlayerAPI.getAvailableVideoQualities}.
     */
    label?: string;
    /**
     * The codec of the media representation.
     */
    codec?: string;
}
/**
 * Quality definition of an audio representation.
 * @see {@link PlayerAPI.getAvailableAudioQualities}
 * @see {@link PlayerAPI.getAudioQuality}
 * @see {@link PlayerAPI.getPlaybackAudioData}
 */
export interface AudioQuality extends Quality {
}
/**
 * Quality definition of a video representation.
 * @see {@link PlayerAPI.getAvailableVideoQualities}
 * @see {@link PlayerAPI.getVideoQuality}
 * @see {@link PlayerAPI.getPlaybackVideoData}
 */
export interface VideoQuality extends Quality {
    /**
     * The width of the video representation.
     */
    width: number;
    /**
     * The heights of the video representation.
     */
    height: number;
    /**
     *  Frame rate of the video representation as stated in the manifest
     */
    frameRate?: number;
}
/**
 * Data describing a downloaded segment of a representation.
 */
export interface DownloadedData {
    /**
     * The id of the representation.
     */
    id: string;
    /**
     * The bitrate of the representation.
     */
    bitrate: number;
    /**
     * True if the player’s logic automatically selects the best representation (default),
     * or false if a fixed representation is currently chosen.
     */
    isAuto: boolean;
}
/**
 * Data describing a downloaded audio segment of an audio representation.
 */
export interface DownloadedAudioData extends DownloadedData {
}
/**
 * Data describing a downloaded video segment of a video representation.
 */
export interface DownloadedVideoData extends DownloadedData {
    /**
     * The width of the video representation.
     */
    width: number;
    /**
     * The height of the video representation.
     */
    height: number;
}
export interface MediaTrack {
    /**
     * The id of the media track that is used to identify and set the track.
     */
    id: string;
    /**
     * The text used to represent this track to the user (e.g. in the UI).
     */
    label: string;
    /**
     * The optional roles of the track.
     */
    role?: MediaTrackRole[];
}
/**
 * Describes the role of a media track, e.g. an {@link AudioTrack}.
 */
export interface MediaTrackRole {
    schemeIdUri: string;
    value?: string;
    id?: string;
    [key: string]: string | undefined;
}
/**
 * Definition of an audio track.
 */
export interface AudioTrack extends MediaTrack {
    /**
     * The language of the audio track.
     */
    lang: string;
    /**
     * Returns the available audio qualities.
     */
    getQualities(): AudioQuality[];
}
/**
 * Definition of a video track.
 */
export interface VideoTrack extends MediaTrack {
    /**
     * Returns the available video qualities.
     */
    getQualities(): VideoQuality[];
}
/**
 * Definition of a text track.
 */
export interface TextTrack extends MediaTrack {
    /**
     * The language of the subtitle/caption track.
     */
    lang: string;
    /**
     * The subtitle type, either "caption" or "subtitle" (default: "subtitle").
     */
    kind: string;
    /**
     * Indicates whether the subtitle is fragmented.
     */
    isFragmented?: boolean;
    /**
     * The URL to the associated file.
     */
    url?: string;
}
export interface Metadata {
    /**
     * The type of timed metadata.
     */
    type: MetadataType;
    /**
     * the actual metadata.
     */
    payload: any;
    /**
     * The start time of the metadata.
     */
    start?: number;
    /**
     * The end time of the metadata.
     */
    end?: number;
}
export interface PlayerManifestAPI {
    /**
     * Offers insight into the loaded DASH manifest.
     */
    dash?: DashAPI;
    /**
     * Offers insight into the loaded HLS manifest.
     */
    hls?: HlsAPI;
}
export interface DashAPI {
    /**
     * Returns the currently playing `Period`.
     */
    getPeriod(): Period;
    /**
     * Returns all available `Periods`.
     */
    listPeriods(): Period[];
}
export interface HlsAPI {
    /**
     * Returns available video tracks.
     */
    getVideoTracks(): VideoTrack[];
    /**
     * Returns available audio tracks.
     */
    getAudioTracks(): AudioTrack[];
    /**
     * Returns available text tracks.
     */
    getTextTracks(): TextTrack[];
    /**
     * Contains all tags found in the Master Playlist.
     */
    properties: HlsTag[];
}
export interface Attributes {
    [name: string]: any;
}
export interface HlsTag {
    /**
     * The name of the HLS tag.
     */
    name: string;
    /**
     * The attributes of the HLS tag as key-value pairs.
     */
    attributes?: Attributes;
    /**
     * The value of the HLS tag that is not part of its attributes.
     */
    value?: string;
}
export interface Period {
    /**
     * The ID of the `Period`.
     */
    id: string;
    /**
     * Returns available video tracks of the `Period`.
     */
    getVideoTracks(): VideoTrack[];
    /**
     * Returns available audio tracks of the `Period`.
     */
    getAudioTracks(): AudioTrack[];
    /**
     * Returns available text tracks of the `Period`.
     */
    getTextTracks(): TextTrack[];
    /**
     * Returns metadata contained in the `EventStream` of the `Period`.
     */
    getMetadata(): Metadata[];
    /**
     * Contains `Period` attributes as defined in the MPD.
     */
    properties: {
        [key: string]: string;
    };
}
export { PlayerType, StreamType };
/**
 * A player and streaming technology tuple describing a supported technology of the player.
 */
export interface Technology {
    /**
     * A string determining a rendering mode used to render the player.
     * See {@link PlayerType} for details of the supported values.
     */
    player: PlayerType;
    /**
     * A string determining a streaming technology.
     * See {@link StreamType} for details of the supported values.
     */
    streaming: StreamType;
}
/**
 * @hidden
 */
export interface BaseURL {
    /**
     * The base url.
     */
    url: string;
    /**
     * The tag name of the parent element.
     */
    parent: string;
    /**
     * An object containing the element names as key and element ids as value of all parents.
     */
    parentIds: {}[];
    /**
     * The serviceLocation attribute of the BaseURL element.
     */
    serviceLocation?: string;
    /**
     * The byteRange attribute of the BaseURL element.
     */
    byteRange?: string;
    /**
     * The availabilityTimeOffset attribute of the BaseURL element.
     */
    availabilityTimeOffset?: string;
    /**
     * The availabilityTimeComplete attribute of the BaseURL element.
     */
    availabilityTimeComplete?: string;
    /**
     * True, if the given base url is an absolute one, false otherwise.
     */
    isAbsolute: boolean;
    /**
     * An object containing all additional attributes of the BaseURL element.
     */
    customAttributes: {}[];
    /**
     * The raw text content of the BaseURL node.
     */
    __text?: string;
}
export interface TimeRange {
    /**
     * The start of the range
     */
    start: number;
    /**
     * The end of the range.
     */
    end: number;
}
export declare enum MediaType {
    Audio = "audio",
    Video = "video",
    /**
     * Not implemented yet.
     * @hidden
     */
    Subtitles = "subtitles",
    /**
     * @hidden
     */
    Thumbnails = "thumbnails"
}
export declare enum BufferType {
    /**
     * Represents the buffered data starting at the current playback time.
     */
    ForwardDuration = "forwardduration",
    /**
     * Represents the buffered data up until the current playback time.
     */
    BackwardDuration = "backwardduration"
}
export interface BufferLevelTargets {
    [BufferType.BackwardDuration]: number;
    [BufferType.ForwardDuration]: number;
}
/**
 * Holds information about the current buffer level.
 */
export interface BufferLevel {
    /**
     * The amount of currently buffered data, relative to the current time of the player.
     * Returns `null` if there is no track for the associated media type.
     */
    level: number | null;
    /**
     * The target buffer level the player tries to maintain for the associated media type.
     */
    targetLevel: number;
    /**
     * The media type the buffer data applies to.
     */
    media: MediaType;
    /**
     * The buffer type the buffer data applies to.
     */
    type: BufferType;
}
export declare enum LogLevel {
    DEBUG = "debug",
    LOG = "log",
    WARN = "warn",
    ERROR = "error",
    OFF = "off"
}
/**
 * A callback function that will be invoked for every message that would be logged to the console regardless of the
 * configured log level.
 * @param level {LogLevel} the log level of the message.
 * @param message {string} the message.
 * @param params {any[]} the parameters passed to the logger call.
 */
export type LogCallback = (logLevel: LogLevel, message: string, ...params: any[]) => void;
/**
 * @hidden
 * Represents the version of a component.
 */
export interface VersionComponents {
    major?: number;
    minor?: number;
    patch?: number;
    channel?: string;
    build?: number;
}
export interface PlayerEventCallback {
    (event: PlayerEventBase): void;
}
/**
 * Information about a given segment.
 */
export interface SegmentInfo {
    /**
     * The full URL of the described segment.
     */
    url: string;
    /**
     * Duration of the segment.
     */
    duration?: number;
    /**
     * Playback time of the beginning of the segment.
     */
    startTime?: number;
}
/**
 * Maps audio and video quality IDs ({@link Quality.id}) to a list of {@link SegmentInfo SegmentInfos}.
 */
export interface SegmentQualityMap {
    [qualityID: string]: SegmentInfo[];
}
/**
 * Maps MIME types to {@link SegmentInfo SegmentInfos}.
 */
export interface SegmentMap {
    [mimeType: string]: SegmentQualityMap;
}
/**
 * @hidden
 */
export interface Id3Metadata {
    frames: Id3Frame[];
}
/**
 * @hidden
 */
export interface Id3Frame {
    key: string;
    data: string | number[];
    info?: string;
}
/**
 * This exception is thrown when the player API is accessed in an invalid state, e.g. after {@link PlayerAPI.destroy}.
 */
export declare class PlayerAPINotAvailableError extends PlayerError {
    constructor(apiName: string);
}
export declare enum ViewMode {
    Inline = "inline",
    Fullscreen = "fullscreen",
    PictureInPicture = "pictureinpicture"
}
export interface ViewModeOptions {
    /**
     * An optional alternative element to be put into {@link ViewMode.Fullscreen} instead of the default player
     * (container) element.
     * @since v8.0
     */
    fullscreenElement?: HTMLElement;
}
/**
 * The mode how supported technologies are determined.
 * @see {@link PlayerAPI.getSupportedTech}
 * @since v8.1.0
 */
export declare enum SupportedTechnologyMode {
    /**
     * Technologies supported by the executing platform.
     */
    Platform = "platform",
    /**
     * Technologies supported by the loaded player modules.
     */
    Modules = "modules",
    /**
     * Technologies supported by the loaded player modules on the executing platform.
     */
    PlatformAndModules = "platformandmodules"
}
/**
 * The static interface of the Bitmovin Player API class that is either available through the global
 * <code>[window.]bitmovin.player.Player</code> namespace or imported as AMD module.
 * The static API provides the constructor for player instances and other static fields as documented.
 */
export interface StaticPlayerAPI {
    /**
     * Creates a new player instance.
     * @param {HTMLElement} containerElement the DOM element container for the player
     * @param {Config} config the player configuration
     * @returns {PlayerAPI} the player instance
     */
    new (containerElement: HTMLElement, config: PlayerConfig): PlayerAPI;
    /**
     * The version number of the player.
     */
    readonly version: string;
    /**
     * Adds a module into the player.
     * @param {object} moduleDefinition - the module object which should be added to the player
     */
    addModule(moduleDefinition: any): void;
    /**
     * Removes a module from the player.
     * @param { ModuleName } name - the module name which should be removed from the player.
     */
    removeModule(name: ModuleName): void;
    /**
     * Gets the list of modules that have been added through {@link addModule}.
     * @returns {ModuleName[]} the list of added modules
     */
    getModules(): ModuleName[];
}
export type Player = StaticPlayerAPI;
export interface PlayerBufferAPI {
    /**
     * Sets the target buffer level for the chosen buffer and media type.
     * @param type The buffer type to change the target buffer level for.
     * @param value The value to set.
     * @param media The media type to change the target buffer level for.
     * @since v8.1
     */
    setTargetLevel(type: BufferType, value: number, media: MediaType): void;
    /**
     * Returns the current and target buffer level for the given buffer type and media type.
     * @param type the buffer type for which to get the buffer level for.
     * @param media the media type for which to get the buffer level for.
     * @since v8.1
     */
    getLevel(type: BufferType, media: MediaType): BufferLevel;
}
export interface LowLatencyAPI {
    /**
     * Returns the current latency in seconds.
     * @since v8.3
     */
    getLatency(): number;
    /**
     * Sets the target latency to be maintained during playback. Causes firing a {@link PlayerEvent.TargetLatencyChanged}
     * event.
     * @param latency the target latency in seconds.
     * @since v8.3
     */
    setTargetLatency(latency: number): void;
    /**
     * Returns the current target latency in seconds.
     * @since v8.3
     */
    getTargetLatency(): number;
    /**
     * Sets the configuration specifying parameters for latency catchup.
     * @param {LowLatencySyncConfig} config the sync configuration for latency catchup.
     * @since v8.3
     */
    setCatchupConfig(config: LowLatencySyncConfig): void;
    /**
     * Returns the current latency sync configuration for catchup.
     * @returns {LowLatencySyncConfig} the catchup sync configuration.
     * @since v8.3
     */
    getCatchupConfig(): LowLatencySyncConfig;
    /**
     * Sets the configuration specifying parameters for latency fallback.
     * @param {LowLatencySyncConfig} config the sync configuration for latency fallback.
     * @since v8.3
     */
    setFallbackConfig(config: LowLatencySyncConfig): void;
    /**
     * Returns the current latency sync configuration for fallback.
     * @returns {LowLatencySyncConfig} the fallback sync configuration.
     * @since v8.3
     */
    getFallbackConfig(): LowLatencySyncConfig;
}
/**
 * Exposes the ability to interact with the adaptation logic after the player has been created.
 */
export interface AdaptationAPI {
    /**
     * Allows updating certain properties of the {@link AdaptationConfig} dynamically after player creation.
     * {@link DynamicAdaptationConfig} defines the specific properties of {@link AdaptationConfig} that can be updated.
     *
     * @param adaptationConfig the updated configuration
     * @since 8.126.0
     */
    setConfig(adaptationConfig: DynamicAdaptationConfig): void;
    /**
     * Returns the current {@link DynamicAdaptationConfig} which is a subset of properties of the {@link AdaptationConfig} that can be dynamically changed through the Adaptation API.
     */
    getConfig(): DynamicAdaptationConfig;
}
export interface DrmAPI {
    /**
     * Starts a DRM license renewal request for the license with the specified ID.
     *
     * Works with PlayReady DRM only. (Widevine DRM is managing license renewals on its own).
     * FairPlay DRM license renewals are not supported yet.
     *
     * @param drmLicenseId The ID of the `DrmLicense` that shall be renewed.
     * @returns A promise that resolves, if the license renewal request was successful and rejects otherwise.
     * @since 8.52
     */
    renewLicense(drmLicenseId: string): Promise<void>;
}
export interface PlayerExports {
    readonly PlayerEvent: typeof PlayerEvent;
    readonly LogLevel: typeof LogLevel;
    readonly HttpRequestType: typeof HttpRequestType;
    readonly HttpResponseType: typeof HttpResponseType;
    readonly HttpRequestMethod: typeof HttpRequestMethod;
    readonly MediaType: typeof MediaType;
    readonly BufferType: typeof BufferType;
    readonly AdQuartile: typeof AdQuartile;
    readonly ViewMode: typeof ViewMode;
    readonly WarningCode: typeof WarningCode;
    readonly ErrorCode: typeof ErrorCode;
    readonly PlayerError: typeof PlayerError;
    readonly PlayerModuleMissingError: typeof PlayerModuleMissingError;
    readonly PlayerAPINotAvailableError: typeof PlayerAPINotAvailableError;
    readonly ModuleName: typeof ModuleName;
    readonly SupportedTechnologyMode: typeof SupportedTechnologyMode;
    readonly PlayerType: typeof PlayerType;
}
/**
 * The mode for getting the player's current time.
 * @see {@link PlayerAPI.getCurrentTime}
 * @since v8.31.0
 */
export declare enum TimeMode {
    /**
     * Returns the relative timestamp of the current playback time.
     * For live streams the beginning of the DVR window at the time of tuning in is defined as 0.
     */
    RelativeTime = "relativetime",
    /**
     * Returns the Unix timestamp of the current playback time.
     * For live stream `EXT-X-PROGRAM-DATE-TIME` tags in HLS manifests are utilized for this value, if present.
     */
    AbsoluteTime = "absolutetime"
}
/**
 * Bitmovin Player instance members.
 */
export interface PlayerAPI {
    /**
     * The version number of the player.
     */
    readonly version: string;
    /**
     * The buffer API namespace.
     */
    readonly buffer: PlayerBufferAPI;
    /**
     * The manifest API namespace.
     */
    readonly manifest: PlayerManifestAPI;
    /**
     * The low latency API namespace.
     */
    readonly lowlatency: LowLatencyAPI;
    /**
     * The adaptation API namespace.
     */
    readonly adaptation: AdaptationAPI;
    /**
     * The advertising API namespace.
     */
    readonly ads: PlayerAdvertisingAPI;
    /**
     * The VR API namespace.
     */
    readonly vr: PlayerVRAPI;
    /**
     * The subtitles API namespace.
     */
    readonly subtitles: PlayerSubtitlesAPI;
    /**
     * The DRM API namespace.
     */
    readonly drm: DrmAPI;
    /**
     * Exports from the player core as a convenience fallback for non-modular code.
     * It is recommended to use ES6 imports instead.
     *
     * Usage:
     *
     * ```ts
     * import { Player } from 'bitmovin-player';
     * const player = new Player(...);
     * player.on(player.exports.Event.Loaded, () => ...);
     * ```
     *
     * Recommended approach:
     *
     * ```ts
     * import { Player, Event } from 'bitmovin-player';
     * const player = new Player(...);
     * player.on(Event.Loaded, () => ...);
     * ```
     *
     * @deprecated It is recommended to use ES6 imports instead
     */
    readonly exports: PlayerExports;
    /**
     * Subscribes an event handler to a player event. This method was called `addEventHandler` in previous
     * player versions.
     *
     * @param eventType The type of event to subscribe to.
     * @param callback The event callback handler that will be called when the event fires.
     * @since v7.8
     */
    on(eventType: PlayerEvent, callback: PlayerEventCallback): void;
    /**
     * Sends custom metadata to a remote receiver app (e.g. Chromecast).
     *
     * @param metadataType The type of the metadata. Currently only 'CAST' is supported.
     * @param metadata The custom data to send to the receiver.
     * @return True if it was successful.
     * @since v4.0
     */
    addMetadata(metadataType: MetadataType.CAST, metadata: any): boolean;
    /**
     * Stops a running Cast session (i.e. {@link isCasting} returns true). Has no effect if {@link isCasting}
     * returns false.
     * @since v4.0
     */
    castStop(): void;
    /**
     * Initiates casting the current video to a Cast-compatible device. The user has to choose the target device.
     * @since v4.0
     */
    castVideo(): void;
    /**
     * Removes all existing query parameters as specified in {@link setQueryParameters} or
     * {@link TweaksConfig.query_parameters}.
     * @since v4.0
     */
    clearQueryParameters(): void;
    /**
     * Unloads the player and removes all inserted HTML elements and event handlers.
     *
     * @return Promise resolves when the player has cleaned up all its event handlers & resources
     * @since v8.0
     */
    destroy(): Promise<void>;
    /**
     * Returns the current aspect ratio of the player, or 0 if there is no style module.
     * Note: the default player aspect ratio is 16:9.
     *
     * @returns A number indicating the player aspect ratio (e.g. 1.6 for 16:10).
     * @since v8.74
     */
    getAspectRatio(): number;
    /**
     * Returns the currently used audio track, or null if no track is active.
     * @since v4.0
     */
    getAudio(): AudioTrack | null;
    /**
     * Returns the seconds of already buffered audio data or null if no audio source is loaded.
     * @deprecated Use {@link PlayerBufferAPI.getLevel} instead.
     */
    getAudioBufferLength(): number | null;
    /**
     * Returns the currently selected audio quality. One of the elements of {@link getAvailableAudioQualities}.
     * @since v7.3.1
     */
    getAudioQuality(): AudioQuality;
    /**
     * Returns an array of all available audio tracks.
     * @since v4.0
     */
    getAvailableAudio(): AudioTrack[];
    /**
     * Returns an array of all available audio qualities the player can adapt between.
     * @since v4.0
     */
    getAvailableAudioQualities(): AudioQuality[];
    /**
     * Returns an array containing all available video qualities the player can adapt between.
     * @since v4.0
     */
    getAvailableVideoQualities(): VideoQuality[];
    /**
     * Returns the config object of the current player instance.
     *
     * @param mergedConfig true to return the config expanded with all default values, false to return the user
     *   config passed to the player's constructor.
     * @return The current user or merged player config.
     * @since v4.0
     */
    getConfig(mergedConfig?: boolean): PlayerConfig;
    /**
     * Returns the html element that the player is embedded in, which has been provided in the player constructor.
     * @since v8.0
     */
    getContainer(): HTMLElement;
    /**
     * Returns the current playback time in seconds of the video.
     * @param mode The mode to decide if the returned time should be absolute or relative, see {@link TimeMode}.
     *   Default mode is absolute.
     * @since v4.0
     */
    getCurrentTime(mode?: TimeMode): number;
    /**
     * Returns data about the last downloaded audio segment.
     * @since v4.0
     */
    getDownloadedAudioData(): DownloadedAudioData;
    /**
     * Returns data about the last downloaded video segment.
     * @since v4.0
     */
    getDownloadedVideoData(): DownloadedVideoData;
    /**
     * Returns the total number of dropped video frames since playback started.
     * @since v8.0
     */
    getDroppedVideoFrames(): number;
    /**
     * Returns the total duration in seconds of the current video or `Infinity` if it’s a live stream.
     * @since v4.0
     */
    getDuration(): number;
    /**
     * Returns the used DASH or HLS manifest file.
     *
     * Previous player versions (v4.2-v7.0) returned an object for DASH and a string for HLS, this has been corrected
     * in v7.1.
     *
     * @since v7.1
     */
    getManifest(): string;
    /**
     * Returns the limit in seconds for time shift. Is either negative or 0 and applicable to live streams only.
     * @since v4.0
     */
    getMaxTimeShift(): number;
    /**
     * Returns data about the currently playing audio segment.
     * @since v4.0
     */
    getPlaybackAudioData(): AudioQuality;
    /**
     * Returns the current playback speed of the player. 1 is the default playback speed, values
     * between 0 and 1 refer to slow motion and values greater than 1 refer to fast forward. Values less or
     * equal zero are ignored.
     * @since v4.0
     */
    getPlaybackSpeed(): number;
    /**
     * Returns data about the currently playing video segment.
     * @since v4.0
     */
    getPlaybackVideoData(): VideoQuality;
    /**
     * Returns the currently used rendering mode. See {@link PlayerType} for details of the valid values.
     * @since v4.0
     */
    getPlayerType(): PlayerType;
    /**
     * Creates a snapshot of the current video frame.
     * Snapshots cannot be taken from DRM protected content.
     *
     * @param type The type of image snapshot to capture. Allowed values are 'image/jpeg' and 'image/webp'.
     * @param quality A number between 0 and 1 indicating the image quality.
     * @since v4.0
     */
    getSnapshot(type?: string, quality?: number): Snapshot | undefined;
    /**
     * Returns the currently used streaming technology. See {@link StreamType} for details of the valid values.
     * @since v4.0
     */
    getStreamType(): StreamType;
    /**
     * Tests and retrieves a list of all supported DRM systems in the current user agent.
     * @returns A Promise that resolves to an array of strings with the supported DRM systems after fulfillment.
     * Should never be rejected.
     * @since v4.1
     */
    getSupportedDRM(): Promise<string[]>;
    /**
     * Returns an array of objects denoting a player and streaming technology combination. By default, this
     * returns the combinations supported on the current platform ({@link SupportedTechnologyMode.Platform}),
     * ordered by descending priority which will be used to play a stream.
     * @since v4.0
     * @param mode the mode by which the supported technologies are determined
     */
    getSupportedTech(mode?: SupportedTechnologyMode): Technology[];
    /**
     * Returns a thumbnail image for a certain time or null if there is no thumbnail available.
     * Requires a configured thumbnails track in {@link SourceConfig.thumbnailTrack}.
     * @param time the media time for which the thumbnail should be returned
     * @returns A thumbnail if a thumbnails track is configured and a thumbnail exists for the specified time, else null
     * @since v8.0
     */
    getThumbnail(time: number): Thumbnail | null;
    /**
     * Returns the current time shift offset to the live edge in seconds. Only applicable to live streams.
     * @since v4.0
     */
    getTimeShift(): number;
    /**
     * Returns the stalled time in seconds since playback started.
     * @since v4.0
     */
    getTotalStalledTime(): number;
    /**
     * Returns the seconds of already buffered video data or null if no video source is loaded.
     * @deprecated Use {@link PlayerBufferAPI.getLevel} instead.
     */
    getVideoBufferLength(): number | null;
    /**
     * Returns the currently selected video quality, if the user manually selected one. In this case it returns one of
     * the elements of {@link getAvailableVideoQualities}.
     *
     * In case the user did not select a video quality it returns `auto`.
     * @since v7.3.1
     */
    getVideoQuality(): VideoQuality;
    /**
     * Returns the player’s volume between 0 (silent) and 100 (max volume).
     * @since v4.0
     */
    getVolume(): number;
    /**
     * Returns true if the video has ended.
     * @since v4.0
     */
    hasEnded(): boolean;
    /**
     * Returns true if casting to another device (such as a ChromeCast) is available, otherwise false.
     * Please note that this function only returns true after the {@link PlayerEvent.CastAvailable} event has fired.
     * @since v5.2
     */
    isCastAvailable(): boolean;
    /**
     * Returns true if the video is currently casted to a device and not played in the browser,
     * or false if the video is played locally.
     * @since v4.0
     */
    isCasting(): boolean;
    /**
     * Checks if a DRM system is supported in the current user agent.
     *
     * @param drmSystem A KeySystem string to test against
     * @returns Resolves with the DRM system string if it is supported, or rejects with an error message if not
     * @since v4.1
     */
    isDRMSupported(drmSystem: string): Promise<string>;
    /**
     * Return true if the displayed video is a live stream.
     * @since v4.0
     */
    isLive(): boolean;
    /**
     * Returns true if the player has been muted.
     * @since v4.0
     */
    isMuted(): boolean;
    /**
     * Returns true if the player has started playback but is currently paused.
     * @since v4.0
     */
    isPaused(): boolean;
    /**
     * Returns true if the player is currently playing, i.e. has started and is not paused.
     * @since v4.0
     */
    isPlaying(): boolean;
    /**
     * Returns true if the player is currently stalling due to an empty buffer.
     * @since v4.0
     */
    isStalled(): boolean;
    /**
     * Sets a new video source and returns a promise which resolves to the player.
     *
     * @param source The source the player should load.
     * @param forceTechnology Forces the player to use the specified playback and streaming technology. The specified
     * technologies have to be separated by a period (e.g. 'html5.hls'). A list of valid combinations can be retrieved
     * by calling {@link getSupportedTech}.
     * @param disableSeeking If set, seeking will be disabled
     * @since v4.0
     */
    load(source: SourceConfig, forceTechnology?: string, disableSeeking?: boolean): Promise<void>;
    /**
     * Mutes the player if an audio track is available. Has no effect if the player is already muted.
     *
     * @param issuer The issuer of the API call that will be passed to events triggered by this call
     * @since v4.0
     */
    mute(issuer?: string): void;
    /**
     * Pauses the video if it is playing. Has no effect if the player is already paused.
     *
     * @param issuer The issuer of the API call that will be passed to events triggered by this call
     * @since v4.0
     */
    pause(issuer?: string): void;
    /**
     * Starts playback or resumes after being paused. No need to call it if the player is setup with
     * autoplay attribute ({@link PlaybackConfig.autoplay}). Has no effect if the player is already playing.
     * @returns a Promise which resolves as soon as playback has actually started. This promise can reject
     * if play is prohibited by the browser (a missing user interaction for example)
     * @param issuer The issuer of the API call that will be passed to events triggered by this call
     * @since v4.0
     */
    play(issuer?: string): Promise<void>;
    /**
     * Removes a handler for a player event. This method was called `removeEventHandler` in previous
     * player versions.
     *
     * @param eventType The event to remove the handler from
     * @param callback The callback handler to remove
     * @since v7.8
     */
    off(eventType: PlayerEvent, callback: PlayerEventCallback): void;
    /**
     * Returns the time range that is currently valid for seeking.
     * @since v7.1
     */
    getSeekableRange(): TimeRange;
    /**
     * Seeks to the given playback time specified by the parameter time in seconds. Must not be greater
     * than the total duration of the video. Has no effect when watching a live stream as seeking is
     * not possible.
     *
     * @param time The time to seek to
     * @param issuer The issuer of the API call that will be passed to events triggered by this call
     * @since v4.0
     */
    seek(time: number, issuer?: string): boolean;
    /**
     * Modifies the current aspect ratio of the player. Can be used to override the {@link StyleConfig.aspectratio}
     * that is optionally passed during player initialization. Has no effect if the player has also been configured
     * to have a fixed {@link StyleConfig.width} and {@link StyleConfig.height}: in general, no more than two options
     * among `width`, `height`, and `aspectratio` should be provided to the player.
     *
     * @param aspectratio The desired aspect ratio for the player. It can be a string (e.g. '16:9' or '16/9'), or
     * a number (e.g 1.6 for 16:10).
     * @since v8.74
     */
    setAspectRatio(aspectratio: string | number): void;
    /**
     * Sets the audio track to the ID specified by trackID.
     * Available tracks can be retrieved with {@link getAvailableAudio}.
     *
     * @param trackID The ID of the audio track to activate
     * @since v4.0
     */
    setAudio(trackID: string): void;
    /**
     * Manually sets the audio stream to a fixed quality, identified by ID. Has to be an ID defined in
     * the MPD or the keyword 'auto'. Auto resets to dynamic switching. A list with valid IDs can be
     * retrieved by calling {@link getAvailableAudioQualities}.
     *
     * @param audioQualityID The ID of the desired audio quality or 'auto' for dynamic switching
     * @since v4.0
     */
    setAudioQuality(audioQualityID: string): void;
    /**
     * Sets authentication data which is sent along with the licensing call. Can be used to add more
     * information for a 3rd party licensing backend. The data be any type or object as needed by the
     * 3rd party licensing backend.
     *
     * @param customData Data which should be sent with the licensing call
     * @since v4.2
     */
    setAuthentication(customData: any): void;
    /**
     * [<i>HTML5 only</i>]
     * Sets the playback speed of the player. Fast forward as well as slow motion is supported.
     * Slow motion is used by values between 0 and 1, fast forward by values greater than 1.
     *
     * @see {@link getPlaybackSpeed}
     * @param speed A playback speed factor greater than 0
     * @since v4.0
     */
    setPlaybackSpeed(speed: number): void;
    /**
     * Sets a poster image. Will be displayed immediately, even if a video stream is playing.
     *
     * @param url The URL to the poster image
     * @param keepPersistent Flag to set the poster image persistent so it is also displayed during playback (useful
     *   for audio-only playback)
     * @since v4.3
     */
    setPosterImage(url: string, keepPersistent: boolean): void;
    /**
     * Adds GET parameters to all request URLs (e.g. manifest, media segments, subtitle files, …).
     * The queryParameters should be an object with key value pairs, where the keys are used as
     * parameter name and the values as parameter values.
     *
     * @param queryParameters The list of query parameter key/value pairs
     * @since v4.1
     */
    setQueryParameters(queryParameters: QueryParameters): void;
    /**
     * Passes an HTML video element to the player, which should be used in case of Html5 or Native playback.
     * Needs to be called before {@link load}.
     *
     * @param videoElement The HTML video element to use
     * @since v5.1
     */
    setVideoElement(videoElement: HTMLElement): void;
    /**
     * Manually sets the video stream to a fixed quality, identified by ID. Has to be an ID defined in
     * the MPD or the keyword 'auto'. Auto resets to dynamic switching. A list with valid IDs can be retrieved
     * by calling {@link getAvailableVideoQualities}.
     *
     * @param videoQualityID ID defined in the MPD or 'auto'
     * @since v4.0
     */
    setVideoQuality(videoQualityID: string): void;
    /**
     * Sets the player’s volume in the range of 0 (silent) to 100 (max volume). Unmutes a muted player.
     *
     * @param volume The volume to set between 0 and 100
     * @param issuer The issuer of the API call that will be passed to events triggered by this call
     * @since v4.0
     */
    setVolume(volume: number, issuer?: string): void;
    /**
     * Shifts the time to the given offset in seconds from the live edge. Has to be within {@link getMaxTimeShift}
     * (which is a negative value) and 0. Only works in live streams.
     * <span class='highlight'>[new in v4.3]</span>: The offset can be positive and is then interpreted as a UNIX
     * timestamp in seconds. The value has to be within the timeShift window as specified by {@link getMaxTimeShift}.
     *
     * @param offset The offset to timeshift to
     * @param issuer The issuer of the API call that will be passed to events triggered by this call
     * @since v4.0
     */
    timeShift(offset: number, issuer?: string): void;
    /**
     * Unloads the current video source.
     * @since v4.0
     */
    unload(): Promise<void>;
    /**
     * Unmutes the player if muted.
     *
     * @param issuer The issuer of the API call that will be passed to events triggered by this call
     * @since v4.0
     */
    unmute(issuer?: string): void;
    /**
     * Checks if Apple AirPlay support is available.
     * @since v7.1
     */
    isAirplayAvailable(): boolean;
    /**
     * Checks if Apple Airplay is enabled.
     * @since v7.8.4
     */
    isAirplayActive(): boolean;
    /**
     * Shows the airplay playback target picker.
     * @since v7.1
     */
    showAirplayTargetPicker(): void;
    /**
     * Returns the currently buffered time ranges of the video element.
     * @since v6.1
     */
    getBufferedRanges(): TimeRange[];
    /**
     * Returns infos for segments that can be requested by the player
     * @returns {SegmentMap}
     * @since v7.2
     */
    getAvailableSegments(): SegmentMap;
    /**
     * Starts preloading the content of the currently loaded source.
     * @since v6.1
     */
    preload(): void;
    /**
     * Sets the level of player log outputs.
     * @param level Log level, allowed values are "debug", "log", "warn", "error" and "off"
     * @since v6.1
     */
    setLogLevel(level: LogLevel): void;
    /**
     * Returns the used HTML5 video element.
     *
     * @returns The HTML5 video element which is used by the player
     */
    getVideoElement(): HTMLVideoElement;
    /**
     * Tests if a particular {@link ViewMode} is available for selection with {@link setViewMode}.
     * @param {ViewMode} viewMode the view mode to test
     * @returns {boolean} `true` if the tested view mode is available, else `false`
     * @since v8.0
     */
    isViewModeAvailable(viewMode: ViewMode): boolean;
    /**
     * Sets the player to a particular {@link ViewMode}. Will only work if the selected view mode is available and
     * {@link isViewModeAvailable} returns `true`, else this call will be ignored. If successful, a
     * {@link PlayerEvent.ViewModeChanged} will be fired.
     * @param {ViewMode} viewMode the view mode to switch the player into
     * @param {ViewModeOptions} options additional optional parameters for view modes
     * @since v8.0
     */
    setViewMode(viewMode: ViewMode, options?: ViewModeOptions): void;
    /**
     * Gets the active {@link ViewMode}.
     * @returns {ViewMode} the view mode that is currently active
     * @since v8.0
     */
    getViewMode(): ViewMode;
    /**
     * Gets the source that was loaded via a successfully finished {@link load} call or `null` if no source is loaded
     * or a load is in progress.
     * @returns {SourceConfig | null} the loaded source or `null` if no source is loaded
     */
    getSource(): SourceConfig | null;
}
