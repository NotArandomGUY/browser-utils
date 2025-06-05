import type { HttpHeaders, HttpResponseType } from '../core/NetworkAPI';
/**
 * Contains the configuration of the different DRM systems related to the source.
 */
export interface DRMConfig {
    /**
     * Widevine Modular is supported in Chrome and Chromium-based browsers with Widevine CDM (e.g. Opera 15+).
     */
    widevine?: WidevineModularDRMConfig;
    /**
     * Microsoft PlayReady is supported in Edge and Internet Explorer 11 on Windows 8.1+.
     */
    playready?: PlayReadyDRMConfig;
    /**
     * Adobe PrimeTime DRM is supported in Firefox 42+ on Windows only.
     */
    primetime?: AdobePrimeTimeDRMConfig;
    /**
     * Apple Fairplay DRM is supported in Safari on Mac OS X only.
     */
    fairplay?: AppleFairplayDRMConfig;
    /**
     * If no Hollywood-grade DRM is required, clear key can be an alternative.
     * The player supports MPEG-CENC (Common Encryption) compatible AES-128 CTR encryption.
     */
    clearkey?: ClearKeyDRMConfig | ClearKeyDRMServerConfig;
    /**
     * When set to `true`, the license requests are made as soon as init data is available.
     * Otherwise, the license requests are made once data segments are pushed into the buffer.
     *
     * Default is `false`.
     */
    immediateLicenseRequest?: boolean;
    /**
     * When set, defines the key system priority used by the player to choose the key system if multiple
     * key systems are sypported by the platform. Default is `unset`.
     *
     * Allowed key system strings: ['widevine', 'playready', 'fairplay', 'primetime']
     */
    preferredKeySystems?: string[];
}
export interface WidevineModularDRMConfig {
    /**
     * An URL to the Widevine license server for this content (optional).
     * Can be defined in the configuration or taken out from the video manifest if defined there.
     * If the config URL is defined it has precedence over the URL defined in the manifest.
     */
    LA_URL?: string;
    /**
     * Set to `true` to send credentials such as cookies or authorization headers along with the license requests.
     * Default is `false`.
     */
    withCredentials?: boolean;
    /**
     * Specifies how often a license request should be retried if was not successful (e.g. the license server
     * was not reachable). Default is `1`. `0` disables retries.
     */
    maxLicenseRequestRetries?: number;
    /**
     * Specifies how long in milliseconds should be waited before a license request should be retried.
     */
    licenseRequestRetryDelay?: number;
    /**
     * Specifies the behavior in case the license request fails with a 403 Forbidden error. If set to `true`, the player
     * will emit a Warning, and try to request a new license for other key IDs, if available. Otherwise, the player will
     * throw an error. Default is `false`.
     */
    retryOtherKeysOnForbiddenLicense?: boolean;
    /**
     * An object which specifies custom HTTP headers.
     *
     * BuyDRM/KeyOS Specific Example:
     * ```js
     * headers : {
     *   customdata: 'AUTHENTICATION-XML'
     * }
     * ```
     *
     * DRMtoday by castLabs Specific Example:
     * ```js
     * headers : {
     *   'dt-custom-data': 'INSERT-YOUR-BASE64-ENCODED-CUSTOMDATA'
     * }
     * ```
     */
    headers?: HttpHeaders;
    /**
     * A function which gets the widevine license from the server. Is needed for custom widevine servers where
     * not only the license itself is responded, but instead the license is e.g. wrapped in an JSON object.
     *
     * DRMtoday by castLabs Specific Example:
     * ```js
     * prepareLicense : (licenseObj) => {
     *   const license = {license: licenseObj.license};
     *
     *   try {
     *     const drmTodayObj = JSON.parse(String.fromCharCode.apply(null, licenseObj.license));
     *     if (drmTodayObj && drmTodayObj.status && drmTodayObj.license) {
     *       if (drmTodayObj.status === 'OK') {
     *         const str = window.atob(drmTodayObj.license);
     *         const bufView = new Uint8Array(new ArrayBuffer(str.length));
     *         for (let i = 0; i < str.length; i++) {
     *           bufView[i] = str.charCodeAt(i);
     *         }
     *         license.license = bufView;
     *       } else {
     *         // license not okay
     *       }
     *     } else {
     *       // no valid DRMtoday license
     *     }
     *   } catch (e) {
     *     // no valid DRMtoday license
     *   }
     *   return license;
     * };
     * ```
     *
     * @param licenseObject
     */
    prepareLicense?: (licenseObject: any) => any;
    /**
     * A function to prepare the license acquisition message which will be sent to the license acquisition
     * server. As many DRM provider expect different, vendor-specific message, this can be done using this
     * user-defined function (optional / depending on the DRM server). The parameter is the key message event
     * object as given by the Widevine Content Decryption Module (CDM).
     *
     * Default Implementation Example:
     * ```js
     * prepareMessage : (keyMessage) => {
     *   return keyMessage.message;
     * }
     * ```
     * This will send just the actual key message as provided by the CDM to the license server.
     *
     * Vualto Specific Example:
     * ```js
     * prepareMessage : (keyMessage) => {
     *   return JSON.stringify({
     *     token: VUALTO_TOKEN,
     *     drm_info: Array.apply(null, new Uint8Array(keyMessage.message)),
     *     kid: 'VUALTO_KID'
     *   });
     * }
     * ```
     * This will send a JSON object to the license server. This object contains the Vualto-specific token (token),
     * a pre-processed key message (drm_info), and the key ID (kid).
     *
     * @param keyMessage
     */
    prepareMessage?: (keyMessage: any) => any;
    /**
     * An object which allows to specify configuration options of the DRM key system, such as
     * distinctiveIdentifier or persistentState (refer to
     * {@link https://w3c.github.io/encrypted-media/#mediakeysystemconfiguration-dictionary
     * MediaKeySystemConfiguration} for more details). Please note that these settings need to be supported by the
     * browser or playback will fail.
     */
    mediaKeySystemConfig?: MediaKeySystemConfiguration;
    /**
     * Sets the robustness level for video. The robustness specifies the security level of the DRM key system. If a
     * string specifies a higher security level than the system is able to support playback will fail. The lowest
     * security level is the empty string. The strings are specific to a key system and currently only the values for
     * Widevine are known based on the [Chromium source
     * code](https://cs.chromium.org/chromium/src/components/cdm/renderer/widevine_key_system_properties.h?q=SW_SECURE_CRYPTO&l=22):
     * - `SW_SECURE_CRYPTO`
     * - `SW_SECURE_DECODE`
     * - `HW_SECURE_CRYPTO`
     * - `HW_SECURE_DECODE`
     * - `HW_SECURE_ALL`
     */
    videoRobustness?: string;
    /**
     * Sets the robustness level for audio. The robustness specifies the security level of the DRM key system. If a
     * string specifies a higher security level than the system is able to support playback will fail. The lowest
     * security level is the empty string. The strings are specific to a key system and currently only the values for
     * Widevine are known based on the [Chromium source
     * code](https://cs.chromium.org/chromium/src/components/cdm/renderer/widevine_key_system_properties.h?q=SW_SECURE_CRYPTO&l=22):
     * - `SW_SECURE_CRYPTO`
     * - `SW_SECURE_DECODE`
     * - `HW_SECURE_CRYPTO`
     * - `HW_SECURE_DECODE`
     * - `HW_SECURE_ALL`
     */
    audioRobustness?: string;
    /**
     * A server certificate to be used to encrypt messages to the DRM license server. The contents are Key
     * System-specific. It allows an application to proactively provide a server certificate to implementations that
     * support it to avoid the additional round trip, should the Content Decryption Module (CDM) request it. It is
     * intended as an optimization, and applications are not required to use it. If not set but required by the CDM, the
     * CDM will request a certificate from the DRM license server.
     */
    serverCertificate?: ArrayBuffer;
    /**
     * Specify the priority of Widevine DRM key system strings for this source. Non-specified strings which the player knows
     * will be put at the end of the list. The first key system string of this list, which is supported on the current platform
     * is used.
     *
     * @since 8.143.0
     */
    keySystemPriority?: string[];
}
export interface PlayReadyDRMConfig {
    /**
     * An URL to the PlayReady license server for this content (optional).
     * Can be defined in the configuration or taken out from the video manifest if defined there.
     * If the config URL is defined it has precedence over the URL defined in the manifest.
     */
    LA_URL?: string;
    /**
     * Set to `true` to send credentials such as cookies or authorization headers along with the license requests.
     * Default is `false`.
     */
    withCredentials?: boolean;
    /**
     * Specifies how often a license request should be retried if was not successful (e.g. the license
     * server was not reachable). Default is `1`. `0` disables retries.
     */
    maxLicenseRequestRetries?: number;
    /**
     * Specifies how long in milliseconds should be waited before a license request should be retried.
     */
    licenseRequestRetryDelay?: number;
    /**
     * An object which specifies custom HTTP headers.
     *
     * DRMtoday by castLabs Specific Example:
     * ```js
     * headers : {
     *   'dt-custom-data': 'INSERT-YOUR-BASE64-ENCODED-CUSTOMDATA'
     * }
     * ```
     */
    headers?: HttpHeaders;
    /**
     * An object which allows to specify configuration options of the DRM key system, such as
     * distinctiveIdentifier or persistentState (refer to
     * {@link https://w3c.github.io/encrypted-media/#mediakeysystemconfiguration-dictionary
     * MediaKeySystemConfiguration} for more details). Please note that these settings need to be supported by the
     * browser or playback will fail.
     */
    mediaKeySystemConfig?: MediaKeySystemConfiguration;
    /**
     * A custom data string sent along with the license request. This is only supported in browsers using
     * the legacy Microsoft prefixed EME (IE, Edge legacy).
     */
    customData?: string;
    /**
     * Used to set the Proactive attribute for the license acquisition when using {@link customData}.
     * @hidden
     */
    proactiveLicense?: boolean;
    /**
     * Specifies whether to upgrade all license requests to use SSL.
     */
    forceSSL?: boolean;
    /**
     * Specifies, whether the `keymessage` provided by the browser is already UTF-8 encoded.
     *
     * On most desktop browsers, the `keymessage` is UTF-16 encoded, which requires additional preprocessing
     * before a license request can be sent. Devices like smart TVs or set-top boxes often already provide a
     * UTF-8 encoded key messages, so the preprocessing step can be skipped. Default value is `false`.
     */
    utf8message?: boolean;
    /**
     * Specifies, whether the `Challenge` specified in the `keymessage` is provided in plaintext
     * rather than being Base64 encoded.
     *
     * On most desktop browsers, the `Challenge` is Base64 encoded, which requires additional preprocessing
     * before a license request can be sent. Devices like smart TVs or set-top boxes often already provide a
     * plaintext challenge in the key message, so the preprocessing step can be skipped. Default value is `false`.
     */
    plaintextChallenge?: boolean;
    /**
     * Specify the priority of PlayReady DRM key system strings for this source. Non-specified strings which the player knows
     * will be put at the end of the list. The first key system string of this list, which is supported on the current platform
     * is used.
     *
     * @since 8.143.0
     */
    keySystemPriority?: string[];
}
export interface AdobePrimeTimeDRMConfig {
    /**
     * The URL to the Adobe PrimeTime license server for this content (optional).
     * Can be defined in the configuration or taken out from the video manifest if defined there.
     * If the config URL is defined it has precedence over the URL defined in the manifest.
     */
    LA_URL?: string;
    /**
     *  The URL for individualization requests.
     */
    indivURL: string;
    /**
     * Set to `true` to send credentials such as cookies or authorization headers along with the license requests.
     * Default is `false`.
     */
    withCredentials?: boolean;
    /**
     * Specifies how often a license request should be retried if was not successful (e.g. the license
     * server was not reachable). Default is `1`. `0` disables retries.
     */
    maxLicenseRequestRetries?: number;
    /**
     * Specifies how long in milliseconds should be waited before a license request should be retried.
     */
    licenseRequestRetryDelay?: number;
    /**
     * An object which specifies custom HTTP headers.
     */
    headers?: HttpHeaders;
    /**
     * An object which allows to specify configuration options of the DRM key system, such as
     * distinctiveIdentifier or persistentState (refer to
     * {@link https://w3c.github.io/encrypted-media/#mediakeysystemconfiguration-dictionary
     * MediaKeySystemConfiguration} for more details). Please note that these settings need to be supported by the
     * browser or playback will fail.
     */
    mediaKeySystemConfig?: Object;
    /**
     * Specify the priority of PrimeTime DRM key system strings for this source. Non-specified strings which the player knows
     * will be put at the end of the list. The first key system string of this list, which is supported on the current platform
     * is used.
     *
     * @since 8.143.0
     */
    keySystemPriority?: string[];
}
/**
 * EZDRM Specific Example:
 * ```js
 * fairplay: {
 *   LA_URL: 'http://fps.ezdrm.com/api/licenses/YOUR-CONTENT-ID',
 *   certificateURL: 'YOUR-CERTIFICATE',
 *   prepareContentId: (contentId) => {
 *     const uri = contentId;
 *     const uriParts = uri.split('://', 1);
 *     const protocol = uriParts[0].slice(-3);
 *     uriParts = uri.split(';', 2);
 *     contentId = uriParts.length>1?uriParts[1]:'';
 *     return protocol.toLowerCase()=='skd' ? contentId : '';
 *   },
 *   prepareLicenseAsync: (ckc) => {
 *     return new Promise((resolve, reject) => {
 *       const reader = new FileReader();
 *       reader.addEventListener('loadend', () => {
 *         const array = new Uint8Array(reader.result);
 *         resolve(array);
 *       });
 *       reader.addEventListener('error', () => {
 *         reject(reader.error);
 *       });
 *       reader.readAsArrayBuffer(ckc);
 *     });
 *   },
 *   prepareMessage: (event, session) => {
 *     return new Blob([event.message], {type: 'application/octet-binary'});
 *   },
 *   headers: {
 *     'content-type': 'application/octet-stream',
 *   },
 *   useUint16InitData: true,
 *   licenseResponseType: 'blob'
 * }
 * ```
 *
 * DRMtoday by castLabs Specific Example:
 * ```js
 * fairplay: {
 *   LA_URL: 'https://license-server-url-provided-by-drmtoday',
 *   certificateURL: 'https://certificate-url-provided-by-drmtoday',
 *   headers: {
 *     'dt-custom-data': 'INSERT-YOUR-BASE64-ENCODED-CUSTOMDATA',
 *   },
 *   prepareMessage : (event, session) => {
 *     return 'spc=' + encodeURIComponent(event.messageBase64Encoded) + '&' + session.contentId;
 *   },
 *   prepareContentId : (contentId) => {
 *     const pattern='skd://drmtoday?';
 *     let parameters;
 *     let idx = contentId.indexOf(pattern);
 *
 *     if (idx > -1) {
 *       parameters = contentId.substring(idx + pattern.length);
 *       parameters = parameters.replace(/assetid/gi, 'assetId');
 *       parameters = parameters.replace(/variantid/gi, 'variantId');
 *       return parameters;
 *     } else {
 *       return '';
 *     }
 *   }
 * }
 * ```
 *
 * Vualto Specific Example (requires Bitmovin Player 6.0+):
 * ```js
 * fairplay: {
 *   LA_URL: 'http://fairplay-license.drm.technology/license',
 *   certificateURL: 'http://fairplay-license.drm.technology/certificate',
 *   certificateHeaders: {
 *     'x-vudrm-token': arrayParams['token'],
 *   },
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 *   prepareMessage: (keyMessageEvent, keySession) => {
 *     return JSON.stringify({
 *       token: 'VUALTO_TOKEN',
 *       contentId: keySession.contentId,
 *       payload: keyMessageEvent.messageBase64Encoded
 *     });
 *   },
 *   prepareContentId: (rawContentId) => {
 *     const tmp = rawContentId.split('/');
 *     return tmp[tmp.length - 1];
 *   },
 *   prepareCertificate: (cert) => {
 *     return new Uint8Array(cert);
 *   },
 *   prepareLicense: (license) => {
 *     return new Uint8Array(license);
 *   },
 *   licenseResponseType: 'arraybuffer'
 * }
 * ```
 */
export interface AppleFairplayDRMConfig {
    /**
     * The URL to the Fairplay license server for this content (optional).
     * Can be defined in the configuration or taken out from the video manifest if defined there.
     * If the config URL is defined it has precedence over the URL defined in the manifest.
     */
    LA_URL?: string;
    /**
     * The URL to the Fairplay certificate of the license server.
     *
     * Note: either `certificateURL` or `serverCertificate` is required for Fairplay.
     */
    certificateURL?: string;
    /**
     * An object which specify custom HTTP headers for the license request (optional).
     */
    headers?: HttpHeaders;
    /**
     * An object which specify custom HTTP headers for the certificate request (optional).
     */
    certificateHeaders?: HttpHeaders;
    /**
     * A function to prepare the license acquisition message which will be sent to the license acquisition
     * server (optional). As many DRM providers expect different, vendor-specific messages, this can be done
     * using this user-defined function. The first parameter is the key message event object as given by the
     * Fairplay Content Decryption Module (CDM), enhanced by the messageBase64Encoded attribute, which contains
     * the key message encoded as base64 encoded string. The second parameter is the ssion object, enhanced by
     * a contentId attribute.
     * @param event
     * @param session
     */
    prepareMessage?: (event: any, session: any) => any;
    /**
     * A function to prepare the contentId, which is sent to the Fairplay license server as request body
     * (optional). As many DRM providers expect different, vendor-specific messages, this can be done using
     * this user-defined function. The parameter is the URI extracted from the HLS manifset (m3u8) and the
     * return value should be the contentID as string.
     * @param url
     */
    prepareContentId?: (url: string) => string;
    /**
     * Set to `true` to send credentials such as cookies or authorization headers along with the license requests.
     * Default is `false`.
     */
    withCredentials?: boolean;
    /**
     * A function to prepare the certificate before passing it into the browser. This is needed if the server
     * response with anything else than the certificate, e.g. if the certificate is wrapped into a JSON object.
     * The server response is passed as parameter “as is” and the return type is expected to be an ArrayBuffer.
     * @param data
     */
    prepareCertificate?: (data: any) => ArrayBuffer;
    /**
     * A function to prepare the license before passing it into the browser. This is needed if the server
     * response with anything else than the license, e.g. if the license is wrapped into a JSON object.
     * The server response is passed as parameter “as is” and the return type is expected to be a
     * Base64-encoded string.
     * @param data
     */
    prepareLicense?: (data: any) => string;
    /**
     * Similar to prepareLicense, this callback can be used to prepare the license before passing it to the
     * browser, but the license can be processed asynchronously. Please note that this function must return a
     * promise and the parameter for the resolve function needs to be the Uint8Array, which is passed “as is”
     * to the browser. Using this function prevents prepareLicense from being called.
     * @param data
     */
    prepareLicenseAsync?: (data: any) => Promise<Uint8Array>;
    /**
     * A flag to change between `Uint8Array` (default, value `false`) and `Uint16Array` initialization data.
     * Depends on the fairplay license server, most use `Uint8Array` but e.g. EZDRM requires `Uint16Array`.
     */
    useUint16InitData?: boolean;
    /**
     * Sets an explicit response type for the license request. Default response type for this request is
     * {@link HttpResponseType.TEXT}, e.g. EZDRM requires {@link HttpResponseType.BLOB}.
     */
    licenseResponseType?: HttpResponseType;
    /**
     * A callback function which gets the URI (without the `skd:` part) from the HLS manifest passed as parameter.
     * The function needs to return a string which is used as LA_URL “as is”.
     */
    getLicenseServerUrl?: (skdUrl: string) => string;
    /**
     * Specifies how often a license request should be retried if was not successful (e.g. the license server
     * was not reachable). Default is `1`. `0` disables retries.
     */
    maxLicenseRequestRetries?: number;
    /**
     * Specifies how often a certificate request should be retried if was not successful (e.g. the certificate URL
     * returns a 404). Default is 1. 0 disables retries.
     */
    maxCertificateRequestRetries?: number;
    /**
     * Defaults to null, e.g., certificate will be requested from the license server if required.
     * A key-system-specific server certificate used to encrypt license requests. Its use is optional and is meant as
     * an optimization to avoid a round-trip to request a certificate.
     *
     * Note: either `certificateURL` or `serverCertificate` is required for Fairplay.
     *
     * @since 7.2
     */
    serverCertificate?: ArrayBuffer;
    /**
     * Specify the priority of FairPlay DRM key system strings for this source. Non-specified strings which the player knows
     * will be put at the end of the list. The first key system string of this list, which is supported on the current platform
     * is used.
     *
     * @since 8.143.0
     */
    keySystemPriority?: string[];
}
export interface ClearKeyDRMConfigEntry {
    /**
     * Key ID. Optional if the same kid is used for the whole content (every audio and video track of
     * each representation). Otherwise the player won’t know which kid has to be used.
     */
    kid?: string;
    key: string;
}
export interface ClearKeyDRMServerConfig {
    /**
     * A URL to the ClearKey license server for this content.
     */
    LA_URL: string;
    /**
     * Set to `true` to send credentials such as cookies or authorization headers along with the license requests.
     * Default is `false`.
     */
    withCredentials?: boolean;
    /**
     * Specifies how often a license request should be retried if it was not successful (e.g. the license
     * server was not reachable). Default is `1`. `0` disables retries.
     */
    maxLicenseRequestRetries?: number;
    /**
     * Specifies how long in milliseconds should be waited before a license request should be retried.
     */
    licenseRequestRetryDelay?: number;
    /**
     * An object which specifies custom HTTP headers.
     *
     * DRMtoday by castLabs Specific Example:
     * ```js
     * headers : {
     *   'dt-custom-data': 'INSERT-YOUR-BASE64-ENCODED-CUSTOMDATA'
     * }
     * ```
     */
    headers?: HttpHeaders;
}
/**
 * Example:
 * ```js
 * clearkey: [{
 *   kid: 'eb676abbcb345e96bbcf616630f1a3da',
 *   key: '100b6c20940f779a4589152b57d2dacb'
 * }, {
 *   kid: 'fc787bccdb345e96bbcf61674102b4eb',
 *   key: '211c7d30940f779a4589152c68a1cfba'
 * }]
 * ```
 */
export interface ClearKeyDRMConfig extends Array<ClearKeyDRMConfigEntry> {
}
export declare namespace MediaKeySystemConfig {
    enum PersistentState {
        Required = "required",
        Optional = "optional"
    }
    enum DistinctiveIdentifier {
        Optional = "optional",
        NotAllowed = "not-allowed"
    }
    enum SessionType {
        Temporary = "temporary",
        PersistentLicense = "persistent-license"
    }
}
