/**
 * Google IMA Advertising Module error codes. These are in addition to the error codes found in
 * {@link Advertising.AdvertisingModuleErrorCode} and {@link Advertising.VastErrorCode}.
 */
export declare enum ImaModuleErrorCode {
    /**
     * There was a problem downloading the IMA SDK.
     */
    FAILED_TO_REQUEST_IMA_SDK = 103,
    /**
     * No Ads VAST response after one or more Wrappers.
     */
    VAST_NO_ADS_AFTER_WRAPPER = 303,
    /**
     * There was a problem requesting ads from the server.
     */
    FAILED_TO_REQUEST_ADS = 1005,
    /**
     * No assets were found in the VAST ad response.
     */
    VAST_ASSET_NOT_FOUND = 1007,
    /**
     * Empty VAST response.
     */
    VAST_EMPTY_RESPONSE = 1009,
    /**
     * The ad response was not understood and cannot be parsed.
     */
    UNKNOWN_AD_RESPONSE = 1010,
    /**
     * Locale specified for the SDK is not supported.
     */
    UNSUPPORTED_LOCALE = 1011,
    /**
     * There was a problem requesting ads from the server.
     */
    ADS_REQUEST_NETWORK_ERROR = 1012,
    /**
     * The ad tag url specified was invalid. It needs to be properly encoded.
     */
    INVALID_AD_TAG = 1013,
    /**
     * There was an error with stream initialization during server side ad insertion.
     */
    STREAM_INITIALIZATION_FAILED = 1020,
    /**
     * There was an error with asset fallback.
     */
    ASSET_FALLBACK_FAILED = 1021,
    /**
     * Invalid arguments were provided to SDK methods.
     */
    INVALID_ARGUMENTS = 1101,
    /**
     * The browser prevented playback initiated without user interaction.
     */
    AUTOPLAY_DISALLOWED = 1205
}
