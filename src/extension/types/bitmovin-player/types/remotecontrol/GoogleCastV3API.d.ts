import type { HttpHeaders, SourceConfigOptions } from '../Export';
/**
 * The customData object on the MediaInfo that a LoadRequest is made with. It contains data that is relevant to the
 * respective source being loaded.
 * {@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.MediaInfo#customData MediaInfo.customData}
 */
export interface CAFMediaInfoCustomData {
    /**
     * The DRM config needed to play the source
     */
    drm?: CAFDrmConfig;
    /**
     * Custom metadata
     */
    metadata?: CAFMetadata;
    /**
     * Options that should apply for the source
     */
    options?: CAFSourceOptions;
}
export type CAFContentProtectionSystem = 'clearkey' | 'playready' | 'widevine';
export interface CAFDrmConfig {
    /**
     * The content protection system
     */
    protectionSystem: CAFContentProtectionSystem;
    /**
     * The license server URL
     */
    licenseUrl: string;
    /**
     * If cookies/credentials should be sent along with the license request
     */
    withCredentials?: boolean;
    /**
     * Headers for the license request
     */
    headers?: HttpHeaders;
}
export interface CAFMetadata {
    [key: string]: string;
}
/**
 * Options that should apply for the loaded source. This is a subset of SourceConfigOptions (i.e the same semantics
 * apply) as there is limited support on CAF.
 */
export type CAFSourceOptions = Pick<SourceConfigOptions, 'withCredentials' | 'manifestWithCredentials'>;
