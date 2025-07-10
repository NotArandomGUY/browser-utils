import { floor, random } from '@ext/global/math'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

const logger = new Logger('YTCHAT-POPOUT')

const STORAGE_MESSAGE_CHANNEL_KEY = 'smck-ytchat-popout'
const STORAGE_MESSAGE_CHANNEL_SOURCE = `smcs-${(((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0}`
const LIVE_CHAT_VIDEO_ID_REGEXP = /(?<=^chat~).*?(?=$)/

const enum StorageMessageType {
  GET_LIVE_CHAT_REQ,
  GET_LIVE_CHAT_RSP
}

let lastLoadedVideoId: string | null = null
let liveChatVideoId: string | null = null

function processLiveChatGetLiveChatResponse(data: YTRendererData<YTRenderer<'liveChatGetLiveChatResponse'>>): boolean {
  const continuation = data.continuationContents?.liveChatContinuation?.continuations?.find(c => c.invalidationContinuationData != null)?.invalidationContinuationData

  if (liveChatVideoId == null) {
    liveChatVideoId = continuation?.invalidationId?.topic?.match(LIVE_CHAT_VIDEO_ID_REGEXP)?.[0] ?? null
  } else if (continuation == null) {
    liveChatVideoId = null
  }

  return true
}

function processPlayerResponse(data: YTRendererData<YTRenderer<'playerResponse'>>): boolean {
  lastLoadedVideoId = data.videoDetails?.videoId ?? null

  if (liveChatVideoId != null && liveChatVideoId !== lastLoadedVideoId) {
    logger.debug('unload live chat video:', liveChatVideoId)

    liveChatVideoId = null
  }

  return true
}

function processLiveChatRenderer(data: YTRendererData<YTRenderer<'liveChatRenderer'>>): boolean {
  if (!data.isReplay && lastLoadedVideoId != null) {
    liveChatVideoId = lastLoadedVideoId

    logger.debug('load live chat video:', liveChatVideoId)
  }

  return true
}

function onStorageMessage(event: StorageEvent): void {
  const { key, newValue, storageArea } = event

  if (storageArea == null || key !== STORAGE_MESSAGE_CHANNEL_KEY || newValue == null) return

  const [, source, type, ...data] = newValue.split(':')

  switch (Number(type)) {
    case StorageMessageType.GET_LIVE_CHAT_REQ:
      if (document.hidden || liveChatVideoId == null) break

      sendStorageMessage(StorageMessageType.GET_LIVE_CHAT_RSP, [liveChatVideoId], source)
      break
    case StorageMessageType.GET_LIVE_CHAT_RSP: {
      if (source !== STORAGE_MESSAGE_CHANNEL_SOURCE) break

      storageArea.removeItem(key)

      const videoId = data.join(':')
      const url = new URL(location.href)

      const { searchParams } = url
      if (searchParams.get('v') === videoId) break

      searchParams.set('v', videoId)

      location.href = url.toString()
      break
    }
    default:
      storageArea.removeItem(key)
      break
  }
}

function sendStorageMessage(type: StorageMessageType, data: string[], source = STORAGE_MESSAGE_CHANNEL_SOURCE): void {
  localStorage.setItem(STORAGE_MESSAGE_CHANNEL_KEY, [Date.now(), source, type, ...data].join(':'))
}

function updateLiveChat(): void {
  if (liveChatVideoId != null) return

  sendStorageMessage(StorageMessageType.GET_LIVE_CHAT_REQ, [])
}

export default class YTChatPopoutModule extends Feature {
  public constructor() {
    super('chat-popout')
  }

  protected activate(): boolean {
    if (location.pathname === '/live_chat') {
      const params = new URLSearchParams(location.search)
      if (!params.has('v')) return false

      registerYTRendererPreProcessor(YTRendererSchemaMap['liveChatGetLiveChatResponse'], processLiveChatGetLiveChatResponse)

      setInterval(updateLiveChat, 5e3)
    } else {
      registerYTRendererPreProcessor(YTRendererSchemaMap['playerResponse'], processPlayerResponse)
      registerYTRendererPreProcessor(YTRendererSchemaMap['liveChatRenderer'], processLiveChatRenderer)
    }

    globalThis.addEventListener('storage', onStorageMessage)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}