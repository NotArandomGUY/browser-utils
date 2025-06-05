/**
 * - `html5`... The MediaSource Extension (MSE) based JavaScript player.
 * - `native`... The browser's native capabilities are being used, e.g. playing back HLS in Safari on iOS.
 * - `unknown`... The initial value where it is not known yet which player will be used.
 */
export declare enum PlayerType {
    Html5 = "html5",
    Native = "native",
    WebRtc = "webrtc",
    Unknown = "unknown"
}
