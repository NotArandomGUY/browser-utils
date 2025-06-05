import type { SubtitleCueEvent } from '../core/Events';
import type { TextTrack } from '../core/PlayerAPI';
/**
 * Definition of a subtitle/caption track.
 */
export interface SubtitleTrack extends TextTrack {
    /**
     * Tells if a subtitle track is enabled or disabled. If set to `true`, the track will be enabled by default.
     */
    enabled?: boolean;
    /**
     * Tells if a subtitle track is forced. If set to true it means that the player should automatically select and
     * switch this subtitle according to the selected audio language.
     */
    forced?: boolean;
}
export interface PlayerSubtitlesAPI {
    /**
     * Adds a subtitle. {@link SubtitleTrack.isFragmented} is not supported when tracks are added via this method.
     * @param {SubtitleTrack} subtitle the subtitle to add
     */
    add(subtitle: SubtitleTrack): void;
    /**
     * Removes a subtitle. Disables it in case it's enabled before removal.
     * @param subtitleID the {@link SubtitleTrack.id} of the subtitle track to remove
     */
    remove(subtitleID: string): void;
    /**
     * Returns the list of all registered subtitles.
     * @returns {SubtitleTrack[]} the list of all registered subtitles
     */
    list(): SubtitleTrack[];
    /**
     * Enables a subtitle track. Multiple tracks can be enabled concurrently depending on the `exclusive` flag.
     * @param subtitleID the {@link SubtitleTrack.id} of the subtitle track to enable
     * @param {boolean} exclusive Optional, default is `true` and all other enabled tracks will be disabled. When set to
     *   `false`, the given track will be enabled additionally.
     */
    enable(subtitleID: string, exclusive?: boolean): void;
    /**
     * Disabled an enabled subtitle track.
     * @param subtitleID the {@link SubtitleTrack.id} of the subtitle track to disable
     */
    disable(subtitleID: string): void;
    /**
     * The player will fire a {@link Core.PlayerEvent.CueEnter} event with the provided information.
     * @param cue the event containing data about the subtitle cue
     */
    cueEnter(cue: SubtitleCueEvent): void;
    /**
     * The player will fire a {@link Core.PlayerEvent.CueExit} event with the provided information.
     * @param cue the event containing data about the subtitle cue
     */
    cueExit(cue: SubtitleCueEvent): void;
}
