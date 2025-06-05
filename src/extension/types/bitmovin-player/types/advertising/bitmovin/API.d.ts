import type { AdBreak, AdMediaFileQuality, VastAdData } from '../API';
import type { AdBreakConfig, AdvertisingConfig } from '../ConfigAPI';
export interface BitmovinAdBreak extends AdBreak, AdBreakConfig {
}
export interface BitmovinAdData extends VastAdData {
}
/**
 * Configuration used when the BitmovinModule is used for Advertising
 */
export interface BitmovinAdvertisingConfig extends AdvertisingConfig {
    /**
     * Receives quality that would be picked by player and list of all available
     * qualities and returns selected quality.
     */
    onSelectAdQuality?: (suggested: AdMediaFileQuality, available: AdMediaFileQuality[]) => AdMediaFileQuality;
}
