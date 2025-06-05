import type { WarningEvent } from '../Events';
import { PlayerEvent } from '../Events';
import { WarningCode } from './WarningCode';
/**
 * A generic base class for player exceptions.
 */
export declare class PlayerWarning implements WarningEvent {
    timestamp: number;
    readonly type: PlayerEvent;
    readonly code: WarningCode;
    readonly name: string;
    readonly message: string;
    readonly data: WarningEventData;
    constructor(code: WarningCode, message?: string, data?: WarningEventData);
}
export type WarningEventData = {
    [key: string]: any;
};
