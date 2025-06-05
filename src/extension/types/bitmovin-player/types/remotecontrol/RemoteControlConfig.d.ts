/**
 * Configuration interface for a {@link RemoteControl}.
 * NOTE: This interface is exposed in the PlayerAPI docs
 */
import type { RemoteControlCustomReceiverConfig } from '../core/PlayerConfigAPI';
export interface RemoteControlConfig {
    /**
     * An arbitrary configuration object that is sent to the receiver when a connection is established. This object
     * can carry configuration values that are of no concern to and are handled outside of the RemoteControl/
     * RemoteControlReceiver architecture.
     */
    customReceiverConfig?: RemoteControlCustomReceiverConfig;
}
