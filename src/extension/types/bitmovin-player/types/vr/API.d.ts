/**
 * The direction in which the viewport of the VR player is looking.
 */
export interface ViewingDirection {
    /**
     * Rotation around the vertical axis in degrees.
     */
    yaw: number;
    /**
     * Rotation around the horizontal axis in degrees.
     */
    pitch: number;
    /**
     * Rotation around the depth axis in degrees.
     */
    roll: number;
}
/**
 * The field of view for VR playback.
 */
export interface FieldOfView {
    /**
     * The up degrees of the field of view.
     */
    upDegrees: number;
    /**
     * The right degrees of the field of view.
     */
    rightDegrees: number;
    /**
     * The down degrees of the field of view.
     */
    downDegrees: number;
    /**
     * The left degrees of the field of view.
     */
    leftDegrees: number;
}
/**
 * Represents a two-dimensional vector.
 */
export interface Vec3 {
    /**
     * The x component of the vector.
     */
    x: number;
    /**
     * The y component of the vector.
     */
    y: number;
    /**
     * The roll of the vector.
     */
    phi: number;
}
/**
 * Represents a viewing window for VR content. The current viewing direction is restricted to the set viewing window.
 */
export interface ViewingWindow {
    /**
     * Lower bound for yaw.
     */
    minYaw: number;
    /**
     * Upper bound for yaw.
     */
    maxYaw: number;
    /**
     * Lower bound for pitch.
     */
    minPitch: number;
    /**
     * Upper bound for pitch.
     */
    maxPitch: number;
}
export interface KeyMap {
    /**
     * The keys that shall be used to move the viewing direction upwards. Each string represents a key combination,
     * where different keys are separated by a space character, i.e. 'w', 'ArrowUp' or 'Alt F4'.
     */
    up?: string[];
    /**
     * The keys that shall be used to move the viewing direction downwards. Each string represents a key combination,
     * where different keys are separated by a space character, i.e. 'w', 'ArrowUp' or 'Alt F4'.
     */
    down?: string[];
    /**
     * The keys that shall be used to move the viewing direction leftwards. Each string represents a key combination,
     * where different keys are separated by a space character, i.e. 'w', 'ArrowUp' or 'Alt F4'.
     */
    left?: string[];
    /**
     * The keys that shall be used to move the viewing direction rightwards. Each string represents a key combination,
     * where different keys are separated by a space character, i.e. 'w', 'ArrowUp' or 'Alt F4'.
     */
    right?: string[];
    /**
     * The keys that shall be used to rotate the viewing direction clockwise. Each string represents a key combination,
     * where different keys are separated by a space character, i.e. 'w', 'ArrowUp' or 'Alt F4'.
     */
    rotateClockwise?: string[];
    /**
     * The keys that shall be used to rotate the viewing direction counterclockwise. Each string represents a key
     * combination, where different keys are separated by a space character, i.e. 'w', 'ArrowUp' or 'Alt F4'.
     */
    rotateCounterclockwise?: string[];
}
export declare enum VRContentType {
    Single = "single",
    TAB = "tab",
    SBS = "sbs"
}
export declare enum VRState {
    Ready = "ready",
    Playing = "playing",
    Error = "error",
    Uninitialized = "uninitialized"
}
export declare enum TransitionTimingType {
    None = "none",
    EaseIn = "ease-in",
    EaseOut = "ease-out",
    EaseInOut = "ease-in-out"
}
export interface PlayerVRAPI {
    /**
     * Enables or disables stereo mode for VR content.
     * @param {Boolean} enableStereo - If true, stereo mode will be enabled.
     * @returns {Boolean} - True if API call was successful, false otherwise.
     */
    setStereo(enableStereo: boolean): boolean;
    /**
     * Enables the gyroscope (also on VRHMDs).
     * @return {boolean} - True, if the VRHandler is ready, false otherwise.
     */
    enableGyroscope(): boolean;
    /**
     * Disables the gyroscope (also on VRHMDs).
     * @return {boolean} - True, if the VRHandler is ready, false otherwise.
     */
    disableGyroscope(): boolean;
    /**
     * Returns true, if the gyroscope is enabled, false otherwise.
     * @return {boolean} - True, if the gyroscope is enabled, false otherwise.
     */
    isGyroscopeEnabled(): boolean;
    /**
     * Enables the mouse controls.
     * @return {boolean} - True, if the VRHandler is ready, false otherwise.
     */
    enableMouseControl(): boolean;
    /**
     * Disables the mouse controls.
     * @return {boolean} - True, if the VRHandler is ready, false otherwise.
     */
    disableMouseControl(): boolean;
    /**
     * Returns true, if mouse controls are enabled, false otherwise.
     * @return {Boolean} - True, if mouse controls are enabled, false otherwise.
     */
    isMouseControlEnabled(): boolean;
    /**
     * Enables the keyboard controls.
     * @return {boolean} - True, if the VRHandler is ready, false otherwise.
     */
    enableKeyboardControl(): boolean;
    /**
     * Disables the keyboard controls.
     * @return {boolean} - True, if the VRHandler is ready, false otherwise.
     */
    disableKeyboardControl(): boolean;
    /**
     * Returns true, if keyboard controls are enabled, false otherwise.
     * @return {Boolean} - True, if keyboard controls are enabled, false otherwise.
     */
    isKeyboardControlEnabled(): boolean;
    /**
     * Returns true, if stereo is enabled, false otherwise.
     * @return {Boolean} - True, if stereo is enabled, false otherwise.
     */
    getStereo(): boolean;
    /**
     * Returns the current state of the VR handler or null, if the VR handler is not yet initialized.
     * @return {String|null} - The current state of the VR handler.
     */
    getState(): string | null;
    /**
     * Returns the last recorded error or null, if no error occurred.
     * @return {String|null} - The last recorded error.
     */
    getLastError(): string | null;
    /**
     * Returns the current viewing direction, if the VRHandler is in the playing state.
     * @return {ViewingDirection} - The current viewing direction.
     */
    getViewingDirection(): ViewingDirection;
    /**
     * Sets the given viewing direction, if the VRHandler is in the playing state.
     * @param {ViewingDirection} viewingDirection - The viewing direction to set.
     * @return {boolean} - True, if the viewing direction could be set, false otherwise.
     */
    setViewingDirection(viewingDirection: ViewingDirection): boolean;
    /**
     * Moves the current VR viewing direction in the given direction with the given speed. The speed is determined by the
     * length of the direction vector in degrees / second. The movement will be continued for 110ms, after that period
     * the
     * movement will be dampened and fade out. To sustain a smooth viewport movement, no more than 100ms must pass
     * between
     * consecutive calls to this function.
     * @param {Vec3} direction - A three-component vector describing the direction and speed in which the viewing
     *   direction shall be moved.
     * @return {Boolean} - True, if the VRHandler is ready, false otherwise.
     */
    moveViewingDirection(direction: Vec3): boolean;
    /**
     * Sets the minimal interval between consecutive VRViewingDirectionChange events. The default value is 250ms.
     * @param {number} interval - The minimal interval between consecutive VRViewingDirectionChange events.
     * @return {boolean} - True, if the VRHandler is ready, false otherwise.
     */
    setViewingDirectionChangeEventInterval(interval: number): boolean;
    /**
     * Gets the minimal interval between consecutive VRViewingDirectionChange events.
     * @return {Number} - The minimal interval between consecutive VRViewingDirectionChange events.
     */
    getViewingDirectionChangeEventInterval(): number;
    /**
     * Sets the number of degrees that the viewport can change before the VRViewingDirectionChange event is
     * triggered. The default value is 5°.
     * @param {Number} threshold - The threshold in degrees that the viewport can change before the
     * VRViewingDirectionChange event is triggered.
     * @return {Boolean} - True, if the VRHandler is ready, false otherwise.
     */
    setViewingDirectionChangeThreshold(threshold: number): boolean;
    /**
     * Gets the number of degrees that the viewport can change before the VRViewingDirectionChange event is
     * triggered.
     * @return {Number} - The threshold in degrees that the viewport can change before the
     * VRViewingDirectionChange event is triggered.
     */
    getViewingDirectionChangeThreshold(): number;
    /**
     * Sets the vertical field of view in degrees.
     * @param {Number} fieldOfView - The vertical field of view in degrees.
     * @return {Boolean} - True, if the VRHandler is ready, false otherwise.
     */
    setVerticalFieldOfView(fieldOfView: number): boolean;
    /**
     * Gets the vertical field of view in degrees.
     * @return {Number} - The vertical field of view in degrees.
     */
    getVerticalFieldOfView(): number;
    /**
     * Sets the horizontal field of view in degrees.
     * @param {Number} fieldOfView - The horizontal field of view in degrees.
     * @return {Boolean} - True, if the VRHandler is ready, false otherwise.
     */
    setHorizontalFieldOfView(fieldOfView: number): boolean;
    /**
     * Gets the horizontal field of view in degrees.
     * @return {Number} - The horizontal field of view in degrees.
     */
    getHorizontalFieldOfView(): number;
    /**
     * Applies a zoom factor to the current field of view.
     * @param {number} factor - The zoom factor to apply.
     * @return {Boolean} - True, if the VRHandler is ready, false otherwise.
     */
    zoom(factor: number): boolean;
    /**
     * Returns the current zoom factor.
     * @returns {number} - The current zoom factor, if the VRHandler is ready, -1 otherwise.
     */
    getZoom(): number;
    /**
     * Returns true, if a permission is required to access device orientation data.
     * @return {Boolean} True, if a permission is required, false otherwise.
     */
    deviceOrientationPermissionRequired(): boolean;
    /**
     * Requests the permission needed to access device orientation data, if required.
     * @return {Promise<void>} A promise that resolves when the required permissions have been acquired.
     */
    requestDeviceOrientationPermission(): Promise<void>;
}
