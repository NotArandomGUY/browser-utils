import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/command'
import { registerYTConfigMenuItemGroup, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { getYTPInstance, YTPInstanceType, YTPVideoPlayerInstance } from '@ext/custom/youtube/module/player/bootstrap'
import { ytuiShowToast } from '@ext/custom/youtube/utils/ytui'
import { floor, max, random } from '@ext/global/math'
import { URL } from '@ext/global/network'
import { getPropertyDescriptor } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import MessageChannel from '@ext/lib/message/channel'
import { MessageDataUnion } from '@ext/lib/message/type'

const logger = new Logger('YTCHAT-POPOUT')

const CHANNEL_NAME = 'bmc-ytchat-popout'
const CHANNEL_SOURCE = sessionStorage.getItem(CHANNEL_NAME) || `cs-${(((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0}`
const COLD_NAV_IFRAME_DISABLE_DURATION = 5e3 // 5 sec
const POPOUT_KEEPALIVE_TIMEOUT = 25e3 // 25 sec
const PLAYER_KEEPALIVE_TIMEOUT = 60e3 // 1 min
const LIVE_CHAT_PATHNAME = '/live_chat'
const LIVE_CHAT_REPLAY_PATHNAME = '/live_chat_replay'

const documentHidden = getPropertyDescriptor(document, 'hidden')?.get?.bind(document)

const enum ChatPopoutMessageType {
  POPOUT_ANNOUNCE,
  PLAYER_BIND,
  PLAYER_UNBIND,
  PLAYER_KEEPALIVE,
  PLAYER_MESSAGE,
  TOAST_MESSAGE
}

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

type ChatBinding = [continuation: string, isReplay: boolean]

type ChatPopoutMessageDataMap = {
  [ChatPopoutMessageType.POPOUT_ANNOUNCE]: [source: string, boundTo: string | null]
  [ChatPopoutMessageType.PLAYER_BIND]: [source: string, boundTo: string | null, binding: ChatBinding]
  [ChatPopoutMessageType.PLAYER_UNBIND]: [source: string]
  [ChatPopoutMessageType.PLAYER_KEEPALIVE]: [source: string]
  [ChatPopoutMessageType.PLAYER_MESSAGE]: [source: string, forwardMessage: YTChatIFrameMessage]
  [ChatPopoutMessageType.TOAST_MESSAGE]: [source: string, text: string]
}

class MainAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private player_: YTPVideoPlayerInstance | null
  private binding_: ChatBinding | null
  private boundTo_: string | null
  private lastBoundedPopoutAnnounce_: number
  private lastUnboundPopoutAnnounce_: number

  public constructor() {
    super(CHANNEL_NAME)

    this.player_ = null
    this.binding_ = null
    this.boundTo_ = null
    this.lastBoundedPopoutAnnounce_ = 0
    this.lastUnboundPopoutAnnounce_ = Date.now() - POPOUT_KEEPALIVE_TIMEOUT + COLD_NAV_IFRAME_DISABLE_DURATION

    registerYTConfigMenuItemGroup('general', [
      {
        type: YTConfigMenuItemType.BUTTON,
        key: 'open-popout-chat',
        icon: YTRenderer.enums.IconType.CHAT,
        text: 'Open popout chat',
        signals: [YTEndpoint.enums.SignalActionType.OPEN_POPOUT_CHAT, YTEndpoint.enums.SignalActionType.CLOSE_POPUP]
      }
    ])
    registerYTSignalActionHandler(YTEndpoint.enums.SignalActionType.OPEN_POPOUT_CHAT, () => {
      open(`${location.origin}${LIVE_CHAT_PATHNAME}`, Math.random().toString(36), 'menubar=0,location=0,scrollbars=0,toolbar=0,width=600,height=600')
    })
    registerYTValueProcessor(YTRenderer.mapped.liveChatRenderer, data => {
      const { lastBoundedPopoutAnnounce_, lastUnboundPopoutAnnounce_ } = this
      const { continuations, isReplay } = data

      const continuation = continuations?.map(c => c.reloadContinuationData?.continuation).find(c => c != null)
      if (continuation == null) {
        logger.debug('missing continuation for live chat')
        return
      }

      // Use iframe if popout chat is not available
      const lastAnnounce = max(lastBoundedPopoutAnnounce_, lastUnboundPopoutAnnounce_)
      data.initialDisplayState = `LIVE_CHAT_DISPLAY_STATE_${(Date.now() - lastAnnounce) > POPOUT_KEEPALIVE_TIMEOUT ? 'EXPANDED' : 'COLLAPSED'}`

      this.loadLiveChat_([continuation, !!isReplay])
    })
    registerYTValueProcessor(YTResponse.mapped.next, (data: YTValueData<YTResponse.Mapped<'next'>>) => {
      if (data.contents) this.unloadLiveChat_()
    })

    setInterval(this.update_.bind(this), 5e3)

    window.addEventListener('beforeunload', this.unloadLiveChat_.bind(this))
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    let { binding_, boundTo_, lastBoundedPopoutAnnounce_ } = this

    switch (message.type) {
      case ChatPopoutMessageType.POPOUT_ANNOUNCE: {
        const [source, boundTo] = message.data
        const now = Date.now()

        switch (boundTo) {
          // Message from popout bounded to us
          case CHANNEL_SOURCE:
            logger.debug(`player bounded announce '${source}'`)
            this.lastBoundedPopoutAnnounce_ = now
            break
          // Message from popout without any binding
          case null:
            logger.debug(`player unbound announce '${source}'`)
            this.lastUnboundPopoutAnnounce_ = now
            break
          // Ignore message
          default: return
        }

        // Return if chat binding is not available
        if (binding_ == null) return

        // Unbind from current popout if it has timed out
        if ((now - lastBoundedPopoutAnnounce_) > POPOUT_KEEPALIVE_TIMEOUT) {
          this.boundTo_ = boundTo_ = null
        }

        // Only bind with popout if it's trying to rebind or we are not bound to anything and page is visible
        if ((boundTo_ !== source || boundTo != null) && (boundTo_ != null || documentHidden?.())) return

        // Bind to popout if it has bounded to us successfully (2nd announce)
        if (boundTo === CHANNEL_SOURCE) {
          this.boundTo_ = boundTo_ = source
          this.lastBoundedPopoutAnnounce_ = now
        }

        logger.debug(`player bind '${source}'/'${boundTo}'`)

        this.send(ChatPopoutMessageType.PLAYER_BIND, [CHANNEL_SOURCE, boundTo_, binding_])
        return
      }
      case ChatPopoutMessageType.TOAST_MESSAGE: {
        const [source, text] = message.data

        if (boundTo_ === source) ytuiShowToast(text, 5e3)
        return
      }
      default:
        logger.trace('invalid message:', message)
        return
    }
  }

  private onPlayerProgress_(): void {
    this.send(ChatPopoutMessageType.PLAYER_MESSAGE, [CHANNEL_SOURCE, { 'yt-player-video-progress': this.player_?.getCurrentTime?.() ?? 0 }])
  }

  private onPlayerAdStart_(cpn: string): void {
    this.send(ChatPopoutMessageType.PLAYER_MESSAGE, [CHANNEL_SOURCE, { 'yt-player-ad-start': cpn }])
  }

  private onPlayerAdEnd_(): void {
    this.send(ChatPopoutMessageType.PLAYER_MESSAGE, [CHANNEL_SOURCE, { 'yt-player-ad-end': true }])
  }

  private onPlayerStateChange_(state: number): void {
    this.send(ChatPopoutMessageType.PLAYER_MESSAGE, [CHANNEL_SOURCE, { 'yt-player-state-change': state }])
  }

  private loadLiveChat_(binding: ChatBinding): void {
    logger.debug('load live chat:', binding)

    this.binding_ = binding
    this.send(ChatPopoutMessageType.PLAYER_BIND, [CHANNEL_SOURCE, this.boundTo_, binding])
  }

  private unloadLiveChat_(): void {
    const { binding_ } = this

    if (binding_ == null) return

    logger.debug('unload live chat:', binding_)

    this.binding_ = null
    this.setPlayer_(null)
    this.send(ChatPopoutMessageType.PLAYER_UNBIND, [CHANNEL_SOURCE])
  }

  private setPlayer_(player: YTPVideoPlayerInstance | null = null): void {
    const { player_, onPlayerProgress_, onPlayerAdStart_, onPlayerAdEnd_, onPlayerStateChange_ } = this

    if (player_ === player) return
    if (player_ && player) this.setPlayer_(null)

    this.player_ = player

    const action = player?.subscribe?.bind(player) ?? player_?.unsubscribe?.bind(player_)
    if (action == null) return

    action('onVideoProgress', onPlayerProgress_, this)
    action('onAdStart', onPlayerAdStart_, this)
    action('onAdEnd', onPlayerAdEnd_, this)
    action('onStateChange', onPlayerStateChange_, this)
  }

  private update_(): void {
    const { binding_, boundTo_ } = this

    if (binding_) this.setPlayer_(getYTPInstance(YTPInstanceType.APP)?.playerRef?.deref())
    if (boundTo_) this.send(ChatPopoutMessageType.PLAYER_KEEPALIVE, [CHANNEL_SOURCE])
  }
}

class ChatAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private boundTo_: string | null
  private lastKeepalive_: number

  public constructor() {
    super(CHANNEL_NAME)

    this.boundTo_ = null
    this.lastKeepalive_ = 0

    registerYTValueProcessor(YTResponse.mapped.liveChatGetLiveChat, () => this.keepalive_('live_chat'))

    addEventListener('load', this.update_.bind(this))
    setInterval(this.update_.bind(this), 5e3)
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    const { boundTo_ } = this

    switch (message.type) {
      case ChatPopoutMessageType.PLAYER_BIND: {
        const [source, boundTo, binding] = message.data

        // Only handle message from player bounded to us if we are bounded to a player
        if (boundTo_ != null && boundTo_ !== source) return

        // Unbind from player if another popout already bounded to it
        if (boundTo != null && boundTo !== CHANNEL_SOURCE) return this.unbind_('race')

        // Load live chat
        if (this.load_(binding)) return

        logger.debug(`popout bind '${source}'`)

        // Update binding
        this.boundTo_ = source
        this.keepalive_('bind')
        this.update_()
        return
      }
      case ChatPopoutMessageType.PLAYER_UNBIND: {
        const [source] = message.data

        if (boundTo_ === source) this.unbind_('player')
        return
      }
      case ChatPopoutMessageType.PLAYER_KEEPALIVE: {
        const [source] = message.data

        if (boundTo_ === source) this.keepalive_('player')
        return
      }
      case ChatPopoutMessageType.PLAYER_MESSAGE: {
        const [source, forwardMessage] = message.data

        if (boundTo_ === source) window.postMessage(forwardMessage)
        return
      }
      default:
        logger.trace('invalid message:', message)
        return
    }
  }

  private load_([continuation, isReplay]: ChatBinding): boolean {
    const { origin, pathname, searchParams } = new URL(location.href)

    const path = isReplay ? LIVE_CHAT_REPLAY_PATHNAME : LIVE_CHAT_PATHNAME

    if (pathname === path && searchParams.get('continuation') === continuation) {
      this.send(ChatPopoutMessageType.TOAST_MESSAGE, [CHANNEL_SOURCE, 'Popout live chat loaded'])
      return false
    }

    location.href = `${origin}${path}?continuation=${encodeURIComponent(continuation)}`
    return true
  }

  private keepalive_(reason: string): void {
    const { boundTo_ } = this

    if (boundTo_ == null) return

    logger.debug(`popout keepalive '${boundTo_}', reason: ${reason}`)

    this.lastKeepalive_ = Date.now()
  }

  private unbind_(reason: string): void {
    const { boundTo_ } = this

    if (boundTo_ == null) return

    logger.debug(`popout unbind '${boundTo_}', reason: ${reason}`)

    this.boundTo_ = null
  }

  private update_(): void {
    const { boundTo_, lastKeepalive_ } = this

    if (boundTo_ != null) {
      if ((Date.now() - lastKeepalive_) < PLAYER_KEEPALIVE_TIMEOUT) {
        this.send(ChatPopoutMessageType.POPOUT_ANNOUNCE, [CHANNEL_SOURCE, boundTo_])
        return
      }

      this.unbind_('idle')
    }

    this.send(ChatPopoutMessageType.POPOUT_ANNOUNCE, [CHANNEL_SOURCE, null])
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

    sessionStorage.setItem(CHANNEL_NAME, CHANNEL_SOURCE)

    return true
  }

  protected deactivate(): boolean {
    this.channel_ = null

    return false
  }
}