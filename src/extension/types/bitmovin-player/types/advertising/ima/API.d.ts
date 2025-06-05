import type { AdBreak, AdvertisingModuleConfig, VastAdData, VmapTrackingEvent } from '../API';
import type { AdBreakConfig, AdTag, AdTagConfig, AdvertisingConfig } from '../ConfigAPI';
export declare enum ImaPassthroughMode {
    /**
     * Ad tags will be downloaded by the Player in order to provide advanced features like preloading ad tags and
     * VAST 4.1 `AdVerifications` parsing.
     */
    None = "none",
    /**
     * VAST tags will be downloaded by the IMA SDK, which will deactivate some features that are available with
     * {@link ImaPassthroughMode.None}:
     * - {@link ImaAdBreakConfig.preloadOffset} will not work
     * - {@link VastResponse.manifest} and {@link Advertising.Ad.verifications} will not be available
     * - {@link Core.AdManifestLoadedEvent.downloadTiming} will not be as accurate (higher)
     */
    Vast = "vast",
    /**
     * In addition to {@link ImaPassthroughMode.Vast}, VMAP tags will also be downloaded by the IMA SDK. This will lead to
     * the Advertising API being severely limited for VMAP tags:
     * - Ad breaks will not be reflected via {@link Advertising.PlayerAdvertisingAPI.list}
     * - {@link Advertising.PlayerAdvertisingAPI.discardAdBreak} will not be supported
     * - {@link Core.AdManifestLoadedEvent.downloadTiming} will not be supported
     * - VMAP tracking will not work
     * - VAST ad tags can not be scheduled anymore after a VMAP tag has sucessfully been loaded by the IMA SDK
     * - Consistent event order can not be guaranteed
     *
     * This mode should only be used if absolutely necessary.
     */
    VastAndVmap = "vastandvmap"
}
export interface ImaAdTagConfig extends AdTagConfig {
    /**
     * Indicates which ad tags should be downloaded by the IMA SDK instead of by the Player. This can be helpful if
     * ad servers expect the IMA SDK to add some specific parameters to the request.
     */
    passthroughMode?: ImaPassthroughMode;
}
export interface ImaAdBreakConfig extends AdBreakConfig, ImaAdTagConfig {
}
export interface VastResponse {
    /**
     * The VAST XML string that was returned by the ad server.
     * If {@link ImaPassthroughMode.Vast} or {@link ImaPassthroughMode.VastAndVmap} is used, this information will not be
     * available.
     */
    manifest?: string;
}
/**
 * Ad break returned by the IMA advertising module.
 */
export interface ImaAdBreak extends AdBreak, ImaAdBreakConfig {
    /**
     * Used internally for keeping track of the current fallback index when doing ad-waterfalling.
     * @hidden
     */
    currentFallbackIndex?: number;
    /**
     * Specifies that the AdBreak is already played back and should not play back again.
     * @hidden
     */
    isScheduled?: boolean;
    /**
     * Specifies the ad tag of the parent VMAP from which current VAST tag are parsed.
     * @hidden
     */
    parentAdTag?: AdTag;
    /**
     * The VAST response of the specified ad tag.
     */
    vastResponse?: Promise<VastResponse>;
    /**
     * Contains the extracted VMAP tracking URLs associated with the ad break.
     */
    trackingEvents?: VmapTrackingEvent[];
}
export declare namespace google {
    /**
     * The Google IMA SDK for HTML5 V3 allows developers to request and track VAST ads in a HTML5 video environment. For
     * platform compatibility information and a detailed list of the video ad features supported by each of the IMA SDKs,
     * see Support and Compatibility.
     *
     * Download the code samples to assist with implementing the IMA HTML5 SDK.
     */
    namespace ima {
        /**
         * @see https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/reference/js/google.ima.AdsManager
         */
        type AdsManager = any;
        /**
         * @see https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/reference/js/google.ima.ImaSdkSettings
         */
        type ImaSdkSettings = any;
    }
}
export interface ImaAdvertisingConfig extends AdvertisingConfig {
    /**
     * Defines an array of UI elements that should be displayed when an ad is active. Customizable UI elements are defined
     * at https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/reference/js/google.ima#.UiElements.
     *
     * Setting this property to an empty array will not show the UI elements mentioned in the link above.
     */
    allowedUiElements?: string[];
    /**
     * The URL of the Google IMA Framework.
     *
     * Default URL: https://imasdk.googleapis.com/js/sdkloader/ima3.js
     */
    sdkUrl?: string;
    /**
     * Callback that provides access to the `google.ima.ImaSdkSettings` before any initialization happens.
     */
    beforeInitialization?: (sdkSettings: google.ima.ImaSdkSettings) => void;
    /**
     * Callback that provides access to the ad container.
     */
    onAdContainerAvailable?: (adContainer: HTMLElement) => void;
    /**
     * Callback that provides access to the `google.ima.AdsManager`.
     */
    onAdsManagerAvailable?: (adsManager: google.ima.AdsManager) => void;
}
/**
 * @hidden
 */
export interface ImaAdvertisingModuleConfig extends AdvertisingModuleConfig {
    sdkUrl: string;
    allowedUiElements?: string[];
    beforeInitialization?: (sdkSettings: google.ima.ImaSdkSettings) => void;
    onAdContainerAvailable?: (adContainer: HTMLElement) => void;
    onAdsManagerAvailable?: (adsManager: google.ima.AdsManager) => void;
}
export interface ImaAdData extends VastAdData {
    /**
     * The first deal ID present in the wrapper chain for the ad, starting from the top.
     */
    dealId?: string;
    /**
     * @see https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/reference/js/google.ima.Ad#getTraffickingParameters
     *
     * Only present if there are traffickingParameters.
     */
    traffickingParameters?: any;
}
