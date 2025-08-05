import { floor, random } from '@ext/global/math'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import MessageChannel from '@ext/lib/message/channel'
import { MessageDataUnion } from '@ext/lib/message/type'
import { registerYTRendererPreProcessor, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { dispatchYTOpenPopupAction } from '@ext/site/youtube/module/core/event'

const CHANNEL_NAME = 'bmc-ytchat-popout'
const CHANNEL_SOURCE = `cs-${(((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0}`
const TOPIC_VIDEO_ID_REGEXP = /(?<=^chat~).*?(?=$)/

const logger = new Logger('YTCHAT-POPOUT')

const enum ChatPopoutMessageType {
  GET_LIVE_CHAT_REQ,
  GET_LIVE_CHAT_RSP,
  LOAD_LIVE_CHAT,
  UNLOAD_LIVE_CHAT,
  TOAST_MESSAGE
}

type ChatPopoutMessageDataMap = {
  [ChatPopoutMessageType.GET_LIVE_CHAT_REQ]: { source: string },
  [ChatPopoutMessageType.GET_LIVE_CHAT_RSP]: { source: string, videoId: string },
  [ChatPopoutMessageType.LOAD_LIVE_CHAT]: { videoId: string },
  [ChatPopoutMessageType.UNLOAD_LIVE_CHAT]: { videoId: string },
  [ChatPopoutMessageType.TOAST_MESSAGE]: { text: string }
}

class MainAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private videoId: string | null
  private liveChatVideoId: string | null

  public constructor() {
    super(CHANNEL_NAME)

    this.videoId = null
    this.liveChatVideoId = null

    const onPlayerUnload = (): void => {
      const { liveChatVideoId } = this

      if (liveChatVideoId == null) return

      logger.debug('unload live chat video:', liveChatVideoId)

      this.liveChatVideoId = null

      this.send(ChatPopoutMessageType.UNLOAD_LIVE_CHAT, { videoId: liveChatVideoId })
    }

    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], data => {
      const videoId = data.videoDetails?.videoId ?? null
      if (videoId !== this.liveChatVideoId) onPlayerUnload()

      this.videoId = videoId

      return true
    })
    registerYTRendererPreProcessor(YTRendererSchemaMap['liveChatRenderer'], data => {
      const { videoId, liveChatVideoId } = this

      if (!data.isReplay && videoId != null && videoId !== liveChatVideoId) {
        logger.debug('load live chat video:', videoId)

        this.liveChatVideoId = videoId

        this.send(ChatPopoutMessageType.LOAD_LIVE_CHAT, { videoId })
      }

      return true
    })

    window.addEventListener('beforeunload', onPlayerUnload)
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    if (document.hidden) return

    switch (message.type) {
      case ChatPopoutMessageType.GET_LIVE_CHAT_REQ: {
        const { liveChatVideoId } = this
        const { source } = message.data

        if (liveChatVideoId == null) return

        this.send(ChatPopoutMessageType.GET_LIVE_CHAT_RSP, { source, videoId: liveChatVideoId })
        break
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
        break
      default:
        logger.warn('invalid message:', message)
        break
    }
  }
}

class ChatAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private videoId: string | null
  private isLoaded: boolean

  public constructor() {
    super(CHANNEL_NAME)

    this.videoId = null
    this.isLoaded = false

    registerYTRendererPreProcessor(YTRendererSchemaMap['liveChatGetLiveChatResponse'], data => {
      const { videoId, isLoaded } = this

      const continuations = data.continuationContents?.liveChatContinuation?.continuations ?? []
      if (continuations.length > 0) {
        const invalidationContinuation = continuations.map(c => c.invalidationContinuationData).find(c => c != null)
        const topicId = invalidationContinuation?.invalidationId?.topic?.match(TOPIC_VIDEO_ID_REGEXP)?.[0] ?? null

        if (topicId != null && topicId !== videoId) {
          this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Loaded popout live chat '${topicId}'` })

          this.videoId = topicId
          this.isLoaded = true
        }
      } else if (isLoaded) {
        this.isLoaded = false

        this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Popout live chat '${videoId}' ended` })
      }

      return true
    })

    setInterval(this.update.bind(this), 5e3)
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    switch (message.type) {
      case ChatPopoutMessageType.GET_LIVE_CHAT_RSP: {
        const { source, videoId } = message.data

        if (source !== CHANNEL_SOURCE || this.isLoaded) return

        this.videoId = videoId
        this.isLoaded = true
        break
      }
      case ChatPopoutMessageType.LOAD_LIVE_CHAT: {
        const { videoId } = message.data

        if (this.isLoaded) return

        this.videoId = videoId
        this.isLoaded = true
        break
      }
      case ChatPopoutMessageType.UNLOAD_LIVE_CHAT: {
        const { videoId } = message.data

        if (videoId !== this.videoId) return

        this.isLoaded = false
        break
      }
      default:
        logger.warn('invalid message:', message)
        return
    }

    const url = new URL(location.href)

    const { videoId } = this
    const { searchParams } = url

    const prevVideoId = searchParams.get('v')
    if (videoId == null || prevVideoId === videoId) return

    searchParams.set('v', videoId)

    this.send(ChatPopoutMessageType.TOAST_MESSAGE, { text: `Switching popout live chat '${prevVideoId}' to '${videoId}'` })

    location.href = url.toString()
  }

  private update(): void {
    if (this.videoId != null) return

    this.send(ChatPopoutMessageType.GET_LIVE_CHAT_REQ, { source: CHANNEL_SOURCE })
  }
}

export default class YTChatPopoutModule extends Feature {
  public channel: MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> | null

  public constructor() {
    super('popout')

    this.channel = null
  }

  protected activate(): boolean {
    if (location.pathname === '/live_chat') {
      const params = new URLSearchParams(location.search)
      if (!params.has('v')) return false

      this.channel = new ChatAppMessageChannel()
    } else {
      this.channel = new MainAppMessageChannel()
    }

    return true
  }

  protected deactivate(): boolean {
    this.channel = null

    return false
  }
}