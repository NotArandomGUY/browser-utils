import type { AdInteractionType, AdQuartile, PlayerEvent } from '../core/Events';
import type { WarningCode, WarningEventData } from '../core/Export';
import type { PlayerEventCallback } from '../core/PlayerAPI';
import type { AdConfig, AdTagPlaceholders, LinearAdUiConfig, RestrictStrategy, Trackers } from './ConfigAPI';
export interface PlayerAdvertisingAPI {
    /**
     * Schedules resulting ad break(s) of an ad config for playback.
     *
     * @param adConfig The ad configuration used to schedule one or more ad breaks.
     * @since v8.0
     * @return Promise that resolves with the ad breaks that were scheduled as a result of the given ad config.
     */
    schedule(adConfig: AdConfig): Promise<AdBreak[]>;
    /**
     * Skips the current ad. Has no effect if the ad is not skippable, if no ad is active or if the IMA module is used (disabled by IMA in version [3.607.0](https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/history)).
     * @since v8.0
     * @return Promise that resolves when the ad has been skipped and the ad player is done with cleanup of events and states.
     */
    skip(): Promise<void>;
    /**
     * Returns all scheduled ad breaks.
     *
     * @since v8.0
     * @return Array containing all the scheduled ad breaks.
     */
    list(): AdBreak[];
    /**
     * Returns the currently active ad break.
     *
     * @since v8.0
     * @return AdBreak
     */
    getActiveAdBreak(): AdBreak;
    /**
     * Returns the currently active ad.
     *
     * @since v8.1
     */
    getActiveAd(): Ad;
    /**
     * Discards all scheduled ad breaks with the given ID. Also stops the current ad break if it has the same ID.
     *
     * @param adBreakId The ID of the ad break which shall be removed from the scheduled ad breaks.
     * @since v8.0
     */
    discardAdBreak(adBreakId: string): void;
    /**
     * Returns true if a linear ad is currently active (playing or paused). Returns false otherwise.
     *
     * @since v8.0
     */
    isLinearAdActive(): boolean;
    /**
     * Returns the name and version of the currently used advertising module.
     *
     * @since v8.1
     */
    getModuleInfo(): ModuleInfo;
}
export interface ModuleInfo {
    name: string;
    version: string;
}
/**
 * @hidden
 */
export interface AdvertisingModuleConfig {
    /**
     * Specifies the amount of milliseconds before the loading of an ad from a given ad manifest times out.
     * Default is 8000.
     */
    videoLoadTimeout: number;
    /**
     * Defines an object with two functions which will be called if an ad break is about to start or when ads are seeked
     * over.
     */
    strategy: RestrictStrategy;
    /**
     * Specifies whether to send credentials such as cookies or authorization headers along with the ad requests. The
     * server needs to explicitly accept them for CORS requests, otherwise the request will fail.
     * Default is `true`.
     */
    withCredentials?: boolean;
    /**
     * Defines a function which returns a container that is used for displaying ads.
     */
    adContainer?: () => HTMLElement;
    /**
     * Defines a function which returns an array of containers for the ad module to fill with companion ads.
     */
    companionAdContainers?: () => HTMLElement[];
    /**
     * List of placeholder strings that will be replaced in the ad manifest URL with the corresponding values.
     * @since 8.1.0
     */
    placeholders?: AdTagPlaceholders;
    /**
     * Receives quality that would be picked by player and list of all available
     * qualities and returns selected quality.
     */
    onSelectAdQuality?: (suggested: AdMediaFileQuality, available: AdMediaFileQuality[]) => AdMediaFileQuality;
    /**
     * Use a fallback handling for VAST ad pods which restricts fallback to standalone ads which are bound to the
     * current ad pods sequence number.
     * Default is false.
     *
     * @since 8.53.0
     */
    freewheelVastFallbackHandling?: boolean;
    /**
     * Defines tracker configurations for the relevant packages such
     * as the Open measurement which will be loaded to provide
     * additional tracking information for ads.
     */
    trackers?: Trackers;
    /**
     * When set to true, the ad module will never write anything to the browser's `localStorage`.
     *
     * @since v8.91.0
     */
    disableStorageApi?: boolean;
}
export interface DownloadTiming {
    /**
     * The total time it took for the ad manifest to be downloaded in seconds.
     */
    downloadTime: number;
    /**
     * The time-to-first-byte for the ad manifest request in seconds.
     */
    timeToFirstByte?: number;
}
export interface AdvertisingError {
    code: number;
    message?: string;
    adConfig?: AdConfig;
}
/**
 * @hidden
 */
export interface AdPlaybackAPI {
    /**
     * Returns an ad player which can be used to play back linear ads.
     *
     * As {@link AdPlayerAPI} or {@link AdPlaybackReportingAPI} must not be used at the same time,
     * the `Promise` will be rejected if `requestReporter()` was already called but `done()`
     * was not called.
     *
     * Can only be used to play back one ad.
     */
    requestPlayer(): Promise<AdPlayerAPI>;
    /**
     * Returns an ad playback reporter for publishing information about ad playback back
     * to the player.
     *
     * As `AdPlayerAPI` or `AdPlaybackReportingAPI` must not be used at the same time,
     * the Promise will be rejected if `requestPlayer()` was already called but `done()`
     * was not called.
     */
    requestReporter(): Promise<AdPlaybackReportingAPI>;
    /**
     * Finishes the ad break and resumes the main content if `restoreContent` is omitted or is set to `true`. Setting it
     * to `false` will finish the ad break and not restore the main content. This is useful if another ad break will be
     * immediately requested after calling `done()`.
     *
     * Resolves when the main content is restored if `restoreContent` is `true` or immediately when it is set to `false`.
     */
    done(restoreContent?: boolean): Promise<void>;
}
/**
 * @hidden
 *
 * A delegate which wraps the Player and provides advertising-related functions for the Advertising Module.
 * // TODO: Make public when the AdvertisingModule API is final.
 */
export interface PlayerDelegate {
    /**
     * Returns the video element of the main content.
     */
    getVideoElement(): HTMLVideoElement;
    /**
     * Returns the current volume level of the content video player.
     * @returns {number}
     */
    getVolume(): number;
    /**
     * Takes various formats of timing information like 'pre', '10', '25%' etc. and returns the position as a number.
     * @returns {number}
     */
    parsePosition(position: string): number;
    /**
     * Returns the best quality from a given set of qualities based on the player's current ABR information.
     * The selection is based on the qualities' bitrate, if present, while `width` and `height` are used as a fallback.
     */
    selectMediaFile(adMediaFiles: AdMediaFileQuality[]): AdMediaFileQuality;
    /**
     * Fires an {@link AdManifestLoaded} event for the given AdBreak or AdConfig when called.
     * @param {AdBreak | AdConfig} adInformation The AdBreak or AdConfig for which metadata was loaded.
     * @param {DownloadTiming} downloadTiming Timing information for the corresponding ad manifest request.
     */
    metadataLoaded(adInformation: AdBreak | AdConfig, downloadTiming?: DownloadTiming): void;
    /**
     * Requests an ad break which pauses content playback and enables linear ad playback.
     *
     * @param adBreak
     */
    requestAdPlayback(adBreak: AdBreak): Promise<AdPlaybackAPI>;
    /**
     * Fires an {@link OverlayAdStarted} event for the given ad when called.
     */
    overlayAdStarted(ad: Ad): void;
    /**
     * Fires an {@link AdClicked} event for the given clickThroughUrl.
     */
    adClicked(clickThroughUrl: string): void;
    /**
     * Fires an {@link AdInteraction} event for the given interaction id and type.
     */
    adInteraction(interactionType: AdInteractionType, id?: string): void;
    /**
     * Fires an {@link AdQuartile} event.
     */
    onQuartile(quartile: AdQuartile): void;
    /**
     * Fires an {@link AdError} event with an attached {@link AdvertisingError}.
     * @param {number} code The AdvertisingModule-specific error code.
     * @param {string} message An optional message to display alongside the error event
     * @param {AdConfig} adConfig The AdConfig that caused the error.
     */
    onError(code: number, message?: string, adConfig?: AdConfig): void;
    /**
     * Fires a {@link Warning} event.
     * @param code - The code of the respective warning
     * @param message - A message to describe what happened
     * @param data - An object to be exposed for additional information
     */
    onWarning(code: WarningCode, message?: string, data?: WarningEventData): void;
}
/**
 * @hidden
 */
export type AdPlayerEvent = PlayerEvent.PlaybackFinished | PlayerEvent.Error;
/**
 * @hidden
 *
 * Player that can be used to play back linear ads. There can only be one active ad at a time. The ad is considered
 * active between calls to `load` and `done`.
 */
export interface AdPlayerAPI {
    readonly duration: number;
    readonly currentTime: number;
    readonly paused: boolean;
    muted: boolean;
    volume: number;
    /**
     * Subscribe to ad-related events defined in {@link AdPlayerEvent}.
     */
    on(event: AdPlayerEvent, callback: PlayerEventCallback): void;
    /**
     * Loads an ad and starts the playback. Resolves when the ad playback has started.
     */
    load(ad: LinearAd): Promise<void>;
    /**
     * Pauses the ad playback.
     */
    pause(): void;
    /**
     * Resumes the ad playback.
     */
    play(): Promise<void>;
    /**
     * Signals that the current ad has finished playback
     * @return Promise that resolves when the clean up of event handlers and source states is done after the ad finished.
     */
    done(): Promise<void>;
}
/**
 * @hidden
 */
export interface AdPlaybackReportingAPI {
    /**
     * Video element which can be used to play back the ad.
     */
    readonly videoElement: HTMLVideoElement;
    /**
     * Signals that an ad has started.
     */
    started(ad: Ad): void;
    /**
     * Signals that the ad is paused.
     * @param {number} pausedTime
     */
    paused(pausedTime: number): void;
    /**
     * Signals that the ad has resumed playback.
     * @param {number} resumedTime
     */
    resumed(resumedTime: number): void;
    /**
     * Signals that the playback time of the ad has progressed.
     */
    timeupdate(time: number): void;
    /**
     * Signal that the ad passed in {@link started} was skipped.
     */
    skipped(): void;
    /**
     * Signals that the ad passed in {@link started} is finished.
     * @return Promise that resolves when the clean up of event handlers and source states is done and the ad is finished.
     */
    done(): Promise<void>;
}
export interface AdBreak extends AdConfig {
    /**
     * The `id` of the corresponding `AdBreakConfig`.
     * If the `AdBreak` was generated out of a VMAP tag, then the ID present in the
     * VMAP tag will be taken. If none is present in the VMAP tag, it will be generated.
     */
    id: string;
    /**
     * The time in seconds in the media timeline the `AdBreak` is scheduled for.
     */
    scheduleTime: number;
    /**
     * The ads scheduled for this `AdBreak`.
     */
    ads?: Ad[];
}
export declare enum VmapTrackingEventType {
    BreakStart = "breakstart",
    BreakEnd = "breakend",
    Error = "error"
}
export interface VmapTrackingEvent {
    /**
     * The tracking event type as defined by {@link VmapTrackingEventType}.
     */
    type: VmapTrackingEventType;
    /**
     * The URL to be requested by this tracking event.
     */
    url: string;
}
/**
 * Defines basic properties available for every ad type
 */
export interface Ad {
    /**
     * Determines whether an ad is linear, i.e. playback of main content needs to be paused for the ad.
     */
    isLinear: boolean;
    /**
     * The width of the ad.
     */
    width: number;
    /**
     * The height of the ad.
     */
    height: number;
    /**
     * Identifier for the ad. This might be autogenerated.
     */
    id?: string;
    /**
     * The corresponding media file for the ad.
     */
    mediaFileUrl?: string;
    /**
     * The CompanionAds that should be served with the ad.
     */
    companionAds?: CompanionAd[];
    /**
     * The parsed Verification tags of the corresponding AdVerifications tag. Every tag is handled as an array and the
     * property names are the exact same as the tag/attribute names found in the manifest (case-sensitive). The text
     * content of a tag is saved to a `content` property.
     */
    verifications?: any[];
    /**
     * The parsed custom Extension tags
     * @since 8.39.0
     */
    extensions?: VastAdExtension[];
    /**
     * The url the user should be redirected to when clicking the ad.
     */
    clickThroughUrl?: string;
    /**
     * Callback function to track the opening of the clickThroughUrl.
     */
    clickThroughUrlOpened?: () => void;
    /**
     * Holds various additional ad data.
     */
    data?: AdData;
}
/**
 * Defines a linear ad which requires the playback of the content to stop
 */
export interface LinearAd extends Ad {
    /**
     * The duration of the ad.
     */
    duration: number;
    /**
     * Specifies whether the ad is skippable or not.
     *
     * @deprecated - This will be removed with player version 9. This can be inferred from `skippableAfter`
     */
    skippable?: boolean;
    /**
     * Time in seconds, after which the ad is skippable. The ad is not skippable if this property is not set.
     */
    skippableAfter?: number;
    /**
     * Holds relevant information for displaying the ad.
     */
    uiConfig?: LinearAdUiConfig;
}
/**
 * Ad which gets displayed during content playback
 */
export interface OverlayAd extends Ad {
}
/**
 * Ad which gets displayed in combination with a linear or overlay ad
 */
export interface CompanionAd {
    /**
     * The width of the companion ad.
     */
    width: number;
    /**
     * The height of the companion ad.
     */
    height: number;
}
export interface UniversalAdId {
    /**
     * The registry website where the unique creative ID is cataloged. Default value is 'unknown'.
     */
    idRegistry: string;
    /**
     * The unique creative identifier. Default value is 'unknown'.
     */
    value: string;
}
export interface AdSystem {
    /**
     * The name of the ad system that returned the ad.
     */
    name: string;
    /**
     * The version number of the ad system that returned the ad.
     */
    version?: string;
}
export interface Advertiser {
    /**
     * The name of the advertiser as defined by the ad serving party.
     */
    name: string;
    /**
     * An identifier for the advertiser, provided by the ad server.
     */
    id?: string;
}
export interface Creative {
    /**
     * Identifies the ad server that provides the creative. Specified in `Creative.id` in the VAST response.
     */
    id?: string;
    /**
     * The ad server's unique identifier for the creative. Specified in `Creative.adId` in the VAST response.
     */
    adId?: string;
    /**
     * A unique creative identifier that is maintained across systems. Specified in `Creative.UniversalAdId` in the
     * VAST response.
     */
    universalAdId?: UniversalAdId;
}
export interface AdPricing {
    /**
     * A numerical value that represents a price that can be used in real-time bidding systems.
     */
    value: number;
    /**
     * Identifies the pricing model as one of: CPM, CPC, CPE, or CPV.
     */
    model: string;
    /**
     * The three-letter ISO-4217 currency symbol that identifies the currency of the value provided (e.g. USD, GBP, etc.).
     */
    currency: string;
}
export interface AdSurvey {
    /**
     * A URI to any resource relating to an integrated survey.
     */
    uri: string;
    /**
     * The MIME type of the resource being served.
     */
    type?: string;
}
/**
 * Holds various additional ad data. Refer to {@link "Advertising.Ima".ImaAdData | ImaAdData} or
 * {@link "Advertising.Bitmovin".BitmovinAdData | BitmovinAdData} for more information on what
 * additional data is available when using our Google IMA SDK implementation or our native VAST implementation.
 */
export interface AdData {
    /**
     * The MIME type of the media file or creative as defined in the VAST response.
     */
    mimeType?: string;
    /**
     * The average bitrate of the progressive media file as defined in the VAST response.
     */
    bitrate?: number;
    /**
     * The minimum bitrate of the streaming media file as defined in the VAST response.
     */
    minBitrate?: number;
    /**
     * The maximum bitrate of the streaming media file as defined in the VAST response.
     */
    maxBitrate?: number;
}
export interface VastAdData extends AdData {
    /**
     * A common name for the ad. Specified in `InLine.AdTitle` in the VAST response.
     */
    adTitle?: string;
    /**
     * The ad system that returned the ad. Specified in `InLine.AdSystem` in the VAST response.
     */
    adSystem?: AdSystem;
    /**
     * The IDs of the `Wrapper` ads, starting at the `InLine` ad and ending at the outermost `Wrapper` ad. Contains an
     * empty array if there are no `Wrapper` ads.
     */
    wrapperAdIds?: string[];
    /**
     * A longer description of the ad. Specified in `InLine.Description` in the VAST response.
     */
    adDescription?: string;
    /**
     * The advertiser as defined by the ad serving party. Specified in `InLine.Advertiser` in the VAST response.
     */
    advertiser?: Advertiser;
    /**
     * Identifies the API needed to execute an interactive media file or communicate with the creative. Specified in
     * `MediaFile.apiFramework` for linear ads or `NonLinear.apiFramework` for non-linear ads in the VAST response.
     */
    apiFramework?: string;
    /**
     * Contains various data about the `Creative`. Specified in `InLine.Creative` or `Wrapper.Creative` in the
     * VAST Response.
     */
    creative?: Creative;
    /**
     * The media file ID. Specified in `MediaFile.id` in the VAST response.
     */
    mediaFileId?: string;
    /**
     * Either 'progressive' for progressive download protocols or 'streaming' for streaming protocols. Specified in
     * `MediaFile.delivery` in the VAST response.
     */
    delivery?: string;
    /**
     * The codec used to encode the file which can take values as specified by https://tools.ietf.org/html/rfc4281.
     * Specified in `MediaFile.codec` in the VAST response.
     */
    codec?: string;
    /**
     * The minimum suggested duration that the creative should be displayed. Specified in `NonLinear.minSuggestedDuration`
     * in the VAST response.
     */
    minSuggestedDuration?: number;
    /**
     * Used to provide a value that represents a price that can be used by real-time bidding (RTB) systems. Specified
     * in `Inline.Pricing` in the VAST response.
     */
    pricing?: AdPricing;
    /**
     * URI to any resource relating to an integrated survey. Specified in `InLine.Survey` in the VAST response.
     */
    survey?: AdSurvey;
}
export interface AdMediaFileQuality {
    /**
     * height of the ad media file.
     */
    height: number;
    /**
     * width of the ad media file.
     */
    width: number;
    /**
     * bitrate of ad media file.
     */
    bitrate?: number;
    /**
     * maximum bitrate of ad media file.
     */
    maxBitrate?: number;
    /**
     * minimum bitrate of ad media file.
     */
    minBitrate?: number;
}
export interface VastAdExtension {
    /**
     * The attributes of the tag
     */
    attributes: VastAdExtensionAttributes;
    /**
     * The nested children of the tag
     */
    children: VastAdExtension[];
    /**
     * The name of the tag
     */
    name: string;
    /**
     * The value of the tag
     */
    value: string;
}
export interface VastAdExtensionAttributes {
    [key: string]: string;
}
