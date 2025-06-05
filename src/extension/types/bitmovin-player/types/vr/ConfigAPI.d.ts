import type { KeyMap, TransitionTimingType, VRContentType } from './API';
export interface VRViewingWindowConfig {
    /**
     * Specifies how low the user can look. Valid values are from -90 to 90 (default: -90).
     */
    minYaw: number;
    /**
     * Specifies how high the user can look. Valid values are from -90 to 90 (default: 90).
     */
    maxYaw: number;
    /**
     * Specifies how far left the user can look. Valid values are from 0 to 360 (default: 0).
     */
    minPitch: number;
    /**
     * Specifies how far right the user can look. Valid values are from 0 to 360 (default: 360).
     */
    maxPitch: number;
}
export interface VRControlConfig {
    /**
     * Specifies the transition timing that shall be used for this control.
     */
    transitionTimingType?: TransitionTimingType;
    /**
     * The time that a transition should take.
     */
    transitionTime?: number;
    /**
     * The maximum displacement speed in degrees per second. Default values are 90°/s for keyboard controls, and
     * Infinity for mouse and API controls.
     */
    maxDisplacementSpeed?: number;
}
export interface VRKeyboardControlConfig extends VRControlConfig {
    /**
     * Specifies which keys should be used for the keyboard control.
     */
    keyMap?: KeyMap;
}
/**
 * Example:
 * ```js
 * source: {
 *   dash : 'http://path/to/mpd/file.mpd',
 *   vr: {
 *     contentType: bitmovin.player.vr.ContentType.Single,
 *     startPosition: 180,
 *     initialRotation: true,
 *     initialRotateRate: 0.025
 *   }
 * }
 * ```
 */
export interface VRConfig {
    /**
     * Specifies the type of the VR/360 content.
     */
    contentType: VRContentType;
    /**
     * Specifies if the video should start in stereo mode (`true`) or not (`false`, default).
     */
    stereo?: boolean;
    /**
     * Specifies the starting viewpoint, stated in degrees.
     */
    startPosition?: number;
    /**
     * Specifies the width of the content, stated in degrees.
     */
    contentFieldOfView?: number;
    /**
     * Specifies the vertical field of view in degrees.
     */
    verticalFieldOfView?: number;
    /**
     * Specifies the horizontal field of view in degrees.
     */
    horizontalFieldOfView?: number;
    /**
     * Specifies the angles the user can view around within the VR/360 video.
     * Per default, the user has no limitations.
     */
    viewingWindow?: VRViewingWindowConfig;
    /**
     * Specifies whether the restricted inline playback shall be used or not.
     */
    restrictedInlinePlayback?: boolean;
    /**
     * Specifies whether performance measurements shall be enabled or not.
     */
    enableFrameRateMeasurements?: boolean;
    /**
     * Allows to set a cardboard config as string to adjust the VR/360 rendering to a specific cardboard device.
     * The QR codes on cardboards contain short URLs, which lead to a long URL, e.g.
     * `http://google.com/cardboard/cfg?p=CghSZWQgQnVsbBILUmVkIEJ1bGwgVlId7FE4PSWPwnU9KhAAAEhCAABIQgAASEIAAEhCWAA1KVwPPToICtcjPArXIzxQAGAC`.
     * The content of parameter p should be used as string.
     *
     * Example:
     * ```js
     * {
     *   ...
     *   cardboard:
     * 'CghSZWQgQnVsbBILUmVkIEJ1bGwgVlId7FE4PSWPwnU9KhAAAEhCAABIQgAASEIAAEhCWAA1KVwPPToICtcjPArXIzxQAGAC'
     * }
     * ```
     */
    cardboard?: string;
    /**
     * The threshold in degrees that the viewport can change before the VRViewingDirectionChange event is
     * triggered.
     */
    viewingDirectionChangeThreshold?: number;
    /**
     * The minimal interval between consecutive VRViewingDirectionChange events.
     */
    viewingDirectionChangeEventInterval?: number;
    /**
     * The keyboard control config.
     */
    keyboardControl?: VRKeyboardControlConfig;
    /**
     * The mouse control config.
     */
    mouseControl?: VRControlConfig;
    /**
     * The api control config.
     */
    apiControl?: VRControlConfig;
}
