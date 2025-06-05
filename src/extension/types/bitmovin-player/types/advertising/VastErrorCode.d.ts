export declare enum VastErrorCode {
    /**
     * The ad response contained an error.
     */
    XML_PARSING_ERROR = 100,
    /**
     * The VAST validates as XML, but does not validate per the VAST schema.
     */
    VAST_SCHEMA_VALIDATION_ERROR = 101,
    /**
     * The VAST version of the ad response is not supported.
     */
    VERSION_NOT_SUPPORTED = 102,
    /**
     * Received an ad type that was not expected and/or cannot be displayed.
     */
    TRAFFICKING_ERROR = 200,
    /**
     * Expected ad with different linearity.
     */
    EXPECTING_DIFFERENT_LINEARITY = 201,
    /**
     * Expected ad with different duration.
     */
    EXPECTING_DIFFERENT_DURATION = 202,
    /**
     * Expected ad with different size or bitrate.
     */
    EXPECTING_DIFFERENT_SIZE = 203,
    /**
     * A general wrapper error occurred. This can mean that some wrappers were not reachable or timed out.
     */
    GENERAL_WRAPPER_ERROR = 300,
    /**
     * Timeout of VAST URI provided in Wrapper element.
     */
    WRAPPER_VAST_URI_TIMEOUT = 301,
    /**
     * Too many wrapper responses have been received with no InLine response.
     */
    WRAPPER_LIMIT_REACHED = 302,
    /**
     * No ads VAST response after one or more Wrappers.
     */
    NO_ADS_VAST_RESPONSE = 303,
    /**
     * Unable to display the linear ad.
     */
    GENERAL_LINEAR_ERROR = 400,
    /**
     * Unable to find Linear/MediaFile from URI.
     */
    FILE_NOT_FOUND = 401,
    /**
     * Timeout of MediaFile URI.
     */
    MEDIAFILE_URI_TIMEOUT = 402,
    /**
     * Could not find MediaFile that is supported, based on the attributes of the MediaFile element.
     */
    NO_SUPPORTED_MEDIAFILE = 403,
    /**
     * There was a problem displaying the MediaFile. Possible causes are CORS issues, unsupported codecs, mismatch
     * between mime type and video file type or an unsupported delivery method.
     */
    PROBLEM_DISPLAYING_MEDIAFILE = 405,
    /**
     * A general NonLinearAds error occurred and no further details are known.
     */
    GENERAL_NONLINEARADS_ERROR = 500,
    /**
     * Unable to display NonLinear ad because creative dimensions do not align with creative display area (i.e., creative
     * dimensions too large).
     */
    NONLINEAR_AD_INVALID_DIMENSIONS = 501,
    /**
     * Unable to fetch NonLinearAds/NonLinear resource.
     */
    UNABLE_TO_FETCH_NONLINEAR_RESOURCE = 502,
    /**
     * Could not find NonLinear resource that is supported.
     */
    NO_SUPPORTED_NONLINEAR_RESOURCE_TYPE = 503,
    /**
     * A general CompanionAds error occurred and no further details are known.
     */
    GENERAL_COMPANIONADS_ERROR = 600,
    /**
     * Unable to display companion because creative dimensions do not fit within companion display area (i.e., no
     * available space).
     */
    COMPANION_AD_INVALID_DIMENSIONS = 601,
    /**
     * A required companion ad can not be displayed.
     */
    UNABLE_TO_DISPLAY_REQUIRED_COMPANION = 602,
    /**
     * Unable to fetch CompanionAds/Companion resource.
     */
    UNABLE_TO_FETCH_COMPANION_RESOURCE = 603,
    /**
     * Could not find Companion resource that is supported.
     */
    NO_SUPPORTED_COMPANION_RESOURCE_TYPE = 604,
    /**
     * An unexpected error occurred and the cause is not known.
     */
    UNDEFINED_ERROR = 900,
    /**
     * A VPAID error occurred.
     */
    GENERAL_VPAID_ERROR = 901
}
