import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTResponse } from '@ext/custom/youtube/api/schema'
import { getYTPInstance, YTPInstanceType, YTPVideoPlayerInstance } from '@ext/custom/youtube/module/player/bootstrap'
import { ytuiShowToast } from '@ext/custom/youtube/utils/ytui'
import { floor, random } from '@ext/global/math'
import { URL } from '@ext/global/network'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import MessageChannel from '@ext/lib/message/channel'
import { MessageDataUnion } from '@ext/lib/message/type'

const CHANNEL_NAME = 'bmc-ytchat-popout'
const CHANNEL_SOURCE = `cs-${(((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0}`
const COLLAPSED_CHAT_TIMEOUT = 5e3 // 5 sec
const CHAT_POPOUT_IDLE_TIMEOUT = 60e3 // 1 min
const LIVE_CHAT_PATHNAME = '/live_chat'
const LIVE_CHAT_REPLAY_PATHNAME = '/live_chat_replay'

const logger = new Logger('YTCHAT-POPOUT')

interface YTChatIFrameMessage {
  'yt-live-chat-buy-flow-callback'?: unknown
  'yt-live-chat-close-buy-flow'?: true
  'yt-live-chat-forward-redux-action'?: unknown
  'yt-live-chat-set-dark-theme'?: unknown
  'yt-player-ad-start'?: string
  'yt-player-ad-end'?: true
  'yt-player-state-change'?: number
  'yt-player-video-progress'?: number
}

const enum ChatPopoutState {
  MASK_LOCK = 0x10,
  MASK_STATE = 0x0F,
  STATE_NONE = 0,
  STATE_LIVE,
  STATE_LIVE_REPLAY
}

const enum ChatPopoutMessageType {
  POPOUT_ANNOUNCE,
  PLAYER_LOAD_LIVE_CHAT,
  PLAYER_LOAD_LIVE_CHAT_REPLAY,
  PLAYER_KEEPALIVE,
  PLAYER_MESSAGE,
  PLAYER_UNLOAD,
  TOAST_MESSAGE
}

type ChatPopoutMessageDataMap = {
  [ChatPopoutMessageType.POPOUT_ANNOUNCE]: { source: string, videoId: string | null }
  [ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT]: { source?: string, videoId: string }
  [ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT_REPLAY]: { source?: string, videoId: string, continuation: string }
  [ChatPopoutMessageType.PLAYER_KEEPALIVE]: { videoId: string }
  [ChatPopoutMessageType.PLAYER_MESSAGE]: { videoId: string, forwardMessage: YTChatIFrameMessage }
  [ChatPopoutMessageType.PLAYER_UNLOAD]: { videoId: string }
  [ChatPopoutMessageType.TOAST_MESSAGE]: { text: string }
}

class MainAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private listeningPlayer_: YTPVideoPlayerInstance | null
  private videoId_: string | null
  private liveChatVideoId_: string | null
  private liveChatContinuation_: string | null
  private lastIdlePopoutAnnounce_: number

  public constructor() {
    super(CHANNEL_NAME)

    this.listeningPlayer_ = null
    this.videoId_ = null
    this.liveChatVideoId_ = null
    this.liveChatContinuation_ = null
    this.lastIdlePopoutAnnounce_ = Date.now()

    const onPlayerUnload = (): void => {
      const { listeningPlayer_, liveChatVideoId_ } = this

      if (listeningPlayer_ != null) this.setPlayerListener_('unsubscribe', null)
      if (liveChatVideoId_ != null) {
        logger.debug('unload live chat video:', liveChatVideoId_)

        this.liveChatVideoId_ = null
        this.liveChatContinuation_ = null
        this.send(ChatPopoutMessageType.PLAYER_UNLOAD, { videoId: liveChatVideoId_ })
      }
    }

    registerYTValueProcessor(YTRenderer.mapped.liveChatRenderer, data => {
      const { videoId_, liveChatVideoId_, lastIdlePopoutAnnounce_ } = this
      const { continuations, isReplay } = data

      if (videoId_ != null && videoId_ !== liveChatVideoId_) {
        logger.debug('load live chat for video:', videoId_)

        const continuation = isReplay ? continuations?.map(c => c.reloadContinuationData).find(c => c != null)?.continuation : null
        if (continuation === undefined) {
          logger.warn('missing continuation for live chat replay')
          return true
        }

        this.liveChatVideoId_ = videoId_
        this.liveChatContinuation_ = continuation

        if (continuation == null) {
          this.send(ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT, { videoId: videoId_ })
        } else {
          this.send(ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT_REPLAY, { videoId: videoId_, continuation })
        }
      }
      registerYTValueProcessor(YTResponse.mapped.player, data => {
        const videoId = data.videoDetails?.videoId ?? null
        if (videoId !== this.liveChatVideoId_) onPlayerUnload()

        this.videoId_ = videoId

        return true
      })

      // Collapse chat if popout window is available
      data.initialDisplayState = (Date.now() - lastIdlePopoutAnnounce_) <= COLLAPSED_CHAT_TIMEOUT ? 'LIVE_CHAT_DISPLAY_STATE_COLLAPSED' : 'LIVE_CHAT_DISPLAY_STATE_EXPANDED'

      return true
    })

    setInterval(this.update_.bind(this), 5e3)

    window.addEventListener('beforeunload', onPlayerUnload)
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    if (document.hidden) return

    switch (message.type) {
      case ChatPopoutMessageType.POPOUT_ANNOUNCE: {
        const { liveChatVideoId_, liveChatContinuation_ } = this
        const { source, videoId } = message.data

        if (liveChatVideoId_ === videoId) {
          this.lastIdlePopoutAnnounce_ = Date.now()
          return
        }
        if (liveChatVideoId_ == null) return

        if (liveChatContinuation_ == null) {
          this.send(ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT, { source, videoId: liveChatVideoId_ })
        } else {
          this.send(ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT_REPLAY, { source, videoId: liveChatVideoId_, continuation: liveChatContinuation_ })
        }
        return
      }
      case ChatPopoutMessageType.TOAST_MESSAGE:
        ytuiShowToast(message.data.text, 5e3)
        return
      default:
        logger.debug('invalid message:', message)
        return
    }
  }

  private onPlayerProgress_(): void {
    const { videoId_, listeningPlayer_ } = this

    if (videoId_ != null) this.send(ChatPopoutMessageType.PLAYER_MESSAGE, { videoId: videoId_, forwardMessage: { 'yt-player-video-progress': listeningPlayer_?.getCurrentTime?.() ?? 0 } })
  }

  private onPlayerAdStart_(cpn: string): void {
    const { videoId_ } = this

    if (videoId_ != null) this.send(ChatPopoutMessageType.PLAYER_MESSAGE, { videoId: videoId_, forwardMessage: { 'yt-player-ad-start': cpn } })
  }

  private onPlayerAdEnd_(): void {
    const { videoId_ } = this

    if (videoId_ != null) this.send(ChatPopoutMessageType.PLAYER_MESSAGE, { videoId: videoId_, forwardMessage: { 'yt-player-ad-end': true } })
  }

  private onPlayerStateChange_(state: number): void {
    const { videoId_ } = this

    if (videoId_ != null) this.send(ChatPopoutMessageType.PLAYER_MESSAGE, { videoId: videoId_, forwardMessage: { 'yt-player-state-change': state } })
  }

  private setPlayerListener_(action: 'subscribe' | 'unsubscribe', player: YTPVideoPlayerInstance | null): void {
    const { listeningPlayer_, onPlayerProgress_, onPlayerAdStart_, onPlayerAdEnd_, onPlayerStateChange_ } = this

    this.listeningPlayer_ = player
    player ??= listeningPlayer_

    if (player == null) return

    player[action]?.('onVideoProgress', onPlayerProgress_, this)
    player[action]?.('onAdStart', onPlayerAdStart_, this)
    player[action]?.('onAdEnd', onPlayerAdEnd_, this)
    player[action]?.('onStateChange', onPlayerStateChange_, this)
  }

  private update_(): void {
    const { listeningPlayer_, videoId_ } = this

    if (videoId_ != null) {
      this.send(ChatPopoutMessageType.PLAYER_KEEPALIVE, { videoId: videoId_ })
    }

    const player = getYTPInstance(YTPInstanceType.APP)?.playerRef?.deref()
    if (player === listeningPlayer_) return

    this.setPlayerListener_('unsubscribe', null)
    if (player == null) return

    this.setPlayerListener_('subscribe', player)
  }
}

class ChatAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private videoId_: string | null
  private state_: ChatPopoutState
  private lastUpdate_: number
  private isLoaded_: boolean

  public constructor() {
    super(CHANNEL_NAME)

    this.videoId_ = null
    this.state_ = ChatPopoutState.STATE_NONE
    this.lastUpdate_ = 0
    this.isLoaded_ = false

    registerYTValueProcessor(YTResponse.mapped.liveChatGetLiveChat, data => {
      const { videoId_, state_ } = this

      if (state_ & ChatPopoutState.MASK_LOCK) {
        const continuations = data.continuationContents?.liveChatContinuation?.continuations
        if (continuations != null && continuations.length > 0) {
          this.lock('live_chat_update')
        } else {
          this.unlock('live_chat_end')
          this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Popout live chat '${videoId_}' ended` })
        }
      }

      return true
    })

    setInterval(this.update.bind(this), 5e3)
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    const { videoId_, state_ } = this

    switch (message.type) {
      case ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT: {
        const { source, videoId } = message.data

        if ((state_ & ChatPopoutState.MASK_LOCK) || (source != null && source !== CHANNEL_SOURCE)) return

        this.videoId_ = videoId
        this.state_ = ChatPopoutState.STATE_LIVE
        this.lock('live_chat_load')
        this.redirect(LIVE_CHAT_PATHNAME, 'v', videoId)
        return
      }
      case ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT_REPLAY: {
        const { source, videoId, continuation } = message.data

        if ((state_ & ChatPopoutState.MASK_LOCK) || (source != null && source !== CHANNEL_SOURCE)) return

        this.videoId_ = videoId
        this.state_ = ChatPopoutState.STATE_LIVE_REPLAY
        this.lock('live_chat_replay_load')
        this.redirect(LIVE_CHAT_REPLAY_PATHNAME, 'continuation', continuation)
        return
      }
      case ChatPopoutMessageType.PLAYER_KEEPALIVE: {
        const { videoId } = message.data

        if (!(state_ & ChatPopoutState.MASK_LOCK) || videoId_ !== videoId) return

        this.lock('player_keepalive')
        return
      }
      case ChatPopoutMessageType.PLAYER_MESSAGE: {
        const { videoId, forwardMessage } = message.data

        if (!(state_ & ChatPopoutState.MASK_LOCK) || videoId_ !== videoId) return

        window.postMessage(forwardMessage)
        return
      }
      case ChatPopoutMessageType.PLAYER_UNLOAD: {
        const { videoId } = message.data

        if (videoId_ !== videoId) return

        this.unlock('unload_player')
        this.send(ChatPopoutMessageType.POPOUT_ANNOUNCE, { source: CHANNEL_SOURCE, videoId: null })
        return
      }
      default:
        logger.debug('invalid message:', message)
        return
    }
  }

  private redirect(path: string, key: string, value: string): void {
    const { videoId_, isLoaded_ } = this

    const url = new URL(location.href)
    const { pathname, searchParams } = url

    if (pathname === path && searchParams.get(key) === value) {
      if (isLoaded_) return

      this.isLoaded_ = true
      this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Popout live chat '${videoId_}' loaded` })
      return
    }

    this.isLoaded_ = false
    this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Popout live chat '${videoId_}' loading...` })

    url.pathname = path
    searchParams.forEach((_, key) => searchParams.delete(key))
    searchParams.set(key, value)

    location.href = url.toString()
  }

  private lock(reason: string): void {
    const { state_ } = this

    if ((state_ & ChatPopoutState.MASK_STATE) === ChatPopoutState.STATE_NONE) {
      logger.warn('cannot lock in state:', state_, 'reason:', reason)
      return
    }

    logger.debug(`chat popout ${(state_ & ChatPopoutState.MASK_LOCK) ? 'keepalive' : 'lock'}, reason: ${reason}`)

    this.state_ |= ChatPopoutState.MASK_LOCK
    this.lastUpdate_ = Date.now()
  }

  private unlock(reason: string): void {
    if (!(this.state_ & ChatPopoutState.MASK_LOCK)) return

    logger.debug(`chat popout unlock, reason: ${reason}`)
    this.state_ &= ChatPopoutState.MASK_STATE
  }

  private update(): void {
    const { videoId_, state_, lastUpdate_ } = this

    if (state_ & ChatPopoutState.MASK_LOCK) {
      if ((Date.now() - lastUpdate_) < CHAT_POPOUT_IDLE_TIMEOUT) {
        this.send(ChatPopoutMessageType.POPOUT_ANNOUNCE, { source: CHANNEL_SOURCE, videoId: videoId_ })
        return
      }

      this.unlock('idle_timeout')
    }

    this.send(ChatPopoutMessageType.POPOUT_ANNOUNCE, { source: CHANNEL_SOURCE, videoId: null })
  }
}

export default class YTChatPopoutModule extends Feature {
  public channel_: MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> | null

  public constructor() {
    super('popout')

    this.channel_ = null
  }

  protected activate(): boolean {
    const { top } = window

    switch (location.pathname) {
      case LIVE_CHAT_PATHNAME:
      case LIVE_CHAT_REPLAY_PATHNAME:
        if (top != null && top !== window) return false
        this.channel_ = new ChatAppMessageChannel()
        break
      default:
        this.channel_ = new MainAppMessageChannel()
        break
    }

    return true
  }

  protected deactivate(): boolean {
    this.channel_ = null

    return false
  }
}