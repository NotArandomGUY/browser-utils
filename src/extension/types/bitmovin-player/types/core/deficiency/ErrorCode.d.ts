/**
 * ### Groups
 *
 * #### 1000 - general errors
 * - 1000 - 1099: GENERAL
 * - 1100 - 1199: SETUP
 * - 1200 - 1299: SOURCE
 * - 1300 - 1399: PLAYBACK
 * - 1400 - 1499: NETWORK
 *
 * #### 2000 - extended use cases
 * - 2000 - 2099: DRM
 * - 2100 - 2199: VR
 *
 * #### 3000 - module errors
 * - 3000 - 3099: MODULE generic
 * - 3100 - 3199: MODULE_ADVERTISING only for external modules
 *
 * #### 4000 - Segment specific errors
 */
export declare enum ErrorCode {
    /**
     * Error is unknown.
     *
     * This error can happen during an ad playback when we encountered an error that we did not expect from the
     * advertising module or the player. Most commonly these errors are during advertisement playback or when we
     * try to play an advertisements and experience an error which we do not know about.
     *
     * During video playback sometimes the playing device can throw an error which we have not identified yet. When this
     * happens this error can be expected. Most common errors we track are {@link ErrorCode.PLAYBACK_VIDEO_DECODING_ERROR},
     * {@link ErrorCode.NETWORK_ERROR}, {@link ErrorCode.SOURCE_STREAM_TYPE_NOT_SUPPORTED}.
     * Usually happens when a segment is being pushed to the video element and the video element throws an error, which is not
     * handled within the player. The error can occur when playback is started with corrupted segments or during initial loading
     * and pushing of segments.
     *
     */
    UNKNOWN = 1000,
    /**
     * The player API was accessed after the player instance has been destroyed by either calling
     * {@link PlayerAPI.destroy} or after an {@link PlayerEvent.Error} event has been thrown. Note that the player is
     * destroyed automatically whenever an {@link PlayerEvent.Error} event is thrown.
     *
     * The Bitmovin Player UI or other third party UIs might access the API after the player was destroyed or has crashed,
     * causing this error to be thrown.
     *
     * It is recommended to not access the player API after the {@link PlayerEvent.Destroy} event has been thrown in order
     * to avoid this error.
     */
    API_NOT_AVAILABLE = 1001,
    /**
     * General setup error
     * @hidden for compatibility with other platforms
     */
    SETUP_ERROR = 1100,
    /**
     * An attempt was made to create a player instance with a `container` element that is not an instance of
     * `HTMLElement`.
     *
     * Some common causes for this error are:
     * - trying to create a player instance with a container element returned by `document.getElementById(<id>)`, but
     *   using an incorrect ID
     * - trying to create a player instance before the window has finished loading, therefore the container element is not
     *   yet an element of the DOM tree
     *
     * Please ensure that the container element is available before creating the player instance.
     */
    SETUP_NO_HTML_ELEMENT = 1101,
    /**
     * No {@link PlayerConfig} was provided when attempting to create a player instance. The {@link PlayerConfig} is used
     * to set different configuration options, e.g. {@link PlayerConfig.key}, {@link PlayerConfig.buffer} or
     * {@link PlayerConfig.playback}, and is required when creating a player instance.
     *
     * @example:
     * ```ts
     *
     * const config = {
     *   key: '<PLAYER-KEY>',
     *   playback: {
     *     autoplay: false,
     *     muted: false
     *   },
     * };
     * ```
     */
    SETUP_MISSING_CONFIGURATION = 1102,
    /**
     * The player license server did not grant playback for the given player key as specified in the {@link PlayerConfig}.
     *
     * The most common cause for this error is that an incorrect or non-existing player key was specified in the
     * {@link PlayerConfig}.
     */
    SETUP_LICENSE_ERROR = 1103,
    /**
     * @deprecated See {@link SETUP_MISSING_DOMAIN_LICENSE_ALLOWLIST} instead
     */
    SETUP_MISSING_DOMAIN_LICENSE_WHITELIST = 1104,
    /**
     * The player build is domain-locked and not authorized to play content on the current domain.
     *
     * For domain-locked players, a list of allowed domains is specified at build time, and the player is only allowed to
     * play back on the specified domains or subdomains of them.
     *
     * Please make sure that the host name matches the specified domain or is a subdomain of it.
     */
    SETUP_MISSING_DOMAIN_LICENSE_ALLOWLIST = 1104,
    /**
     * @deprecated See {@link SETUP_MISSING_LICENSE_ALLOWLIST} instead
     */
    SETUP_MISSING_LICENSE_WHITELIST = 1105,
    /**
     * The player is not allowed to play back content on the current domain.
     *
     * This error is usually caused by the domain not being added to the list of allowed domains in the dashboard and can
     * usually be resolved by adding the current domain to it.
     */
    SETUP_MISSING_LICENSE_ALLOWLIST = 1105,
    /**
     * The license server URL provided in {@link TweaksConfig.licenseServer} does not match any of the available license
     * server URLs.
     *
     * If {@link TweaksConfig.licenseServer} is not set, the default Bitmovin license server is used. Please make sure
     * that the specified license server URL is valid.
     */
    SETUP_INVALID_LICENSE_SERVER = 1106,
    /**
     * The impression server URL provided in {@link TweaksConfig.impressionServer} does not match any of the available
     * impression server URLs.
     *
     * If {@link TweaksConfig.impressionServer} is not set, the default Bitmovin impression server is used. Please make
     * sure that the specified impression server URL is valid.
     */
    SETUP_INVALID_IMPRESSION_SERVER = 1107,
    /**
     * Could not initialize the rendering engine, which is either using the Media Source Extensions if the
     * {@link PlayerType.Html5} player type is used or the native video element playback capabilities if the
     * {@link PlayerType.Native} player type is used.
     *
     * This error occurs when the platform does not support the {@link PlayerType} and {@link StreamType} for the provided
     * {@link SourceConfig} on the current platform, and is therefore unable to instantiate a suitable rendering engine.
     *
     * It can also occur when no suitable rendering engine is available for the {@link PlayerType} and {@link StreamType}
     * specified in the {@link PlaybackConfig.preferredTech}.
     *
     * Ensure the following to fix the issue:
     *   - at least one supported stream type (DASH, HLS or smooth) is present in the {@link SourceConfig}
     *   - {@link PlaybackConfig.preferredTech} is not set to an unsupported combination of {@link PlayerType}
     *     and {@link StreamType} for the current platform
     */
    SETUP_NO_RENDERING_ENGINE = 1108,
    /**
     * This site has been loaded using "file" protocol which is not supported. Please host the page using a web server
     * (using http or https).
     */
    SETUP_UNSUPPORTED_PROTOCOL = 1113,
    /**
     * The player encountered a problem which prevents playback of the current source.
     *
     * Possible reasons for this error are:
     * - None of the available representations had a compatible codec.
     * - All DRM Licenses were tried but none resulted in a valid license.
     * - All DRM Licenses reported "restricted-output" due to HDCP.
     * - Connection to WebRTC source failed or was lost.
     */
    SOURCE_ERROR = 1200,
    /**
     * The {@link SourceConfig} provided to the {@link PlayerAPI.load} method is invalid. Ensure that the
     * {@link SourceConfig} contains at least one valid source URL for any of the supported stream types on the current
     * platform.
     *
     * Common causes for this error include:
     * - {@link PlayerAPI.play} was called before a source has been loaded
     * - an empty {@link SourceConfig} object, or an object containing only empty strings instead of URLs was provided
     * - the {@link SourceConfig} object didn't contain `dash`, `hls`, `progressive` or `smooth` keys
     * - the provided source URL is not of type `string`
     *
     * The following examples show a few invalid source objects.
     * @example
     * ```js
     *
     * source = {};
     *
     * source = {
     *   poster: 'https://bitmovin-a.akamaihd.net/art-of-motion_drm/art-of-motion_poster.jpg',
     * };
     *
     * ```
     *
     * In contrast, the following examples shows a valid source object.
     * @example
     *```js
     *
     * source = {
     *   title: 'Art of Motion',
     *   description: 'What is this event... Parcour?',
     *   dash: 'https://bitmovin-a.akamaihd.net/MI201109210084_1/mpds/f08e80da.mpd',
     *   hls: 'https://bitmovin-a.akamaihd.net/MI201109210084_1/m3u8s/f08e80da.m3u8',
     *   progressive: 'https://bitmovin-a.akamaihd.net/MI201109210084_1/MI201109210084.mp4',
     *   poster: 'https://bitmovin-a.akamaihd.net/art-of-motion_drm/art-of-motion_poster.jpg'
     * };
     *```
     */
    SOURCE_INVALID = 1201,
    /**
     * The downloaded manifest is invalid.
     *
     * This error is fired when the downloaded manifest is not valid or could not be parsed. Different stream types might
     * fail because of different validation issues in the manifest.
     *
     * For DASH, some of common issues are:
     *   - the XML manifest is not valid, for example, some tags are missing or not closed
     *   - the XML manifest is valid, but there is no `Period` tag or the `Period` tag is empty
     *   - an unsupported manifest scheme was detected - the supported schemes are `SegmentTemplate`, `SegmentTimeline`,
     *     `SegmentList` and `SegmentBase`
     *
     * For HLS, some of common issues are:
     *   - the master playlist does not contain any variant playlists
     *   - the variant playlist does not contain any segments
     *   - the master playlist does not contain codec information and probing the codec from the segments failed
     *
     * One common failure reason is that an incorrect key was specified in the {@link SourceConfig}. For example,
     * specifying an `hls` source in the source config, but inserting a URL to a DASH manifest instead, would cause this
     * error to be thrown.
     *
     * Please check for the above issues in the manifest and also consider validating the manifest with a validation tool.
     */
    SOURCE_MANIFEST_INVALID = 1202,
    /**
     * The platform does not support any of the technologies needed to play back the provided source.
     *
     * The error is fired when there is no support for any of the stream types on the current platform for the provided {@link SourceConfig}.
     * Different platforms support different {@link PlayerType} for a given {@link StreamType}
     * in the {@link SourceConfig}.
     *
     * Additionally, in case a {@link PlaybackConfig.preferredTech} was specified, the platform may not support the
     * desired {@link PlayerType} and {@link StreamType} combination, which would also cause this error to be thrown.
     *
     * Some ways to fix this issue:
     *   - ensure that at least one of the stream types specified in the {@link SourceConfig} is supported on the platform
     *   - remove {@link PlaybackConfig.preferredTech} or set it to a {@link Technology} that is supported on the platform
     *
     * The list of technologies supported by the current platform can be queried using the
     * {@link PlayerAPI.getSupportedTech} method.
     */
    SOURCE_NO_SUPPORTED_TECHNOLOGY = 1203,
    /**
     * The stream type is not supported.
     *
     * This error happens when the {@link SourceConfig} does not contain a valid stream type, i.e. `dash`, `hls`,
     * `progressive` or `smooth`. Also, when no {@link PlayerType} is supported on the platform for the stream type
     * specified in the source, the error is triggered. The
     * [`MEDIA_ERR_SRC_NOT_SUPPORTED`](https://developer.mozilla.org/en-US/docs/Web/API/MediaError) error from the
     * video element is also mapped to this error.
     *
     * Please check the {@link SourceConfig} for the supported stream types. Also, consider using a stream type for which
     * a {@link PlayerType} is supported on the current platform.
     */
    SOURCE_STREAM_TYPE_NOT_SUPPORTED = 1204,
    /**
     * The {@link Technology} selected through the `forceTechnology` parameter, that was passed to the
     * {@link PlayerAPI.load} method, is not supported on the current platform.
     *
     * The `forceTechnology` parameter of the load call contains a {@link PlayerType} for the {@link StreamType} separated
     * by a `.`. For example, by passing `html5.hls` as the second parameter to {@link PlayerAPI.load}, the player is
     * instructed to play back a supplied HLS stream with the HTML5 technology.
     *
     * When this error happens, consider using a valid technology string that is supported on the platform. Unless
     * strictly necessary, consider not using the forced technology, as the player will then choose the best technology
     * based on the platform and provided source.
     *
     * The list of technologies supported by the current platform can be queried using the
     * {@link PlayerAPI.getSupportedTech} method.
     */
    SOURCE_FORCED_TECHNOLOGY_NOT_SUPPORTED = 1205,
    /**
     * The current platform doesn't support any of the technologies needed to play back any of the sources provided in the
     * {@link SourceConfig}.
     *
     * This can also happen when `forceTechnology` is provided to the {@link PlayerAPI.load} method as the second
     * parameter, and the desired {@link PlayerType} and {@link StreamType} combination is not supported on the current
     * platform.
     *
     * Consider using a {@link Technology} supported by the current platform, and make sure a supported stream type is
     * present in the {@link SourceConfig}. Not specifying a `forceTechnology` for the {@link PlayerAPI.load} method might
     * also let player to choose the best technology based on platform support.
     *
     * The list of technologies supported by the current platform can be queried using the
     * {@link PlayerAPI.getSupportedTech} method.
     */
    SOURCE_NO_STREAM_FOUND_FOR_SUPPORTED_TECHNOLOGY = 1206,
    /**
     * The downloaded segment is empty.
     *
     * This error occurs whenever an empty MP4 init-segment was downloaded, which usually indicates that there is an
     * underlying issue with the stream. It is therefore recommended to check the segments of the stream - there may be
     * an issue on the encoding side that caused empty segments to be generated.
     *
     * The [ISO Viewer](https://github.com/sannies/isoviewer) tool can be used to inspect ISO-BMFF formatted segments. For
     * testing purposes, it is also possible to use the {@link NetworkConfig} to replace the corrupted empty segments.
     */
    SOURCE_EMPTY_SEGMENT = 1207,
    /**
     * The manifest could not be loaded.
     *
     * The manifest network request failed, please check the network request's response for the failure reason. In case an
     * HLS stream was being loaded, this error can occur when the master playlist request or any of the initial variant
     * playlist requests failed.
     *
     * The detailed failure reason can be found in the network request's response.
     *
     * This error is only triggered after the manifest request has failed a certain number of times,
     * based on the {@link TweaksConfig.max_mpd_retries}. By default, manifest requests are retried 2 times.
     */
    SOURCE_COULD_NOT_LOAD_MANIFEST = 1208,
    /**
     * The specified progressive stream type is not supported, or the `SourceElement` used to load the source has reported
     * an error.
     *
     * This error is only fired when the native player is used with a progressive source. In this case, playback is
     * handled natively by the video element, and this error is thrown when a stream error is encountered by the video
     * element.
     *
     * Some common root causes for this error are:
     * - the browser not being able to load the progressive source due to CORS restrictions
     * - the browser not supporting the codec and/or container combination used by the asset
     *
     * Please check the logged error message for more detailed info on what caused the error to be thrown.
     */
    SOURCE_PROGRESSIVE_STREAM_ERROR = 1209,
    /**
     * An error was encountered while playing, or trying to play back an HLS stream.
     *
     * This error can occur while loading an HLS stream, usually while loading or parsing of the variant playlists. For
     * example, this error can be thrown when all network requests for all variant playlists fail. In case parsing of any
     * of the loaded playlists fails, this error will also be thrown.
     *
     * Furthermore, this error can also occur when an HLS source is played back with the native player and the video
     * element throws a playback error. In this case a more detailed failure reason may be included in the error message,
     * if exposed by the video element.
     *
     * Please check the error message in the event for the exact reason of the failure.
     */
    SOURCE_HLS_STREAM_ERROR = 1210,
    /**
     * The encryption method used by the source is not supported.
     *
     * Currently, this error is thrown when an attempt is made to play back a `SAMPLE-AES` encrypted stream.
     *
     * Consider using a different encryption method, if possible - for example `AES-128`.
     */
    SOURCE_ENCRYPTION_METHOD_NOT_SUPPORTED = 1211,
    /**
     * @hidden TODO: move into data, Unable to parse H264-codec information from CodecPrivateData
     */
    SOURCE_INVALID_H264_CODEC = 7043,
    /**
     * General playback error
     * @hidden for compatibility the other platforms
     */
    PLAYBACK_ERROR = 1300,
    /**
     * An error occurred while trying to demux or decode the content.
     *
     * This error can occur when the browser or device is unable to either demux or decode the content. This can have a
     * multitude of reasons, but it is usually an indication of there either being an issue with the asset itself, or the
     * player not properly supporting the provided stream.
     *
     * Furthermore, this error can be thrown whenever the video element throws a `MEDIA_ERR_DECODE`, which is also an
     * indication of there being an underlying issue with the provided stream.
     *
     * Some recommendation to identify the root cause for this issue:
     *   - try playing the stream audio- or video-only, e.g. by removing the other mime type from the manifest, e.g.
     * using
     *     the {@link NetworkConfig.preprocessHttpResponse} to narrow the demuxing/decoding issues
     *     down
     *   - try playing back a single and fixed audio or video quality, e.g. using
     *     {@link AdaptationConfig.onVideoAdaptation} or {@link AdaptationConfig.onAudioAdaptation}, as the issue may
     *     occur only with a certain set of qualities (e.g. only the highest video quality)
     *   - try using a stream validation tool to validate that there is no issue with the stream, e.g. the
     *     [`mediastreamvalidator`](https://developer.apple.com/documentation/http_live_streaming/about_apple_s_http_live_streaming_tools)
     * for HLS streams
     *   - try inspecting the [`chrome://media-internals`](chrome://media-internals) in Chrome, as they can also provide
     *     additional and detailed information about stream demuxing or decoding issues
     */
    PLAYBACK_VIDEO_DECODING_ERROR = 1301,
    /**
     * The transmuxer could not be initialized.
     *
     * This error can occur when an error is encountered during transmuxer initialization. The transmuxer is used to
     * convert HLS transport stream segments into fMP4 segments that can be played back using the HTML5 based player. This
     * error mainly occurs because of issues during the setup of the transmuxer, and it may indicate that some
     * dependencies like `WebWorker`s, the `BlobBuilder` or `Blob`s are not supported by the platform.
     *
     * Please refer to the error message for the exact issue for the failure.
     */
    PLAYBACK_HLS_COULD_NOT_LOAD_TRANSMUXER = 1304,
    /**
     * A general network error has occurred while downloading resource E.g.: the manifest or a segment of the stream.
     *
     * When a segment request fails, the player tries to load the same segment of different quality from a different CDN,
     * if provided. If all of the request fails, this error is thrown. For HLS streams, backup streams are used to get the
     * same segment from a different origin.
     *
     * For live streams, failed segment downloads are per default ignored and the player continues with the next segment
     * instead of throwing an error.
     *
     * Please look at the response of the failed network request to determine the exact reason of the failure.
     */
    NETWORK_ERROR = 1400,
    /**
     * The manifest download request timed out.
     *
     * This error occurs when the manifest request was not completed within the default timeout of 20 seconds, and the
     * request was therefore aborted, which is usually an indication of a poor network connection.
     *
     * When the native player is used with an HLS source, the player expects playback to start within a default timeout of
     * 10 seconds. Should playback not start within that time frame, this error is thrown as well.
     *
     * Please check the network conditions and ensure, that the manifest is available and can be loaded.
     */
    NETWORK_MANIFEST_DOWNLOAD_TIMEOUT = 1401,
    /**
     * The segment download timed out.
     *
     * This error occurs when the segment download does not complete within the default timeout of 20 seconds, and the
     * request was therefore aborted, which is usually an indication of a poor network connection.
     *
     * When a segment download fails due to a timeout, the player will attempt to load the same segment again from a
     * different CDN/origin. This error is not thrown when segment downloads fail for DASH live streams, as segments that
     * couldn't be downloaded are skipped without throwing an error in that case.
     *
     * Please check the network conditions and ensure, that the segments are available and can be loaded.
     */
    NETWORK_SEGMENT_DOWNLOAD_TIMEOUT = 1402,
    /**
     * The progressive stream download timed out.
     *
     * This error occurs when loading of a progressive source doesn't complete within the default timeout of 20 seconds.
     * As the native player is used for progressive sources, the player expects playback to start within a default timeout
     * of 10 seconds. Should playback not start within that time frame, this error is thrown as well.
     *
     * Please check the network conditions and ensure, that the progressive source is available and can be loaded.
     */
    NETWORK_PROGRESSIVE_STREAM_DOWNLOAD_TIMEOUT = 1403,
    /**
     * The Fairplay DRM certificate request failed.
     *
     * This error occurs when the Fairplay certificate could not be loaded due to a network error. Please check the
     * network response in the error to determine the exact failure reason.
     *
     * Per default, the certificate request is retried once. The number of retries can be set using
     * {@link DRM.AppleFairplayDRMConfig.maxCertificateRequestRetries}
     */
    NETWORK_FAILED_CERTIFICATE_REQUEST = 1404,
    /**
     * General DRM error
     * @hidden for compatibility with other platforms
     */
    DRM_ERROR = 2000,
    /**
     * An attempt was made to play back a Fairplay protected stream, but no DRM configuration was provided in the
     * {@link SourceConfig.drm}.
     *
     * In order to play back Fairplay protected content, it is necessary to specify a {@link DRM.AppleFairplayDRMConfig} in
     * {@link SourceConfig.drm}, as the DRM licenses required to decode and play back the content can otherwise not be
     * requested by the player.
     *
     * An example Fairplay DRM configuration can be seen in {@link DRM.AppleFairplayDRMConfig}.
     */
    DRM_MISSING_CONFIGURATION = 2001,
    /**
     * The Fairplay licensing server URL is missing in the provided {@link DRM.AppleFairplayDRMConfig}.
     *
     * This error occurs when the Fairplay license server URL (`LA_URL`) is missing. The license server url can either be
     * provided directly in the {@link DRM.AppleFairplayDRMConfig.LA_URL}, or it can provided through the
     * {@link DRM.AppleFairplayDRMConfig.getLicenseServerUrl} callback, which is called with the init data of the content and
     * must return the license server url.
     *
     * Please make sure that the license server url is correctly set.
     */
    DRM_NO_LICENSE_SERVER_URL_PROVIDED = 2002,
    /**
     * The DRM license request failed.
     *
     * This error occurs when a DRM license request fails and the player could not retrieve a valid license from the
     * license server. It can occur for a multitude of different reasons, but the most common ones include:
     * - the license server rejecting the license request, possible due to a misconfiguration or missing/expired tokens
     * - an incorrect DRM configuration being used, especially on smart TVs or set-top boxes, and preparing of the
     * license
     *   request therefore failing
     *
     * Troubleshooting steps for license requests rejected by the DRM license server include:
     * - making sure that the license server is set up properly, e.g. that CORS allows license requests from different
     *   domains
     * - inspecting the detailed error message which is usually returned by the license server in the body of the license
     *   response
     * - ensuring, that all required {@link HttpHeaders} are set in the {@link DRM.DRMConfig} and e.g. tokens are valid and
     *   not expired
     *
     *
     * Some smart TVs also need special configuration options for PlayReady protected content playback. For example, most
     * platforms required both {@link DRM.PlayReadyDRMConfig.plaintextChallenge} and {@link DRM.PlayReadyDRMConfig.utf8message}
     * to be set, along with `Content-Type` {@link DRM.PlayReadyDRMConfig.headers}. If those options are not set, DRM license
     * requests may fail.
     *
     * An example of such a {@link DRM.PlayReadyDRMConfig}, that needs to be used on most smart TVs, is shown below.
     * @example
     *```js
     *
     *{
     *  LA_URL: '<LA URL>',
     *  utf8message: true,
     *  plaintextChallenge: true,
     *  headers: {
     *    'Content-Type': 'text/xml',
     *  },
     *}
     *```
     */
    DRM_FAILED_LICENSE_REQUEST = 2003,
    /**
     * Key size is not supported.
     */
    DRM_KEY_SIZE_NOT_SUPPORTED = 2005,
    /**
     * The current platform doesn't support any of the key systems specified in the {@link SourceConfig} that are required
     * to play back the content.
     *
     * Different platforms support different DRM key systems, and when multiple key system configurations are provided in
     * the {@link SourceConfig.drm}, the first supported one is chosen. If, however, the current platform doesn't support
     * any of the key systems provided in the source config, this error will be thrown.
     *
     * A feature matrix, describing what DRM key systems are supported where by the Bitmovin Player, can be found at
     * https://bitmovin.com/docs/player/articles/browser-drm-support.
     *
     * In order to support DRM protected content playback on most platforms it is recommended to supply at least a
     * {@link DRM.PlayReadyDRMConfig} and a {@link DRM.WidevineModularDRMConfig} for DRM protected sources.
     */
    DRM_NO_KEY_SYSTEM = 2006,
    /**
     * Unable to create or initialize a DRM key session.
     *
     * This error might occur during the initialization of a DRM Media Key Session which is used to both start DRM license
     * requests as well as providing the Content Decryption Module with the licenses returned by the license server.
     *
     * As the DRM init data is used to generate Media Key Sessions, this error can be an indication of the init data being
     * invalid or not supported on the current platform.
     *
     * Please verify, that the init data provided to the player is valid.
     */
    DRM_KEY_SESSION_INITIALIZATION_FAILED = 2007,
    /**
     * The DRM Media Keys object could not be created or initialized.
     *
     * The Media Keys object is associated to the video element and used to create Media Key Sessions, which are used to
     * interface with the Content Decryption Module. This error might occur if the creation of the Media Keys, or
     * attaching them the video element failed, which can happen because the key system is not supported by the platform
     * or the data provided to create the instance is not valid.
     *
     * Please check the logs to determine the exact reason of the failure.
     */
    DRM_MEDIA_KEY_INITIALIZATION_FAILED = 2008,
    /**
     * The video element or an associated DRM Key Session has thrown a DRM key error.
     *
     * This error is triggered by the key session or the video element when a DRM error is encountered during playback.
     * There are multiple different possible causes for this error, but the most common ones are:
     * - the device/browser being unable to generate a DRM license request for the init data provided in the content
     * - the init data being malformed
     * - the Content Decryption Module not being able to parse/process the DRM license returned by the license server
     * - the Content Decryption Module encountering a general DRM related error during playback
     *
     * On certain platforms, a detailed error message is logged to the console, if one is available.
     */
    DRM_KEY_ERROR = 2009,
    /**
     * No supported Fairplay Key System is available.
     *
     * This error occurs when an attempt is made to play back a Fairplay protected stream on a platform that doesn't
     * support any of the required Fairplay Key Systems.
     *
     * Please try to use a different DRM key system that is supported by the current platform. It is possible, and
     * recommended, to define more than one key system configuration in the {@link DRM.DRMConfig}. The player will then choose
     * the first key system, that is supported by the platform, and use it to play back the content.
     */
    DRM_KEY_SYSTEM_NOT_SUPPORTED = 2010,
    /**
     * The DRM certificate specified in the {@link DRM.DRMConfig} is not valid, the player was unable to parse the provided
     * certificate or the network request for the certificate failed.
     *
     * This error can be thrown under the following conditions:
     * - the Fairplay certificate request was not completed within the default network request timeout of 20 seconds
     * - preparing of a Fairplay license failed when calling {@link DRM.AppleFairplayDRMConfig.prepareLicenseAsync} or
     *   {@link DRM.AppleFairplayDRMConfig.prepareCertificate}
     * - the {@link DRM.AppleFairplayDRMConfig.serverCertificate} is not an instance of an `ArrayBuffer`
     * - the provided {@link DRM.WidevineModularDRMConfig.serverCertificate} could not be set on the Media Keys
     *
     * Please verify that license and/or server certificate URLs are correct, and that the server certificate specified
     * in the DRM config is valid, if one was specified.
     */
    DRM_CERTIFICATE_ERROR = 2011,
    /**
     * Invalid header key/value pair encountered while parsing a PlayReady license request.
     *
     * This error can occur, when the XML provided to the player through the DRM key-message event is malformed or
     * contains invalid DRM request headers.
     */
    DRM_PLAYREADY_INVALID_HEADER_KEY_VALUE_PAIR = 2012,
    /**
     * @deprecated Replaced by the Warning {@link WarningCode.DRM_RESTRICTED_OUTPUT}
     *
     * The DRM protected content cannot be played back due to the device not being able to securely present the content.
     *
     * This error can occur when an attempt is made to play back DRM protected content on a device or platform that is
     * not capable of playing back the content in a secure manner. In most cases, this error occurs when a
     * non-HDCP-capable monitor is connected to the system.
     *
     * The security level required to play back DRM protected content can also be configured on the DRM license server
     * side. In order to lessen the required security level, and to e.g. allow content playback on platforms that for
     * example don't support hardware decryption, please contact you DRM provider.
     *
     * Since 8.138.0 The player will only fire a warning event for the DRM key which is restricted and try to fall back to
     * a different key. Only after all keys have been exhausted a `SOURCE_ERROR` will be thrown.
     */
    DRM_RESTRICTED_OUTPUT = 2013,
    /**
     * No init data was found for the used key system in the manifest or the segments.
     *
     * In order to start a DRM license request, DRM init data is needed. This init data may be present in the manifest,
     * the segments of the stream, or both. If no init data could be found in the manifest or the segments, the player
     * will be unable to start a DRM license request and therefore throw this error.
     *
     * Please make sure that the DRM init data is present in the manifest and/or the segments of the stream.
     */
    DRM_INIT_DATA_MISSING = 2015,
    /**
     * General VR error
     * @hidden for compatibility with other platforms
     */
    VR_ERROR = 2100,
    /**
     * The used player technology not compatible with VR playback.
     *
     * This error can occur when the loaded {@link SourceConfig} contains a {@link VR.VRConfig}, but the current platform is
     * not capable of playing back VR content with the chosen player technology. Depending on the platform, some
     * {@link StreamType} are not supported for VR playback with some of the {@link PlayerType}. For example, VR playback
     * is not supported with DASH sources in Safari.
     *
     * Please make sure that current platform is capable of playing back the provided VR source.
     */
    VR_INCOMPATIBLE_PLAYER_TECHNOLOGY = 2101,
    /**
     * General module error
     * @hidden for compatibility with other platforms
     */
    MODULE_ERROR = 3000,
    /**
     * The definition of the module is invalid (e.g. incomplete).
     *
     * This error is triggered when {@link StaticPlayerAPI.addModule} is called with an invalid module definition, for
     * example when the name or the module property is missing.
     *
     * Make sure the custom module definition is valid and follows the specification.
     */
    MODULE_INVALID_DEFINITION = 3001,
    /**
     * The module definition specifies dependencies but the module is not provided via a function for deferred loading.
     *
     * This error is triggered when {@link StaticPlayerAPI.addModule} is called with a custom module that defines
     * dependencies, but the module is exported directly rather than through a function that can be invoked at a later
     * point in time.
     *
     * Make sure the custom module definition is valid and follows the specification.
     */
    MODULE_INVALID_DEFINITION_DEPENDENCY = 3002,
    /**
     * A module cannot be loaded because it has not been added to the player core.
     *
     * This error occurs when a feature is used that needs a specific module to be loaded, but that module has not been
     * added to the player. For example, when playing back a WebM stream, the {@link ModuleName.ContainerWebM} module is
     * needed. Should that module not be present, this error will be thrown.
     *
     * Please make sure all the required modules are loaded. Refer to {@link ModuleName} to determine, which modules are
     * needed to supported the desired features.
     */
    MODULE_MISSING = 3003,
    /**
     * A module cannot be loaded because one or more dependencies are missing.
     *
     * This error occurs when a module, that has dependencies on other modules, is added without adding all of its
     * dependencies first.
     *
     * Refer to {@link ModuleName} to determine the dependencies of the modules you're trying to add and ensure, that all
     * dependencies are added before adding the module that depends on them.
     */
    MODULE_DEPENDENCY_MISSING = 3004,
    /**
     * A module has been removed from the player core.
     * The error is triggered when a module is removed when there are active player instances.
     *
     * This error occurs when a module is removed from the player core using {@link StaticPlayerAPI.removeModule}.
     */
    MODULE_REMOVED = 3005,
    /**
     * An advertising module error has occurred. Refer to the attached {@link Advertising.AdvertisingError}.
     *
     * This error is triggered when an error happens during a client side ad break playback. The
     * {@link Advertising.AdvertisingError.code} contains a {@link Advertising.VastErrorCode} and can be used to identify the exact error.
     */
    MODULE_ADVERTISING_ERROR = 3100,
    /**
     * No relevant PSSH block data was found for the used key system.
     * This issue is known to happen on Tizen 2016.
     * If the pssh data is only present in the manifest and not in the init segments,
     * Tizen2016 will fail to append the first data segment and the app will crash with no log or error.
     */
    SEGMENT_PSSH_DATA_MISSING = 4000
}
