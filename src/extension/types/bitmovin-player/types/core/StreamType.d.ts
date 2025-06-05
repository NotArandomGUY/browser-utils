/**
 * - `progressive`... Progressive MP4 or WebM streams.
 * - `dash`... MPEG-DASH streams.
 * - `hls`... Apple HLS streams.
 * - `smooth`... Microsoft Smooth Streaming streams.
 * - `whep`... WebRTC based WHEP stream.
 * - `unknown`... No stream specified.
 */
export declare enum StreamType {
    Progressive = "progressive",
    Dash = "dash",
    Hls = "hls",
    Smooth = "smooth",
    Whep = "whep",
    Unknown = "unknown"
}
