/**
 * Defines the names and describes all available modules.
 */
export declare enum ModuleName {
    /**
     * Support for rendering of 2D and 3D 360 video content
     * @filename `bitmovinplayer-vr.js`
     */
    VR = "VR",
    /**
     * Handling of XML files, like DASH or VAST manifests
     * @filename `bitmovinplayer-xml.js`
     */
    XML = "XML",
    /**
     * Provides Microsoft Smooth Streaming support
     * @filename `bitmovinplayer-smooth.js`
     * @dependencies {@link DASH}
     */
    Smooth = "Smooth",
    /**
     * Provides general APIs for advertising support
     * @filename `bitmovinplayer-advertising-core.js`
     * @dependencies {@link XML} + ({@link EngineBitmovin} | {@link EngineNative})
     */
    AdvertisingCore = "AdvertisingCore",
    /**
     * Generic advertising module name.
     *
     * @hidden
     */
    Advertising = "Advertising",
    /**
     * Provides ad support using the Google IMA SDK.
     *
     * @filename `bitmovinplayer-advertising-ima.js`
     * @dependencies {@link AdvertisingCore}
     */
    AdvertisingIma = "Advertising",
    /**
     * Provides ad support using the Bitmovin advertising module. `EngineNative` module is required in order to play
     * progressive ads.
     *
     * @filename `bitmovinplayer-advertising-bitmovin.js`
     * @dependencies {@link AdvertisingCore}
     */
    AdvertisingBitmovin = "Advertising",
    /**
     * Provides ad verification capabilities using the Open Measurement SDK.
     *
     * In order to make use of this module, you have to use the AdvertisingBitmovin module and include the om-sdk
     * javascript files before the player, namely:
     * - omweb-v1.js
     * - omid-session-client-v1.js
     *
     * You then have to at least configure {@link Advertising.OmSdkTracker.partnerName} and {@link Advertising.OmSdkTracker.partnerVersion}
     * in the {@link Advertising.OmSdkTracker} which can be found in the {@link Advertising.AdvertisingConfig.trackers}.
     *
     * For additional verification, you can also include the validation script in the
     * {@link Advertising.OmSdkTracker.verificationResources}.
     *
     * @filename 'bitmovinplayer-advertising-omsdk.js'
     * @dependencies {@link Advertising}
     */
    AdvertisingOmSdk = "AdvertisingOmSdk",
    /**
     * Provides polyfills for legacy browsers which don't support state-of-the-art JavaScript features
     * like `Promise` or `String.prototype.includes`
     * @filename `bitmovinplayer-polyfill.js`
     */
    Polyfill = "Polyfill",
    /**
     * Provides bug fixes for certain browser versions.
     * Currently only on Chromecast Firmware 1.25.90308 due to a bug in the native `Array.prototype.reduce` method
     * @filename `bitmovinplayer-patch.js`
     */
    Patch = "Patch",
    /**
     * Support to use the player as remote control for Chromecast or WebSockets
     * @filename `bitmovinplayer-remotecontrol.js`
     * @dependencies {@link EngineBitmovin} | {@link EngineNative}
     */
    RemoteControl = "RemoteControl",
    /**
     * State-of-the-art video rendering of DASH, HLS or Smooth using the browser's MediaSource Extension
     * @filename `bitmovinplayer-mserenderer.js`
     * @dependencies {@link EngineBitmovin}
     */
    RendererMse = "RendererMSE",
    /**
     * Uses the plain video element for playback of progressive or HLS (if the browser supports it) sources
     * @filename `bitmovinplayer-engine-native.js`
     */
    EngineNative = "EngineNative",
    /**
     * Provides common adaptive streaming functionality
     * @filename `bitmovinplayer-engine-bitmovin.js`
     */
    EngineBitmovin = "EngineBitmovin",
    /**
     * Provides the available Adaptive BitRate algorithms
     * @filename `bitmovinplayer-abr.js`
     * @dependencies {@link EngineBitmovin}
     */
    ABR = "ABR",
    /**
     * Provides support for HLS AES-128 and DASH ClearKey streams
     * @filename `bitmovinplayer-crypto.js`
     * @dependencies {@link HLS} | {@link DASH}
     */
    Crypto = "Crypto",
    /**
     * Provides support for HLS playback
     * @filename `bitmovinplayer-hls.js`
     * @dependencies {@link EngineBitmovin}
     */
    HLS = "HLS",
    /**
     * Provides support for Widevine, PlayReady, PrimeTime and Fairplay DRM systems
     * @filename `bitmovinplayer-drm.js`
     */
    DRM = "DRM",
    /**
     * Provides MPEG-DASH support
     * @filename `bitmovinplayer-dash.js`
     * @dependencies {@link EngineBitmovin} + {@link XML}
     */
    DASH = "DASH",
    /**
     * Provides support for trans-multiplexing MPEG-2 TS to fMP4
     * @filename `bitmovinplayer-container-ts.js`
     * @dependencies {@link EngineBitmovin}
     */
    ContainerTS = "ContainerTS",
    /**
     * Provides support for playback of MP4 container formats in supported browsers
     * @filename `bitmovinplayer-container-mp4.js`
     * @dependencies {@link EngineBitmovin}
     */
    ContainerMP4 = "ContainerMP4",
    /**
     * Provides support for playback of WebM container formats in supported browsers
     * @filename `bitmovinplayer-container-webm.js`
     * @dependencies {@link EngineBitmovin}
     */
    ContainerWebM = "ContainerWebM",
    /**
     * Provides general subtitle support. Requires a format-specific subtitle module in addition
     * @filename `bitmovinplayer-subtitles.js`
     * @dependencies {@link EngineBitmovin} | {@link EngineNative}
     */
    Subtitles = "Subtitles",
    /**
     * Provides TTML/DFXP/EBU-TT-D subtitle support
     * @filename `bitmovinplayer-subtitles-ttml.js`
     * @dependencies {@link EngineBitmovin} + {@link Subtitles} + {@link XML}
     */
    SubtitlesTTML = "SubtitlesTTML",
    /**
     * Provides WebVTT and SRT subtitle support
     * @filename `bitmovinplayer-subtitles-vtt.js`
     * @dependencies {@link EngineBitmovin} + {@link Subtitles}
     */
    SubtitlesWebVTT = "SubtitlesWebVTT",
    /**
     * Provides CEA-608 subtitle support
     * @filename `bitmovinplayer-subtitles-cea608.js`
     * @dependencies {@link EngineBitmovin} + {@link Subtitles}
     */
    SubtitlesCEA608 = "SubtitlesCEA608",
    /**
     * Provides support for subtitles with {@link EngineNative}
     * @filename `bitmovinplayer-subtitles-native.js`
     * @dependencies {@link EngineNative} + {@link Subtitles}
     */
    SubtitlesNative = "SubtitlesNative",
    /**
     * Provides basic styling of the player
     * @filename `bitmovinplayer-style.js`
     */
    Style = "Style",
    /**
     * Provides support for thumbnail preview seeking
     * @filename `bitmovinplayer-thumbnail.js`
     * @filename `bitmovinplayer-thumbnail-imp.js`
     */
    Thumbnail = "Thumbnail",
    /**
     * Loads the default [Bitmovin Player UI](https://github.com/bitmovin/bitmovin-player-ui)
     * @filename `bitmovinplayer-ui.js`
     */
    UI = "UI",
    /**
     * Provides support for Tizen TVs that require special timestamp handling.
     * @filename `bitmovinplayer-tizen.js`
     */
    Tizen = "Tizen",
    /**
     * Provides support for WebOS TVs that require special handling for drm content. This module is not included in the
     * full player build and needs to be added manually.
     * Not required for playback on WebOS.
     * @filename `bitmovinplayer-webos.js`
     */
    Webos = "webos",
    /**
     * Provides low latency live streaming support
     * @filename `bitmovinplayer-lowlatency.js`
     */
    LowLatency = "LowLatency",
    /**
     * Provides support to communicate with a `ServiceWorker`
     * @filename `bitmovinplayer-serviceworker-client.js`
     */
    ServiceWorkerClient = "ServiceWorkerClient",
    /**
     * Support not-to-spec streams from the Envivio packager
     * @filename `bitmovinplayer-envivio.js`
     */
    Envivio = "Envivio",
    /**
     * Enables support for setting the `playmode` and `esvm` tweaks for MediaSDK on PlayStation 5
     * @filename `bitmovinplayer-playstation5.js`
     */
    PlayStation5 = "PlayStation5",
    /**
     * Provides support for PlayStation4 WebMAF applications
     * @filename `bitmovinplayer-playstation4.js`
     */
    PlayStation4 = "PlayStation4",
    /**
     * Provides support for playback of WebRTC streams.
     */
    EngineWebRtc = "EngineWebRtc",
    /**
     * Provides support for using the player in React Native applications
     * @filename `bitmovinplayer-reactnative.js`
     * @hidden
     */
    ReactNative = "ReactNative"
}
