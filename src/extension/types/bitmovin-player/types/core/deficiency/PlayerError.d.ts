/**
 * A generic base class for player exceptions.
 *
 * We currently cannot extend the Error object as recommended in https://stackoverflow.com/a/32749533/370252
 * due to transpilation to ES5 where Error is not a class and instanceof checks therefore fail. The downside of
 * the missing extension is that browsers do not automatically parse and prepare the stacktrace in the console.
 */
import { ErrorCode } from './ErrorCode';
export declare class PlayerError implements Error {
    readonly code: ErrorCode;
    readonly message: string;
    readonly name: string;
    readonly stack: string;
    readonly data?: {
        [key: string]: any;
    };
    readonly sourceIdentifier?: string;
    constructor(code: ErrorCode, data?: {
        [key: string]: any;
    }, message?: string, sourceIdentifier?: string);
}
