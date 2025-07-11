import { floor, random } from '@ext/global/math'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import MessageChannel from '@ext/lib/message/channel'
import { MessageDataUnion } from '@ext/lib/message/type'
import { registerYTRendererPreProcessor, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

const CHANNEL_NAME = 'bmc-ytchat-popout'
const CHANNEL_SOURCE = `cs-${(((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0}`
const TOPIC_VIDEO_ID_REGEXP = /(?<=^chat~).*?(?=$)/

const logger = new Logger('YTCHAT-POPOUT')

const enum ChatPopoutMessageType {
  GET_LIVE_CHAT_REQ,
  GET_LIVE_CHAT_RSP,
  LOAD_LIVE_CHAT,
  UNLOAD_LIVE_CHAT
}

type ChatPopoutMessageDataMap = {
  [ChatPopoutMessageType.GET_LIVE_CHAT_REQ]: { source: string },
  [ChatPopoutMessageType.GET_LIVE_CHAT_RSP]: { source: string, videoId: string },
  [ChatPopoutMessageType.LOAD_LIVE_CHAT]: { videoId: string },
  [ChatPopoutMessageType.UNLOAD_LIVE_CHAT]: { videoId: string }
}

class MainAppMessageChannel extends MessageChannel<ChatPopoutMessageDataMap, ChatPopoutMessageType> {
  private videoId: string | null
  private liveChatVideoId: string | null

  public constructor() {
    super(CHANNEL_NAME)

    this.videoId = null
    this.liveChatVideoId = null

    registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], data => {
      const { liveChatVideoId } = this

      const videoId = data.videoDetails?.videoId ?? null

      if (liveChatVideoId != null && videoId !== liveChatVideoId) {
        logger.debug('unload live chat video:', liveChatVideoId)

        this.liveChatVideoId = null

        this.send(ChatPopoutMessageType.UNLOAD_LIVE_CHAT, { videoId: liveChatVideoId })
      }

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
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    if (message.type !== ChatPopoutMessageType.GET_LIVE_CHAT_REQ) {
      logger.warn('invalid message:', message)
      return
    }

    const { liveChatVideoId } = this
    const { source } = message.data

    if (document.hidden || liveChatVideoId == null) return

    this.send(ChatPopoutMessageType.GET_LIVE_CHAT_RSP, { source, videoId: liveChatVideoId })
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
      const continuation = data.continuationContents?.liveChatContinuation?.continuations?.find(c => c.invalidationContinuationData != null)
      const liveChatVideoId = continuation?.invalidationContinuationData?.invalidationId?.topic?.match(TOPIC_VIDEO_ID_REGEXP)?.[0] ?? null

      if (liveChatVideoId !== this.videoId) {
        this.videoId = liveChatVideoId
        this.isLoaded = liveChatVideoId != null
      }

      return true
    })

    setInterval(this.update.bind(this), 5e3)
  }

  protected onMessage(message: MessageDataUnion<ChatPopoutMessageDataMap, ChatPopoutMessageType>): void {
    switch (message.type) {
      case ChatPopoutMessageType.GET_LIVE_CHAT_RSP: {
        const { source, videoId } = message.data

        if (source !== CHANNEL_SOURCE) return

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

    if (videoId == null || searchParams.get('v') === videoId) return

    searchParams.set('v', videoId)

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
    super('chat-popout')

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