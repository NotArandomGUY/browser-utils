export declare enum AdvertisingModuleErrorCode {
    /**
     * The loaded manifest did not correspond to the given ad tag type.
     */
    AD_TAG_TYPE_NOT_MATCHING = 110,
    /**
     * There was a problem downloading the ad manifest from the specified URI.
     */
    COULD_NOT_LOAD_AD_MANIFEST = 404,
    /**
     * There was a problem playing the ad because a required player module is missing.
     */
    REQUIRED_PLAYER_MODULE_MISSING = 2000
}
