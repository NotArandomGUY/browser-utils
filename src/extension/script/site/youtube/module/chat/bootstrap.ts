import { Feature } from '@ext/lib/feature'

interface YTIFrameMessage {
  'yt-live-chat-buy-flow-callback'?: unknown
  'yt-live-chat-close-buy-flow'?: true
  'yt-live-chat-forward-redux-action'?: unknown
  'yt-live-chat-set-dark-theme'?: unknown
  'yt-player-ad-start'?: string
  'yt-player-ad-end'?: true
  'yt-player-state-change'?: number
  'yt-player-video-progress'?: number
}

function postToLiveChatWindow(message: YTIFrameMessage): void {
  window.postMessage(message)
}

export default class YTChatBootstrapModule extends Feature {
  public constructor() {
    super('bootstrap')
  }

  protected activate(): boolean {
    const { pathname } = location

    if (!pathname.startsWith('/live_chat')) return false

    window.addEventListener('load', () => {
      if (pathname === '/live_chat_replay') {
        // Fire initial progress event to load chat immediately
        postToLiveChatWindow({ 'yt-player-video-progress': 0 })
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}