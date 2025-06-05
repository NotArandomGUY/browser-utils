import type { RemoteControlConfig } from './RemoteControlConfig';
export declare enum GoogleCastReceiverVersion {
    v2 = "v2",
    v3 = "v3"
}
/**
 * Configuration interface for the {@link GoogleCastRemoteControl}.
 * NOTE: This interface is exposed in the PlayerAPI docs
 */
export interface GoogleCastRemoteControlConfig extends RemoteControlConfig {
    /**
     * The application ID of the Cast application that should be launched when connecting to a Cast receiver.
     * Set this if you want to use your own custom receiver application. If unset, the Bitmovin player cast application
     * is used.
     */
    receiverApplicationId?: string;
    /**
     * The message namespace for communication of advanced player functionality not covered by the Cast media controls.
     * Only overwrite this if you are implementing your own custom receiver.
     */
    messageNamespace?: string;
    /**
     * The receiver app version. This is only necessary if providing custom {@link receiverApplicationId} and
     * it is using receiver app v3.
     *
     * Default is 'v2'
     * @since 8.43.0
     */
    receiverVersion?: 'v2' | 'v3';
    /**
     * Specifies, whether an existing Cast session shall be re-joined rather than creating a new one when casting starts.
     *
     * Default is `false`.
     * @since 8.67.0
     */
    rejoinActiveSession?: boolean;
    /**
     * Callback providing the possibility to prepare/alter the media info object before it is loaded onto Chromecast
     * receiver app to change its media/source.
     *
     * Example:
     * ```js
     * prepareMediaInfo: function(mediaInfo) {
     *   // Signal fMP4 container format for audio and video
     *   mediaInfo.hlsSegmentFormat = chrome.cast.media.HlsSegmentFormat.FMP4;
     *   mediaInfo.hlsVideoSegmentFormat = chrome.cast.media.HlsVideoSegmentFormat.FMP4;
     *
     *   return Promise.resolve(mediaInfo);
     * }
     * ```
     *
     * Note: This callback is only supported with Chromecast v3 (CAF) receivers.
     *
     * @since 8.78.0
     * @param mediaInfo The object representing the media to be loaded on the receiver, see {@link https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.MediaInfo | chrome.cast.media.MediaInfo}
     * @returns A promise resloving with the altered object that the player will load on the receiver.
     */
    prepareMediaInfo?(mediaInfo: any): Promise<any>;
}
