import { registerYTRendererPreProcessor, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { dispatchYTOpenPopupAction } from '@ext/custom/youtube/module/core/event'
import { getYTPInstance, YTPInstanceType, YTPVideoPlayerInstance } from '@ext/custom/youtube/module/player/bootstrap'
import { floor, random } from '@ext/global/math'
import { URL } from '@ext/global/network'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import MessageChannel from '@ext/lib/message/channel'
import { MessageDataUnion } from '@ext/lib/message/type'

const CHANNEL_NAME = 'bmc-ytchat-popout'
const CHANNEL_SOURCE = `cs-${(((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0}`
const COLLAPSED_CHAT_TIMEOUT = 10e3 // 10 sec
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
  [ChatPopoutMessageType.PLAYER_KEEPALIVE]: {}
  [ChatPopoutMessageType.PLAYER_MESSAGE]: YTChatIFrameMessage
  [ChatPopoutMessageType.PLAYER_UNLOAD]: { videoId: string }
  [ChatPopoutMessageType.TOAST_MESSAGE]: { text: string }
}

class MainAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private listeningPlayer: YTPVideoPlayerInstance | null
  private videoId: string | null
  private liveChatVideoId: string | null
  private liveChatContinuation: string | null
  private lastIdlePopoutAnnounce: number

  public constructor() {
    super(CHANNEL_NAME)

    this.listeningPlayer = null
    this.videoId = null
    this.liveChatVideoId = null
    this.liveChatContinuation = null
    this.lastIdlePopoutAnnounce = 0

    const onPlayerUnload = (): void => {
      const { liveChatVideoId } = this

      if (liveChatVideoId == null) return

      logger.debug('unload live chat video:', liveChatVideoId)

      this.liveChatVideoId = null
      this.liveChatContinuation = null
      this.send(ChatPopoutMessageType.PLAYER_UNLOAD, { videoId: liveChatVideoId })
    }

    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], data => {
      const videoId = data.videoDetails?.videoId ?? null
      if (videoId !== this.liveChatVideoId) onPlayerUnload()

      this.videoId = videoId

      return true
    })
    registerYTRendererPreProcessor(YTRendererSchemaMap['liveChatRenderer'], data => {
      const { videoId, liveChatVideoId, lastIdlePopoutAnnounce } = this
      const { continuations, isReplay } = data

      if (videoId != null && videoId !== liveChatVideoId) {
        logger.debug('load live chat for video:', videoId)

        const continuation = isReplay ? continuations?.map(c => c.reloadContinuationData).find(c => c != null)?.continuation : null
        if (continuation === undefined) {
          logger.warn('missing continuation for live chat replay')
          return true
        }

        this.liveChatVideoId = videoId
        this.liveChatContinuation = continuation

        if (continuation == null) {
          this.send(ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT, { videoId })
        } else {
          this.send(ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT_REPLAY, { videoId, continuation })
        }
      }

      // Collapse chat if popout window is available
      data.initialDisplayState = (Date.now() - lastIdlePopoutAnnounce) <= COLLAPSED_CHAT_TIMEOUT ? 'LIVE_CHAT_DISPLAY_STATE_COLLAPSED' : 'LIVE_CHAT_DISPLAY_STATE_EXPANDED'

      return true
    })

    setInterval(this.update.bind(this), 5e3)

    window.addEventListener('beforeunload', onPlayerUnload)
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    if (document.hidden) return

    switch (message.type) {
      case ChatPopoutMessageType.POPOUT_ANNOUNCE: {
        const { liveChatVideoId, liveChatContinuation } = this
        const { source, videoId } = message.data

        if (liveChatVideoId === videoId) {
          this.lastIdlePopoutAnnounce = Date.now()
          return
        }
        if (liveChatVideoId == null) return

        if (liveChatContinuation == null) {
          this.send(ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT, { source, videoId: liveChatVideoId })
        } else {
          this.send(ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT_REPLAY, { source, videoId: liveChatVideoId, continuation: liveChatContinuation })
        }
        return
      }
      case ChatPopoutMessageType.TOAST_MESSAGE:
        dispatchYTOpenPopupAction({
          durationHintMs: 5e3,
          popup: {
            notificationActionRenderer: {
              responseText: { runs: [{ text: message.data.text }] }
            }
          },
          popupType: 'TOAST'
        })
        return
      default:
        logger.warn('invalid message:', message)
        return
    }
  }

  private onPlayerProgress(): void {
    this.send(ChatPopoutMessageType.PLAYER_MESSAGE, { 'yt-player-video-progress': this.listeningPlayer?.getCurrentTime?.() ?? 0 })
  }

  private onPlayerAdStart(cpn: string): void {
    this.send(ChatPopoutMessageType.PLAYER_MESSAGE, { 'yt-player-ad-start': cpn })
  }

  private onPlayerAdEnd(): void {
    this.send(ChatPopoutMessageType.PLAYER_MESSAGE, { 'yt-player-ad-end': true })
  }

  private onPlayerStateChange(state: number): void {
    this.send(ChatPopoutMessageType.PLAYER_MESSAGE, { 'yt-player-state-change': state })
  }

  private update(): void {
    const { listeningPlayer, onPlayerProgress, onPlayerAdStart, onPlayerAdEnd, onPlayerStateChange } = this

    this.send(ChatPopoutMessageType.PLAYER_KEEPALIVE, {})

    const player = getYTPInstance(YTPInstanceType.VIDEO_PLAYER)
    if (listeningPlayer != null) {
      if (player === listeningPlayer) return

      listeningPlayer.unsubscribe?.('onVideoProgress', onPlayerProgress, this)
      listeningPlayer.unsubscribe?.('onAdStart', onPlayerAdStart, this)
      listeningPlayer.unsubscribe?.('onAdEnd', onPlayerAdEnd, this)
      listeningPlayer.unsubscribe?.('onStateChange', onPlayerStateChange, this)
      this.listeningPlayer = null
    }
    if (player == null) return

    this.listeningPlayer = player
    player.subscribe?.('onVideoProgress', onPlayerProgress, this)
    player.subscribe?.('onAdStart', onPlayerAdStart, this)
    player.subscribe?.('onAdEnd', onPlayerAdEnd, this)
    player.subscribe?.('onStateChange', onPlayerStateChange, this)
  }
}

class ChatAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private videoId: string | null
  private state: ChatPopoutState
  private lastUpdate: number
  private isLoaded: boolean

  public constructor() {
    super(CHANNEL_NAME)

    this.videoId = null
    this.state = ChatPopoutState.STATE_NONE
    this.lastUpdate = 0
    this.isLoaded = false

    registerYTRendererPreProcessor(YTRendererSchemaMap['liveChatGetLiveChatResponse'], data => {
      const { videoId, state } = this

      if (state & ChatPopoutState.MASK_LOCK) {
        const continuations = data.continuationContents?.liveChatContinuation?.continuations
        if (continuations != null && continuations.length > 0) {
          this.lock('live_chat_update')
        } else {
          this.unlock('live_chat_end')
          this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Popout live chat '${videoId}' ended` })
        }
      }

      return true
    })

    setInterval(this.update.bind(this), 5e3)
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    switch (message.type) {
      case ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT: {
        const { source, videoId } = message.data

        if ((this.state & ChatPopoutState.MASK_LOCK) || (source != null && source !== CHANNEL_SOURCE)) return

        this.videoId = videoId
        this.state = ChatPopoutState.STATE_LIVE
        this.lock('live_chat_load')
        this.redirect(LIVE_CHAT_PATHNAME, 'v', videoId)
        return
      }
      case ChatPopoutMessageType.PLAYER_LOAD_LIVE_CHAT_REPLAY: {
        const { source, videoId, continuation } = message.data

        if ((this.state & ChatPopoutState.MASK_LOCK) || (source != null && source !== CHANNEL_SOURCE)) return

        this.videoId = videoId
        this.state = ChatPopoutState.STATE_LIVE_REPLAY
        this.lock('live_chat_replay_load')
        this.redirect(LIVE_CHAT_REPLAY_PATHNAME, 'continuation', continuation)
        return
      }
      case ChatPopoutMessageType.PLAYER_KEEPALIVE: {
        if (!(this.state & ChatPopoutState.MASK_LOCK)) return

        this.lock('player_keepalive')
        return
      }
      case ChatPopoutMessageType.PLAYER_MESSAGE: {
        window.postMessage(message.data)
        return
      }
      case ChatPopoutMessageType.PLAYER_UNLOAD: {
        const { videoId } = message.data

        if (videoId !== this.videoId) return

        this.unlock('unload_player')
        this.send(ChatPopoutMessageType.POPOUT_ANNOUNCE, { source: CHANNEL_SOURCE, videoId: null })
        return
      }
      default:
        logger.warn('invalid message:', message)
        return
    }
  }

  private redirect(path: string, key: string, value: string): void {
    const { videoId, isLoaded } = this

    const url = new URL(location.href)
    const { pathname, searchParams } = url

    if (pathname === path && searchParams.get(key) === value) {
      if (isLoaded) return

      this.isLoaded = true
      this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Popout live chat '${videoId}' loaded` })
      return
    }

    this.isLoaded = false
    this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Popout live chat '${videoId}' loading...` })

    url.pathname = path
    searchParams.forEach((_, key) => searchParams.delete(key))
    searchParams.set(key, value)

    location.href = url.toString()
  }

  private lock(reason: string): void {
    const { state } = this

    if ((state & ChatPopoutState.MASK_STATE) === ChatPopoutState.STATE_NONE) {
      logger.warn('cannot lock in state:', state, 'reason:', reason)
      return
    }

    logger.debug(`chat popout ${(state & ChatPopoutState.MASK_LOCK) ? 'keepalive' : 'lock'}, reason: ${reason}`)

    this.state |= ChatPopoutState.MASK_LOCK
    this.lastUpdate = Date.now()
  }

  private unlock(reason: string): void {
    if (!(this.state & ChatPopoutState.MASK_LOCK)) return

    logger.debug(`chat popout unlock, reason: ${reason}`)
    this.state &= ChatPopoutState.MASK_STATE
  }

  private update(): void {
    const { state, videoId, lastUpdate } = this

    if (state & ChatPopoutState.MASK_LOCK) {
      if ((Date.now() - lastUpdate) < CHAT_POPOUT_IDLE_TIMEOUT) return

      this.unlock('idle_timeout')
    }

    this.send(ChatPopoutMessageType.POPOUT_ANNOUNCE, { source: CHANNEL_SOURCE, videoId: (state & ChatPopoutState.MASK_LOCK) ? videoId : null })
  }
}

export default class YTChatPopoutModule extends Feature {
  public channel: MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> | null

  public constructor() {
    super('popout')

    this.channel = null
  }

  protected activate(): boolean {
    const { top } = window

    switch (location.pathname) {
      case LIVE_CHAT_PATHNAME:
      case LIVE_CHAT_REPLAY_PATHNAME:
        if (top != null && top !== window) return false
        this.channel = new ChatAppMessageChannel()
        break
      default:
        this.channel = new MainAppMessageChannel()
        break
    }

    return true
  }

  protected deactivate(): boolean {
    this.channel = null

    return false
  }
}