import type { RemoteControlConfig } from './RemoteControlConfig';
/**
 * Configuration interface for the {@link WebSocketRemoteControl}.
 * NOTE: This interface is exposed in the PlayerAPI docs
 */
export interface WebSocketRemoteControlConfig extends RemoteControlConfig {
    /**
     * The URL of the WebSocket server managing communication between WebSocket remote controls
     * and WebSocket remote receivers.
     */
    url: string;
}
