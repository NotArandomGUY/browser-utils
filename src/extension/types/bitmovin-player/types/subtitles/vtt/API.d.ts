export interface VTTRegionProperties {
    /**
     * ID of the region.
     * https://www.w3.org/TR/webvtt1/#webvtt-region-identifier
     */
    id: string;
    /**
     * Width of the region.
     * https://www.w3.org/TR/webvtt1/#webvtt-region-width
     */
    width: number;
    /**
     * Number of lines in region.
     * https://www.w3.org/TR/webvtt1/#webvtt-region-lines
     */
    lines: number;
    /**
     * X coordinate within the region which is anchored to the video viewport.
     * https://www.w3.org/TR/webvtt1/#webvtt-region-anchor
     */
    regionAnchorX: number;
    /**
     * Y coordinate within the region which is anchored to the video viewport.
     * https://www.w3.org/TR/webvtt1/#webvtt-region-anchor
     */
    regionAnchorY: number;
    /**
     * X coordinate within the video viewport to which the region anchor point is anchored.
     * https://www.w3.org/TR/webvtt1/#webvtt-region-viewport-anchor
     */
    viewportAnchorX: number;
    /**
     * Y coordinate within the video viewport to which the region anchor point is anchored.
     * https://www.w3.org/TR/webvtt1/#webvtt-region-viewport-anchor
     */
    viewportAnchorY: number;
    /**
     * Scroll value of the region.
     * https://www.w3.org/TR/webvtt1/#webvtt-region-scroll
     */
    scroll: 'up' | '';
}
export interface VTTProperties {
    /**
     * An optional ID.
     */
    id?: string;
    /**
     * An optional WebVTT region to which a cue belongs.
     * https://www.w3.org/TR/webvtt1/#webvtt-cue-region
     */
    region?: VTTRegionProperties;
    /**
     * Writing direction.
     * https://www.w3.org/TR/webvtt1/#webvtt-cue-writing-direction
     */
    vertical: 'rl' | 'lr' | '';
    /**
     * The line defines positioning of the cue box.
     * https://www.w3.org/TR/webvtt1/#webvtt-cue-line
     */
    line: number | string;
    /**
     * An alignment for the cue box’s line.
     * https://www.w3.org/TR/webvtt1/#webvtt-cue-line-alignment
     */
    lineAlign: 'start' | 'center' | 'end';
    /**
     * A boolean indicating whether the line is an integer number of lines,
     * or whether it is a percentage of the dimension of the video.
     * https://www.w3.org/TR/webvtt1/#webvtt-cue-snap-to-lines-flag
     */
    snapToLines: boolean;
    /**
     * A number giving the size of the cue box, to be interpreted as a percentage of the video,
     * as defined by the writing direction.
     * https://www.w3.org/TR/webvtt1/#webvtt-cue-size
     */
    size: number;
    /**
     * An alignment for all lines of text within the cue box, in the dimension of the writing direction.
     * https://w3.org/TR/webvtt1/#webvtt-cue-text-alignment
     */
    align: 'left' | 'start' | 'center' | 'middle' | 'end' | 'right';
    /**
     * The position defines the indent of the cue box in the direction defined by the writing direction.
     * https://www.w3.org/TR/webvtt1/#webvtt-cue-position
     */
    position: number | 'auto';
    /**
     * An alignment for the cue box in the dimension of the writing direction.
     * https://www.w3.org/TR/webvtt1/#webvtt-cue-position-alignment
     */
    positionAlign: 'line-left' | 'center' | 'line-right' | 'auto';
}
export interface VTTStyleDeclaration {
    background: string;
    backgroundClip: string;
    backgroundColor: string;
    backgroundImage: string;
    backgroundOrigin: string;
    backgroundPosition: string;
    backgroundRepeat: string;
    backgroundSize: string;
    backgroundAttachement: string;
    color: string;
    font: string;
    fontSize: string;
    fontFamily: string;
    fontStyle: string;
    fontVariant: string;
    fontWeight: string;
    fontStretch: string;
    lineHeight: string;
    opacity: string;
    outline: string;
    outlineColor: string;
    outlineStyle: string;
    outlineWidth: string;
    rubyPosition: string;
    textCombineUpright: string;
    textDecoration: string;
    textDecorationLine: string;
    textDecorationColor: string;
    textDecorationStyle: string;
    textDecorationThickness: string;
    textShadow: string;
    visibility: string;
    whiteSpace: string;
}
export interface VTTStyleProperties {
    /**
     * Optional identifier of a cue
     */
    identifier?: string;
    /**
     * Applied css styles
     */
    style: Partial<VTTStyleDeclaration>;
}
