import type { Ad, AdBreak } from './API';
export interface RestrictStrategy {
    /**
     * A callback function that will be called every time an ad break is about to start. The return value decides
     * whether the ad break will actually start playing or be discarded.
     */
    shouldPlayAdBreak: (toPlay: AdBreak) => boolean;
    /**
     * A callback function that will be called after every seek where ad breaks were scheduled in between the original
     * time and the seek target. The return value decides which ad breaks will be played after the operation finished.
     *
     * The default behaviour is to playback the most recent AdBreak.
     */
    shouldPlaySkippedAdBreaks: (skipped: AdBreak[], from: number, to: number) => AdBreak[];
}
export interface AdConfig {
    /**
     * Specifies how many seconds the ad break(s) should replace of the main video content.
     */
    replaceContentDuration?: number;
}
export declare enum AdTagType {
    VAST = "vast",
    VMAP = "vmap",
    /**
     * @deprecated Please use {@link AdTagType.VAST} even when scheduling VPAID ad tags.
     */
    VPAID = "vpaid"
}
/**
 * Configuration object for the LinearAd Ui.
 *
 * In case the `bitmovin-player-ui` is used, available from https://github.com/bitmovin/bitmovin-player-ui, message
 * placeholders such as: {remainingTime}, {adDuration} or {playedTime} are available to customize the ad messages:
 * ```
 * {
 *   message: 'This ad will end in {remainingTime}',
 *   untilSkippableMessage: 'This ad is skippable in {remainingTime}',
 *   skippableMessage: 'You can skip this ad now.'
 * }
 * ```
 */
export interface LinearAdUiConfig {
    /**
     * Specifies whether the ads need a UI.
     */
    requestsUi?: boolean;
    /**
     * Message that gets displayed while an ad is active.
     */
    message?: string;
    /**
     * Message that gets displayed while a skippable ad is not yet skippable.
     */
    untilSkippableMessage?: string;
    /**
     * Message that gets diplayed after the ad becomes skippable.
     */
    skippableMessage?: string;
}
export interface AdTag {
    /**
     * Defines the path to an ad manifest. If the tag is a VMAP manifest, the resulting ad breaks will be scheduled as
     * described in the manifest, otherwise the ad breaks will be handled as pre-roll ads if no further information is
     * specified in the {@link AdBreakConfig.position} property.
     */
    url: string;
    /**
     * Specifies whether the ad tag is a VAST, VMAP or VPAID tag. VMAP tags will be loaded immediately after scheduling.
     */
    type: AdTagType;
}
export interface AdTagConfig extends AdConfig {
    /**
     * Defines the url and type of the ad manifest. If the tag is a VAST or VPAID manifest, then more specific
     * scheduling options can be defined in the {@link AdBreakConfig}.
     */
    tag: AdTag;
    /**
     * If set, the ad tag will be processed and rescheduled automatically when a new source is loaded.
     */
    persistent?: boolean;
    /**
     * Specifies whether ad breaks are discarded after they are played back, played over or tried to be played back but
     * failed due to some condition.
     * When set to `false`, ad breaks are played again when seeking back to a previous ad break position and never
     * discarded in any of the above cases.
     *
     * The flag will be ignored when {@link "Advertising.Ima".ImaAdTagConfig.passthroughMode | ImaAdTagConfig.passthroughMode}
     * is set to {@link "Advertising.Ima".ImaPassthroughMode.VastAndVmap | ImaPassthroughMode.VastAndVmap}
     *
     * Default is `true`.
     */
    discardAfterPlayback?: boolean;
    /**
     * Defines a list of fallback ad tags which will be tried one after the other if the original ad tag does not
     * provide a valid response. The fallback ad tags need to have the same {@link AdTagType} as the main tag.
     */
    fallbackTags?: AdTag[];
    /**
     * Holds relevant information for the advertising UI.
     */
    linearAdUiConfig?: LinearAdUiConfig;
}
export interface AdBreakConfig extends AdTagConfig {
    /**
     * Unique identifier of the ad break. Used to be able to identify and discard the ad break dynamically.
     */
    id: string;
    /**
     * Defines when the ad break shall be started. Default is 'pre'.
     *
     * Allowed values are:
     * - 'pre': pre-roll ad
     * - 'post': post-roll ad
     * - fractional seconds: '10', '12.5' (mid-roll ad)
     * - percentage of the entire video duration: '25%', '50%' (mid-roll ad)
     * - timecode [hh:mm:ss.mmm]: '00:10:30.000', '01:00:00.000' (mid-roll ad)
     */
    position: string;
    /**
     * Specifies how many seconds before the ad break would start playing should the ad tag (and if possible the media
     * files of the resulting ad response) start pre-loading.
     * Default is `0`.
     */
    preloadOffset?: number;
    /**
     * Specifies after which time ads in the ad break become skippable. By setting it to `-1`, an ad is marked as
     * not skippable. This overrides the skip settings from the downloaded ads.
     * @hidden
     */
    skippableAfter?: number;
}
/**
 * Single VAST tag example:
 * ```js
 * advertising: {
 *   adBreaks: [{
 *     tag: {
 *       url: 'http://your.ad.provider/vast-manifest.xml',
 *       type: 'vast'
 *     }
 *   }],
 * }
 * ```
 * This is the most simple config example to play a single pre-roll ad.
 *
 * Single VMAP tag example:
 * ```js
 * advertising: {
 *   adBreaks: [{
 *     tag: {
 *       url: 'http://your.ad.provider/vmap-manifest.xml',
 *       type: 'vmap'
 *     }
 *   }]
 * }
 * ```
 * This config example will immediately download the VMAP manifest and schedule the resulting ad break(s) based on
 * information in the manifest.
 *
 * This example plays all the ad breaks in the VMAP manifest based on timing information in the manifest itself,
 * while the three VAST ads are played as a pre-roll, mid-roll at 8 minutes and 30 seconds and a post-roll ad.
 * Additionally, the strategy chosen here will result in every seeked-over ad break being played. The latter two
 * manifests are loaded 5 seconds in advance.
 *
 * Mixed example:
 * ```js
 * advertising: {
 *   adBreaks: [{
 *     tag: {
 *       url: 'http://your.ad.provider/vmap-manifest.xml',
 *       type: 'vmap'
 *     },
 *   }, {
 *     tag: {
 *       url: 'http://your.ad.provider/vast-manifest.xml',
 *       type: 'vast'
 *     },
 *     replaceContentDuration: 5,
 *     persistent: true,
 *     id: 'pre-roll-1',
 *     position: 'pre',
 *   }, {
 *     tag: {
 *       url: 'http://your.ad.provider/vast-manifest.xml',
 *       type: 'vast'
 *     },
 *     id: 'mid-roll-1',
 *     position: '00:08:30.000',
 *     preloadOffset: 5
 *   }, {
 *     tag: {
 *       url: 'http://your.ad.provider/vast-manifest.xml',
 *       type: 'vast'
 *     },
 *     persistent: true,
 *     id: 'post-roll-1',
 *     position: 'post',
 *     preloadOffset: 5
 *   }],
 *   strategy: {
 *     shouldPlayAdBreak: (adBreak) => true,
 *     shouldPlaySkippedAdBreaks: (skipped, from, to) => skipped,
 *   }
 * }
 * ```
 */
export interface AdvertisingConfig {
    /**
     * Defines a collection of ad breaks which will be played at the specified position in each {@link AdBreakConfig}.
     */
    adBreaks?: AdConfig[];
    /**
     * Specifies the amount of milliseconds before the loading of an ad from a given ad manifest times out.
     * Default is 8000.
     */
    videoLoadTimeout?: number;
    /**
     * Defines an object with two functions which will be called if an ad break is about to start or when ads are seeked
     * over. If this property is not set manually, then only the last ad that was seeked over will be played.
     */
    strategy?: RestrictStrategy;
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
     * Defines tracker configurations for the relevant packages such
     * as the Open measurement which will be loaded to provide
     * additional tracking information for ads.
     */
    trackers?: Trackers;
    /**
     * When set to true, the ad module will be prohibited from using the browser's `localStorage`.
     *
     * Defaults to {@link Core.StorageConfig.disableStorageApi}, if present, and falls back to `false`.
     *
     * @since v8.91.0
     */
    disableStorageApi?: boolean;
}
/**
 * You will have to include the {@link Core.ModuleName.AdvertisingOmSdk}
 * module into the player before creating an instance.
 *
 * @example
 * ```html
 *
 * <script type="text/javascript" src="./bitmovinplayer.js"></script>
 * <script type="text/javascript" src="./modules/bitmovinplayer-advertising-bitmovin.js"></script>
 * <script type="text/javascript" src="./modules/bitmovinplayer-advertising-omsdk.js"></script>
 * <!-- your html body here -->
 * <script type="text/javascript">
 *   bitmovin.player.Player.addModule(bitmovin.player['advertising-bitmovin'].default);
 *   bitmovin.player.Player.addModule(bitmovin.player['advertising-omsdk'].default);
 *   var conf = {
 *     key: '<yourPlayerKey>',
 *     advertising: {
 *       adBreaks: [{
 *         tag: {
 *           url: '<http://location-of-your-ad.xml>',
 *           type: 'vast'
 *         },
 *         position: 'pre',
 *       }],
 *       trackers: {
 *         omSdk: {
 *           partnerName: '<yourOmSdkPartnerName>',
 *           partnerVersion: '<yourOmSdkParnterVersion>',
 *         },
 *       }
 *     },
 *   };
 *   var player = new bitmovin.player.Player(document.getElementById('player'), conf);
 * ```
 */
export interface OmSdkTracker {
    /**
     * Allows you to customize the current content url used. This can be useful when the same urls with different
     * parameters need to be included under the same content url for easier tracking.
     *
     * If the content url is not provided the default current href will be used.
     */
    contentUrl?: string;
    /**
     * By default accessMode will be set as AccessMode.FULL for all requests if nothing is provided.
     *
     * @example
     * ```ts
     *
     * const rules: OmSdkAccessModeRules = {
     *   limited: [new RegExp('examplevendor1\.com/.*$')],
     *   full: [/examplevendor2\.com/],
     * }
     * const omSdkTracker: OmSdkTracker = {
     *   onAccessMode: _ad => rules,
     *   ...
     * }
     * ```
     */
    onAccessMode?: (ad: Ad) => OmSdkAccessModeRules;
    /**
     * The partner name associated with your OM SDK account
     */
    partnerName: string;
    /**
     * The version associated with your OM SDK account
     */
    partnerVersion: string;
    /**
     * By default, the OM SDK Session Client Library will assume the Service Script is present
     * in the same frame the library is loaded in. Use this config to override the behavior.
     * Default is `top` to indicate that `window.top` shall be used.
     */
    serviceWindowProxy?: 'parent' | 'self' | 'top';
    /**
     * By default it will use an empty array. Allows loading of verification urls.
     *
     * @example
     * ```ts
     *
     * const adConfig: AdvertisingConfig = {
     *   adBreaks: [
     *     // your ads here
     *   ],
     *   trackers: {
     *     omSdk: {
     *       partnerName: '<yourOmSdkPartnerName>',
     *       partnerVersion: '<yourOmSdkParnterVersion>',
     *       verificationResources: [
     *         {
     *           validationScriptUrl:
     *              './Validation-Script/omid-validation-verification-script-v1.js',
     *         },
     *       ],
     *     },
     *   },
     * };
     * ```
     */
    verificationResources?: VerificationResource[];
}
/**
 * Lets you control the rules for chosing the AccessMode for an ad.
 * The player will try to match from the most restrictive (limited) to the least restricted (full)
 * and will take the first matching access mode.
 */
export interface OmSdkAccessModeRules {
    /**
     * The verification script is sandboxed and cannot access the creative or publisher page,
     * and cannot directly confirm what publisher domain it is on.
     */
    limited?: RegExp[];
    /**
     * The verification script is sandboxed and cannot access the creative or publisher page.
     * However, the script is loaded in such a way that it can directly confirm what publisher
     * domain it is on.
     */
    domain?: RegExp[];
    /**
     * The verification script and creative are sandboxed from the publisher page.
     * However, the script has direct access to the creative.
     */
    creative?: RegExp[];
    /**
     * The verification script has direct access to the creative and the publisher page.
     */
    full?: RegExp[];
}
export interface Trackers {
    /**
     * Used in the advertising module to implement the open measurement SDK.
     */
    omSdk?: OmSdkTracker;
}
/**
 * Represents a verification script resource that comes in a VAST extension for
 * VAST versions <= 3 or a verification node for VAST versions >= 4
 */
export interface VerificationResource {
    /**
     * The location of the verification script file
     */
    validationScriptUrl: string;
    /**
     * An optional vendor key to be used by the verification script
     */
    vendorKey?: string;
    /**
     * Optional stringified parameters to be used by the verification script
     */
    params?: string;
}
export interface AdTagPlaceholders {
    /**
     * Placeholders for the current playback time of the player
     */
    playbackTime?: string[];
    /**
     * Placeholders for the height of the player
     */
    height?: string[];
    /**
     * Placeholders for the width of the player
     */
    width?: string[];
    /**
     * Placeholders for the domain of the current page
     */
    domain?: string[];
    /**
     * Placeholders for the URL of the current page
     */
    page?: string[];
    /**
     * Placeholders for the URL of the referring page
     */
    referrer?: string[];
    /**
     * Placeholders for the URL of the content asset
     */
    assetUrl?: string[];
    /**
     * Placeholders for a 8 digit random number
     */
    random?: string[];
    /**
     * Placeholders for the current UNIX timestamp of the client
     */
    timestamp?: string[];
}
