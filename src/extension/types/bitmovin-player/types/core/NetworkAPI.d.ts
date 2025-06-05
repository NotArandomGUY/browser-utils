export interface HttpHeaders {
    /**
     * The key of the object is the name of the HTTP header and the value its string content.
     */
    [fieldName: string]: string;
}
/**
 * Values the `HttpRequestType` property can have in the network API config callbacks.
 */
export declare enum HttpRequestType {
    MANIFEST_DASH = "manifest/dash",
    MANIFEST_HLS_MASTER = "manifest/hls/master",
    MANIFEST_HLS_VARIANT = "manifest/hls/variant",
    MANIFEST_SMOOTH = "manifest/smooth",
    MANIFEST_ADS = "manifest/ads",
    MEDIA_AUDIO = "media/audio",
    MEDIA_VIDEO = "media/video",
    MEDIA_SUBTITLES = "media/subtitles",
    MEDIA_THUMBNAILS = "media/thumbnails",
    MEDIA_SEGMENTINDEX = "media/segmentindex",
    DRM_LICENSE_WIDEVINE = "drm/license/widevine",
    DRM_LICENSE_PLAYREADY = "drm/license/playready",
    DRM_LICENSE_FAIRPLAY = "drm/license/fairplay",
    DRM_LICENSE_PRIMETIME = "drm/license/primetime",
    DRM_LICENSE_CLEARKEY = "drm/license/clearkey",
    DRM_CERTIFICATE_FAIRPLAY = "drm/certificate/fairplay",
    KEY_HLS_AES = "key/hls/aes",
    TIME_SYNC = "time/sync",
    WEBRTC_SDP_REQUEST = "webrtc/sdp/request",
    WEBRTC_SDP_ANSWER = "webrtc/sdp/answer",
    WEBRTC_SDP_OFFER = "webrtc/sdp/offer",
    UNKNOWN = "unknown",
    /**
     * @hidden
     */
    INTERNAL = "internal"
}
export declare enum HttpResponseType {
    ARRAYBUFFER = "arraybuffer",
    BLOB = "blob",
    DOCUMENT = "document",
    JSON = "json",
    TEXT = "text"
}
/**
 * Allowed types of the {@link HttpRequest.body}
 */
export type HttpRequestBody = ArrayBuffer | ArrayBufferView | Blob | FormData | string | Document | URLSearchParams;
/**
 * Possible types of {@link HttpResponse.body}
 */
export type HttpResponseBody = string | ArrayBuffer | Blob | Object | Document | Stream<StreamDataType>;
/**
 * Allowed HTTP request method
 */
export declare enum HttpRequestMethod {
    GET = "GET",
    POST = "POST",
    HEAD = "HEAD",
    PATCH = "PATCH"
}
export interface HttpResponseTiming {
    /**
     * The time at which the request was initially sent.
     */
    sendTimestamp?: number;
    /**
     * The timestamp at which the request was opened.
     */
    openedTimestamp?: number;
    /**
     * The timestamp at which the headers where received.
     */
    headersReceivedTimestamp?: number;
    /**
     * The timestamp of the current progress event.
     */
    progressTimestamp?: number;
    /**
     * The timestamp at which the request was finished.
     */
    doneTimestamp?: number;
}
export interface HttpRequest {
    /**
     * HTTP method of the request
     */
    method: HttpRequestMethod;
    /**
     * URL of the request
     */
    url: string;
    /**
     * Headers of this request
     */
    headers: HttpHeaders;
    /**
     * Request body to send to the server (optional).
     */
    body?: HttpRequestBody;
    /**
     * Type we expect the {@link HttpResponse.body} to be.
     */
    responseType: HttpResponseType;
    /**
     * The credentials property as used in the `fetch` API and mapped to the `XmlHttpRequest` as follows:
     * <pre>
     * 'include' ... withCredentials = true
     * 'omit'    ... withCredentials = false
     * </pre>
     */
    credentials: 'omit' | 'same-origin' | 'include';
}
export interface HttpResponse<ResponseBody extends HttpResponseBody> {
    /**
     * Corresponding request object of this response
     */
    request: HttpRequest;
    /**
     * URL of the actual request. May differ from {@link HttpRequest.url} when redirects have happened.
     */
    url: string;
    /**
     * Headers of the response.
     */
    headers: HttpHeaders;
    /**
     * HTTP status code
     */
    status: number;
    /**
     * Status text provided by the server or default value if not present in response.
     */
    statusText: string;
    /**
     * Body of the response with type defined by {@link HttpRequest.responseType} (optional).
     */
    body?: ResponseBody;
    /**
     * Amount of bytes of the response body (optional).
     */
    length?: number;
    /**
     * The time-to-first-byte for this request in seconds.
     */
    timeToFirstByte?: number;
    /**
     * The elapsed time in seconds since this request was opened.
     */
    elapsedTime?: number;
}
export type Chunk = {
    bytes: number;
    downloadDuration: number;
};
export interface RequestProgress {
    loadedBytes: number;
    totalBytes?: number;
    url?: string;
    elapsedTime?: number;
    segmentDuration?: number;
    representationBitrate?: number;
    responseTiming?: HttpResponseTiming;
    /**
     * @hidden
     */
    chunks?: Chunk[];
}
/**
 * This interface can be returned by {@link NetworkConfig.sendHttpRequest} if a custom
 * network request implementation should be provided. The default implementation of the
 * player uses `XMLHttpRequest`.
 */
export interface RequestController<T extends HttpResponseBody> {
    /**
     * Is called by the player if it wants to cancel the current request (e.g. on seek)
     */
    cancel(): void;
    /**
     * Provides the data transfer progress to the player (if available).
     * @param {(requestProgress: RequestProgress) => void} listener
     */
    setProgressListener(listener: (requestProgress: RequestProgress) => void): void;
    /**
     * Returns a Promise that resolves with the actual {@link HttpResponse} in case of a `2xx
     * Success` HTTP status code. For all other HTTP status codes, the Promise should reject
     * with the {@link HttpResponse}.
     * @returns {Promise<HttpResponse<T>>}
     */
    getResponse(): Promise<HttpResponse<T>>;
}
export declare enum NetworkRequestApi {
    /**
     * XMLHttpRequest API
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest XMLHttpRequest on MDN}
     */
    XHR = "xhr",
    /**
     * Fetch API
     *
     * If configured, fetch will only be used if the `fetch` and `AbortController` APIs are supported by the browser.
     * Otherwise, the player will fall back to using XHR.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API Fetch API on MDN}
     */
    Fetch = "fetch"
}
/**
 * The network API gives the ability to influence network requests. It enables preprocessing requests, processing
 * responses or influencing the retry behavior.
 *
 * @since 7.4
 */
export interface NetworkConfig {
    /**
     * Specifies which Browser API should be used to perform network requests.
     *
     * Default is {@link NetworkRequestApi.XHR}.
     *
     * @since 8.149.0
     */
    requestApi?: NetworkRequestApi;
    /**
     * Can be used to change request parameters before a request is made.<br>
     * This will **not** be called before a {@link NetworkConfig.retryHttpRequest}.
     *
     * Example:
     * ```js
     * network: {
     *   preprocessHttpRequest: function(type, request) {
     *     if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_WIDEVINE) {
     *       // withCredentials = true
     *       request.credentials = 'include';
     *       // custom headers
     *       request.headers['customdata'] = 'AUTHENTICATION-XML';
     *     } else if (type === bitmovin.player.HttpRequestType.MEDIA_VIDEO ||
     *       type === bitmovin.player.HttpRequestType.MEDIA_AUDIO) {
     *
     *       // async call of custom API and add token to media URLs
     *       return customApiCall.then(function(data) {
     *         request.url += '?token=' + data.token;
     *         return request;
     *       });
     *     }
     *     return Promise.resolve(request);
     *   }
     * }
     * ```
     *
     * @param {HttpRequestType} type String type of the request to be made.
     * @param {HttpRequest} request Configuration object of the request.
     * @returns {Promise<HttpResponse>} The request can be canceled with `Promise.reject()` or
     *   data can be retrieved asynchronously before processing the request properties.
     */
    preprocessHttpRequest?: (type: HttpRequestType, request: HttpRequest) => Promise<HttpRequest>;
    /**
     * Can be used to provide a custom implementation to download requested files.
     * When `null` or `undefined` is returned for a certain request, the default implementation is used.
     *
     * Example:
     * ```js
     * network: {
     *   sendHttpRequest: function(type, request) {
     *     return {
     *       getResponse: function() {
     *         // get data from somewhere else
     *         var response = {
     *           request: request,
     *           url: request.url,
     *           headers: {},
     *           status: 200,
     *           statusText: 'OK',
     *           body: 'my message',
     *         }
     *         return Promise.resolve(response);
     *       },
     *       setProgressListener: function() {},
     *       cancel: function() {},
     *     }
     *   }
     * }
     * ```
     *
     * @param {HttpRequestType} type String type of the request to be made.
     * @param {HttpRequest} request Configuration object of the request.
     * @returns {RequestController<T> | undefined | null} The custom implementation of the RequestController.
     * @since 7.7
     */
    sendHttpRequest?: <T extends HttpResponseBody>(type: HttpRequestType, request: HttpRequest) => RequestController<T> | undefined | null;
    /**
     * Is called when a request is failed. Will override the default retry behavior.
     *
     * Example:
     * ```js
     * network: {
     *   retryHttpRequest: function(type, response) {
     *     // delay the retry by 1 second
     *     return new Promise(function(resolve) {
     *       setTimeout(function() {
     *         resolve(response.request);
     *       }, 1000);
     *     });
     *   }
     * }
     * ```
     *
     * @param {HttpRequestType} type String type of the request to be made.
     * @param {HttpResponse} response Response of the failed request.
     * @param {number} retry Amount of retries
     * @returns {Promise<HttpRequest>} The request that shall be used on the retry.
     */
    retryHttpRequest?: <T extends HttpResponseBody>(type: HttpRequestType, response: HttpResponse<T>, retry: number) => Promise<HttpRequest>;
    /**
     * Can be used to the access or change properties of the response before it gets into the player.
     *
     * Example:
     * ```js
     * network: {
     *   preprocessHttpResponse: function(type, response) {
     *     if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_WIDEVINE) {
     *       drmHeaders = response.headers;
     *     }
     *   }
     * }
     * ```
     *
     * @param {HttpRequestType} type String type of the request to be made.
     * @param {HttpResponse} response Contains all important fields of the response.
     * @returns {Promise<HttpResponse>} The response that shall go back into the player.
     */
    preprocessHttpResponse?: <T extends HttpResponseBody>(type: HttpRequestType, response: HttpResponse<T>) => Promise<HttpResponse<T>>;
}
export interface StreamResponse<T> {
    done: boolean;
    value?: T;
}
export type StreamDataType = ArrayBuffer | String;
export interface Stream<T extends StreamDataType> {
    /**
     * Provides the next data chunk in the stream and rejects once all data has been read.
     * @returns {Promise<T>}
     */
    read(): Promise<StreamResponse<T>>;
    /**
     * The type of data that the stream carries.
     * @returns string
     */
    getType(): string;
}
