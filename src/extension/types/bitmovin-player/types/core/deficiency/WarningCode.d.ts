/**
 * ### Groups
 *
 * #### 1000 - general warnings
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
 * #### 3000 - module warnings
 * - 3000 - 3099: MODULE generic
 * - 3100 - 3199: Advertising warning
 */
export declare enum WarningCode {
    /**
     * General warning
     * @hidden
     */
    GENERAL_WARNING = 1000,
    /**
     * An invalid argument has been passed into a {@link PlayerAPI} call.
     */
    API_INVALID_ARGUMENT = 1001,
    /**
     * General setup warning
     * @hidden
     */
    SETUP_WARNING = 1100,
    /**
     * URL.createObjectURL is missing.
     * This leads to query parameters not being added when using `native_hls_parsing`.
     */
    SETUP_CREATE_OBJECT_URL_MISSING = 1101,
    /**
     * Failed to initialize the `ServiceWorker`
     */
    SETUP_SERVICE_WORKER_INITIALIZATION_FAILED = 1103,
    /**
     * The `config.location.serviceworker` URL is not set but the serviceworker client module is loaded.
     */
    SETUP_SERVICE_WORKER_LOCATION_MISSING = 1104,
    /**
     * General source warning
     * @hidden
     */
    SOURCE_WARNING = 1200,
    /**
     * Codec or file format in the manifest is not supported
     */
    SOURCE_CODEC_OR_FILE_FORMAT_NOT_SUPPORTED = 1201,
    /**
     * Representation is missing
     */
    SOURCE_SMOOTH_REPRESENTATION_MISSING = 1202,
    /**
     * Couldn't create an init segment
     */
    SOURCE_SMOOTH_INVALID_INIT_DATA = 1203,
    /**
     * StreamIndex.type is neither 'video', 'audio' nor 'video'
     */
    SOURCE_SMOOTH_UNKNOWN_STREAM_INDEX_TYPE = 1204,
    /**
     * A `StreamIndex` does not contain any `QualityLevel`s, it will be filtered out
     */
    SOURCE_SMOOTH_EMPTY_QUALITY_LEVEL = 1205,
    /**
     * General playback warning
     */
    PLAYBACK_WARNING = 1300,
    /**
     * A gap in the buffer was detected
     */
    PLAYBACK_GAP_DETECTED = 1301,
    /**
     * The maximum number of retries to decode the stream was exceeded
     */
    PLAYBACK_DECODE_RETRIES_EXCEEDED = 1302,
    /**
     * Playback couldn't be started
     */
    PLAYBACK_COULD_NOT_BE_STARTED = 1303,
    /**
     * Negative DTS encountered, trying to correct
     */
    PLAYBACK_NEGATIVE_DECODING_TIMESTAMP_ENCOUNTERED = 1304,
    /**
     * Encountered an invalid segment that will be skipped
     */
    PLAYBACK_INVALID_DATA_SEGMENT_ENCOUNTERED = 1305,
    /**
     * General network warning
     * @hidden
     */
    NETWORK_WARNING = 1400,
    /**
     * Could not load manifest
     */
    NETWORK_COULD_NOT_LOAD_MANIFEST = 1401,
    /**
     * Could not load subtitles/captions
     */
    NETWORK_COULD_NOT_LOAD_SUBTITLE = 1402,
    /**
     * General DRM warning
     * @hidden
     */
    DRM_WARNING = 2000,
    /**
     * Content Decryption Module (CDM) does not support server certificates
     */
    DRM_SERVER_CERTIFICATE_NOT_SUPPORTED = 2001,
    /**
     * Could not decrypt segment
     */
    DRM_COULD_NOT_DECRYPT_SEGMENT = 2002,
    /**
     * The DRM license renewal failed
     */
    DRM_LICENSE_RENEWAL_FAILED = 2003,
    /**
     * The DRM license request failed.
     *
     * This warning can occur if access to the DRM license for the requested key IDs was forbidden, or the request was
     * misconfigured (e.g. with missing or expired tokens).
     */
    DRM_FAILED_LICENSE_REQUEST = 2004,
    /**
     * The DRM protected content cannot be played back due to the device not being able to securely present the content.
     *
     * The player will exclude all Representations associated with the blocked keyId and try to fall back to a different
     * representation. Once all representations have been exhausted, a `SOURCE_ERROR` ErrorEvent will be emitted.
     *
     * This warning can occur when an attempt is made to play back DRM protected content on a device or platform that is
     * not capable of playing back the content in a secure manner. In most cases, this error occurs when a
     * non-HDCP-capable monitor is connected to the system.
     *
     * The security level required to play back DRM protected content can also be configured on the DRM license server
     * side. In order to lessen the required security level, and to e.g. allow content playback on platforms that for
     * example don't support hardware decryption, please contact you DRM provider.
     */
    DRM_RESTRICTED_OUTPUT = 2013,
    /**
     * General DRM warning
     * @hidden
     */
    VR_WARNING = 2100,
    /**
     * VR rendering error
     */
    VR_RENDERING_ERROR = 2101,
    /**
     * General module warning
     * @hidden
     */
    MODULE_WARNING = 3000,
    /**
     * Module was not found
     */
    MODULE_MISSING = 3001,
    /**
     * General advertising module warning
     * @hidden
     */
    MODULE_ADVERTISING_WARNING = 3100,
    /**
     * Could not load Google IMA SDK
     */
    MODULE_ADVERTISING_IMA_SDK_NOT_FOUND = 3101,
    /**
     * The Open Measurement SDK player module was not added although expected
     */
    MODULE_ADVERTISING_OM_SDK_MODULE_MISSING = 3102,
    /**
     * Initialization of the Open Measurement SDK for Ad Tracking has failed
     */
    MODULE_ADVERTISING_OM_SDK_INIT_FAILURE = 3103,
    /**
     * A failure with Open Measurement SDK Ad Tracking has occurred
     */
    MODULE_ADVERTISING_OM_SDK_TRACKING_FAILURE = 3104
}
