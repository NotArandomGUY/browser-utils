import { PlayerError } from './core/deficiency/PlayerError';
import type { ModuleName } from './ModuleName';
export declare class PlayerModuleMissingError extends PlayerError {
    constructor(name: ModuleName, dependency?: ModuleName);
}
